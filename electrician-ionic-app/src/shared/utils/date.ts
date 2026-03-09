/**
 * Formats a date string from "DD-MM-YYYY" format to "DD - MonthName - YYYY" format.
 *
 * example: 04-08-2024  -> 04  - septiembre - 2024
 * @param date - The date string in "DD-MM-YYYY" format.
 * @returns The formatted date string in "DD - MonthName - YYYY" format.
 */
export const dateExtended = (date: string): string => {
  const [day, month, year] = date.split('-').map((part) => parseInt(part, 10));
  const monthName = getMonthName(month.toString());
  return `${day} - ${monthName} - ${year}`;
};

/**
 * Returns the Spanish name of a month given its number (1-12).
 * @param month - A string representing the month number (1-12)
 * @returns The Spanish name of the month as a string
 * @example
 * getMonthName("1") // returns "enero"
 * getMonthName("12") // returns "diciembre"
 * @throws Will return undefined if month is not between 1-12
 */
const getMonthName = (month: string): string => {
  const months = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];

  return months[parseInt(month, 10) - 1];
};

/**
 * Formats a date string with special labels for today and tomorrow
 * @param date - The date string to format
 * @returns A formatted string that prepends "Hoy:" for today's date, "Mañana:" for tomorrow's date,
 * or just returns the formatted date string for other dates
 * @example
 * // Returns "Hoy: [formatted date]" if date is today
 * // Returns "Mañana: [formatted date]" if date is tomorrow
 * // Returns "[formatted date]" for any other date
 * labelDate('2023-12-25')
 */
export const labelDate = (date: string): string => {
  const [day, month, year] = date.split('-');
  const currentDate = new Date();
  const tomorrowDate = new Date();
  const inputDate = new Date(`${year}-${month}-${day}T00:00:00`);
  tomorrowDate.setDate(currentDate.getDate() + 1);

  const isToday = currentDate.toDateString() === inputDate.toDateString();
  const isTomorrow = tomorrowDate.toDateString() === inputDate.toDateString();

  const dataFormatted = dateExtended(date);

  if (isToday) {
    return `Hoy: ${dataFormatted}`;
  }
  if (isTomorrow) {
    return `Mañana: ${dataFormatted}`;
  }

  return dataFormatted;
};

/**
 * Convierte un valor de fecha/hora a formato ISO 8601 válido
 * @param value - El valor de fecha/hora en formato string (puede tener espacio o 'T')
 * @returns El valor en formato ISO 8601 (YYYY-MM-DDTHH:mm:ss) o undefined si el valor está vacío
 * @example
 * convertToIsoFormat('2024-12-31 23:59:00') // returns '2024-12-31T23:59:00'
 * convertToIsoFormat('2024-12-31T23:59:00') // returns '2024-12-31T23:59:00'
 * convertToIsoFormat('2024-12-31 23:59') // returns '2024-12-31T23:59:00'
 * convertToIsoFormat('') // returns undefined
 */
export const convertToIsoFormat = (
  value: string | undefined
): string | undefined => {
  if (!value || value.trim() === '') return undefined;

  let formattedValue = value.trim();

  // Reemplazar el espacio con 'T' para formato ISO 8601
  // Formato recibido: YYYY-MM-DD HH:mm o YYYY-DD-MM HH:mm (invertido)
  if (formattedValue.includes(' ') && !formattedValue.includes('T')) {
    formattedValue = formattedValue.replace(' ', 'T');
  }

  // Validar y completar formato ISO 8601
  // Formato esperado: YYYY-MM-DDTHH:mm o YYYY-MM-DDTHH:mm:ss
  const isoRegex = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(:(\d{2}))?/;
  const match = formattedValue.match(isoRegex);

  if (match) {
    const year = match[1];
    let month = match[2];
    let day = match[3];
    const hour = match[4];
    const minute = match[5];
    const second = match[7] || '00';

    // Validar si el mes es inválido (mayor a 12), probablemente está invertido
    const monthNum = parseInt(month, 10);
    const dayNum = parseInt(day, 10);

    if (monthNum > 12 && dayNum <= 12) {
      // El formato está invertido: YYYY-DD-MM, intercambiar
      const temp = month;
      month = day;
      day = temp;
    }

    // Validar que el mes y día sean válidos
    const finalMonth = parseInt(month, 10);
    const finalDay = parseInt(day, 10);

    if (finalMonth < 1 || finalMonth > 12 || finalDay < 1 || finalDay > 31) {
      // Fecha inválida
      return undefined;
    }

    // Validar que la fecha sea válida (ej: 31 de febrero no existe)
    const testDate = new Date(parseInt(year, 10), finalMonth - 1, finalDay);
    if (
      testDate.getFullYear() !== parseInt(year, 10) ||
      testDate.getMonth() !== finalMonth - 1 ||
      testDate.getDate() !== finalDay
    ) {
      return undefined;
    }

    // Retornar formato ISO 8601 completo: YYYY-MM-DDTHH:mm:ss
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour}:${minute}:${second}`;
  }

  // Si ya tiene formato ISO 8601 pero no coincide con el regex, retornarlo tal cual
  if (formattedValue.includes('T')) {
    return formattedValue;
  }

  // Si no coincide con ningún formato esperado, retornar undefined
  return undefined;
};
