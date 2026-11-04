"""Windows desktop UI: all dialogs live on the Tk main thread, never the tray loop."""
import queue
import threading
import ctypes
import tkinter as tk
from tkinter import ttk
from hotkeys import captured_hotkey


class DesktopUI:
    def __init__(self):
        self.root = tk.Tk()
        self.root.withdraw()
        self.tasks = queue.Queue()
        self.selector = None
        self.closed = False
        self.root.after(40, self.pump)

    def post(self, callback):
        self.tasks.put(callback)

    def pump(self):
        while not self.tasks.empty():
            callback = self.tasks.get_nowait()
            callback()
        if not self.closed:
            self.root.after(40, self.pump)

    def message(self, text, error=False):
        dialog = tk.Toplevel(self.root)
        dialog.title('Puente Entorno' + (' — Aviso' if error else ''))
        dialog.resizable(False, False)
        frame = ttk.Frame(dialog, padding=22)
        frame.pack(fill='both', expand=True)
        ttk.Label(frame, text=text, wraplength=440, justify='left').pack(anchor='w', pady=(0,18))
        button = ttk.Button(frame, text='Aceptar', command=dialog.destroy)
        button.pack(anchor='e')
        dialog.bind('<Return>', lambda event: dialog.destroy())
        dialog.bind('<Escape>', lambda event: dialog.destroy())
        dialog.grab_set()
        dialog.lift()
        button.focus_force()
        self.root.wait_window(dialog)
        if self.selector:
            self.selector.grab_set()

    def authorize_origin(self, origin, done):
        dialog = tk.Toplevel(self.root)
        dialog.title('Autorizar web — Puente Entorno')
        dialog.resizable(False, False)
        frame = ttk.Frame(dialog, padding=22)
        frame.pack(fill='both', expand=True)
        ttk.Label(frame, text='¿Permitir que esta web prepare y envíe entornos a FiveM?',
                  wraplength=440, justify='left').pack(anchor='w')
        ttk.Label(frame, text=origin, wraplength=440, justify='left',
                  font=('Segoe UI', 11, 'bold')).pack(anchor='w', pady=16)
        ttk.Label(frame, text='Acepta solo si acabas de pulsar Conectar puente en esa web.\nSe recordará en este PC y sustituirá la conexión actual.',
                  wraplength=440, justify='left').pack(anchor='w', pady=(0, 16))
        finished = [False]
        def close(accepted=False):
            if finished[0]:
                return
            finished[0] = True
            dialog.destroy()
            if self.selector:
                self.selector.grab_set()
            done(accepted)
        buttons = ttk.Frame(frame)
        buttons.pack(fill='x')
        ttk.Button(buttons, text='Autorizar esta web', command=lambda: close(True)).pack(side='right')
        cancel = ttk.Button(buttons, text='Cancelar', command=close)
        cancel.pack(side='right', padx=8)
        dialog.protocol('WM_DELETE_WINDOW', close)
        dialog.bind('<Escape>', lambda event: close())
        dialog.bind('<Return>', lambda event: close())
        dialog.after(60000, close)
        dialog.grab_set()
        dialog.lift()
        cancel.focus_force()

    def choose_hotkey(self, manager, save):
        if self.selector:
            self.selector.lift()
            self.selector.focus_force()
            return
        previous = manager.status()['configured']
        manager.configure('')
        window = self.selector = tk.Toplevel(self.root)
        window.title('Elegir atajo — Puente Entorno')
        window.resizable(False, False)
        frame = ttk.Frame(window, padding=22)
        frame.pack(fill='both', expand=True)
        ttk.Label(frame, text='Pulsa la tecla o combinación que quieras usar.').pack(anchor='w')
        ttk.Label(frame, text='Puedes usar letras, números, flechas, teclado numérico…').pack(anchor='w', pady=(4,14))
        selection = tk.StringVar(value=previous or 'Sin atajo')
        hint = tk.StringVar(value='Ctrl + F9 es el atajo predeterminado.')
        field = ttk.Entry(frame, textvariable=selection, state='readonly', width=42, justify='center')
        field.pack(fill='x', ipady=10)
        ttk.Label(frame, textvariable=hint, wraplength=420).pack(anchor='w', pady=12)
        candidate = [previous]
        testing = [False]

        def choose(value):
            candidate[0] = value
            selection.set(value or 'Sin atajo')
            hint.set('Pulsa Guardar para aplicar el atajo.')

        def capture(event):
            if testing[0]:
                return 'break'
            user32 = ctypes.WinDLL('user32')
            modifiers = sum(mask for vk, mask in ((17,2),(18,1),(16,4),(91,8))
                            if user32.GetKeyState(vk) & 0x8000)
            if user32.GetKeyState(92) & 0x8000:
                modifiers |= 8
            try:
                value = captured_hotkey(event.keycode, modifiers)
                if value is not None:
                    choose(value)
            except ValueError as error:
                hint.set(str(error))
            return 'break'

        def close(restore=True):
            if restore:
                manager.configure(previous)
            self.selector = None
            window.grab_release()
            window.destroy()

        def apply():
            testing[0] = True
            button.state(['disabled'])
            manager.configure(candidate[0])
            hint.set('Comprobando el atajo…')
            attempts = [0]

            def check():
                if self.selector is not window:
                    return
                state = manager.status()
                if candidate[0] and not state['active'] and not state['error'] and attempts[0] < 20:
                    attempts[0] += 1
                    window.after(100, check)
                    return
                if candidate[0] and not state['active']:
                    manager.configure('')
                    hint.set(state['error'] or 'No se pudo activar. Prueba otra tecla.')
                    testing[0] = False
                    button.state(['!disabled'])
                    return
                try:
                    save(candidate[0])
                except Exception as error:
                    manager.configure('')
                    hint.set('No se pudo guardar: ' + str(error))
                    testing[0] = False
                    button.state(['!disabled'])
                    return
                close(False)
            window.after(100, check)

        buttons = ttk.Frame(frame)
        buttons.pack(fill='x')
        ttk.Button(buttons, text='Predeterminado', command=lambda: choose('CTRL+F9')).pack(side='left')
        ttk.Button(buttons, text='Desactivar', command=lambda: choose('')).pack(side='left', padx=6)
        button = ttk.Button(buttons, text='Guardar', command=apply)
        button.pack(side='right')
        ttk.Button(buttons, text='Cancelar', command=close).pack(side='right', padx=6)
        window.bind('<KeyPress>', capture)
        window.protocol('WM_DELETE_WINDOW', close)
        window.grab_set()
        window.lift()
        field.focus_force()

    def stop(self):
        self.closed = True
        self.root.destroy()

    def run(self):
        self.root.mainloop()
