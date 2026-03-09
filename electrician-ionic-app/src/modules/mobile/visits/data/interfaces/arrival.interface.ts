
interface IArrivalPhotosRequest {
  photos: IArrivalPhoto[]; // Array de fotos con blobs
}

interface IArrivalPhotosResponse {
  success: boolean;
  message?: string;
  data: { photos: IArrivalPhotoResponse[] };
}

interface IArrivalPhotoResponse {
  captured_at: string;
  id: number;
  url: string;
  visit_id: string;
}

interface IArrivalPhoto {
  blob: Blob; // Blob comprimido de la imagen
  captured_at: string; // Timestamp de cuando se capturó
  url?: string; // URL opcional para display (Data URL)
  name?: string; // Nombre opcional del archivo
}

export type {
  IArrivalPhotosRequest,
  IArrivalPhotosResponse,
  IArrivalPhoto,
  IArrivalPhotoResponse,
};
