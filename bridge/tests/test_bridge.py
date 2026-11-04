import importlib.util, pathlib, socket, threading, struct, http.client, json, tempfile, unittest, time
ROOT=pathlib.Path(__file__).resolve().parents[1]
import sys
sys.path.insert(0,str(ROOT))
SPEC=importlib.util.spec_from_file_location('bridge',ROOT/'puente.py')
b=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(b)
class BridgeTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.packets=[];cls.listener=socket.socket();cls.listener.bind(('127.0.0.1',0));cls.listener.listen();cls.game_port=cls.listener.getsockname()[1]
  def run():
   while True:
    try:sock,_=cls.listener.accept()
    except OSError:return
    def client(sock):
     with sock:
      if sock.recv(4)!=b'PPCR':return
      ack=b'AINF\x00\xd3'+struct.pack('>I',16)+b'\0\0TEST';sock.sendall(ack[:3]);sock.sendall(ack[3:]);data=b''
      while True:
       try:chunk=sock.recv(8192)
       except ConnectionResetError:break
       if not chunk:break
       data+=chunk
      if data:cls.packets.append(data)
    threading.Thread(target=client,args=(sock,),daemon=True).start()
  threading.Thread(target=run,daemon=True).start();cls.http=b.BridgeServer(('127.0.0.1',0),b.Handler);b.PORT=cls.http.server_port;cls.http.game_port=cls.game_port;cls.http.slash=False
  threading.Thread(target=cls.http.serve_forever,daemon=True).start()
 @classmethod
 def tearDownClass(cls):cls.http.shutdown();cls.http.server_close();cls.listener.close()
 def request(self,method,path,body=None,origin=None,token=None,headers=None):
  c=http.client.HTTPConnection('127.0.0.1',b.PORT,timeout=4);h=headers or {}
  if origin:h['Origin']=origin
  if token:h['X-Entorno-Token']=token
  if body is not None:h['Content-Type']='application/json';body=json.dumps(body)
  c.request(method,path,body,h);r=c.getresponse();raw=r.read();result=(r.status,dict(r.getheaders()),json.loads(raw) if raw else None);c.close();return result
 def test_01_health(self):
  status,h,data=self.request('GET','/health',origin=b.ORIGIN);self.assertEqual(status,200);self.assertTrue(data['connected']);self.assertEqual(h['Access-Control-Allow-Origin'],b.ORIGIN)
 def test_02_origins(self):
  for origin in [None,'null','https://malicious.example',b.ORIGIN+'.attacker.example']:
   status,h,_=self.request('GET','/health',origin=origin);self.assertEqual(status,403);self.assertNotIn('Access-Control-Allow-Origin',h)
 def test_03_preflight(self):
  status,h,_=self.request('OPTIONS','/execute',origin=b.ORIGIN);self.assertEqual(status,204);self.assertEqual(h['Access-Control-Allow-Private-Network'],'true')
 def test_04_session(self):
  self.assertEqual(self.request('POST','/execute',{'text':'/entorno prueba'},origin=b.ORIGIN)[0],403)
  self.assertEqual(self.request('POST','/execute',{'text':'/entorno prueba'},origin=b.ORIGIN,token='ñ')[0],403)
 def test_05_command_validation(self):
  for value in ['quit','/entornos prueba','/entorno ','/entorno prueba\nquit','/entorno prueba\x00','/entorno '+('a'*6001),None,123]:
   with self.assertRaises(ValueError):b.normalize_command(value)
  self.assertEqual(b.normalize_command('/entorno A; "hola".'),'entorno "A, ”hola”."');self.assertTrue(b.normalize_command('/entorno prueba',True).startswith('/entorno '))
 def test_06_send_frame(self):
  status,_,data=self.request('POST','/execute',{'text':'/entorno Dos personas; pistola visible.'},origin=b.ORIGIN,token=b.TOKEN);self.assertEqual(status,200);self.assertTrue(data['ok']);time.sleep(.05)
  frame=self.packets[-1];self.assertEqual(frame[:6],b'CMND\x00\xd3');self.assertEqual(struct.unpack('>I',frame[6:10])[0],len(frame)-12);self.assertTrue(frame.endswith(b'\n\x00'));self.assertNotIn(b';',frame[12:])
  self.assertEqual(self.request('POST','/execute',{'text':'/entorno Otra'},origin=b.ORIGIN,token=b.TOKEN)[0],429)
 def test_07_invalid_json_and_text(self):
  self.assertEqual(self.request('POST','/execute',{'text':'quit'},origin=b.ORIGIN,token=b.TOKEN)[0],400)
  self.assertEqual(self.request('POST','/execute',['array'],origin=b.ORIGIN,token=b.TOKEN)[0],400)
 def test_08_host(self):
  self.assertEqual(self.request('GET','/health',origin=b.ORIGIN,headers={'Host':'example.com'})[0],403)
 def test_09_urls(self):
  self.assertEqual(b.parse_site_url('https://EXAMPLE.es:443/app/'),('https://example.es/app/','https://example.es'))
  self.assertEqual(b.parse_site_url('http://localhost:8080/')[1],'http://localhost:8080')
  for value in ['file:///C:/index.html','https://user:pass@web.es','https://web.es/?x=1','https://web.es/#x','https://web.es:0/','https://bad host/','https://web.es\\evil/','*']:
   with self.assertRaises(ValueError,msg=value):b.parse_site_url(value)
 def test_10_reload(self):
  old_path,old_url,old_origin,old_token=b.CONFIG_PATH,b.WEB_URL,b.ORIGIN,b.TOKEN
  try:
   with tempfile.TemporaryDirectory() as directory:
    b.CONFIG_PATH=pathlib.Path(directory)/'configuracion.json';b.CONFIG_PATH.write_text(json.dumps({'web_url':'https://other.example/generator/'}));b.load_site_config();self.assertEqual(b.ORIGIN,'https://other.example');self.assertNotEqual(b.TOKEN,old_token)
    self.assertEqual(self.request('GET','/health',origin=old_origin)[0],403)
    self.assertEqual(self.request('GET','/health',origin=b.ORIGIN)[0],200)
    b.CONFIG_PATH.write_text('invalid');
    with self.assertRaises(ValueError):b.load_site_config()
    self.assertEqual(b.ORIGIN,'https://other.example')
  finally:b.CONFIG_PATH,b.WEB_URL,b.ORIGIN,b.TOKEN=old_path,old_url,old_origin,old_token
 def test_11_offline(self):
  self.http.game_port=1
  try:self.assertFalse(self.request('GET','/health',origin=b.ORIGIN)[2]['connected'])
  finally:self.http.game_port=self.game_port
 def test_12_prepare_endpoint(self):
  code,_,data=self.request('POST','/prepare',{'text':'/entorno Borrador de prueba'},origin=b.ORIGIN,token=b.TOKEN)
  self.assertEqual(code,200);self.assertTrue(data['ready'])
  _,_,health=self.request('GET','/health',origin=b.ORIGIN)
  self.assertEqual(health['version'],3);self.assertIn('prepare',health['capabilities']);self.assertTrue(health['preparation']['ready'])
  packet_count=len(self.packets)
  code,_,data=self.request('POST','/prepare',{'text':''},origin=b.ORIGIN,token=b.TOKEN)
  self.assertEqual(code,200);self.assertFalse(data['ready']);self.assertEqual(len(self.packets),packet_count)
  self.assertEqual(self.request('POST','/prepare',{'text':'quit'},origin=b.ORIGIN,token=b.TOKEN)[0],400)
  self.assertEqual(self.request('POST','/prepare',{'text':'/entorno Prueba'},origin='https://other.test',token=b.TOKEN)[0],403)
if __name__=='__main__':unittest.main(verbosity=2)
