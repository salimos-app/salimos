require('dotenv').config();
const { getDb } = require('./client');
const { ensureSchema } = require('./schema');

// Datos que antes vivían hardcodeados en el código (src/discotecas/discotecas.js
// del backend y src/data/{discotecas,sitios,taxis}.ts del frontend). Este script
// los siembra una vez en Turso; a partir de ahí la app los sirve desde la BD.
//
// Procedencia de las discotecas:
// - Banana y Guateque: clientes de Fourvenues (verificado contra su API;
//   dirección y coordenadas tomadas de ahí, es la más fiable porque la sube
//   el propio local).
// - Los Milagros y Phi Phi Beach: OpenStreetMap (amenity=nightclub cerca de
//   El Puerto de Santa María) © OpenStreetMap contributors, licencia ODbL.
// - GOLD, Sala New Palace, Therapy, Boho Garden Club, Musseum Club, dingui,
//   Pub MIA, Soho Puerto y Bar La Cristalera: Google Maps (búsqueda
//   "discotecas puerto santa maria" y "discoteca" centradas en El Puerto de
//   Santa María). Soho Puerto y Bar La Cristalera aparecen como "Pub"/"Bar
//   musical" en su ficha de Google, pero se listan aquí como discoteca a
//   petición explícita. GOLD tiene un microsite en Fourvenues con el slug
//   "gold", pero no se pudo confirmar que sea este local y no otro "Gold" en
//   otra ciudad, así que de momento NO se conecta a Fourvenues.
// Sin precio/horario en las que no son Fourvenues porque no son datos
// confirmados — no se inventan. El rating de las que vienen de Google Maps
// sí es real (de Google Maps).
const DISCOTECAS = [
  {
    id: '1',
    nombre: 'BANANA',
    slug: 'banana',
    direccion: 'Calle Ribera del Marisco, 13, El Puerto de Santa María (Cádiz)',
    descripcion:
      'Discoteca icónica en El Puerto de Santa María con las mejores sesiones de electrónica y música comercial.',
    latitud: 36.59821,
    longitud: -6.22418,
    genero: 'Electrónica / Comercial',
    precioEntrada: 15,
    rating: 4.7,
    horario: 'Vie-Sáb 23:30 - 06:00',
    imagen: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=400',
  },
  {
    id: '2',
    nombre: 'GUATEQUE',
    slug: 'guateque',
    direccion: 'Calle Bajada del Castillo, 11500 El Puerto de Santa María (Cádiz)',
    descripcion:
      'Discoteca con ambiente intenso, música comercial y sesiones de electrónica para la última hora del viernes y sábado.',
    latitud: 36.59627,
    longitud: -6.22603,
    genero: 'Electrónica / Comercial',
    precioEntrada: 18,
    rating: 4.6,
    horario: 'Vie-Sáb 23:30 - 06:00',
    imagen: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400',
  },
  {
    id: '3',
    nombre: 'Los Milagros',
    slug: 'los-milagros',
    direccion: 'El Puerto de Santa María (Cádiz)',
    descripcion: 'Discoteca en El Puerto de Santa María.',
    latitud: 36.5975251,
    longitud: -6.2251072,
    genero: 'Discoteca',
    precioEntrada: null,
    rating: null,
    horario: null,
    imagen: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400',
  },
  {
    id: '4',
    nombre: 'Phi Phi Beach',
    slug: 'phi-phi-beach',
    direccion: 'El Puerto de Santa María (Cádiz)',
    descripcion: 'Discoteca en El Puerto de Santa María.',
    latitud: 36.5826858,
    longitud: -6.2505636,
    genero: 'Discoteca',
    precioEntrada: null,
    rating: null,
    horario: null,
    imagen: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400',
  },
  {
    id: '5',
    nombre: 'GOLD',
    slug: 'gold-santa-maria',
    direccion: 'Av. Micaela Aramburu de Mora, 24, El Puerto de Santa María (Cádiz)',
    descripcion: 'Discoteca en El Puerto de Santa María.',
    latitud: 36.5960236,
    longitud: -6.2260532,
    genero: 'Discoteca',
    precioEntrada: null,
    rating: 3.3,
    horario: null,
    imagen: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400',
  },
  {
    id: '6',
    nombre: 'Sala New Palace',
    slug: 'sala-new-palace',
    direccion: 'Juan Ignacio Varela Gilabert, s/n, El Puerto de Santa María (Cádiz)',
    descripcion: 'Discoteca en El Puerto de Santa María.',
    latitud: 36.607589,
    longitud: -6.2323023,
    genero: 'Discoteca',
    precioEntrada: null,
    rating: 4.1,
    horario: null,
    imagen: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
  },
  {
    id: '7',
    nombre: 'Therapy',
    slug: 'therapy-santa-maria',
    direccion: 'Calle Curva, 4, El Puerto de Santa María (Cádiz)',
    descripcion: 'Discoteca en El Puerto de Santa María.',
    latitud: 36.5992832,
    longitud: -6.2243972,
    genero: 'Discoteca',
    precioEntrada: null,
    rating: 4.5,
    horario: null,
    imagen: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=400',
  },
  {
    id: '8',
    nombre: 'Boho Garden Club',
    slug: 'boho-garden-club',
    direccion: 'Avenida de Fuentebravía, 47, El Puerto de Santa María (Cádiz)',
    descripcion: 'Discoteca en El Puerto de Santa María.',
    latitud: 36.6030078,
    longitud: -6.2610168,
    genero: 'Discoteca',
    precioEntrada: null,
    rating: 4.3,
    horario: null,
    imagen: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400',
  },
  {
    id: '9',
    nombre: 'Musseum Club',
    slug: 'musseum-club',
    direccion: 'Plaza Juan de la Cosa, 2, El Puerto de Santa María (Cádiz)',
    descripcion: 'Discoteca en El Puerto de Santa María.',
    latitud: 36.5969234,
    longitud: -6.2271007,
    genero: 'Discoteca',
    precioEntrada: null,
    rating: 4.3,
    horario: null,
    imagen: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400',
  },
  {
    id: '10',
    nombre: 'dingui',
    slug: 'dingui-santa-maria',
    direccion: 'Avenida Juan Melgarejo, 10, El Puerto de Santa María (Cádiz)',
    descripcion: 'Discoteca en El Puerto de Santa María.',
    latitud: 36.5998831,
    longitud: -6.2514845,
    genero: 'Discoteca',
    precioEntrada: null,
    rating: 3.4,
    horario: null,
    imagen: 'https://images.unsplash.com/photo-1571204829887-3b8d69e4094d?w=400',
  },
  {
    id: '11',
    nombre: 'Pub MIA',
    slug: 'pub-mia-el-puerto',
    direccion: 'Calle Jesús de los Milagros, 29, El Puerto de Santa María (Cádiz)',
    descripcion: 'Discoteca en El Puerto de Santa María.',
    latitud: 36.5975457,
    longitud: -6.2250849,
    genero: 'Discoteca',
    precioEntrada: null,
    rating: 3.9,
    horario: null,
    imagen: 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=400',
  },
  {
    id: '12',
    nombre: 'Soho Puerto',
    slug: 'soho-puerto',
    direccion: 'Calle Jesús de los Milagros, 2, El Puerto de Santa María (Cádiz)',
    descripcion: 'Discoteca en El Puerto de Santa María.',
    latitud: 36.5986846,
    longitud: -6.2242611,
    genero: 'Discoteca',
    precioEntrada: null,
    rating: 4.3,
    horario: null,
    imagen: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=400',
  },
  {
    id: '13',
    nombre: 'Bar La Cristalera',
    slug: 'bar-la-cristalera',
    direccion: 'Plaza de las Galeras Reales, s/n, El Puerto de Santa María (Cádiz)',
    descripcion: 'Discoteca en El Puerto de Santa María.',
    latitud: 36.597649,
    longitud: -6.2236862,
    genero: 'Discoteca',
    precioEntrada: null,
    rating: 3.9,
    horario: null,
    imagen: 'https://images.unsplash.com/photo-1520333789090-1afc82db536a?w=400',
  },
];

// Generado a partir de OpenStreetMap (Overpass API) para El Puerto de Santa
// María. Fuente: datos abiertos © OpenStreetMap contributors, licencia ODbL.
const SITIOS = [
  { id: 'osm-2447594680', nombre: '470', categoria: 'bar', latitud: 36.5802955, longitud: -6.260983 },
  { id: 'osm-3811365450', nombre: 'Bar Chovi', categoria: 'bar', latitud: 36.5920679, longitud: -6.236858 },
  { id: 'osm-6370928987', nombre: 'Bar Golàs Milwaukee', categoria: 'bar', latitud: 36.5963192, longitud: -6.2253048 },
  { id: 'osm-6370955885', nombre: 'Bar Gonzalo', categoria: 'bar', latitud: 36.595426, longitud: -6.226561 },
  { id: 'osm-12546682443', nombre: 'Bar La Aurora', categoria: 'bar', latitud: 36.599336, longitud: -6.2288759 },
  {
    id: 'osm-4262635792',
    nombre: 'Bar Liba "Ceballos"',
    categoria: 'bar',
    latitud: 36.5971809,
    longitud: -6.2241951,
    direccion: 'Plaza de las Galeras Reales, 1',
  },
  { id: 'osm-13287704801', nombre: "Bigote's Cafe Pub", categoria: 'bar', latitud: 36.5727846, longitud: -6.2239984 },
  { id: 'osm-13153277729', nombre: 'Blu Puerto Sherry', categoria: 'bar', latitud: 36.5819259, longitud: -6.2509158 },
  {
    id: 'osm-7884609985',
    nombre: 'Bocatería Las Primas',
    categoria: 'bar',
    latitud: 36.5989138,
    longitud: -6.2364988,
    direccion: 'Calle Fernando Villalón, 55',
  },
  { id: 'osm-5156718514', nombre: 'Bodeguita Fuentebravía', categoria: 'bar', latitud: 36.6114817, longitud: -6.2805945 },
  { id: 'osm-4845579034', nombre: 'Café y Copas New Wind', categoria: 'bar', latitud: 36.5708398, longitud: -6.2235758 },
  {
    id: 'osm-4320106127',
    nombre: 'Chema Y Punto',
    categoria: 'bar',
    latitud: 36.5927579,
    longitud: -6.2314795,
    direccion: 'Avenida de Andalucía',
  },
  { id: 'osm-2335839679', nombre: 'El Loco de la Ribera', categoria: 'bar', latitud: 36.5977077, longitud: -6.2245634 },
  { id: 'osm-2335839676', nombre: 'El Mosquito', categoria: 'bar', latitud: 36.6008517, longitud: -6.2267399 },
  { id: 'osm-11050866605', nombre: 'El timón', categoria: 'bar', latitud: 36.5931841, longitud: -6.238688 },
  { id: 'osm-5158699721', nombre: "K' Ana", categoria: 'bar', latitud: 36.6054579, longitud: -6.2326489 },
  { id: 'osm-4262758889', nombre: 'Los Maeras', categoria: 'bar', latitud: 36.5979011, longitud: -6.224417 },
  { id: 'osm-9010450052', nombre: 'Quilla', categoria: 'bar', latitud: 36.6142632, longitud: -6.2864493 },
  { id: 'osm-4262711091', nombre: 'Santa María', categoria: 'bar', latitud: 36.5978976, longitud: -6.22412 },
  { id: 'osm-5787815758', nombre: 'Sotavento', categoria: 'bar', latitud: 36.5782194, longitud: -6.2570112 },
  { id: 'osm-1474020853', nombre: 'TK3', categoria: 'bar', latitud: 36.6090865, longitud: -6.2850745 },
  { id: 'osm-5787615868', nombre: 'Toro', categoria: 'bar', latitud: 36.5949971, longitud: -6.2291017 },
  { id: 'osm-5787833113', nombre: 'Txoko', categoria: 'bar', latitud: 36.5819299, longitud: -6.2565176 },
  {
    id: 'osm-9770602000',
    nombre: 'Carrefour Express',
    categoria: 'convenience',
    latitud: 36.5796836,
    longitud: -6.2242007,
    direccion: 'Avenida de la Paz, 34',
  },
  { id: 'osm-12908147808', nombre: 'TOI TO TO', categoria: 'convenience', latitud: 36.6288219, longitud: -6.2093978 },
  { id: 'osm-9900515899', nombre: 'Bar La Isleta', categoria: 'pub', latitud: 36.5841936, longitud: -6.2171126 },
  { id: 'osm-12065860644', nombre: 'Bar Vicente Los Pepes', categoria: 'pub', latitud: 36.600265, longitud: -6.2267061 },
  { id: 'osm-10106498939', nombre: 'Bar Vinate', categoria: 'pub', latitud: 36.5969504, longitud: -6.2268453 },
  { id: 'osm-12103123023', nombre: 'El Búcaro', categoria: 'pub', latitud: 36.6084338, longitud: -6.2196204 },
  { id: 'osm-9010450051', nombre: 'El Último', categoria: 'pub', latitud: 36.6144015, longitud: -6.2867117 },
  {
    id: 'osm-13672784002',
    nombre: 'La Taberna de Edu',
    categoria: 'pub',
    latitud: 36.5992815,
    longitud: -6.2287859,
    direccion: 'Plaza de España',
  },
  { id: 'osm-5063537749', nombre: "Molly Malone's", categoria: 'pub', latitud: 36.6068892, longitud: -6.2746188 },
  { id: 'osm-2335839687', nombre: "O'Donoghue's Pub", categoria: 'pub', latitud: 36.5987414, longitud: -6.224688 },
  { id: 'osm-6371180585', nombre: 'Romantica', categoria: 'pub', latitud: 36.5993873, longitud: -6.2244151 },
  { id: 'osm-3058740269', nombre: 'ALDI', categoria: 'supermarket', latitud: 36.5936696, longitud: -6.228718 },
  {
    id: 'osm-4345854994',
    nombre: 'Alimentation biologique',
    categoria: 'supermarket',
    latitud: 36.5805332,
    longitud: -6.2235901,
  },
  { id: 'osm-3097102085', nombre: 'Carrefour', categoria: 'supermarket', latitud: 36.6175059, longitud: -6.2107484 },
  { id: 'osm-9010450053', nombre: 'Covirán', categoria: 'supermarket', latitud: 36.6143337, longitud: -6.2865943 },
  { id: 'osm-2447594585', nombre: 'Dia', categoria: 'supermarket', latitud: 36.6020461, longitud: -6.2569193 },
  {
    id: 'osm-6494932186',
    nombre: 'Dia',
    categoria: 'supermarket',
    latitud: 36.5995806,
    longitud: -6.226092,
    direccion: 'Calle Pedro Muñoz Seca, 7',
  },
  { id: 'osm-9768159661', nombre: 'Dia', categoria: 'supermarket', latitud: 36.5806458, longitud: -6.2232273 },
  {
    id: 'osm-3058308839',
    nombre: 'Don Super Supermercado',
    categoria: 'supermarket',
    latitud: 36.591992,
    longitud: -6.2308093,
  },
  { id: 'osm-3060361389', nombre: 'Makro', categoria: 'supermarket', latitud: 36.5875827, longitud: -6.2183706 },
  { id: 'osm-2335839700', nombre: 'Mercadona', categoria: 'supermarket', latitud: 36.5975291, longitud: -6.2306479 },
  { id: 'osm-3060352280', nombre: 'Mercadona', categoria: 'supermarket', latitud: 36.5915428, longitud: -6.2376228 },
];

// Generado a partir de OpenStreetMap (Overpass API, amenity=taxi) para El
// Puerto de Santa María. Fuente: datos abiertos © OpenStreetMap contributors,
// licencia ODbL.
const PARADAS_TAXI = [
  { id: 'osm-1703329624', nombre: 'Estación de FF.CC.', latitud: 36.6040773, longitud: -6.2183379 },
  { id: 'osm-9900478965', nombre: 'Plaza de las Galeras Reales', latitud: 36.5974651, longitud: -6.2241594 },
  {
    id: 'osm-2259942166',
    nombre: 'Avenida Santa María del Mar (Valdelagrana)',
    latitud: 36.5793371,
    longitud: -6.2239379,
  },
  {
    id: 'osm-way-1385313795',
    nombre: 'Avenida de la Libertad (Costa Oeste)',
    latitud: 36.5829805,
    longitud: -6.2564662,
  },
  {
    id: 'osm-way-1385313802',
    nombre: 'Avenida del Pueblo Marinero (Costa Oeste)',
    latitud: 36.5822038,
    longitud: -6.252505,
  },
];

// Radio Taxi El Puerto de Santa María ("Puerto Taxi"), Plaza del Polvorista, 2.
const APP_SETTINGS = {
  radio_taxi_nombre: 'Puerto Taxi',
  radio_taxi_telefono: '956 85 85 84',
};

async function seed() {
  const db = getDb();
  await ensureSchema(db);

  const statements = [
    { sql: 'DELETE FROM discotecas', args: [] },
    ...DISCOTECAS.map((d, index) => ({
      sql: `INSERT INTO discotecas
        (id, nombre, slug, direccion, descripcion, latitud, longitud, genero, precio_entrada, rating, horario, imagen, orden)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        d.id,
        d.nombre,
        d.slug,
        d.direccion,
        d.descripcion,
        d.latitud,
        d.longitud,
        d.genero,
        d.precioEntrada ?? null,
        d.rating ?? null,
        d.horario ?? null,
        d.imagen,
        index,
      ],
    })),

    { sql: 'DELETE FROM sitios', args: [] },
    ...SITIOS.map((s) => ({
      sql: `INSERT INTO sitios (id, nombre, categoria, latitud, longitud, direccion)
        VALUES (?, ?, ?, ?, ?, ?)`,
      args: [s.id, s.nombre, s.categoria, s.latitud, s.longitud, s.direccion ?? null],
    })),

    { sql: 'DELETE FROM paradas_taxi', args: [] },
    ...PARADAS_TAXI.map((p) => ({
      sql: 'INSERT INTO paradas_taxi (id, nombre, latitud, longitud) VALUES (?, ?, ?, ?)',
      args: [p.id, p.nombre, p.latitud, p.longitud],
    })),

    ...Object.entries(APP_SETTINGS).map(([key, value]) => ({
      sql: 'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
      args: [key, value],
    })),
  ];

  await db.batch(statements, 'write');

  return {
    discotecas: DISCOTECAS.length,
    sitios: SITIOS.length,
    paradasTaxi: PARADAS_TAXI.length,
  };
}

if (require.main === module) {
  seed()
    .then((resumen) => {
      console.log('Siembra completada:');
      console.log(`  ✓ ${resumen.discotecas} discotecas`);
      console.log(`  ✓ ${resumen.sitios} sitios`);
      console.log(`  ✓ ${resumen.paradasTaxi} paradas de taxi`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('La siembra falló:', error);
      process.exit(1);
    });
}

module.exports = { seed };
