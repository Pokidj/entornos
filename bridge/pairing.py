"""Native approval for a new web origin. Discovery never exposes a session token."""
import threading
import time


class Pairing:
    def __init__(self, activate, trusted):
        self.activate = activate
        self.trusted = set(trusted)
        self.approve = None
        self.lock = threading.Lock()
        self.pending = None
        self.last_request = -100.0
        self.timeout = 60

    def connect(self, origin):
        # Only one dialog can exist, including when a browser repeats its request.
        with self.lock:
            if self.pending is not None:
                return 409, {'error': 'Ya hay una autorización pendiente en el puente.'}
            if origin in self.trusted:
                try:
                    self.activate(origin, self.trusted)
                except (OSError, ValueError):
                    return 503, {'error': 'No se pudo guardar la autorización. Mueve el puente a una carpeta con permisos de escritura.'}
                return 200, {'ok': True}
            if self.approve is None:
                return 503, {'error': 'La autorización requiere el puente abierto en la bandeja de Windows.'}
            if time.monotonic() - self.last_request < 15:
                return 429, {'error': 'Espera unos segundos antes de solicitar otra autorización.'}
            if len(self.trusted) >= 32:
                return 409, {'error': 'Se ha alcanzado el límite de webs recordadas.'}
            self.last_request = time.monotonic()
            event = threading.Event()
            result = [403, {'error': 'Autorización rechazada o caducada.'}]
            request = object()
            self.pending = request

        def complete(accepted):
            with self.lock:
                if self.pending is not request or event.is_set():
                    return
                if accepted:
                    try:
                        trusted = self.trusted | {origin}
                        self.activate(origin, trusted)
                        self.trusted = trusted
                        result[:] = [200, {'ok': True}]
                    except (OSError, ValueError):
                        result[:] = [503, {'error': 'No se pudo guardar la autorización. Mueve el puente a una carpeta con permisos de escritura.'}]
                event.set()

        try:
            self.approve(origin, complete)
            event.wait(self.timeout)
        finally:
            with self.lock:
                if self.pending is request:
                    self.pending = None
        return tuple(result)
