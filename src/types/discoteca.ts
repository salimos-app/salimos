export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Address {
  streetAddress: string;
}

export interface Location {
  name: string;
  address: Address;
}

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface Discoteca {
  id: string;
  nombre: string;
  slug: string;
  direccion: string;
  descripcion: string;
  latitud: number;
  longitud: number;
  genero: string;
  imagen: string;
  color: string;
  /** Datos no disponibles para locales sin ficha propia (no confirmar/inventar). */
  precioEntrada?: number;
  rating?: number;
  horario?: string;
  coordinates?: Coordinates;
  location?: Location;
}

/** Forma que devuelve el backend (`/api/discotecas`): sin `color`, que es un acento puramente visual que asigna el cliente. */
export type DiscotecaSinColor = Omit<Discoteca, 'color'>;

export interface DiscotecaSummary {
  id: string;
  nombre: string;
  slug: string;
  genero: string;
  rating: number;
  precioEntrada: number;
  imagen: string;
}

export interface DiscotecaFilters {
  genero?: string;
  precioMaximo?: number;
  ratingMinimo?: number;
  nombre?: string;
}