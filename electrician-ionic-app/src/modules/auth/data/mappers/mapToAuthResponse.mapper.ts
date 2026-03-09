import { UserCredential } from 'firebase/auth';
import { ISession } from '../interfaces/user.interface';

/**
 * Transforma un UserCredential de Firebase en un objeto de tipo User.
 * @param data UserCredential proporcionado por Firebase Authentication.
 * @returns Objeto de tipo User.
 * @throws Error si los datos son inválidos.
 */
export const mapToAuthResponse = async (
  data: UserCredential
): Promise<ISession> => {
  if (!data || typeof data !== 'object') {
    throw new Error('Datos inválidos recibidos de Firebase');
  }

  const { user } = data;
  if (!user) {
    throw new Error('No se encontró el usuario en UserCredential');
  }

  const token = await user.getIdToken(); // Obtener el token de ID de Firebase

  return {
    token,
    refreshToken: user.refreshToken,
  };
};
