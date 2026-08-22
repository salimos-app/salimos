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
}
