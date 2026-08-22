export type SitioCategoria = 'bar' | 'pub' | 'supermarket' | 'convenience';

export interface Sitio {
  id: string;
  nombre: string;
  categoria: SitioCategoria;
  latitud: number;
  longitud: number;
  direccion?: string;
}
