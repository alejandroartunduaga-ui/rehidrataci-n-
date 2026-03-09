export interface IEquipmentCertificate {
  end_date: string;
  serial: string;
  equipment_type: string;
  brand: string;
  equipment_id: number;
  status?: EEquipmentCertificateStatus;
}

export enum EEquipmentCertificateStatus {
  VERIFIED = 'Verificado',
  WRONG = 'Incorrecto',
  PENDING = 'Pendiente',
  NOT_FOUND = 'No encontrado',
}

export interface IEquipmentCertificatesRequest {
  activity_id: string;
}

export interface IEquipmentCertificatesResponse {
  success: boolean;
  message: string;
  data: {
    certificates: IEquipmentCertificate[];
  };
}

//eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IEquipmentCertificatesApiResponse
  extends Array<IEquipmentCertificate> {}

export interface IGetEquipmentCertificatesParams {
  activity_id: string;
}
