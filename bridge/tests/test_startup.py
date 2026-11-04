import pathlib, sys, unittest
from unittest.mock import patch
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
import startup


class Registry:
    HKEY_CURRENT_USER = 1
    KEY_SET_VALUE = 2
    REG_SZ = 3
    def __init__(self): self.values = {}; self.writes = []
    def __enter__(self): return self
    def __exit__(self, *args): pass
    def OpenKey(self, *args): return self
    CreateKeyEx = OpenKey
    def QueryValueEx(self, key, name):
        if name not in self.values: raise FileNotFoundError()
        return self.values[name]
    def SetValueEx(self, key, name, reserved, kind, value):
        self.values[name] = (value, kind)
        self.writes.append((name, value))
    def DeleteValue(self, key, name):
        if name not in self.values: raise FileNotFoundError()
        del self.values[name]


class StartupTests(unittest.TestCase):
    def test_opt_in_and_disable(self):
        registry = Registry()
        registry.values['OtherApp'] = ('keep', registry.REG_SZ)
        self.assertFalse(startup.is_enabled(registry))
        startup.set_enabled(True, registry)
        self.assertTrue(startup.is_enabled(registry))
        startup.set_enabled(False, registry)
        startup.set_enabled(False, registry)
        self.assertFalse(startup.is_enabled(registry))
        self.assertEqual(registry.values['OtherApp'][0], 'keep')

    def test_quotes_and_modes(self):
        with patch.object(sys, 'frozen', True, create=True), patch.object(sys, 'executable', r'C:\Mis herramientas\Puente Entorno.exe'), patch.object(sys, 'argv', ['bridge', '--cl2', '--slash', '--console', 'bad']):
            self.assertEqual(startup.startup_command(), '"C:\\Mis herramientas\\Puente Entorno.exe" --cl2 --slash')

    def test_stale_path(self):
        registry = Registry()
        registry.values[startup.VALUE_NAME] = ('old.exe', registry.REG_SZ)
        self.assertFalse(startup.is_enabled(registry))

    def test_denied_write(self):
        registry = Registry()
        with patch.object(registry, 'CreateKeyEx', side_effect=PermissionError('denied')):
            with self.assertRaises(PermissionError): startup.set_enabled(True, registry)
        self.assertFalse(startup.is_enabled(registry))

if __name__ == '__main__': unittest.main(verbosity=2)
