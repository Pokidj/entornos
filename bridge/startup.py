"""Opt-in, per-user Windows logon startup. No elevation or scheduled tasks."""
import subprocess
import sys
from pathlib import Path

RUN_KEY = r'Software\Microsoft\Windows\CurrentVersion\Run'
VALUE_NAME = 'PuenteEntorno'


def startup_command():
    executable = Path(sys.executable).resolve()
    if getattr(sys, 'frozen', False):
        command = [str(executable)]
    else:
        command = [str(executable.with_name('pythonw.exe')),
                   str(Path(__file__).with_name('puente.py').resolve())]
    command.extend(arg for arg in sys.argv[1:] if arg in ('--slash', '--cl2'))
    return subprocess.list2cmdline(command)


def is_enabled(registry=None):
    if registry is None:
        import winreg as registry
    try:
        with registry.OpenKey(registry.HKEY_CURRENT_USER, RUN_KEY) as key:
            value, kind = registry.QueryValueEx(key, VALUE_NAME)
            return kind == registry.REG_SZ and value == startup_command()
    except FileNotFoundError:
        return False


def set_enabled(enabled, registry=None):
    if registry is None:
        import winreg as registry
    if enabled:
        command = startup_command()
        if len(command) > 260:
            raise ValueError('La ruta es demasiado larga. Mueve el puente a una carpeta más corta.')
        with registry.CreateKeyEx(registry.HKEY_CURRENT_USER, RUN_KEY, 0, registry.KEY_SET_VALUE) as key:
            registry.SetValueEx(key, VALUE_NAME, 0, registry.REG_SZ, command)
    else:
        try:
            with registry.OpenKey(registry.HKEY_CURRENT_USER, RUN_KEY, 0, registry.KEY_SET_VALUE) as key:
                registry.DeleteValue(key, VALUE_NAME)
        except FileNotFoundError:
            pass
