export interface Location {
  name: string;
  address: {
    streetAddress: string;
  };
}

export interface Evento {
  name: string;
  startDate: string;
  endDate: string;
  url: string;
  location: Location;
}

export interface EventoResponse {
  data: {
    itemListElement: {
      item: Evento;
    }[];
  };
}

export interface DiscotecaCoordinates {
  latitude: number;
  longitude: number;
  nombre: string;
  direccion: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  metadata?: {
    timestamp: string;
    requestId: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}