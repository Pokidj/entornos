const meleeWeapons = [
  "Cuchillo",
  "Navaja",
  "Puño americano",
  "Bate de béisbol",
  "Porra",
  "Martillo",
  "Palanca",
  "Hacha",
  "Machete",
  "Botella rota",
  "Taco de billar",
  "Palo de golf",
  "Linterna",
  "Llave de tubo",
  "Hacha de combate",
  "Hacha de piedra",
  "Bastón de caramelo",
];
const firearmWeapons = [
  "Pistola",
  "Revólver",
  "Pistola eléctrica",
  "Subfusil",
  "Escopeta",
  "Rifle",
  "Rifle de francotirador",
  "Ametralladora",
  "Lanzagranadas",
  "Lanzacohetes",
  "Minigun",
  "Arma futurista",
];
const weaponDescription = {
  "Arma melee": "un arma cuerpo a cuerpo",
  "Arma de fuego": "un arma de fuego",
  Cuchillo: "un cuchillo",
  Navaja: "una navaja",
  Pincho: "un pincho",
  "Puño americano": "un puño americano",
  "Bate de béisbol": "un bate de béisbol",
  Porra: "una porra",
  Martillo: "un martillo",
  Palanca: "una palanca",
  Hacha: "un hacha",
  Machete: "un machete",
  "Botella rota": "una botella rota",
  "Taco de billar": "un taco de billar",
  "Palo de golf": "un palo de golf",
  Linterna: "una linterna",
  "Llave de tubo": "una llave de tubo",
  "Hacha de combate": "un hacha",
  "Hacha de piedra": "un hacha",
  "Bastón de caramelo": "un bastón",
  Pistola: "una pistola",
  Revólver: "un revólver",
  "Pistola eléctrica": "una pistola eléctrica",
  Subfusil: "un subfusil",
  Escopeta: "una escopeta",
  Rifle: "un rifle",
  "Rifle de francotirador": "un rifle de francotirador",
  Ametralladora: "una ametralladora",
  Lanzagranadas: "un lanzagranadas",
  Lanzacohetes: "un lanzacohetes",
  Minigun: "una ametralladora pesada",
  "Arma futurista": "un arma de fuego",
};
function renderWeapons() {
  const category =
    weapon === "Desarmado" || weapon === "No se distingue"
      ? weapon
      : weapon === "Arma melee" ||
          meleeWeapons.includes(weapon) ||
          weapon === "Pincho"
        ? "Arma melee"
        : weapon
          ? "Arma de fuego"
          : "";
  const root = $("weapons");
  root.replaceChildren();
  for (const name of [
    "Desarmado",
    "Arma melee",
    "Arma de fuego",
    "No se distingue",
  ]) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = name;
    b.setAttribute("aria-pressed", String(category === name));
    b.onclick = () => {
      weapon = name;
      renderWeapons();
      generate();
    };
    root.append(b);
  }
  let details = $("weapon-types");
  if (!details) {
    details = document.createElement("div");
    details.id = "weapon-types";
    details.className = "chips";
    details.style.marginTop = "10px";
    root.after(details);
  }
  details.replaceChildren();
  details.hidden = !["Arma melee", "Arma de fuego"].includes(category);
  if (!details.hidden) {
    const label = document.createElement("div");
    label.className = "hint";
    label.style.width = "100%";
    label.textContent = "Tipo visible (opcional):";
    details.append(label);
    for (const name of category === "Arma melee"
      ? meleeWeapons
      : firearmWeapons) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = name;
      b.setAttribute("aria-pressed", String(weapon === name));
      b.onclick = () => {
        weapon = name;
        renderWeapons();
        generate();
      };
      details.append(b);
    }
  }
}
const $ = (id) => document.getElementById(id);
let number = "",
  weapon = "",
  catalog = [],
  vehicle = null,
  pendingVehicleId = null,
  onlyFav = false,
  favs = new Set();
let storageOK = true;
try {
  const saved = JSON.parse(localStorage.getItem("entorno-favs") || "[]");
  if (Array.isArray(saved))
    favs = new Set(saved.filter((x) => typeof x === "string"));
} catch {
  storageOK = false;
}
const colors = [
  "negro",
  "blanco",
  "gris",
  "gris oscuro",
  "plateado",
  "rojo",
  "rojo oscuro",
  "azul",
  "azul marino",
  "azul claro",
  "verde",
  "verde oscuro",
  "verde lima",
  "amarillo",
  "naranja",
  "morado",
  "rosa",
  "marrón",
  "beige",
  "dorado",
  "bronce",
  "turquesa",
  "granate",
  "camuflaje",
  "varios colores",
  "no se distingue",
];
const situations = [
  [
    "amenazando a alguien",
    "está amenazando a alguien",
    "están amenazando a alguien",
  ],
  [
    "atracando una tienda",
    "está atracando una tienda",
    "están atracando una tienda",
  ],
  [
    "robando un vehículo",
    "está robando un vehículo",
    "están robando un vehículo",
  ],
  [
    "forzando una puerta",
    "está forzando una puerta",
    "están forzando una puerta",
  ],
  ["disparando", "está disparando", "están disparando"],
  ["peleándose", "está golpeando a otra persona", "están peleándose"],
  [
    "reteniendo a alguien",
    "está reteniendo a alguien",
    "están reteniendo a alguien",
  ],
  [
    "persiguiendo a alguien",
    "está persiguiendo a alguien",
    "están persiguiendo a alguien",
  ],
  ["huyendo del lugar", "está huyendo del lugar", "están huyendo del lugar"],
  [
    "conduciendo temerariamente",
    "está conduciendo de forma temeraria",
    "están conduciendo de forma temeraria",
  ],
  [
    "destrozando mobiliario",
    "está destrozando mobiliario",
    "están destrozando mobiliario",
  ],
  [
    "rondando la zona",
    "está dando vueltas por la zona",
    "están dando vueltas por la zona",
  ],
  [
    "discutiendo a gritos",
    "está discutiendo a gritos con alguien",
    "están discutiendo a gritos",
  ],
  [
    "sacando objetos de un local",
    "está sacando objetos de un local",
    "están sacando objetos de un local",
  ],
  ["golpeando un coche", "está golpeando un coche", "están golpeando un coche"],
  [
    "entrando en una propiedad",
    "está entrando en una propiedad",
    "están entrando en una propiedad",
  ],
  [
    "tirando objetos",
    "está tirando objetos a la calle",
    "están tirando objetos a la calle",
  ],
  ["pidiendo ayuda", "está pidiendo ayuda", "están pidiendo ayuda"],
  [
    "rompiendo farolas",
    "está rompiendo las farolas",
    "están rompiendo las farolas",
  ],
  [
    "arrancando una señal de STOP",
    "está arrancando una señal de STOP",
    "están arrancando una señal de STOP",
  ],
  [
    "atracando una farmacia",
    "está atracando una farmacia",
    "están atracando una farmacia",
  ],
  [
    "robando en un cajero",
    "está robando en un cajero",
    "están robando en un cajero",
  ],
  [
    "rompiendo escaparates",
    "está rompiendo escaparates",
    "están rompiendo escaparates",
  ],
  [
    "pinchando ruedas",
    "está pinchando las ruedas de un coche",
    "están pinchando las ruedas de un coche",
  ],
];
function options(id, items) {
  $(id).replaceChildren(
    ...items.map((s, i) => {
      const o = document.createElement("option");
      o.value = String(i);
      o.textContent = s;
      return o;
    }),
  );
}
situations.push(
  ...[
    "amenazando al dependiente",
    "forzando una persiana",
    "intentando abrir coches aparcados",
    "pintando una fachada",
    "destrozando una terraza",
    "bloqueando la carretera",
    "persiguiendo un vehículo",
    "lanzando piedras",
    "rompiendo una cámara de seguridad",
    "golpeando una puerta",
    "registrando un coche",
    "cargando cajas en un vehículo",
    "sacando dinero de un cajero por la fuerza",
    "prendiendo fuego a un contenedor",
    "tirando una moto al suelo",
    "empujando a los peatones",
    "rompiendo el cristal de un coche",
    "quitando las ruedas a un vehículo",
    "escalando una valla",
    "entrando por una ventana",
    "arrastrando a una persona",
    "amenazando a un conductor",
    "destrozando una máquina expendedora",
    "golpeando un cajero",
    "robando una bicicleta",
    "cortando una cadena",
    "reventando una cerradura",
    "incendiando un vehículo",
    "rompiendo bancos de la calle",
    "golpeando a un vigilante",
  ].map((a) => [a, "está " + a, "están " + a]),
);
situations.push(
  ...[
    "atracando una joyería",
    "atracando un banco",
    "atracando una gasolinera",
    "atracando un supermercado",
    "atracando una armería",
    "atracando un restaurante",
    "atracando un bar",
    "atracando un casino",
    "robando en una vivienda",
    "robando en un almacén",
    "robando en un taller",
    "robando paquetes",
    "robando una moto",
    "robando una cartera",
    "robando un bolso",
    "robando combustible",
    "robando mercancía de un camión",
    "robando material de una obra",
    "robando una máquina registradora",
    "forzando un maletero",
    "forzando una caja fuerte",
    "forzando una verja",
    "forzando un garaje",
    "forzando una taquilla",
    "forzando una máquina de cobro",
    "intentando abrir una caja registradora",
    "escondiendo objetos en una bolsa",
    "saliendo de un local con cajas",
    "arrancando una verja",
    "derribando una valla",
    "destrozando un escaparate",
    "destrozando una parada de autobús",
    "destrozando una cabina telefónica",
    "destrozando un jardín",
    "destrozando un cartel",
    "rompiendo retrovisores",
    "rompiendo cristales de una vivienda",
    "rompiendo una barrera de aparcamiento",
    "rompiendo una puerta de cristal",
    "pintando grafitis en un coche",
    "pintando grafitis en una persiana",
    "volcando contenedores",
    "volcando una moto",
    "arrojando basura a la carretera",
    "lanzando botellas",
    "lanzando objetos desde una azotea",
    "dando patadas a un vehículo",
    "dando patadas a una puerta",
    "quemando papeles en la calle",
    "prendiendo fuego a mobiliario",
    "amenazando a un peatón",
    "amenazando al personal de un local",
    "amenazando con una botella rota",
    "intimidando a los clientes",
    "gritando amenazas",
    "acorrallando a alguien",
    "sujetando a una persona por la fuerza",
    "metiendo a una persona en un coche por la fuerza",
    "sacando a una persona de un vehículo por la fuerza",
    "persiguiendo a un peatón",
    "golpeando a un conductor",
    "golpeando a un dependiente",
    "empujando a un vigilante",
    "arrastrando a alguien por el suelo",
    "apuntando a una persona",
    "apuntando hacia un vehículo",
    "disparando al aire",
    "disparando contra un vehículo",
    "disparando contra un local",
    "mostrando un arma a los transeúntes",
    "corriendo con un arma en la mano",
    "abandonando un arma en el suelo",
    "manipulando un arma en público",
    "haciendo trompos",
    "conduciendo en sentido contrario",
    "circulando por la acera",
    "conduciendo a gran velocidad",
    "saltándose un semáforo",
    "bloqueando una entrada con un vehículo",
    "embistiendo un coche",
    "embistiendo una barrera",
    "golpeando vehículos al aparcar",
    "haciendo una carrera en la calle",
    "conduciendo sin luces",
    "abandonando un coche en medio de la vía",
    "huyendo tras un choque",
    "huyendo a pie",
    "huyendo en una moto",
    "cambiando de vehículo apresuradamente",
    "subiéndose a un vehículo con prisas",
    "escondiéndose detrás de un edificio",
    "saltando una valla",
    "entrando en un edificio abandonado",
    "merodeando junto a coches aparcados",
    "mirando por las ventanas de una vivienda",
    "siguiendo a una persona",
    "intercambiando bolsas",
    "entregando paquetes a través de una ventanilla",
    "descargando bidones",
    "trasladando cajas entre dos vehículos",
    "manipulando una cerradura",
    "manipulando cables de un vehículo",
    "quitando una matrícula",
    "cambiando una matrícula",
    "tapando una cámara de seguridad",
    "cortando una valla",
    "retirando una señal de tráfico",
    "ocupando la calzada",
    "obstruyendo el paso de peatones",
    "discutiendo con un vigilante",
    "discutiendo con un conductor",
    "discutiendo en la entrada de un local",
    "peleándose junto a un vehículo",
    "pidiendo auxilio a gritos",
    "intentando auxiliar a una persona",
    "haciendo señales para pedir ayuda",
    "llamando a una puerta y pidiendo ayuda",
    "tambaleándose por la calzada",
    "caminando por el arcén",
    "tumbándose en mitad de la carretera",
    "trepando a una azotea",
    "trepando a una farola",
    "colgándose de una señal",
    "entrando en una zona vallada",
    "cruzando las vías del tren",
    "encendiendo bengalas",
    "lanzando petardos",
    "soltando humo desde un recipiente",
    "derramando un líquido en el suelo",
    "vaciando un extintor",
    "rociando pintura sobre un vehículo",
    "abriendo una alcantarilla",
    "levantando una tapa de registro",
    "moviendo una barrera de seguridad",
  ]
    .filter((a) => !situations.some((x) => x[0] === a))
    .map((a) => [a, "está " + a, "están " + a]),
);
situations.push(
  ...[
    "atracando una licorería",
    "atracando un badulaque",
    "robando botellas de una licorería",
    "robando productos de un badulaque",
    "amenazando al dependiente de una licorería",
    "amenazando al dependiente de un badulaque",
    "forzando la puerta de una licorería",
    "forzando la puerta de un badulaque",
    "forzando la persiana de una licorería",
    "forzando la persiana de un badulaque",
    "rompiendo el escaparate de una licorería",
    "rompiendo el escaparate de un badulaque",
    "destrozando el interior de una licorería",
    "destrozando el interior de un badulaque",
    "robando la caja registradora de una licorería",
    "robando la caja registradora de un badulaque",
    "reteniendo al dependiente de una licorería",
    "reteniendo al dependiente de un badulaque",
    "discutiendo a gritos en una licorería",
    "discutiendo a gritos en un badulaque",
    "sacando cajas de una licorería",
    "sacando cajas de un badulaque",
    "huyendo de una licorería",
    "huyendo de un badulaque",
  ]
    .filter((a) => !situations.some((x) => x[0] === a))
    .map((a) => [a, "está " + a, "están " + a]),
);
situations.push(
  ...[
    "secuestrando a una persona",
    "intentando secuestrar a una persona",
    "reteniendo a una persona contra su voluntad",
    "reteniendo a varias personas contra su voluntad",
    "metiendo a una persona en una furgoneta por la fuerza",
    "obligando a una persona a subir a un vehículo",
    "impidiendo que una persona salga de un vehículo",
    "sacando a una persona de una vivienda por la fuerza",
    "llevándose a una persona atada",
    "llevándose a una persona con la cabeza cubierta",
    "arrastrando a una persona hacia una furgoneta",
    "sujetando a una persona mientras pide ayuda",
    "atando las manos de una persona",
    "tapando la boca a una persona",
    "rodeando a una persona e impidiendo que se marche",
    "reteniendo a un conductor dentro de su coche",
    "reteniendo a una persona dentro de un local",
    "reteniendo a los clientes de una tienda",
    "reteniendo a los empleados de un local",
    "reteniendo al dependiente de un badulaque",
    "reteniendo al personal de una licorería",
    "amenazando a una persona para que camine",
    "obligando a una persona a entrar en un edificio",
    "obligando a una persona a pasar a otro vehículo",
    "trasladando a una persona atada entre dos vehículos",
    "empujando a una persona al maletero de un coche",
    "encerrando a una persona en el maletero",
    "impidiendo que una persona pida ayuda",
    "reteniendo a una persona en un garaje",
    "reteniendo a una persona en una nave industrial",
  ]
    .filter((a) => !situations.some((x) => x[0] === a))
    .map((a) => [a, "está " + a, "están " + a]),
);
situations.push(
  ...[
    "atracando un yate",
    "robando objetos de un yate",
    "forzando la entrada de un yate",
    "rompiendo los cristales de un yate",
    "amenazando a una persona en un yate",
    "reteniendo a una persona en un yate",
    "sacando cajas de un yate",
    "destrozando el interior de un yate",
    "huyendo de un yate",
    "discutiendo a gritos en un yate",
    "atracando un furgón blindado",
    "robando objetos de un furgón blindado",
    "forzando la entrada de un furgón blindado",
    "rompiendo los cristales de un furgón blindado",
    "amenazando a una persona en un furgón blindado",
    "reteniendo a una persona en un furgón blindado",
    "sacando cajas de un furgón blindado",
    "destrozando el interior de un furgón blindado",
    "huyendo de un furgón blindado",
    "discutiendo a gritos en un furgón blindado",
    "atracando un carguero",
    "robando objetos de un carguero",
    "forzando la entrada de un carguero",
    "rompiendo los cristales de un carguero",
    "amenazando a una persona en un carguero",
    "reteniendo a una persona en un carguero",
    "sacando cajas de un carguero",
    "destrozando el interior de un carguero",
    "huyendo de un carguero",
    "discutiendo a gritos en un carguero",
    "atracando una barbería",
    "robando objetos de una barbería",
    "forzando la entrada de una barbería",
    "rompiendo los cristales de una barbería",
    "amenazando a una persona en una barbería",
    "reteniendo a una persona en una barbería",
    "sacando cajas de una barbería",
    "destrozando el interior de una barbería",
    "huyendo de una barbería",
    "discutiendo a gritos en una barbería",
    "atracando una chatarrería",
    "robando objetos de una chatarrería",
    "forzando la entrada de una chatarrería",
    "rompiendo los cristales de una chatarrería",
    "amenazando a una persona en una chatarrería",
    "reteniendo a una persona en una chatarrería",
    "sacando cajas de una chatarrería",
    "destrozando el interior de una chatarrería",
    "huyendo de una chatarrería",
    "discutiendo a gritos en una chatarrería",
    "atracando una farmacia",
    "robando objetos de una farmacia",
    "forzando la entrada de una farmacia",
    "rompiendo los cristales de una farmacia",
    "amenazando a una persona en una farmacia",
    "reteniendo a una persona en una farmacia",
    "sacando cajas de una farmacia",
    "destrozando el interior de una farmacia",
    "huyendo de una farmacia",
    "discutiendo a gritos en una farmacia",
    "atracando una tienda de ropa",
    "robando objetos de una tienda de ropa",
    "forzando la entrada de una tienda de ropa",
    "rompiendo los cristales de una tienda de ropa",
    "amenazando a una persona en una tienda de ropa",
    "reteniendo a una persona en una tienda de ropa",
    "sacando cajas de una tienda de ropa",
    "destrozando el interior de una tienda de ropa",
    "huyendo de una tienda de ropa",
    "discutiendo a gritos en una tienda de ropa",
    "atracando un pawnshop (casa de empeños)",
    "robando objetos de un pawnshop (casa de empeños)",
    "forzando la entrada de un pawnshop (casa de empeños)",
    "rompiendo los cristales de un pawnshop (casa de empeños)",
    "amenazando a una persona en un pawnshop (casa de empeños)",
    "reteniendo a una persona en un pawnshop (casa de empeños)",
    "sacando cajas de un pawnshop (casa de empeños)",
    "destrozando el interior de un pawnshop (casa de empeños)",
    "huyendo de un pawnshop (casa de empeños)",
    "discutiendo a gritos en un pawnshop (casa de empeños)",
    "atracando una tienda digital (electrónica)",
    "robando objetos de una tienda digital (electrónica)",
    "forzando la entrada de una tienda digital (electrónica)",
    "rompiendo los cristales de una tienda digital (electrónica)",
    "amenazando a una persona en una tienda digital (electrónica)",
    "reteniendo a una persona en una tienda digital (electrónica)",
    "sacando cajas de una tienda digital (electrónica)",
    "destrozando el interior de una tienda digital (electrónica)",
    "huyendo de una tienda digital (electrónica)",
    "discutiendo a gritos en una tienda digital (electrónica)",
    "atracando una casa",
    "robando objetos de una casa",
    "forzando la entrada de una casa",
    "rompiendo los cristales de una casa",
    "amenazando a una persona en una casa",
    "reteniendo a una persona en una casa",
    "sacando cajas de una casa",
    "destrozando el interior de una casa",
    "huyendo de una casa",
    "discutiendo a gritos en una casa",
    "abordando un yate por la fuerza",
    "reteniendo a la tripulación de un yate",
    "amenazando a los pasajeros de un yate",
    "sacando bolsas de un yate",
    "forzando las puertas de un furgón blindado",
    "bloqueando el paso a un furgón blindado",
    "amenazando a los vigilantes de un furgón blindado",
    "sacando bolsas de dinero de un furgón blindado",
    "disparando contra un furgón blindado",
    "asaltando un carguero",
    "reteniendo a la tripulación de un carguero",
    "forzando un contenedor de un carguero",
    "descargando mercancía de un carguero",
    "amenazando al personal de una barbería",
    "robando la caja de una barbería",
    "robando piezas de una chatarrería",
    "cargando chatarra en una furgoneta",
    "forzando el portón de una chatarrería",
    "robando medicamentos de una farmacia",
    "amenazando al farmacéutico",
    "robando la caja de una farmacia",
    "robando prendas de una tienda de ropa",
    "amenazando al dependiente de una tienda de ropa",
    "saliendo de una tienda de ropa con bolsas",
    "robando joyas de un pawnshop",
    "amenazando al dependiente de un pawnshop",
    "forzando las vitrinas de un pawnshop",
    "robando móviles de una tienda digital",
    "robando ordenadores de una tienda digital",
    "rompiendo las vitrinas de una tienda digital",
    "amenazando al dependiente de una tienda digital",
    "entrando en una casa por una ventana",
    "forzando la puerta de una casa",
    "sacando muebles de una casa",
    "reteniendo a los habitantes de una casa",
    "saltando la valla de una casa",
    "robando en varias casas",
    "llamando a las puertas de varias casas",
    "merodeando por las ventanas de una casa",
  ]
    .filter((a) => !situations.some((x) => x[0] === a))
    .map((a) => [a, "está " + a, "están " + a]),
);
// Append only: existing saved scenes use their original numeric indices.
const robberyVenues = [
  "una peluquería",
  "una chatarrería",
  "un desguace",
  "un centro de reciclaje",
  "una ferretería",
  "una panadería",
  "una carnicería",
  "una cafetería",
  "un local de comida rápida",
  "un mercado",
  "un centro comercial",
  "una tienda de mascotas",
  "una lavandería",
  "un salón de tatuajes",
  "un concesionario",
  "un depósito de vehículos",
  "un lavadero de coches",
  "una gasolinera",
  "un supermercado",
  "una licorería",
  "un badulaque",
  "una joyería",
  "una armería",
  "una tienda de ropa",
  "una tienda de electrónica",
  "un pawnshop",
  "una farmacia",
  "un restaurante",
  "un bar",
  "una discoteca",
  "un casino",
  "un hotel",
  "un motel",
  "una oficina",
  "un museo",
  "un almacén",
  "una nave industrial",
  "una fábrica",
  "una obra",
  "una granja",
  "un rancho",
  "un viñedo",
  "un hangar",
  "una iglesia",
  "una mansión",
  "un bloque de apartamentos",
  "una vivienda",
];
const extraCrimeScenes = [
  "robando",
  "atracando",
  "asaltando a alguien",
  "intentando robar",
  "intentando atracar a alguien",
  "amenazando para exigir dinero",
  "robando dinero",
  "robando una caja registradora",
  "robando una caja fuerte",
  "robando mercancía",
  "robando herramientas",
  "robando joyas",
  "robando paquetes",
  "robando teléfonos móviles",
  "robando carteras",
  "robando bolsos",
  "robando a los peatones",
  "robando a un repartidor",
  "robando a un taxista",
  "robando a un vendedor ambulante",
  "robando a una persona en un cajero automático",
  "forzando un cajero automático",
  "robando una máquina expendedora",
  "robando un coche",
  "robando una moto",
  "robando una bicicleta",
  "robando una furgoneta",
  "robando un camión",
  "robando un autobús",
  "robando un taxi",
  "robando una ambulancia",
  "robando un vehículo de reparto",
  "robando objetos del interior de un coche",
  "robando equipaje",
  "robando piezas de vehículos",
  "robando ruedas de un coche",
  "robando una embarcación",
  "robando una moto de agua",
  "robando una lancha",
  "robando un helicóptero",
  "robando una avioneta",
  "robando un remolque",
  "robando la carga de un camión",
  "robando mercancía de un contenedor",
  "robando materiales de una obra",
  "robando maquinaria de una fábrica",
  "robando combustible de una gasolinera",
  "robando productos de una granja",
  "robando botellas de una licorería",
  "robando la caja de un badulaque",
  "robando la caja de una peluquería",
  "robando productos de una peluquería",
  "amenazando a los clientes de una peluquería",
  "reteniendo al personal de una peluquería",
  "atracando una peluquería",
  "sacando bolsas de una peluquería",
  "robando metal de una chatarrería",
  "robando baterías de una chatarrería",
  "robando herramientas de una chatarrería",
  "amenazando al personal de una chatarrería",
  "sacando piezas de un desguace",
  "cargando material de una chatarrería en un camión",
  "robando alimentos de un supermercado",
  "robando bebidas de un bar",
  "robando obras de arte de un museo",
  "robando objetos de una iglesia",
  "robando ordenadores de una oficina",
  "robando las cajas de un mercado",
  "robando las maletas de un hotel",
  "robando muebles de una vivienda",
  "secuestrando a alguien",
  "intentando secuestrar a alguien",
  "reteniendo a alguien contra su voluntad",
  "tomando a alguien como rehén",
  "obligando a una persona a subir a un vehículo",
  "metiendo a una persona en el maletero",
  "sacando a una persona de un vehículo por la fuerza",
  "arrastrando a una persona por la fuerza",
  "llevándose a una persona contra su voluntad",
  "atando a una persona",
  "reteniendo a un repartidor",
  "reteniendo a un taxista",
  "reteniendo a un comerciante",
  "secuestrando a una persona en una peluquería",
  "secuestrando a una persona en una chatarrería",
];
for (const venue of robberyVenues) {
  extraCrimeScenes.push(
    "robando en " + venue,
    "forzando la entrada de " + venue,
    "amenazando al personal de " + venue,
  );
}
for (const action of extraCrimeScenes) {
  if (!situations.some((scene) => scene[0] === action))
    situations.push([action, "está " + action, "están " + action]);
}
for (const action of [
  "hurtando pertenencias",
  "arrebatando un bolso",
  "sustrayendo una cartera",
  "vaciando una caja registradora",
  "llevándose mercancía sin pagar",
  "saliendo con objetos robados",
  "intentando llevarse un vehículo",
  "registrando un vehículo ajeno",
  "forzando una persiana",
  "rompiendo un escaparate",
  "intentando entrar por una ventana",
  "saltando una valla",
  "entrando por la fuerza",
  "amenazando a los presentes",
  "intimidando a una persona",
  "exigiendo dinero bajo amenazas",
  "extorsionando a alguien",
  "coaccionando a un comerciante",
  "impidiendo que alguien se marche",
  "reteniendo a varias personas",
  "obligando a alguien a acompañarles",
  "trasladando a un rehén",
  "vigilando a una persona retenida",
  "persiguiendo a una persona",
  "siguiendo a alguien",
  "acorralando a una persona",
  "bloqueando una entrada",
  "bloqueando el paso",
  "dañando un vehículo",
  "destrozando mobiliario",
  "causando daños",
  "huyendo del lugar",
]) {
  if (!situations.some((scene) => scene[0] === action))
    situations.push([action, "está " + action, "están " + action]);
}
let customSituation = "";
const customVerbs = {
  robar: "robando",
  atracar: "atracando",
  secuestrar: "secuestrando",
  amenazar: "amenazando",
  disparar: "disparando",
  pelear: "peleando",
  huir: "huyendo",
  retener: "reteniendo",
  entrar: "entrando",
  romper: "rompiendo",
  forzar: "forzando",
  perseguir: "persiguiendo",
  extorsionar: "extorsionando",
  intimidar: "intimidando",
  hurtar: "hurtando",
};
function cleanRepeatedWords(text) {
  return String(text)
    .replace(
      /(^|[\s¿¡])([\p{L}\p{N}]+)(?:[ \t]+\2)+(?=[\s.,;:!?]|$)/giu,
      "$1$2",
    )
    .replace(/\b(de color|en una|en un|en la|en el)(?:\s+\1)+\b/gi, "$1")
    .trim();
}
function cleanCustomSituation(value) {
  return typeof value === "string"
    ? cleanRepeatedWords(
        value
          .replace(/[\u0000-\u001f\u007f]/g, " ")
          .replace(/\s+/g, " ")
          .slice(0, 160),
      )
        .replace(/[.!?]+$/, "")
        .trim()
    : "";
}
function currentSituation() {
  if ($("situation").value !== "custom")
    return situations[+$("situation").value] || null;
  if (!customSituation) return null;
  const raw = customSituation;
  const match = raw.match(/^([^\s]+)(.*)$/u),
    key = norm(match[1]),
    verb = Object.hasOwn(customVerbs, key) ? customVerbs[key] : "";
  const action = verb ? verb + match[2] : raw;
  // Unrecognised words remain verbatim; never guess a conjugation or invent a fact.
  return /^(?:\S+ando|\S+iendo|\S+yendo)(?:\s|$)/iu.test(action)
    ? [action, "está " + action, "están " + action]
    : [
        "en esta situación: " + action,
        "la situación es: " + action,
        "la situación es: " + action,
      ];
}
const situationLabel = (s) => s.charAt(0).toLocaleUpperCase("es") + s.slice(1);
function situationSearchText(text) {
  return norm(text)
    .replace(
      /\b(?:robar|robando|robos?|atracar|atracando|atracos?|asaltar|asaltando|asaltos?)\b/g,
      "rob",
    )
    .replace(/\b(?:secuestrar|secuestrando|secuestros?)\b/g, "secuestr")
    .replace(/\b(?:peluquerias?|barberias?)\b/g, "peluqueria")
    .replace(/\b(?:chatarrerias?|desguaces?)\b/g, "chatarreria")
    .replace(/\bdisparos?\b/g, "dispar")
    .replace(/\bretencion(?:es)?\b/g, "reten");
}
function renderSituations() {
  const selected = $("situation").value;
  const terms = situationSearchText($("situation-search").value)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const list = situations
    .map((x, i) => ({ text: situationLabel(x[0]), id: String(i) }))
    .filter((x) =>
      terms.every((term) =>
        (norm(x.text) + " " + situationSearchText(x.text)).includes(term),
      ),
    );
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = terms.length
    ? "Elige un resultado"
    : "Sin seleccionar";
  const nodes = [placeholder];
  if (selected && !list.some((x) => x.id === selected)) {
    const o = document.createElement("option");
    o.value = selected;
    o.textContent =
      "Seleccionado: " +
      (selected === "custom"
        ? customSituation
        : situationLabel(situations[+selected][0]));
    nodes.push(o);
  }
  for (const item of list) {
    const o = document.createElement("option");
    o.value = item.id;
    o.textContent = item.text;
    nodes.push(o);
  }
  $("situation").replaceChildren(...nodes);
  $("situation").value = selected;
  $("situation-results").textContent =
    list.length +
    " de " +
    situations.length +
    " situaciones" +
    (!list.length ? " · Prueba con otra palabra." : "");
}
options(
  "situation",
  situations.map((x) => situationLabel(x[0])),
);
const places = [
  "en una tienda",
  "en una gasolinera",
  "en un banco",
  "en una joyería",
  "en la calle",
  "en un callejón",
  "en un aparcamiento",
  "en un taller",
  "en un bar",
  "en un restaurante",
  "en una vivienda",
  "en una nave industrial",
  "en el puerto",
  "en el aeropuerto",
  "en la playa",
  "en la autopista",
  "cerca del hospital",
  "cerca de comisaría",
  "en un motel",
  "en un supermercado",
  "en una armería",
  "en un concesionario",
  "en una plaza",
  "en un garaje",
  "en una zona rural",
  "en un camping",
  "en una obra",
  "en una estación de tren",
  "en un club nocturno",
  "en un almacén",
  "en una iglesia",
  "en un cementerio",
  "en una capilla",
  "en un hospital",
  "en una clínica",
  "en una farmacia",
  "en un parque",
  "en un parque de atracciones",
  "en un estadio",
  "en un gimnasio",
  "en una escuela",
  "en una universidad",
  "en una biblioteca",
  "en un ayuntamiento",
  "en los juzgados",
  "en una prisión",
  "en un cuartel de bomberos",
  "en una comisaría",
  "en un hotel",
  "en un casino",
  "en un cine",
  "en un teatro",
  "en un museo",
  "en una discoteca",
  "en una barbería",
  "en una peluquería",
  "en un salón de tatuajes",
  "en una tienda de ropa",
  "en una tienda de electrónica",
  "en una licorería",
  "en una ferretería",
  "en una cafetería",
  "en un local de comida rápida",
  "en una panadería",
  "en una carnicería",
  "en un mercado",
  "en un centro comercial",
  "en una oficina",
  "en una azotea",
  "en un sótano",
  "en un patio interior",
  "en un bloque de apartamentos",
  "en una mansión",
  "en una urbanización",
  "en una granja",
  "en un rancho",
  "en un establo",
  "en un viñedo",
  "en una fábrica",
  "en una central eléctrica",
  "en una refinería",
  "en una cantera",
  "en una mina",
  "en un desguace",
  "en un depósito de vehículos",
  "en un lavadero de coches",
  "en una estación de autobuses",
  "en una parada de autobús",
  "en una estación de metro",
  "en un túnel",
  "en un puente",
  "bajo un puente",
  "en un peaje",
  "en una carretera secundaria",
  "en un camino de tierra",
  "en un muelle",
  "en un embarcadero",
  "en un faro",
  "en un helipuerto",
  "en un hangar",
  "en una pista de aterrizaje",
  "en una presa",
  "junto a un río",
  "junto a un lago",
  "en un bosque",
  "en la montaña",
  "en un mirador",
  "en el desierto",
  "en una cueva",
  "en un campo de golf",
  "en una pista de tenis",
  "en una cancha de baloncesto",
  "en una piscina pública",
  "en un paseo marítimo",
  "en una zona de caravanas",
  "en un edificio abandonado",
  "en un aparcamiento subterráneo",
];
places.push(
  ...[
    "en una estación de servicio abandonada",
    "en un centro de reciclaje",
    "en un invernadero",
    "en un observatorio",
    "en un embarcadero de pescadores",
    "en una tienda de mascotas",
    "en una lavandería",
    "en una bolera",
    "en un billar",
    "en un salón recreativo",
    "en un aparcamiento de camiones",
    "en una torre de comunicaciones",
    "en un depósito de agua",
    "en un parque de bomberos abandonado",
    "en una caseta de vigilancia",
    "en un mercado de pescado",
    "en una terminal de carga",
    "en una zona de contenedores",
    "en una entrada de servicio",
    "en una escalera de incendios",
  ],
);
places.push(
  ...[
    "Paleto Bay",
    "Grapeseed",
    "Sandy Shores",
    "Harmony",
    "Stab City",
    "Alamo Sea",
    "Mount Chiliad",
    "Mount Gordo",
    "Mount Josiah",
    "Raton Canyon",
    "Cassidy Creek",
    "Chiliad Mountain State Wilderness",
    "Paleto Forest",
    "Procopio Beach",
    "Procopio Promenade",
    "Braddock Pass",
    "Braddock Farm",
    "Cape Catfish",
    "El Gordo Lighthouse",
    "San Chianski Mountain Range",
    "Union Road",
    "Senora Freeway",
    "Grand Senora Desert",
    "Redwood Lights Track",
    "Bolingbroke Penitentiary",
    "Route 68",
    "Great Chaparral",
    "Zancudo River",
    "Fort Zancudo",
    "Lago Zancudo",
    "North Chumash",
    "Chumash",
    "Banham Canyon",
    "Tongva Valley",
    "Tongva Hills",
    "Richman Glen",
    "Pacific Bluffs",
    "Pacific Ocean",
    "Los Santos",
    "Downtown Los Santos",
    "Pillbox Hill",
    "Legion Square",
    "Mission Row",
    "Textile City",
    "Strawberry",
    "Rancho",
    "Davis",
    "Chamberlain Hills",
    "La Puerta",
    "Banning",
    "Elysian Island",
    "Terminal",
    "Port of Los Santos",
    "Los Santos International Airport",
    "LSIA",
    "Vespucci",
    "Vespucci Beach",
    "Vespucci Canals",
    "Del Perro",
    "Del Perro Beach",
    "Del Perro Pier",
    "Little Seoul",
    "Rockford Hills",
    "Burton",
    "Hawick",
    "Alta",
    "Vinewood",
    "Downtown Vinewood",
    "West Vinewood",
    "East Vinewood",
    "Vinewood Hills",
    "Mirror Park",
    "La Mesa",
    "El Burro Heights",
    "Murrieta Heights",
    "Cypress Flats",
    "Darnell Bros",
    "El Rancho Boulevard",
    "Vinewood Racetrack",
    "Diamond Casino",
    "Galileo Observatory",
    "Richman",
    "Morningwood",
    "Golf Club de Los Santos",
    "Tataviam Mountains",
    "Palomino Highlands",
    "Land Act Dam",
    "Land Act Reservoir",
    "NOOSE",
    "Humane Labs",
    "Davis Quartz",
    "Ron Alternates Wind Farm",
    "Sandy Shores Airfield",
    "McKenzie Field",
    "Paleto Bay Sheriff Station",
    "Cayo Perico",
    "North Yankton",
  ]
    .map((name) => "en " + name)
    .filter((p) => !places.includes(p)),
);
options("place", places);
const clothes = [
  "ropa de calle",
  "sudadera y pantalón largo",
  "chándal",
  "traje",
  "chaqueta y vaqueros",
  "camiseta y vaqueros",
  "camiseta y pantalón corto",
  "ropa deportiva",
  "ropa de motorista",
  "mono de trabajo",
  "ropa táctica",
  "ropa de camuflaje",
  "abrigo largo",
  "chaleco y pantalón largo",
  "camisa y pantalón",
  "ropa de playa",
  "uniforme de seguridad",
  "ropa de repartidor",
  "ropa de mecánico",
  "ropa elegante",
  "ropa ancha",
  "ropa diferente entre sí",
  "no se distingue",
];
clothes.push(
  ...[
    "cazadora de cuero y vaqueros",
    "chaqueta vaquera",
    "jersey y pantalón largo",
    "chaleco reflectante",
    "camisa de cuadros",
    "camiseta sin mangas",
    "mono de carreras",
    "uniforme sanitario",
    "impermeable",
    "poncho",
    "ropa militar",
    "chaqueta de cuero y pantalón de moto",
    "sudadera y pantalón corto",
    "camiseta de baloncesto",
    "ropa de senderismo",
    "ropa de pescador",
    "chaqueta acolchada",
    "chaleco antibalas sobre la ropa",
    "ropa con estampados",
    "ropa con rayas",
  ],
);
options("clothing", clothes);
options("clothcolor", colors);
options("carcolor", colors);
$("carcolor").value = "2";
const faces = [
  "sin detalle visible",
  "con pasamontañas",
  "con la cara cubierta por una máscara",
  "con un pañuelo tapando la cara",
  "con casco integral",
  "con gorra",
  "con capucha puesta",
  "con gafas de sol",
  "con sombrero",
  "con casco de moto abierto",
  "con máscara de payaso",
  "con máscara de animal",
  "con gorro de lana",
  "con mochila",
  "con bolsa de deporte",
];
faces.push(
  ...[
    "con máscara antigás",
    "con máscara de calavera",
    "con máscara de hockey",
    "con casco de obra",
    "con casco de bicicleta",
    "con gorra y gafas de sol",
    "con pasamontañas y gafas",
    "con capucha y pañuelo",
    "con riñonera",
    "con maletín",
    "con mochila de reparto",
    "con bolsa de supermercado",
  ],
);
options("face", faces);
options("finish", [
  "sin especificar",
  "mate",
  "metalizado",
  "cromado",
  "perlado",
]);
const detailTexts = [
  "Se oyen gritos.",
  "Se oyen disparos.",
  "Hay una persona en el suelo.",
  "Se ve sangre en el suelo.",
  "Hay cristales rotos.",
  "El vehículo tiene los cristales tintados.",
  "El vehículo tiene golpes visibles.",
  "El motor sigue encendido.",
  "Las puertas del vehículo están abiertas.",
  "Se ha oído una alarma.",
  "Hay humo en la zona.",
  "Hay fuego visible.",
  "Una persona lleva una bolsa.",
  "Se ven guantes.",
  "La matrícula no se distingue.",
  "Hay gente corriendo.",
  "Se han subido al vehículo.",
  "El vehículo se ha marchado.",
];
detailTexts.push(
  ...[
    "Se oyen golpes metálicos.",
    "Hay marcas de frenada.",
    "Se ve una puerta forzada.",
    "Se ve una persiana a medio abrir.",
    "Hay objetos tirados por el suelo.",
    "Se oyen bocinazos.",
    "Hay un contenedor volcado.",
    "El vehículo no tiene matrícula visible.",
    "El vehículo tiene una rueda pinchada.",
    "El maletero está abierto.",
    "Se ven herramientas en el suelo.",
    "Una persona está grabando con el móvil.",
    "Hay peatones apartándose.",
    "Se oyen acelerones.",
    "Se ve una ventana rota.",
    "Una persona cojea.",
    "Se ve una mancha de pintura.",
    "Hay una bicicleta tirada.",
    "Se oye una alarma de coche.",
    "Hay un atasco en la calle.",
  ],
);
detailTexts.forEach((text, i) => {
  const l = document.createElement("label");
  l.className = "check";
  const c = document.createElement("input");
  c.type = "checkbox";
  c.value = text;
  c.id = "detail" + i;
  l.append(c, document.createTextNode(text));
  $("details").append(l);
});
function chips(id, items, current, callback) {
  if (id === "numbers") {
    renderNumbers();
    return;
  }
  if (id === "weapons") {
    renderWeapons();
    return;
  }
  $(id).replaceChildren(
    ...items.map((value) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = value;
      b.setAttribute("aria-pressed", String(value === current));
      b.onclick = () => {
        callback(value);
        chips(id, items, value, callback);
        generate();
      };
      return b;
    }),
  );
}
chips(
  "numbers",
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Manual"],
  number,
  (x) => (number = x),
);
chips(
  "weapons",
  ["Desarmado", "Pistola", "Escopeta", "Navaja", "Pincho", "No se distingue"],
  weapon,
  (x) => (weapon = x),
);
const categories = {
  COMPACT: "Compactos",
  SEDAN: "Sedanes",
  SUV: "SUV",
  COUPE: "Cupés",
  MUSCLE: "Muscle",
  SPORT_CLASSIC: "Clásicos deportivos",
  SPORT: "Deportivos",
  SUPER: "Superdeportivos",
  MOTORCYCLE: "Motos",
  OFF_ROAD: "Todoterreno",
  INDUSTRIAL: "Industriales",
  UTILITY: "Utilitarios",
  VAN: "Furgonetas",
  CYCLE: "Bicicletas",
  BOAT: "Barcos",
  HELICOPTER: "Helicópteros",
  PLANE: "Aviones",
  SERVICE: "Servicios",
  EMERGENCY: "Emergencias",
  MILITARY: "Militares",
  COMMERCIAL: "Comerciales",
  RAIL: "Trenes",
  OPEN_WHEEL: "Monoplazas",
};
const norm = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
function filtered() {
  const q = norm($("search").value);
  return catalog.filter(
    (c) =>
      (!onlyFav || favs.has(c.id)) &&
      (!$("category").value || c.category === $("category").value) &&
      norm(c.name + " " + c.brand + " " + c.id).includes(q),
  );
}
function renderCars() {
  const rows = filtered();
  $("cars").replaceChildren();
  rows.forEach((c) => {
    const row = document.createElement("div");
    row.className = "vehicle" + (vehicle?.id === c.id ? " selected" : "");
    const b = document.createElement("button");
    b.type = "button";
    b.className = "choose";
    b.setAttribute("aria-pressed", String(vehicle?.id === c.id));
    b.append(document.createTextNode(c.name));
    const small = document.createElement("small");
    small.textContent = [c.brand, c.id, categories[c.category] || c.category]
      .filter(Boolean)
      .join(" · ");
    b.append(small);
    b.onclick = () => {
      vehicle = c;
      pendingVehicleId = null;
      renderCars();
      $("vehicle-picker").open = false;
      $("vehicle-picker").querySelector("summary").focus();
      generate();
    };
    const star = document.createElement("button");
    star.type = "button";
    star.className = "star";
    star.textContent = favs.has(c.id) ? "★" : "☆";
    star.setAttribute(
      "aria-label",
      (favs.has(c.id) ? "Quitar de" : "Añadir a") + " favoritos: " + c.name,
    );
    star.setAttribute("aria-pressed", String(favs.has(c.id)));
    star.onclick = () => {
      favs.has(c.id) ? favs.delete(c.id) : favs.add(c.id);
      try {
        localStorage.setItem("entorno-favs", JSON.stringify([...favs]));
        storageOK = true;
      } catch {
        storageOK = false;
      }
      renderCars();
    };
    row.append(b, star);
    $("cars").append(row);
  });
  if (!rows.length)
    $("cars").textContent = onlyFav
      ? "No hay favoritos con estos filtros. Marca ☆ junto a un vehículo."
      : "No se han encontrado vehículos. Prueba otro nombre.";
  $("selected").textContent =
    "Seleccionado: " + (vehicle ? vehicle.name : "ninguno");
  $("catalogstatus").textContent =
    rows.length +
    " de " +
    catalog.length +
    " modelos · " +
    favs.size +
    " favoritos" +
    (!storageOK
      ? " · No se pueden guardar los favoritos en este navegador."
      : "");
}
$("search").oninput = renderCars;
$("category").onchange = renderCars;
$("favfilter").onclick = () => {
  onlyFav = !onlyFav;
  $("favfilter").setAttribute("aria-pressed", String(onlyFav));
  $("favfilter").textContent = onlyFav ? "★ Solo favoritos" : "☆ Favoritos";
  renderCars();
};
const selectedText = (id) => $(id).selectedOptions[0]?.textContent || "";
// Keep one compact editor, with a separate outfit for each identified person.
const wardrobeFields = ["clothing", "clothcolor", "face"];
let wardrobePeople = [],
  wardrobeIndex = 0,
  wardrobeShared = false,
  wardrobeSize = 0;
function readOutfit() {
  return Object.fromEntries(wardrobeFields.map((id) => [id, $(id).value]));
}
function writeOutfit(outfit = {}) {
  for (const id of wardrobeFields)
    $(id).value = typeof outfit[id] === "string" ? outfit[id] : "";
  if (typeof syncAllSelects === "function") syncAllSelects();
}
function wardrobeQuantity() {
  return /^[1-9]\d{0,2}$/.test(number) ? +number : 0;
}
function syncWardrobe() {
  const size = wardrobeQuantity(),
    multi = size > 1 || (size === 1 && $("number-more").checked);
  if (!wardrobeShared) wardrobePeople[wardrobeIndex] = readOutfit();
  const shared = multi && $("same-clothing").checked;
  if (wardrobeIndex >= Math.max(1, size)) {
    wardrobeIndex = 0;
    if (!shared) writeOutfit(wardrobePeople[0]);
  }
  if (wardrobeShared && !shared) writeOutfit(wardrobePeople[wardrobeIndex]);
  wardrobeShared = shared;
  $("wardrobe-controls").hidden = !multi;
  $("person-picker").hidden = shared;
  if (wardrobeSize !== size) {
    $("clothing-person").replaceChildren(
      ...Array.from({ length: Math.max(1, size) }, (_, i) => {
        const option = document.createElement("option");
        option.value = String(i);
        option.textContent = "Persona " + (i + 1);
        return option;
      }),
    );
    wardrobeSize = size;
  }
  $("clothing-person").value = String(wardrobeIndex);
  $("wardrobe-help").textContent = $("number-more").checked
    ? "Describe a las personas identificadas. No se inventará la ropa del resto."
    : "Elige una persona y describe su ropa, color y accesorios.";
}
$("clothing-person").onchange = () => {
  wardrobePeople[wardrobeIndex] = readOutfit();
  wardrobeIndex = +$("clothing-person").value;
  writeOutfit(wardrobePeople[wardrobeIndex]);
  generate();
};
$("same-clothing").onchange = () => generate();
function individualWardrobeParts(brief) {
  return wardrobePeople
    .slice(0, wardrobeQuantity())
    .flatMap((outfit, index) => {
      if (!outfit) return [];
      const text = (id) =>
        [...$(id).options].find((o) => o.value === outfit[id])?.textContent ||
        "";
      const clothing = outfit.clothing ? text("clothing") : "";
      const color = outfit.clothcolor ? text("clothcolor") : "";
      const face = outfit.face ? text("face") : "";
      const visibleClothes = clothing && clothing !== "no se distingue";
      let description =
        visibleClothes || color
          ? (visibleClothes ? clothing : "ropa") +
            (color
              ? color === "no se distingue"
                ? " de color desconocido"
                : " de color " + color
              : "")
          : "";
      if (face && face !== "sin detalle visible")
        description += (description ? ", " : "") + face;
      if (!description) return [];
      return ["Persona " + (index + 1) + ": " + description + "."];
    });
}
function restoreWardrobe(data) {
  wardrobePeople = Array.isArray(data.wardrobe?.people)
    ? data.wardrobe.people
        .slice(0, 999)
        .map((outfit) =>
          Object.fromEntries(
            wardrobeFields.map((id) => [
              id,
              typeof outfit?.[id] === "string" &&
              [...$(id).options].some((o) => o.value === outfit[id])
                ? outfit[id]
                : "",
            ]),
          ),
        )
    : [readOutfit()];
  wardrobeIndex = 0;
  // Old saved environments described the whole group with one outfit.
  $("same-clothing").checked = data.wardrobe
    ? data.wardrobe.same === true
    : true;
  wardrobeShared =
    $("same-clothing").checked &&
    (wardrobeQuantity() > 1 || $("number-more").checked);
  wardrobeSize = -1;
  if (!wardrobeShared) writeOutfit(wardrobePeople[0]);
}
function generate() {
  syncWardrobe();
  if (
    $("manual-number").value !== "" &&
    !/^[1-9]\d{0,2}$/.test($("manual-number").value)
  ) {
    $("output").textContent = "";
    $("status").textContent = "Escribe una cantidad entera entre 1 y 999.";
    count();
    return;
  }
  const scene = currentSituation();
  if ($("situation").value === "" || !scene) {
    $("output").textContent = "";
    $("status").textContent = "";
    count();
    return;
  }
  const brief = $("length").value === "brief",
    one = number === "1" && !$("number-more").checked,
    qty = number
      ? one
        ? "una persona"
        : $("number-more").checked
          ? "más de " + number + " personas"
          : number + " personas"
      : "alguien";
  const action = scene[brief ? 0 : one || !number ? 1 : 2];
  let place = $("place").value === "" ? "" : places[+$("place").value];
  if (place) {
    const venue = situationSearchText(
      place.replace(
        /^(?:en |junto a |cerca de |bajo )(?:un |una |el |la |los |las )?/,
        "",
      ),
    );
    if (
      (
        " " +
        situationSearchText(action).replace(/[^\p{L}\p{N}\s]/gu, " ") +
        " "
      ).includes(" " + venue + " ")
    )
      place = "";
  }
  let parts = [
    brief
      ? chooseVoice(
          ["", "Aviso: ", "Atención: ", "He visto a ", "Veo a "],
          "briefLead",
        ) +
        qty.charAt(0).toLowerCase() +
        qty.slice(1) +
        " " +
        action +
        (place ? " " + place : "") +
        "."
      : "Veo a " + qty + (place ? " " + place : "") + "; " + action + ".",
  ];
  parts[0] = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  const clothing = $("clothing").value === "" ? "" : selectedText("clothing"),
    color = $("clothcolor").value === "" ? "" : selectedText("clothcolor");
  const individualClothing = !$("wardrobe-controls").hidden && !wardrobeShared;
  if (individualClothing) parts.push(...individualWardrobeParts(brief));
  else if (clothing || color) {
    let desc = brief
      ? color
        ? "Ropa " +
          (color === "no se distingue"
            ? "de color desconocido"
            : "de color " + color)
        : clothing
      : (one || !number ? "Lleva " : "Llevan ") +
        (clothing && clothing !== "no se distingue" ? clothing : "ropa") +
        (color && color !== "no se distingue" ? " de color " + color : "");
    if (clothing !== "no se distingue" || color) parts.push(desc + ".");
  }
  if (
    !individualClothing &&
    !brief &&
    $("face").value !== "" &&
    selectedText("face") !== "sin detalle visible"
  )
    parts.push((one || !number ? "Va " : "Van ") + selectedText("face") + ".");
  const arms = weaponDescription;
  if (arms[weapon])
    parts.push(
      brief
        ? arms[weapon].charAt(0).toUpperCase() +
            arms[weapon].slice(1) +
            " visible."
        : (one || !number ? "Lleva " : "Una de esas personas lleva ") +
            arms[weapon] +
            " en la mano.",
    );
  else if (weapon === "Desarmado") parts.push("Sin armas visibles.");
  else if (weapon === "No se distingue") parts.push("No se distinguen armas.");
  if ($("travel").value === "foot")
    parts.push(one || !number ? "Va a pie." : "Van a pie.");
  else if ($("travel").value === "unknown" && !brief)
    parts.push("No he visto ningún vehículo.");
  else if ($("travel").value === "vehicle" && vehicle) {
    const col = $("carcolor").value === "" ? "" : selectedText("carcolor"),
      finish = $("finish").value === "" ? "" : selectedText("finish");
    parts.push(
      (brief ? "Vehículo: " : "El vehículo que veo es un ") +
        vehicle.name +
        (col && col !== "no se distingue" ? " de color " + col : "") +
        (!brief && finish && finish !== "sin especificar"
          ? ", con acabado " + finish
          : "") +
        ".",
    );
  }
  if (!brief) {
    document
      .querySelectorAll("#details input:checked")
      .forEach((c) => parts.push(c.value));
    const extra = $("extra").value.trim();
    if (extra) parts.push(extra.replace(/[.!?]+$/, "") + ".");
    const tone = Object.hasOwn(voicePools, $("tone").value)
      ? $("tone").value
      : chooseVoice(Object.keys(voicePools), "randomTone");
    parts = voiceScene(parts, tone, $("length").value === "long");
  }
  const seenParts = new Set();
  parts = parts.map(cleanRepeatedWords).filter((part) => {
    const key = norm(part)
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim();
    if (!key || seenParts.has(key)) return false;
    seenParts.add(key);
    return true;
  });
  $("output").textContent = "/entorno " + parts.join(" ");
  count();
  $("status").textContent = "";
}

let copiedText = "";
let copyToastTimer;
function updateCopyHint() {
  const copied =
    copiedText !== "" && $("output").textContent.trim() === copiedText;
  $("copy-hint").textContent = copied
    ? "Tu entorno se ha copiado en el portapapeles."
    : "Tu entorno se copiará en el portapapeles.";
  $("copy-hint").classList.toggle("copied", copied);
}
function notifyCopied() {
  const toast = $("copy-toast");
  toast.textContent = "✓ Entorno copiado al portapapeles";
  toast.hidden = false;
  clearTimeout(copyToastTimer);
  copyToastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 4000);
}
function count() {
  const text = $("output").textContent;
  $("count").textContent = text.length + " caracteres";
  $("copy").disabled = !text.trim();
  updateCopyHint();
}
$("form").onsubmit = (e) => {
  e.preventDefault();
  generate();
};
$("form").addEventListener("change", (e) => {
  if (
    configFields.includes(e.target.id) ||
    e.target.id === "number-more" ||
    e.target.matches("#details input")
  ) {
    $("garage").hidden = $("travel").value !== "vehicle";
    if (e.target.id !== "extra") generate();
  }
});
$("extra").oninput = generate;
$("tone").onchange = generate;
$("length").onchange = generate;
$("output").oninput = count;
$("copy").onclick = async () => {
  const text = $("output").textContent.trim();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    copiedText = text;
    updateCopyHint();
    notifyCopied();
    $("status").textContent = "";
  } catch {
    const range = document.createRange();
    range.selectNodeContents($("output"));
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    copiedText = "";
    updateCopyHint();
    $("copy-hint").textContent =
      "No se pudo copiar automáticamente. Texto seleccionado: pulsa Ctrl+C.";
    $("status").textContent = "";
  }
};
fetch("vehicles.json")
  .then((r) => {
    if (!r.ok) throw Error();
    return r.json();
  })
  .then((data) => {
    catalog = data.sort((a, b) => a.name.localeCompare(b.name));
    for (const c of [...new Set(catalog.map((v) => v.category))].sort()) {
      const o = document.createElement("option");
      o.value = c;
      o.textContent = categories[c] || c;
      $("category").append(o);
    }
    vehicle = pendingVehicleId
      ? catalog.find((c) => c.id === pendingVehicleId) || null
      : vehicle;
    pendingVehicleId = null;
    if (vehicle) $("vehicle-picker").open = false;
    renderCars();
    if ($("travel").value === "vehicle") generate();
  })
  .catch(() => {
    $("catalogstatus").textContent =
      "No se ha podido cargar el catálogo. Recarga la página para reintentar.";
  });
function renderTravelButtons() {
  const items = [
    ["vehicle", "Seleccionar coche"],
    ["foot", "A pie"],
    ["unknown", "No se ha visto vehículo"],
  ];
  $("travel-buttons").replaceChildren(
    ...items.map(([value, label]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.setAttribute("aria-pressed", String($("travel").value === value));
      b.onclick = () => {
        $("travel").value = value;
        $("garage").hidden = value !== "vehicle";
        renderTravelButtons();
        generate();
      };
      return b;
    }),
  );
}
renderTravelButtons();

const configFields = [
  "situation",
  "place",
  "clothing",
  "clothcolor",
  "face",
  "travel",
  "carcolor",
  "finish",
  "tone",
  "length",
  "extra",
];
for (const id of configFields) {
  const el = $(id);
  if (el.tagName === "SELECT" && id !== "length") {
    const o = document.createElement("option");
    o.value = "";
    o.textContent = id === "tone" ? "Aleatorio" : "Sin seleccionar";
    o.defaultSelected = true;
    el.prepend(o);
  }
}
function refreshChips() {
  chips(
    "numbers",
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Manual"],
    number,
    (x) => (number = x),
  );
  chips(
    "weapons",
    ["Desarmado", "Pistola", "Escopeta", "Navaja", "Pincho", "No se distingue"],
    weapon,
    (x) => (weapon = x),
  );
  renderTravelButtons();
}
function clearConfig() {
  customSituation = "";
  document.dispatchEvent(new Event("entorno:reset"));
  $("vehicle-picker").open = true;
  number = "";
  $("manual-number").value = "";
  $("number-more").checked = false;
  weapon = "";
  vehicle = null;
  pendingVehicleId = null;
  for (const id of configFields) $(id).value = id === "length" ? "normal" : "";
  wardrobePeople = [];
  wardrobeIndex = 0;
  wardrobeShared = false;
  wardrobeSize = -1;
  $("same-clothing").checked = false;
  document
    .querySelectorAll("#details input")
    .forEach((c) => (c.checked = false));
  $("search").value = "";
  $("situation-search").value = "";
  renderSituations();
  $("category").value = "";
  onlyFav = false;
  $("favfilter").setAttribute("aria-pressed", "false");
  $("favfilter").textContent = "☆ Favoritos";
  $("garage").hidden = true;
  refreshChips();
  renderCars();
  generate();
  $("status").textContent = "";
}
$("reset").textContent = "Vaciar todo ↻";
$("reset").onclick = clearConfig;
function snapshot() {
  syncWardrobe();
  return {
    customSituation: $("situation").value === "custom" ? customSituation : "",
    wardrobe: {
      same: $("same-clothing").checked,
      people: wardrobePeople.slice(0, Math.max(1, wardrobeQuantity())),
    },
    fields: Object.fromEntries(configFields.map((id) => [id, $(id).value])),
    number,
    numberMore: $("number-more").checked,
    weapon,
    vehicleId: vehicle?.id || pendingVehicleId || null,
    details: [...document.querySelectorAll("#details input:checked")].map(
      (c) => c.value,
    ),
  };
}
function loadConfig(data) {
  if (!data || typeof data !== "object") data = {};
  clearConfig();
  if (data.fields?.situation === "custom") {
    customSituation = cleanCustomSituation(data.customSituation);
    if (customSituation) {
      const option = document.createElement("option");
      option.value = "custom";
      option.textContent = customSituation;
      $("situation").append(option);
    }
  }
  for (const id of configFields) {
    if (typeof data.fields?.[id] === "string")
      $(id).value =
        id === "length" ? data.fields[id] || "normal" : data.fields[id];
  }
  number = /^[1-9]\d{0,2}$/.test(String(data.number))
    ? String(data.number)
    : data.number === "Más de 6"
      ? "6"
      : "";
  $("number-more").checked =
    Boolean(data.numberMore) || data.number === "Más de 6";
  $("manual-number").value = number && +number > 10 ? number : "";
  restoreWardrobe(data);
  weapon =
    ["Desarmado", "No se distingue"].includes(data.weapon) ||
    Object.hasOwn(weaponDescription, data.weapon)
      ? data.weapon
      : "";
  pendingVehicleId = typeof data.vehicleId === "string" ? data.vehicleId : null;
  vehicle = catalog.find((c) => c.id === pendingVehicleId) || null;
  if (catalog.length) pendingVehicleId = null;
  document
    .querySelectorAll("#details input")
    .forEach(
      (c) =>
        (c.checked =
          Array.isArray(data.details) && data.details.includes(c.value)),
    );
  $("garage").hidden = $("travel").value !== "vehicle";
  $("vehicle-picker").open = !vehicle;
  renderSituations();
  refreshChips();
  renderCars();
  generate();
}
$("situation-search").oninput = renderSituations;
clearConfig();

function renderNumbers() {
  const root = $("numbers");
  root.replaceChildren();
  for (let i = 1; i <= 10; i++) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = i;
    b.setAttribute("aria-pressed", String(number === String(i)));
    b.onclick = () => {
      number = String(i);
      $("manual-number").value = "";
      renderNumbers();
      generate();
    };
    root.append(b);
  }
}
$("manual-number").oninput = () => {
  const value = $("manual-number").value;
  number = /^[1-9]\d{0,2}$/.test(value) ? value : "";
  renderNumbers();
  generate();
};
