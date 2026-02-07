import { MesEnum } from '../enums/mes-enum';

const ZONA_HORARIA_ARGENTINA = 'America/Argentina/Buenos_Aires';
const MESES: MesEnum[] = [
  MesEnum.ENERO,
  MesEnum.FEBRERO,
  MesEnum.MARZO,
  MesEnum.ABRIL,
  MesEnum.MAYO,
  MesEnum.JUNIO,
  MesEnum.JULIO,
  MesEnum.AGOSTO,
  MesEnum.SEPTIEMBRE,
  MesEnum.OCTUBRE,
  MesEnum.NOVIEMBRE,
  MesEnum.DICIEMBRE,
];

export interface MesAnioActual {
  mes: MesEnum;
  anio: number;
}

/**
 * Retorna el mes y año actual considerando la zona horaria de Argentina.
 */
export function getMesAnioActual(): MesAnioActual {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA_ARGENTINA,
    year: 'numeric',
    month: 'numeric',
  });

  const parts = formatter.formatToParts(new Date());
  const anio = Number(parts.find((p) => p.type === 'year')?.value);
  const mesNum = Number(parts.find((p) => p.type === 'month')?.value);

  return {
    mes: MESES[mesNum - 1],
    anio,
  };
}