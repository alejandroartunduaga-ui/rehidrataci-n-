export const isStagingAccessError = (errorMessage?: string): boolean => {
  return errorMessage?.includes('Acceso denegado') ?? false;
};
