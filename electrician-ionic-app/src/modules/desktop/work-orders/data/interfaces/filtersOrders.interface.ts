// Interfaz para las ciudades
interface ICity {
  name: string;
  value: string;
}

// Interfaz para los operadores de red
interface INetworkOperator {
  name: string;
  value: string;
}

// Interfaz para los estados del grupo
interface IGroupStatus {
  name: string;
  value: string;
}

// Interfaz para los tipos de servicio
interface IServiceType {
  name: string;
  value: string;
}

// Interfaz para los contratistas
interface IContractor {
  name: string;
  value: string;
}

interface IElectricianFilter {
  name: string;
  value: string;
  contractor_id: string;
  status: string;
}

// Interfaz para la respuesta completa
export interface IFiltersResponse {
  cities: ICity[];
  network_operators: INetworkOperator[];
  group_status: IGroupStatus[];
  service_types: IServiceType[];

  electricians: IElectricianFilter[];
  contractors: IContractor[];
}
