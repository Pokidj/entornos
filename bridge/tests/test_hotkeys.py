import importlib.util,pathlib,sys,unittest,time,socket,threading,struct
ROOT=pathlib.Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
import hotkeys
spec=importlib.util.spec_from_file_location('bridge_hotkey',ROOT/'puente.py');b=importlib.util.module_from_spec(spec);spec.loader.exec_module(b)
class HotkeyTests(unittest.TestCase):
 def test_parse(self):
  self.assertEqual(hotkeys.parse_hotkey('ctrl + f9'),('CTRL+F9',2,0x78))
  self.assertEqual(hotkeys.parse_hotkey('ALT+SHIFT+G'),('ALT+SHIFT+G',5,ord('G')))
  self.assertEqual(hotkeys.parse_hotkey('')[0],'')
  for value in ['CTRL+CTRL+F9','CTRL+','F25','VK_00','VK_FF','VK_A0']:
   with self.assertRaises(ValueError):hotkeys.parse_hotkey(value)
  for value,vk in [('A',65),('SPACE',32),('ENTER',13),('NUMPAD7',103),('LEFT',37),('F12',123),('VK_BA',186)]:
   self.assertEqual(hotkeys.parse_hotkey(value)[2],vk)
   self.assertEqual(hotkeys.captured_hotkey(vk),value)
  self.assertEqual(hotkeys.captured_hotkey(186,2),'CTRL+VK_BA')
  self.assertEqual(hotkeys.parse_hotkey('WIN+F9'),('WIN+F9',8,120))
  self.assertIsNone(hotkeys.captured_hotkey(17))
 def test_foreground_names(self):
  for name in ['FiveM_b3095_GTAProcess.exe','FiveM_GTAProcess.exe','C:\\Game\\FiveM_b3258_GTAProcess.exe']:
   self.assertTrue(hotkeys.is_game_process(name))
  for name in ['notepad.exe','FiveM.exe','FiveM_ChromeBrowser.exe','GTA5.exe','FakeFiveM_b3095_GTAProcess.exe','FiveM_cl2_b3095_GTAProcess.exe']:
   self.assertFalse(hotkeys.is_game_process(name))
  self.assertTrue(hotkeys.is_game_process('FiveM_cl2_b3095_GTAProcess.exe',True))
 def test_preparation_no_execution_and_dedupe(self):
  b.LAST_SEND=0
  server=b.BridgeServer(('127.0.0.1',0),b.Handler);server.slash=False;server.game_port=1
  try:
   result=b.prepare_text(server,'/entorno preparado');self.assertTrue(result['ready'])
   self.assertFalse(server.last_sent_id)
   self.assertEqual(b.send_prepared(server,lambda:False)[0],409)
   self.assertFalse(server.last_sent_id)
   self.assertEqual(b.send_prepared(server,lambda:True)[0],503)
   self.assertFalse(server.last_sent_id)
   server.last_sent_id=server.prepared_id
   self.assertTrue(b.prepare_text(server,'/entorno preparado')['sent'])
   self.assertEqual(b.send_prepared(server,lambda:True)[0],409)
   self.assertTrue(b.prepare_text(server,'/entorno nuevo')['ready'])
   self.assertFalse(b.prepare_text(server,'')['ready']);self.assertEqual(server.prepared_text,'')
  finally:server.server_close()
 def test_focus_and_packet(self):
  packets=[];listener=socket.socket();listener.bind(('127.0.0.1',0));listener.listen()
  def accept():
   try:sock,_=listener.accept()
   except OSError:return
   with sock:
    self.assertEqual(sock.recv(4),b'PPCR');sock.sendall(b'AINF\x00\xd3'+struct.pack('>I',12)+b'\0\0');data=b''
    while True:
     chunk=sock.recv(4096)
     if not chunk:break
     data+=chunk
    if data:packets.append(data)
  server=b.BridgeServer(('127.0.0.1',0),b.Handler);server.slash=False;server.game_port=listener.getsockname()[1]
  try:
   b.LAST_SEND=0;b.prepare_text(server,'/entorno prueba de atajo')
   threading.Thread(target=accept,daemon=True).start()
   calls=iter([True,True,False]);code,result=b.send_prepared(server,lambda:next(calls));self.assertEqual(code,409);time.sleep(.05);self.assertEqual(packets,[]);self.assertFalse(server.last_sent_id)
   threading.Thread(target=accept,daemon=True).start();code,result=b.send_prepared(server,lambda:True);self.assertEqual(code,200);time.sleep(.05);self.assertEqual(len(packets),1)
   self.assertTrue(server.preparation()['sent']);self.assertEqual(b.send_prepared(server,lambda:True)[0],409);self.assertEqual(len(packets),1)
  finally:server.server_close();listener.close()
 def test_changed_draft(self):
  server=b.BridgeServer(('127.0.0.1',0),b.Handler);server.slash=False
  try:
   b.prepare_text(server,'/entorno primero');old=server.prepared_id;b.prepare_text(server,'/entorno segundo')
   self.assertEqual(b.send_text(server,'/entorno primero',lambda:True,old)[0],409)
  finally:server.server_close()
 def test_native_registration(self):
  if sys.platform!='win32':self.skipTest('Windows')
  manager=hotkeys.HotkeyManager(lambda:None,'CTRL+ALT+SHIFT+F24');manager.start()
  try:
   if not manager.status()['active'] and manager.native_error == 5:
    self.skipTest('El entorno aislado no permite RegisterHotKey; requiere prueba en el escritorio de Windows.')
   self.assertTrue(manager.status()['active'],manager.status()['error']);manager.configure('');time.sleep(.1);self.assertFalse(manager.status()['active'])
  finally:manager.stop()
if __name__=='__main__':unittest.main(verbosity=2)
