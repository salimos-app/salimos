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
  image?: string;
  /** Id interno de Fourvenues (no el `code` corto de la URL pública). Hace falta para pedir precios con fetchEventTicketTypes. */
  id?: string;
  /** Code corto de 4 caracteres (el de la URL pública). Hace falta para pedir el detalle con fetchEventDetail. */
  code?: string;
  /** Edad mínima de entrada, cuando Fourvenues la trae (viene ya en el listado, no hace falta pedir el detalle). */
  age?: number;
}

/** Detalle de un evento (Fourvenues `/api/events/:code`), solo lo que no trae ya el listado. */
export interface EventoDetalle {
  /** Código de vestimenta tal cual lo manda Fourvenues (visto: "casual"). Campo sin documentar oficialmente, nombre real en la API: `perch`. */
  dressCode?: string;
  /** Qué ofrece el evento: "listas" | "entradas" | "reservados". */
  services?: string[];
}

export interface TicketOption {
  id: string;
  name: string;
  price: number;
  isSoldOut: boolean;
}

export interface TicketType {
  id: string;
  name: string;
  isSoldOut: boolean;
  options: TicketOption[];
}