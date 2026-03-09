function mimeToExtension(mime: string | undefined): string {
  const mimeToExt: { [key: string]: string } = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'application/pdf': 'pdf',
  };

  return mime ? mimeToExt[mime] || '' : '';
}

export function base64ToFile(Base64File: string, filename: string): File {
  const arr = Base64File.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1];
  const extension = mimeToExtension(mime);
  const fullFilename = `${filename}.${extension}`;

  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], fullFilename, { type: mime });
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      resolve(event.target?.result as string);
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(file);
  });
}
