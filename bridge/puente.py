"""Puente local /entorno con bandeja Windows. No modifica FiveM ni el servidor."""
import argparse
import hmac
import hashlib
import json
import secrets
import socket
import struct
import threading
import time
import sys
from pathlib import Path
from urllib.parse import urlsplit
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ORIGIN = 'https://entorno-rp-radio-2710.balmyguppy1.chatgpt.site'
HOST = '127.0.0.1'
PORT = 39173
TOKEN = secrets.token_urlsafe(32)
SEND_LOCK = threading.RLock()
LAST_SEND = 0.0

HOTKEY = "CTRL+F9"
WEB_URL = ORIGIN
BASE_DIR = Path(sys.executable).resolve().parent if getattr(sys, 'frozen', False) else Path(__file__).resolve().parent
CONFIG_PATH = BASE_DIR / 'configuracion.json'

def parse_site_url(value):
    if not isinstance(value, str):
        raise ValueError('La dirección debe ser un texto.')
    value = value.strip()
    if any(ord(c) < 32 for c in value):
        raise ValueError('Dirección no válida.')
    parsed = urlsplit(value)
    if parsed.scheme not in ('http', 'https') or not parsed.hostname or parsed.username or parsed.password:
        raise ValueError('Escribe una dirección completa http:// o https://, sin usuario ni contraseña.')
    if parsed.query or parsed.fragment:
        raise ValueError('Usa la dirección de la página sin parámetros ni fragmentos.')
    try:
        port = parsed.port
    except ValueError:
        raise ValueError('Puerto de la web no válido.')
    if port is not None and not 1 <= port <= 65535:
        raise ValueError('Puerto de la web no válido.')
    if any(c.isspace() or c in '\\/*' for c in parsed.hostname):
        raise ValueError('Dominio no válido.')
    host = parsed.hostname.encode('idna').decode('ascii').lower()
    if ':' in host:
        host = '[' + host + ']'
    if port and not (parsed.scheme == 'https' and port == 443 or parsed.scheme == 'http' and port == 80):
        host += ':' + str(port)
    origin = parsed.scheme + '://' + host
    return origin + (parsed.path or '/'), origin

def load_site_config():
    global WEB_URL, ORIGIN, TOKEN, HOTKEY
    if not CONFIG_PATH.exists():
        return
    data = json.loads(CONFIG_PATH.read_text(encoding='utf-8-sig'))
    if not isinstance(data, dict):
        raise ValueError('La configuración debe ser un objeto JSON.')
    from hotkeys import parse_hotkey
    url, origin = parse_site_url(data.get('web_url', WEB_URL))
    hotkey = parse_hotkey(data.get('hotkey', 'CTRL+F9'))[0]
    with SEND_LOCK:
        if origin != ORIGIN:
            TOKEN = secrets.token_urlsafe(32)
        WEB_URL = url
        ORIGIN = origin
        HOTKEY = hotkey

def normalize_command(value, slash=False):
    if not isinstance(value, str) or len(value) > 6000:
        raise ValueError('Texto no válido o demasiado largo.')
    if any(ord(c) < 32 or ord(c) == 127 for c in value):
        raise ValueError('El entorno no puede contener saltos de línea ni caracteres de control.')
    text = value.strip()
    if not text.lower().startswith('/entorno '):
        raise ValueError('Solo se permite /entorno seguido de texto.')
    body = text[len('/entorno '):].strip()
    if not body:
        raise ValueError('El entorno está vacío.')
    # Evitar separadores de consola y delimitar el texto como un solo argumento.
    body = body.replace(';', ',').replace('"', '”').replace('\\', '/')
    return ('/entorno' if slash else 'entorno') + ' "' + body + '"'

def frame(command):
    payload = command.encode('utf-8') + b'\n'
    return b'CMND\x00\xd3' + struct.pack('>I', len(payload) + 1) + b'\x00\x00' + payload + b'\x00'

def connect_console(port):
    sock = socket.create_connection((HOST, port), timeout=0.8)
    deadline = time.monotonic() + 1.2
    try:
        sock.sendall(b'PPCR')
        # FiveM confirma el protocolo con una cabecera AINF.
        data = b''
        while len(data) < 12:
            sock.settimeout(max(0.01, deadline - time.monotonic()))
            if time.monotonic() >= deadline:
                raise OSError('La consola no respondió a tiempo.')
            chunk = sock.recv(12-len(data))
            if not chunk:
                raise OSError('La consola cerró la conexión.')
            data += chunk
        if data[:4] != b'AINF':
            raise OSError('No se ha reconocido la consola de FiveM.')
        size = struct.unpack('>I', data[6:10])[0]
        if size < 12 or size > 1048576:
            raise OSError('Respuesta de consola no válida.')
        remaining = size - 12
        while remaining:
            if time.monotonic() >= deadline:
                raise OSError('La consola no respondió a tiempo.')
            sock.settimeout(max(0.01, deadline - time.monotonic()))
            chunk = sock.recv(min(remaining, 8192))
            if not chunk:
                raise OSError('Respuesta de consola incompleta.')
            remaining -= len(chunk)
        return sock
    except Exception:
        sock.close()
        raise

class BridgeServer(ThreadingHTTPServer):
    daemon_threads = True
    def __init__(self, *args, **kwargs):
        self.prepared_text = ''
        self.prepared_id = ''
        self.last_sent_id = ''
        self.last_result = ''
        self.hotkeys = None
        self.send_events = threading.Condition(SEND_LOCK)
        self.send_sequence = 0
        self.last_send_event = None
        from pairing import Pairing
        trusted = {ORIGIN}
        try:
            config = json.loads(CONFIG_PATH.read_text(encoding='utf-8-sig'))
            saved = config.get('trusted_origins', [])
            if isinstance(saved, list):
                for value in saved[:32]:
                    try:
                        _, origin = parse_site_url(value)
                        trusted.add(origin)
                    except (ValueError, TypeError):
                        pass
        except (OSError, ValueError, AttributeError):
            pass
        self.pairing = Pairing(lambda origin, trusted: activate_origin(self, origin, trusted), trusted)
        super().__init__(*args, **kwargs)
    def preparation(self):
        with SEND_LOCK:
            return {'ready': bool(self.prepared_id) and self.prepared_id != self.last_sent_id,
                    'sent': bool(self.prepared_id) and self.prepared_id == self.last_sent_id}
    def clear_preparation(self):
        with SEND_LOCK:
            self.prepared_text = ''
            self.prepared_id = ''
    def get_request(self):
        connection, address = super().get_request()
        connection.settimeout(5)
        return connection, address

def activate_origin(server, origin, trusted):
    global ORIGIN, WEB_URL, TOKEN
    with SEND_LOCK:
        data = json.loads(CONFIG_PATH.read_text(encoding='utf-8-sig')) if CONFIG_PATH.exists() else {}
        if not isinstance(data, dict):
            raise ValueError('Configuración no válida.')
        data.update(web_url=origin + '/', trusted_origins=sorted(trusted))
        temp = CONFIG_PATH.with_suffix('.tmp')
        temp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
        temp.replace(CONFIG_PATH)
        if ORIGIN != origin:
            ORIGIN, WEB_URL, TOKEN = origin, origin + '/', secrets.token_urlsafe(32)
            server.clear_preparation()
            server.last_send_event = None
            server.send_events.notify_all()


def command_id(command):
    return hashlib.sha256((ORIGIN + '\0' + command).encode('utf-8')).hexdigest()

def prepare_text(server, text):
    if text == '':
        server.clear_preparation()
        return {'ok': True, **server.preparation()}
    command = normalize_command(text, server.slash)
    with SEND_LOCK:
        server.prepared_text = text
        server.prepared_id = command_id(command)
    return {'ok': True, **server.preparation()}

def send_text(server, text, foreground_check=None, expected_id=None):
    global LAST_SEND
    command = normalize_command(text, server.slash)
    with SEND_LOCK:
        digest = command_id(command)
        if expected_id is not None and expected_id != digest:
            return 409, {'error': 'La web configurada ha cambiado. Prepara el entorno otra vez.'}
        if expected_id is not None and server.prepared_id != expected_id:
            return 409, {'error': 'El entorno ha cambiado. Vuelve a pulsar el atajo.'}
        if foreground_check is not None and not foreground_check():
            return 409, {'error': 'El atajo solo funciona con FiveM en primer plano.'}
        if digest == server.last_sent_id:
            return 409, {'error': 'Este entorno ya se ha enviado. Prepara uno nuevo en la web.', 'sent': True}
        if time.monotonic() - LAST_SEND < 2:
            return 429, {'error': 'Espera dos segundos antes de repetir el envío.'}
        reserved = False
        try:
            with connect_console(server.game_port) as sock:
                time.sleep(0.04)
                if foreground_check is not None and not foreground_check():
                    return 409, {'error': 'FiveM ya no está en primer plano. No se ha enviado.'}
                server.prepared_text = text
                server.prepared_id = digest
                server.last_sent_id = digest
                LAST_SEND = time.monotonic()
                reserved = True
                sock.sendall(frame(command))
                time.sleep(0.08)
        except OSError:
            if reserved:
                server.last_result = 'No se pudo confirmar el envío. Comprueba el juego antes de repetir.'
                return 503, {'error': server.last_result, 'sent': True, 'uncertain': True}
            server.last_result = 'No se puede conectar con FiveM. Abre el juego y entra al servidor.'
            return 503, {'error': server.last_result}
        server.last_result = 'Enviado a la consola. Comprueba el entorno en el juego.'
        server.send_sequence += 1
        server.last_send_event = {'sequence': server.send_sequence,
                                  'source': 'hotkey' if foreground_check is not None else 'web',
                                  'text': text}
        server.send_events.notify_all()
    return 200, {'ok': True, 'sent': True, 'message': server.last_result}

def send_prepared(server, foreground_check=None):
    if foreground_check is None:
        from hotkeys import foreground_is_fivem
        foreground_check = lambda: foreground_is_fivem(server.game_port == 29300)
    if not foreground_check():
        return 409, {'error': 'FiveM no está en primer plano.', 'ignored': True}
    with SEND_LOCK:
        text = server.prepared_text
        expected_id = server.prepared_id
    if not text:
        return 409, {'error': 'No hay ningún entorno preparado. Genera uno en la web.'}
    return send_text(server, text, foreground_check, expected_id)

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass
    def allowed(self):
        return self.headers.get('Origin') == ORIGIN and self.headers.get('Host') == f'{HOST}:{PORT}'
    def discoverable(self):
        if self.headers.get('Host') != f'{HOST}:{PORT}':
            return False
        value = self.headers.get('Origin')
        try:
            return parse_site_url(value)[1] == value and len(value) <= 300
        except (ValueError, TypeError):
            return False
    def pairing_route(self):
        return self.path in ('/discover', '/pair') and self.discoverable()
    def respond(self, code, data):
        payload = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        if self.allowed() or self.pairing_route():
            self.send_header('Access-Control-Allow-Origin', self.headers.get('Origin'))
            self.send_header('Vary', 'Origin')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        try:
            self.wfile.write(payload)
        except (BrokenPipeError, ConnectionResetError):
            pass
    def do_OPTIONS(self):
        if not self.allowed() and not self.pairing_route():
            self.respond(403, {'error':'Origen no autorizado.'})
            return
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', self.headers.get('Origin'))
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Entorno-Token')
        self.send_header('Access-Control-Allow-Private-Network', 'true')
        self.send_header('Access-Control-Max-Age', '600')
        self.send_header('Vary', 'Origin')
        self.end_headers()
    def do_GET(self):
        if self.path == '/discover' and self.discoverable():
            self.respond(200, {'bridge': 'entorno-fivem', 'version': 3,
                               'authorized': self.allowed(), 'capabilities': ['pair']})
            return
        if not self.allowed():
            self.respond(403, {'error':'Origen no autorizado.'})
            return
        if self.path != '/health':
            self.respond(404, {})
            return
        connected = False
        try:
            with connect_console(self.server.game_port):
                connected = True
        except OSError:
            pass
        self.respond(200, {'bridge':'entorno-fivem','version':3,'connected':connected,'token':TOKEN,
                           'capabilities':['prepare','hotkey','send-events'], 'sequence': self.server.send_sequence,
                           'preparation': self.server.preparation(),
                           'hotkey': self.server.hotkeys.status() if self.server.hotkeys else {'configured':HOTKEY,'active':False,'error':''}})
    def do_POST(self):
        global LAST_SEND
        if self.path == '/pair':
            if not self.discoverable():
                self.respond(403, {'error': 'Origen no válido.'})
                return
            if self.headers.get('Content-Type', '').split(';')[0] != 'application/json':
                self.respond(415, {'error': 'Formato no válido.'})
                return
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if not 0 < length <= 100:
                    raise ValueError()
                body = json.loads(self.rfile.read(length))
                if body != {}:
                    raise ValueError()
            except (ValueError, OSError):
                self.respond(400, {'error': 'Solicitud no válida.'})
                return
            code, data = self.server.pairing.connect(self.headers['Origin'])
            self.respond(code, data)
            return
        if not self.allowed() or not hmac.compare_digest(self.headers.get('X-Entorno-Token','').encode('utf-8'), TOKEN.encode('ascii')):
            self.respond(403, {'error':'Sesión no autorizada. Recarga la web.'})
            return
        if self.path not in ('/execute', '/prepare', '/events'):
            self.respond(404, {})
            return
        if self.headers.get('Content-Type','').split(';')[0] != 'application/json':
            self.respond(415, {'error':'Formato no válido.'})
            return
        try:
            length = int(self.headers.get('Content-Length','0'))
            if length <= 0 or length > 24000:
                raise ValueError('Solicitud demasiado grande o vacía.')
            self.connection.settimeout(3)
            body = json.loads(self.rfile.read(length))
            if not isinstance(body, dict):
                raise ValueError('Solicitud no válida.')
            text = body.get('text')
            if self.path == '/events':
                after = body.get('after')
                if type(after) is not int or after < 0:
                    raise ValueError('Secuencia no válida.')
            elif not (self.path == '/prepare' and text == ''):
                normalize_command(text, self.server.slash)
        except (ValueError, OSError) as exc:
            self.respond(400, {'error':str(exc)})
            return
        with SEND_LOCK:
            if not self.allowed() or not hmac.compare_digest(self.headers.get('X-Entorno-Token', '').encode('utf-8'), TOKEN.encode('ascii')):
                self.respond(403, {'error': 'La web autorizada ha cambiado. Recarga el generador.'})
                return
            if self.path == '/events':
                self.server.send_events.wait_for(lambda: self.server.send_sequence > after, timeout=18)
                if not self.allowed() or not hmac.compare_digest(self.headers.get('X-Entorno-Token','').encode('utf-8'), TOKEN.encode('ascii')):
                    self.respond(403, {'error': 'La sesión ha cambiado. Recarga el generador.'})
                    return
                event = self.server.last_send_event if self.server.send_sequence > after else None
                self.respond(200, {'ok': True, 'event': event})
            elif self.path == '/prepare':
                self.respond(200, prepare_text(self.server, text))
            else:
                code, result = send_text(self.server, text)
                self.respond(code, result)


def show_message(text, error=False):
    from bridge_ui import DesktopUI
    ui = DesktopUI()
    try:
        ui.message(text, error)
    finally:
        ui.stop()

def run_tray(server):
    import pystray
    from PIL import Image, ImageDraw
    from hotkeys import HotkeyManager
    from bridge_ui import DesktopUI
    ui = DesktopUI()
    import startup
    server.pairing.approve = lambda origin, done: ui.post(lambda: ui.authorize_origin(origin, done))
    try:
        startup_enabled = [startup.is_enabled()]
    except OSError:
        startup_enabled = [False]
    image = Image.new('RGBA', (64,64), (0,0,0,0))
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((2,2,62,62), radius=15, fill='#963441')
    draw.rounded_rectangle((12,13,52,43), radius=5, fill='#f1e8d3')
    draw.polygon([(19,40),(19,53),(34,40)], fill='#f1e8d3')
    draw.line((37,20,27,36), fill='#963441', width=5)
    def set_hotkey(value):
        global HOTKEY
        data = json.loads(CONFIG_PATH.read_text(encoding='utf-8-sig')) if CONFIG_PATH.exists() else {}
        if not isinstance(data, dict):
            raise ValueError('Configuración no válida.')
        data['hotkey'] = value
        temp_path = CONFIG_PATH.with_suffix('.tmp')
        temp_path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding='utf-8')
        temp_path.replace(CONFIG_PATH)
        HOTKEY = value

    def choose_hotkey(icon=None, item=None):
        ui.post(lambda: ui.choose_hotkey(server.hotkeys, set_hotkey))
    def fire_hotkey():
        code, result = send_prepared(server)
        if result.get('ignored'):
            return
        try:
            icon.notify(result.get('message') if code == 200 else result.get('error', 'No se ha podido enviar.'), 'Puente /entornos')
        except Exception:
            pass
    def check_status():
        try:
            with connect_console(server.game_port):
                state = 'Consola de FiveM disponible.'
        except OSError:
            state = 'FiveM no está disponible. Abre el juego y entra al servidor.'
        hotkey_state = server.hotkeys.status() if server.hotkeys else {}
        prepared = server.preparation()
        details = ('Entorno preparado.' if prepared['ready'] else 'El último entorno ya se envió.' if prepared['sent'] else 'Sin entorno preparado.')
        text = 'El puente está activo.\n\n' + state + '\n' + details + '\nAtajo: ' + (hotkey_state.get('configured') or 'Desactivado') + '\n' + hotkey_state.get('error', '')
        ui.post(lambda: ui.message(text))
    def status(icon=None, item=None):
        threading.Thread(target=check_status, daemon=True).start()
    def quit_bridge(icon, item):
        ui.post(ui.stop)
    def toggle_startup(icon, item):
        def apply_startup():
            try:
                enabled = not startup.is_enabled()
                startup.set_enabled(enabled)
                startup_enabled[0] = startup.is_enabled()
                icon.update_menu()
                ui.message('El puente se iniciará al entrar en Windows.\n\nMantén el ejecutable en esta carpeta para que siga funcionando.' if enabled
                           else 'Inicio con Windows desactivado.')
            except (OSError, ValueError) as error:
                ui.message('No se pudo cambiar el inicio con Windows.\n\n' + str(error), True)
        ui.post(apply_startup)
    icon = pystray.Icon('entorno-fivem', image, 'Puente /entornos — activo', menu=pystray.Menu(
        pystray.MenuItem('Comprobar estado', status),
        pystray.MenuItem('Elegir atajo de teclado…', choose_hotkey, default=True),
        pystray.MenuItem('Iniciar con Windows', toggle_startup, checked=lambda item: startup_enabled[0]),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem('Cerrar puente', quit_bridge)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    server.hotkeys = HotkeyManager(fire_hotkey, HOTKEY)
    server.hotkeys.start()
    tray_thread = threading.Thread(target=icon.run, daemon=True)
    tray_thread.start()
    try:
        ui.run()
    finally:
        icon.stop()
        server.hotkeys.stop()
        server.shutdown()
        server.server_close()

def main():
    parser = argparse.ArgumentParser(description='Puente local para Generador de /entornos')
    parser.add_argument('--slash', action='store_true', help='Enviar /entorno en lugar de entorno')
    parser.add_argument('--cl2', action='store_true', help='Usar consola CL2 (29300)')
    parser.add_argument('--console', action='store_true', help='Modo consola para diagnóstico con Python')
    args = parser.parse_args()
    try:
        load_site_config()
    except Exception as error:
        if args.console:
            print('Configuración no válida: ' + str(error))
        else:
            show_message('Corrige configuracion.json antes de iniciar el puente.\n\n' + str(error), True)
        return
    try:
        server = BridgeServer((HOST, PORT), Handler)
    except OSError:
        if args.console:
            print('El puente ya está abierto o el puerto está ocupado.')
        else:
            show_message('El puente ya está abierto o el puerto local está ocupado. Busca su icono en la bandeja junto al reloj.', True)
        return
    server.game_port = 29300 if args.cl2 else 29200
    server.slash = args.slash
    if not args.console:
        try:
            run_tray(server)
        except Exception:
            server.server_close()
            show_message('No se ha podido abrir el icono de bandeja. Cierra otras instancias e inténtalo de nuevo.', True)
        return
    print('Puente activo: '+ORIGIN)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

if __name__ == '__main__':
    main()
