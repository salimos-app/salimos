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
// - GOLD y Sala New Palace: Google Maps (búsqueda "discoteca"/"sala de
//   fiestas" en El Puerto de Santa María). GOLD tiene un microsite en
//   Fourvenues con el slug "gold", pero no se pudo confirmar que sea este
//   local y no otro "Gold" en otra ciudad (sin eventos publicados para
//   comparar dirección), así que de momento NO se conecta a Fourvenues.
// Sin precio/horario en las que no son Fourvenues porque no son datos
// confirmados — no se inventan. El rating de GOLD/Sala New Palace sí es
// real (de Google Maps).
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
    imagen: 'https://images.unsplash.com/photo-1582719587489-6f12dbb6d85b?w=400',
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
    imagen: 'https://images.unsplash.com/photo-1517665884544-9366983cd8c3?w=400',
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
    imagen: 'https://images.unsplash.com/photo-1571266028243-d220c9a3c8e0?w=400',
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
];

module.exports = { DISCOTECAS };
