/**
 * Convierte un objeto JSON a string Base64
 * @param data Objeto a convertir
 * @returns string en formato Base64
 */
export const jsonToBase64 = <T>(data: T): string => {
  try {
    const jsonString = JSON.stringify(data);
    return btoa(jsonString);
  } catch (error) {
    console.error('Error al convertir JSON a Base64:', error);
    return '';
  }
};

/**
 * Convierte un string Base64 a objeto JSON
 * @param base64String String en formato Base64
 * @returns Objeto JSON
 */
export const base64ToJson = <T>(base64String: string): T | null => {
  try {
    const jsonString = atob(base64String);
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('Error al convertir Base64 a JSON:', error);
    return null;
  }
};

/**
 * Convierte un objeto JSON a string Base64 con codificación UTF-8
 * @param data Objeto a convertir
 * @returns string en formato Base64
 */
export const jsonToBase64UTF8 = <T>(data: T): string => {
  try {
    const jsonString = JSON.stringify(data);
    return btoa(unescape(encodeURIComponent(jsonString)));
  } catch (error) {
    console.error('Error al convertir JSON a Base64 UTF-8:', error);
    return '';
  }
};

/**
 * Convierte un string Base64 a objeto JSON con decodificación UTF-8
 * @param base64String String en formato Base64
 * @returns Objeto JSON
 */
export const base64ToJsonUTF8 = <T>(base64String: string): T | null => {
  try {
    const jsonString = decodeURIComponent(escape(atob(base64String)));
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('Error al convertir Base64 a JSON UTF-8:', error);
    return null;
  }
};
