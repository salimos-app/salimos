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
