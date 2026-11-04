import pathlib, sys, unittest, threading, http.client, json
from unittest.mock import patch
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
import puente as b

class Console:
    def __init__(self, fail=False): self.fail=fail
    def __enter__(self): return self
    def __exit__(self,*args): pass
    def sendall(self,frame):
        if self.fail: raise OSError('uncertain write')

class EventTests(unittest.TestCase):
    def setUp(self):
        self.server=b.BridgeServer(('127.0.0.1',0),b.Handler)
        self.server.game_port=1;self.server.slash=False
        self.old_port=b.PORT;b.PORT=self.server.server_port;b.LAST_SEND=0
        threading.Thread(target=self.server.serve_forever,daemon=True).start()
    def tearDown(self):
        self.server.shutdown();self.server.server_close();b.PORT=self.old_port
    def request(self,path,body,token=True):
        client=http.client.HTTPConnection('127.0.0.1',b.PORT,timeout=3)
        headers={'Origin':b.ORIGIN,'Content-Type':'application/json'}
        if token:headers['X-Entorno-Token']=b.TOKEN
        client.request('POST',path,json.dumps(body),headers)
        response=client.getresponse();result=response.status,json.loads(response.read());client.close();return result
    def test_success_events_only(self):
        b.prepare_text(self.server,'/entorno primero')
        self.assertEqual(self.server.send_sequence,0)
        with patch.object(b,'connect_console',side_effect=OSError('offline')):
            self.assertEqual(b.send_prepared(self.server,lambda:True)[0],503)
        self.assertEqual(self.server.send_sequence,0)
        with patch.object(b,'connect_console',return_value=Console(True)):
            self.assertEqual(b.send_prepared(self.server,lambda:True)[0],503)
        self.assertEqual(self.server.send_sequence,0,'uncertain writes do not trigger regeneration')
        b.LAST_SEND=0
        b.prepare_text(self.server,'/entorno segundo')
        with patch.object(b,'connect_console',return_value=Console()):
            self.assertEqual(b.send_prepared(self.server,lambda:True)[0],200)
            self.assertEqual(self.server.last_send_event,{'sequence':1,'source':'hotkey','text':'/entorno segundo'})
            self.assertEqual(b.send_prepared(self.server,lambda:True)[0],409)
        self.assertEqual(self.server.send_sequence,1)
        b.LAST_SEND=0
        with patch.object(b,'connect_console',return_value=Console()):
            self.assertEqual(b.send_text(self.server,'/entorno manual')[0],200)
        self.assertEqual(self.server.last_send_event['source'],'web')
        self.assertEqual(self.server.send_sequence,2)
    def test_authenticated_event_delivery(self):
        self.assertEqual(self.request('/events',{'after':0},False)[0],403)
        for after in [-1,'0',True,None]:
            self.assertEqual(self.request('/events',{'after':after})[0],400)
        result=[]
        waiting=threading.Thread(target=lambda:result.append(self.request('/events',{'after':0})))
        waiting.start()
        b.prepare_text(self.server,'/entorno evento')
        with patch.object(b,'connect_console',return_value=Console()):
            self.assertEqual(b.send_prepared(self.server,lambda:True)[0],200)
        waiting.join(3);self.assertFalse(waiting.is_alive())
        self.assertEqual(result[0][0],200)
        self.assertEqual(result[0][1]['event']['source'],'hotkey')
        self.assertEqual(result[0][1]['event']['text'],'/entorno evento')

if __name__=='__main__':unittest.main(verbosity=2)
