"""Atajo nativo de Windows: RegisterHotKey; no instala ganchos ni lee otras teclas."""
import ctypes
from ctypes import wintypes
import re
import threading

MODIFIERS = {'CTRL': 0x2, 'ALT': 0x1, 'SHIFT': 0x4, 'WIN': 0x8}
KEYS = {'BACKSPACE': 8, 'TAB': 9, 'ENTER': 13, 'PAUSE': 19,
        'CAPSLOCK': 20, 'ESC': 27, 'SPACE': 32, 'PAGEUP': 33,
        'PAGEDOWN': 34, 'END': 35, 'HOME': 36, 'LEFT': 37, 'UP': 38,
        'RIGHT': 39, 'DOWN': 40, 'PRINTSCREEN': 44, 'INSERT': 45,
        'DELETE': 46, 'APPS': 93, 'MULTIPLY': 106, 'ADD': 107,
        'SUBTRACT': 109, 'DECIMAL': 110, 'DIVIDE': 111,
        'NUMLOCK': 144, 'SCROLLLOCK': 145}
KEYS.update({f'NUMPAD{i}': 96+i for i in range(10)})

def captured_hotkey(vk, modifiers=0):
    """Convert Windows Tk keycodes, including layout-specific punctuation."""
    if vk in (16, 17, 18, 91, 92, 160, 161, 162, 163, 164, 165):
        return None
    key = next((name for name, code in KEYS.items() if code == vk), None)
    if 48 <= vk <= 57 or 65 <= vk <= 90:
        key = chr(vk)
    elif 112 <= vk <= 135:
        key = f'F{vk-111}'
    if key is None:
        key = f'VK_{vk:02X}'
    return parse_hotkey('+'.join([p for p, mask in MODIFIERS.items() if modifiers & mask] + [key]))[0]

def parse_hotkey(value):
    if value is None or value == '':
        return '', 0, 0
    if not isinstance(value, str):
        raise ValueError('El atajo debe ser un texto, por ejemplo CTRL+F9.')
    parts = [p.strip().upper().replace('CONTROL', 'CTRL') for p in value.split('+')]
    if len(parts) != len(set(parts)) or any(not p for p in parts):
        raise ValueError('Atajo no válido.')
    key = parts[-1]
    if any(p not in MODIFIERS for p in parts[:-1]):
        raise ValueError('Usa CTRL, ALT, SHIFT o WIN antes de la tecla.')
    if re.fullmatch(r'F(?:[1-9]|1[0-9]|2[0-4])', key):
        vk = 0x70 + int(key[1:]) - 1
    elif len(key) == 1 and key.isascii() and key.isalnum():
        vk = ord(key)
    elif key in KEYS:
        vk = KEYS[key]
    elif re.fullmatch(r'VK_[0-9A-F]{2}', key):
        vk = int(key[3:], 16)
        if vk < 8 or vk == 255 or vk in (16,17,18,91,92,160,161,162,163,164,165):
            raise ValueError('Selecciona una tecla distinta de un modificador.')
    else:
        raise ValueError('Pulsa una tecla en el selector de atajo.')
    modifiers = sum(MODIFIERS[p] for p in parts[:-1])
    canonical = '+'.join([p for p in MODIFIERS if p in parts[:-1]] + [key])
    return canonical, modifiers, vk

def is_game_process(name, cl2=False):
    # Nombre del proceso GTA de Cfx; no acepta el navegador ni el lanzador.
    name = name.replace('\\', '/').rsplit('/', 1)[-1]
    match = re.fullmatch(r'FiveM_(cl2_)?(?:fxdk_)?(?:b\d+_)?GTAProcess\.exe', name, re.IGNORECASE)
    return bool(match) and bool(match.group(1)) == bool(cl2)

def foreground_is_fivem(cl2=False):
    user32 = ctypes.WinDLL('user32', use_last_error=True)
    kernel32 = ctypes.WinDLL('kernel32', use_last_error=True)
    user32.GetForegroundWindow.restype = wintypes.HWND
    user32.GetWindowThreadProcessId.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.DWORD)]
    kernel32.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
    kernel32.OpenProcess.restype = wintypes.HANDLE
    kernel32.QueryFullProcessImageNameW.argtypes = [wintypes.HANDLE, wintypes.DWORD, wintypes.LPWSTR, ctypes.POINTER(wintypes.DWORD)]
    kernel32.QueryFullProcessImageNameW.restype = wintypes.BOOL
    kernel32.CloseHandle.argtypes = [wintypes.HANDLE]
    pid = wintypes.DWORD()
    window = user32.GetForegroundWindow()
    if not window:
        return False
    user32.GetWindowThreadProcessId(window, ctypes.byref(pid))
    handle = kernel32.OpenProcess(0x1000, False, pid.value)
    if not handle:
        return False
    try:
        size = wintypes.DWORD(32768)
        buffer = ctypes.create_unicode_buffer(size.value)
        return bool(kernel32.QueryFullProcessImageNameW(handle, 0, buffer, ctypes.byref(size))) and is_game_process(buffer.value, cl2)
    finally:
        kernel32.CloseHandle(handle)

class HotkeyManager:
    CHANGE = 0x8001
    def __init__(self, callback, value='CTRL+F9'):
        self.callback = callback
        self.value = parse_hotkey(value)[0]
        self.active = False
        self.error = ''
        self.native_error = 0
        self.thread_id = None
        self.ready = threading.Event()
        self.lock = threading.Lock()
        self.thread = threading.Thread(target=self.run, daemon=True)
    def status(self):
        with self.lock:
            return {'configured': self.value, 'active': self.active, 'error': self.error}
    def start(self):
        self.thread.start()
        self.ready.wait(2)
    def configure(self, value):
        canonical = parse_hotkey(value)[0]
        with self.lock:
            self.value = canonical
            self.active = False
            self.error = ''
        if self.thread_id:
            self.post(self.CHANGE)
    def post(self, message):
        user32 = ctypes.WinDLL('user32', use_last_error=True)
        user32.PostThreadMessageW.argtypes = [wintypes.DWORD, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM]
        user32.PostThreadMessageW.restype = wintypes.BOOL
        return user32.PostThreadMessageW(self.thread_id, message, 0, 0)
    def stop(self):
        if self.thread_id:
            self.post(0x12)
            self.thread.join(timeout=2)
    def run(self):
        registered = False
        try:
            user32 = ctypes.WinDLL('user32', use_last_error=True)
            kernel32 = ctypes.WinDLL('kernel32', use_last_error=True)
            kernel32.GetCurrentThreadId.restype = wintypes.DWORD
            user32.PeekMessageW.argtypes = [ctypes.POINTER(wintypes.MSG), wintypes.HWND, wintypes.UINT, wintypes.UINT, wintypes.UINT]
            user32.RegisterHotKey.argtypes = [wintypes.HWND, ctypes.c_int, wintypes.UINT, wintypes.UINT]
            user32.RegisterHotKey.restype = wintypes.BOOL
            user32.UnregisterHotKey.argtypes = [wintypes.HWND, ctypes.c_int]
            user32.GetMessageW.argtypes = [ctypes.POINTER(wintypes.MSG), wintypes.HWND, wintypes.UINT, wintypes.UINT]
            user32.GetMessageW.restype = ctypes.c_int
            message = wintypes.MSG()
            user32.PeekMessageW(ctypes.byref(message), None, 0, 0, 0)
            self.thread_id = kernel32.GetCurrentThreadId()
            def apply():
                nonlocal registered
                if registered:
                    user32.UnregisterHotKey(None, 1)
                    registered = False
                with self.lock:
                    value = self.value
                _, modifiers, vk = parse_hotkey(value)
                ctypes.set_last_error(0)
                active = bool(vk and user32.RegisterHotKey(None, 1, modifiers | 0x4000, vk))
                self.native_error = ctypes.get_last_error() if vk and not active else 0
                registered = active
                with self.lock:
                    self.active = active
                    self.error = 'Atajo ocupado o no disponible. Elige otra combinación.' if value and not active else ''
            apply()
            self.ready.set()
            while True:
                result = user32.GetMessageW(ctypes.byref(message), None, 0, 0)
                if result <= 0:
                    break
                if message.message == self.CHANGE:
                    apply()
                elif message.message == 0x312 and message.wParam == 1:
                    threading.Thread(target=self.callback, daemon=True).start()
        except Exception:
            with self.lock:
                self.active = False
                self.error = 'No se ha podido registrar el atajo en Windows.'
            self.ready.set()
        finally:
            if registered:
                user32.UnregisterHotKey(None, 1)
            with self.lock:
                self.active = False
