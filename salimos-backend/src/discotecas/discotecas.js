// Discotecas de El Puerto de Santa María que conoce la app. `slug` es el
// identificador del microsite en Fourvenues cuando el local tiene ficha ahí
// (eventos, fotos y coordenadas en vivo vía /api/microsites/:slug/*); si no
// tiene, sigue funcionando con estos datos estáticos como único dato.
//
// Fuentes:
// - Banana y Guateque: clientes de Fourvenues (verificado contra su API;
//   dirección y coordenadas tomadas de ahí, es la más fiable porque la
//   sube el propio local).
// - Los Milagros y Phi Phi Beach: OpenStreetMap (amenity=nightclub cerca de
//   El Puerto de Santa María) © OpenStreetMap contributors, licencia ODbL.
// - GOLD, Sala New Palace, Therapy, Boho Garden Club, Musseum Club, dingui,
//   Pub MIA, Soho Puerto y Bar La Cristalera: Google Maps (búsqueda
//   "discotecas puerto santa maria" y "discoteca" centradas en El Puerto de
//   Santa María). Soho Puerto y Bar La Cristalera aparecen como "Pub"/"Bar
//   musical" en su ficha de Google, pero se listan aquí como discoteca a
//   petición explícita. GOLD tiene un
//   microsite en Fourvenues con el slug "gold", pero no se pudo confirmar
//   que sea este local y no otro "Gold" en otra ciudad (sin eventos
//   publicados para comparar dirección), así que de momento NO se conecta
//   a Fourvenues. La misma búsqueda en Google Maps también sacó "Padreo
//   Club" (a 11 m de las coordenadas de Guateque: mismo local, nombre
//   antiguo/duplicado) y "Lupita The Club" (a 1,3 m de "dingui": mismo
//   local que reabrió con otro nombre) — no se añaden porque son el mismo
//   sitio que una entrada ya existente.
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
    rating: 3.3,
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
    rating: 4.1,
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
    rating: 4.5,
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
    rating: 4.3,
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
    rating: 4.3,
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
    rating: 3.4,
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
    rating: 3.9,
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
    rating: 4.3,
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
    rating: 3.9,
    imagen: 'https://images.unsplash.com/photo-1520333789090-1afc82db536a?w=400',
  },
];

module.exports = { DISCOTECAS };
