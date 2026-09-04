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