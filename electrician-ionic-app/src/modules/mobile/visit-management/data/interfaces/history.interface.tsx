export interface IPagesByActivityIdRequest {
  activity_id: string;
}

export interface IPage {
  code: string;
  name: string;
  hide_when_tags: string[] | null;
  index: number;
  description: string;
  mandatory_fields: number;
  completed_fields: number;
  isComplete?: boolean;
}

export interface IPagesByActivityIdResponse {
  title: string;
  description: string;
  pages: IPage[];
}

export const stepMapping: { [key: string]: 'always' | string[] } = {
  'Información general': 'always',
  'Tipo de servicio': 'always',
  'Transformadores encontrados': [
    'PQR',
    'Normalización medida',
    'Normalización Emergencias',
  ],
  'Hallazgos Visita Emergencia': ['PQR', 'Normalización Emergencias'],
  'Medidor encontrado': 'always',
  'Medidor principal instalado': [
    'Normalización medida',
    'Normalización Emergencias',
  ],
  'Telemedida encontrada': [
    'Normalización medida',
    'Pruebas de Rutina',
    'PQR',
    'Normalización Emergencias',
  ],
  'Telemedida instalada': [
    'Normalización medida',
    'Pruebas de Rutina',
    'PQR',
    'Normalización Emergencias',
  ],
  'Totalizador encontrado': 'always',
  'Totalizador instalado': [
    'PQR',
    'Normalización medida',
    'Normalización Emergencias',
  ],
  'Cables de potencia encontrados': [
    'PQR',
    'Pruebas de Rutina',
    'Previa Bichito',
    'Normalización medida',
    'Visita previa condensadores',
    'Normalización Emergencias',
    'Normalización condensadores',
    'Inst. condensadores',
    'Inst. BIA Monitor',
  ],
  'Cables de potencia instalados': [
    'PQR',
    'Pruebas de Rutina',
    'Previa Bichito',
    'Normalización medida',
    'Visita previa condensadores',
    'Normalización Emergencias',
    'Normalización condensadores',
    'Inst. condensadores',
    'Inst. BIA Monitor',
  ],
  'TCs encontrados': [
    'PQR',
    'Normalización medida',
    'Normalización Emergencias',
  ],
  'TCs Instalados': [
    'PQR',
    'Normalización medida',
    'Normalización Emergencias',
  ],
  'TPs encontrados': [
    'PQR',
    'Normalización medida',
    'Normalización Emergencias',
  ],
  'TPs Instalados': [
    'PQR',
    'Normalización medida',
    'Normalización Emergencias',
  ],
  'Bloque de pruebas encontrado': [
    'PQR',
    'Normalización medida',
    'Normalización Emergencias',
  ],
  'Bloque de pruebas instalado': [
    'PQR',
    'Normalización medida',
    'Normalización Emergencias',
  ],
  'Cable de control encontrado': [
    'PQR',
    'Normalización medida',
    'Normalización Emergencias',
  ],
  'Cable de control instalado': [
    'PQR',
    'Normalización medida',
    'Normalización Emergencias',
  ],
  'Pruebas de funcionamiento': 'always',
  'Diagrama unifilar': 'always',
  'R&D': ['Previa Bichito'],
  'Equipos Retirados Condensadores /Bichitos': [
    'Inst. condensadores',
    'Inst. BIA Monitor',
    'Normalización condensadores',
  ],
  'Equipos Instalados Condensadores /Bichitos': [
    'Inst. condensadores',
    'Inst. BIA Monitor',
    'Normalización condensadores',
  ],
  'Descripción y observaciones': 'always',
  'Autorización y firmas': 'always',
};
