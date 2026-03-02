import { MesEnum } from '../enums/mes-enum';

/** Mapeo de MesEnum a número de mes (1-12) para consultas SQL */
export const MES_A_NUMERO: Record<MesEnum, number> = {
  [MesEnum.ENERO]: 1,
  [MesEnum.FEBRERO]: 2,
  [MesEnum.MARZO]: 3,
  [MesEnum.ABRIL]: 4,
  [MesEnum.MAYO]: 5,
  [MesEnum.JUNIO]: 6,
  [MesEnum.JULIO]: 7,
  [MesEnum.AGOSTO]: 8,
  [MesEnum.SEPTIEMBRE]: 9,
  [MesEnum.OCTUBRE]: 10,
  [MesEnum.NOVIEMBRE]: 11,
  [MesEnum.DICIEMBRE]: 12,
};

export function mesEnumToNumero(mes: MesEnum): number {
  return MES_A_NUMERO[mes];
}
