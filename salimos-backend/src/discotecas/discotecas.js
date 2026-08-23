// Discotecas de El Puerto de Santa María que conoce la app. `slug` es el
// identificador del microsite en Fourvenues cuando el local tiene ficha ahí
// (eventos, fotos y coordenadas en vivo vía /api/microsites/:slug/*); si no
// tiene, sigue funcionando con estos datos estáticos como único dato.
//
// Fuentes: Banana y Guateque son clientes de Fourvenues (verificado contra
// su API). Los Milagros y Phi Phi Beach salen de OpenStreetMap
// (amenity=nightclub cerca de El Puerto de Santa María) © OpenStreetMap
// contributors, licencia ODbL — sin precio/rating/horario porque no son
// datos que tengamos confirmados, no se inventan.
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
    direccion: 'Calle de la Ribera, 18, El Puerto de Santa María (Cádiz)',
    descripcion:
      'Discoteca con ambiente intenso, música comercial y sesiones de electrónica para la última hora del viernes y sábado.',
    latitud: 36.5971,
    longitud: -6.2249,
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
];

module.exports = { DISCOTECAS };
