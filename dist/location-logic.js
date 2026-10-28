// Compatibilidad entre la escena y el lugar, conservando los índices guardados.
const locationGroups=[
{words:['yate','carguero'],places:['puerto','muelle','embarcadero','embarcadero de pescadores','zona de contenedores','terminal de carga'],coastal:true},
{words:['furgón blindado'],places:[]},
{words:['farmacia','farmacéutico'],places:['farmacia']},
{words:['licorería'],places:['licorería']},
{words:['badulaque'],places:['tienda','supermercado']},
{words:['tienda digital','electrónica','móviles','ordenadores'],places:['tienda de electrónica']},
{words:['pawnshop','casa de empeños'],places:[]},
{words:['tienda de ropa','prendas'],places:['tienda de ropa']},
{words:['barbería'],places:['barbería','peluquería']},
{words:['chatarrería','chatarra'],places:['desguace','centro de reciclaje']},
{words:['joyería'],places:['joyería']},
{words:['gasolinera','combustible'],places:['gasolinera','estación de servicio abandonada']},
{words:['banco'],places:['banco']},
{words:['supermercado'],places:['supermercado','tienda']},
{words:['armería'],places:['armería']},
{words:['restaurante'],places:['restaurante','local de comida rápida']},
{words:['bar'],places:['bar','club nocturno','discoteca']},
{words:['casino'],places:['casino']},
{words:['casa','casas','vivienda','viviendas','habitantes'],places:['vivienda','mansión','bloque de apartamentos','urbanización']},
{words:['almacén'],places:['almacén','nave industrial']},
{words:['taller'],places:['taller']},
{words:['garaje'],places:['garaje','aparcamiento','aparcamiento subterráneo']},
{words:['nave industrial'],places:['nave industrial','almacén']},
{words:['tienda'],places:['tienda','supermercado','tienda de ropa','tienda de electrónica','licorería','farmacia','armería','joyería']},
{words:['local'],places:['tienda','bar','restaurante','club nocturno','discoteca','supermercado','barbería','peluquería','tienda de ropa','tienda de electrónica','licorería','farmacia','armería','joyería','cafetería']}
];
function mentionedWord(text,word){const escaped=norm(word).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return new RegExp('(?:^|[^a-z])'+escaped+'(?:$|[^a-z])').test(norm(text));}
function locationRule(action){const explicit=locationGroups.find(g=>g.words.some(w=>mentionedWord(action,w)));if(explicit)return explicit;const limit=places.indexOf('en Paleto Bay');const candidates=places.slice(0,limit<0?places.length:limit).map(p=>p.replace(/^(en |junto a |bajo )(un |una |el |la |los |las )?/,'' )).filter(w=>w.length>3&&!['calle','zona rural','carretera secundaria','camino de tierra'].includes(w)).sort((a,b)=>b.length-a.length);const match=candidates.find(w=>mentionedWord(action,w));return match?{words:[match],places:[match]}:null;}
function compatiblePlaceIndices(action){const rule=locationRule(action);if(!rule)return places.map((_,i)=>i);const geographicStart=places.indexOf('en Paleto Bay');return places.map((p,i)=>({p,i})).filter(({p,i})=>(geographicStart>=0&&i>=geographicStart&&(!rule.coastal||['Paleto Bay','Procopio Beach','Cape Catfish','El Gordo Lighthouse','North Chumash','Chumash','Pacific Bluffs','Pacific Ocean','Los Santos','La Puerta','Banning','Elysian Island','Terminal','Port of Los Santos','Vespucci','Vespucci Beach','Vespucci Canals','Del Perro Beach','Del Perro Pier','Cayo Perico'].some(name=>p==='en '+name)))||rule.places.some(w=>norm(p.replace(/^en (?:un |una |el |la )?/,''))===norm(w))).map(x=>x.i);}
let lastLocationRule='';const locationHint=document.createElement('div');locationHint.id='location-hint';locationHint.className='hint';$('place').parentElement.after(locationHint);
function syncCompatiblePlaces(){const action=$('situation').value===''?'':situations[+$('situation').value]?.[0]||'';const allowed=compatiblePlaceIndices(action),key=allowed.join(',');const selected=$('place').value;let cleared=false;if(selected!==''&&!allowed.includes(+selected)){ $('place').value='';cleared=true; }
if(key!==lastLocationRule){const current=$('place').value,placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='Sin seleccionar';$('place').replaceChildren(placeholder,...allowed.map(i=>{const o=document.createElement('option');o.value=String(i);o.textContent=places[i];return o}));$('place').value=current;lastLocationRule=key;}
const rule=locationRule(action);locationHint.textContent=cleared?'Se ha quitado el lugar anterior porque no encaja con esta situación.':rule?'Lugares compatibles con la situación. También puedes elegir una zona de GTA V o dejarlo sin concretar.':'';if(typeof syncAllSelects==='function')syncAllSelects();}
const generateWithPlaces=generate;generate=function(){syncCompatiblePlaces();generateWithPlaces()};syncCompatiblePlaces();
