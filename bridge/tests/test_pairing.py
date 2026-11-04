import importlib.util
import http.client
import json
import pathlib
import sys
import tempfile
import threading
import time
import unittest
from unittest.mock import patch

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
spec = importlib.util.spec_from_file_location('bridge_pair_tests', ROOT / 'puente.py')
b = importlib.util.module_from_spec(spec)
spec.loader.exec_module(b)


class PairingTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        b.CONFIG_PATH = pathlib.Path(self.temp.name) / 'configuracion.json'
        b.CONFIG_PATH.write_text('{"hotkey":"CTRL+F9","custom":"preserved"}')
        b.ORIGIN = 'https://old.example'
        b.WEB_URL = b.ORIGIN + '/'
        b.TOKEN = 'old-token'
        self.server = b.BridgeServer(('127.0.0.1', 0), b.Handler)
        b.PORT = self.server.server_port
        self.server.game_port = 1
        self.server.slash = False
        threading.Thread(target=self.server.serve_forever, daemon=True).start()

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.temp.cleanup()

    def request(self, path, origin='https://new.example', body=None, token=None, host=None):
        c = http.client.HTTPConnection('127.0.0.1', b.PORT, timeout=4)
        headers = {'Origin': origin}
        if body is not None:
            headers['Content-Type'] = 'application/json'
        if token:
            headers['X-Entorno-Token'] = token
        if host:
            headers['Host'] = host
        c.request('POST' if body is not None else 'GET', path,
                  json.dumps(body) if body is not None else None, headers)
        r = c.getresponse()
        result = (r.status, dict(r.getheaders()), json.loads(r.read()))
        c.close()
        return result

    def test_discovery_has_no_session_or_game_data(self):
        code, headers, data = self.request('/discover')
        self.assertEqual(code, 200)
        self.assertFalse(data['authorized'])
        self.assertEqual(headers['Access-Control-Allow-Origin'], 'https://new.example')
        self.assertNotIn('token', data)
        self.assertNotIn('preparation', data)
        code, headers, _ = self.request('/health')
        self.assertEqual(code, 403)
        self.assertNotIn('Access-Control-Allow-Origin', headers)
        self.assertEqual(self.request('/execute', body={'text': '/entorno prueba'})[0], 403)

    def test_invalid_origins_and_dns_rebinding(self):
        for origin in ['null', 'file:///test', '*', 'https://new.example/path', 'https://user:pass@new.example']:
            self.assertEqual(self.request('/discover', origin)[0], 403)
        self.assertEqual(self.request('/discover', host='attacker.example')[0], 403)

    def test_accept_rotates_session_and_clears_preparation(self):
        b.prepare_text(self.server, '/entorno anterior')
        self.server.pairing.approve = lambda origin, done: done(True)
        self.assertEqual(self.request('/pair', body={})[0], 200)
        self.assertNotEqual(b.TOKEN, 'old-token')
        self.assertFalse(self.server.preparation()['ready'])
        self.assertEqual(self.request('/health', 'https://old.example')[0], 403)
        self.assertEqual(self.request('/prepare', body={'text': '/entorno nuevo'}, token='old-token')[0], 403)
        self.assertEqual(self.request('/prepare', body={'text': '/entorno nuevo'}, token=b.TOKEN)[0], 200)
        saved = json.loads(b.CONFIG_PATH.read_text())
        self.assertEqual(saved['web_url'], 'https://new.example/')
        self.assertEqual(saved['custom'], 'preserved')
        self.assertIn('https://new.example', saved['trusted_origins'])
        self.assertNotIn('token', saved)

    def test_denial_and_rate_limit(self):
        self.server.pairing.approve = lambda origin, done: done(False)
        self.assertEqual(self.request('/pair', body={})[0], 403)
        self.assertEqual(b.ORIGIN, 'https://old.example')
        self.assertEqual(self.request('/pair', body={})[0], 429)

    def test_requires_desktop_and_valid_json(self):
        self.assertEqual(self.request('/pair', body={})[0], 503)
        self.assertEqual(self.request('/pair', body={'accept': True})[0], 400)

    def test_timeout_does_not_accept_late_callback(self):
        callbacks = []
        self.server.pairing.timeout = .02
        self.server.pairing.approve = lambda origin, done: callbacks.append(done)
        self.assertEqual(self.request('/pair', body={})[0], 403)
        callbacks[0](True)
        self.assertEqual(b.ORIGIN, 'https://old.example')

    def test_pending_dialog_is_not_duplicated(self):
        callbacks = []
        self.server.pairing.timeout = 1
        self.server.pairing.approve = lambda origin, done: callbacks.append(done)
        results = []
        thread = threading.Thread(target=lambda: results.append(self.server.pairing.connect('https://new.example')))
        thread.start()
        deadline = time.monotonic() + 1
        while not callbacks and time.monotonic() < deadline:
            time.sleep(.01)
        self.assertEqual(self.server.pairing.connect('https://other.example')[0], 409)
        callbacks[0](False)
        thread.join(2)
        self.assertEqual(results[0][0], 403)

    def test_remembers_origin_after_restart(self):
        self.server.pairing.approve = lambda origin, done: done(True)
        self.assertEqual(self.request('/pair', body={})[0], 200)
        b.load_site_config()
        self.assertEqual(b.ORIGIN, 'https://new.example')
        self.server.pairing.approve = lambda *args: self.fail('Known origin prompted again')
        self.assertEqual(self.request('/pair', 'https://old.example', body={})[0], 200)
        self.assertEqual(b.ORIGIN, 'https://old.example')

    def test_bad_configuration_never_grants_access(self):
        self.server.pairing.approve = lambda origin, done: done(True)
        b.CONFIG_PATH.write_text('broken')
        self.assertEqual(self.request('/pair', body={})[0], 503)
        self.assertEqual(b.TOKEN, 'old-token')
        self.assertEqual(self.request('/health')[0], 403)

    def test_session_rotated_while_request_waits(self):
        parsed = threading.Event()
        original = b.normalize_command
        def normalize(*args, **kwargs):
            result = original(*args, **kwargs)
            parsed.set()
            return result
        results = []
        with patch.object(b, 'normalize_command', normalize):
            with b.SEND_LOCK:
                thread = threading.Thread(target=lambda: results.append(self.request(
                    '/prepare', 'https://old.example', {'text': '/entorno pendiente'}, 'old-token')))
                thread.start()
                self.assertTrue(parsed.wait(2))
                b.activate_origin(self.server, 'https://new.example', {'https://new.example', 'https://old.example'})
                b.activate_origin(self.server, 'https://old.example', {'https://new.example', 'https://old.example'})
            thread.join(3)
        self.assertEqual(results[0][0], 403)
        self.assertFalse(self.server.preparation()['ready'])
