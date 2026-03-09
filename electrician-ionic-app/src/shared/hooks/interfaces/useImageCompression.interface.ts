export interface IImageCompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  fileType?: string;
  initialQuality?: number;
  alwaysKeepResolution?: boolean;
  exifOrientation?: number;
  onProgress?: (progress: number) => void;
}

export interface IImageCompressionResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  processingTime: number;
}

export interface IImageCompressionError {
  message: string;
  originalError: unknown;
  fileName?: string;
  originalSize?: number;
}

export interface ICompressionProgress {
  current: number;
  total: number;
}
