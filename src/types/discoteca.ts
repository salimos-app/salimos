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
  precioEntrada: number;
  rating: number;
  horario: string;
  imagen: string;
  color: string;
  coordinates?: Coordinates;
  location?: Location;
}

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
