import { ParadaTaxi } from '../types/taxi';

// Generado a partir de OpenStreetMap (Overpass API, amenity=taxi) para
// El Puerto de Santa María.
// Fuente: datos abiertos © OpenStreetMap contributors, licencia ODbL.
export const paradasTaxi: ParadaTaxi[] = [
  {
    id: 'osm-1703329624',
    nombre: 'Estación de FF.CC.',
    latitud: 36.6040773,
    longitud: -6.2183379,
  },
  {
    id: 'osm-9900478965',
    nombre: 'Plaza de las Galeras Reales',
    latitud: 36.5974651,
    longitud: -6.2241594,
  },
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
export const RADIO_TAXI_NOMBRE = 'Puerto Taxi';
export const RADIO_TAXI_TELEFONO = '956 85 85 84';
