export interface IS3UploadResponse {
  location: string;
  name: string;
  field_code: string;
}

export interface IUploadFileParams {
  base64File: string;
  fileName: string;
}
