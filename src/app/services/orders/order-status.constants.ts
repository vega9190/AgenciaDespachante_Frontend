export const ORDER_STATUS_IDS = {
  nuevo: '06A96731-4552-419A-9C99-2D9D3789C8D8',
  enProceso: '4E728433-3F70-420E-B185-FB7A11B66D12',
  declaracion: '0B257220-3850-4273-91B8-5469B44CFC88',
  autorizado: 'D0E070C1-1778-4A97-B36D-7542545E9388',
  finalizado: 'B170F17F-F8A7-4814-8C56-6E7C5225D5F6',
  cancelado: 'E6842736-E965-4A09-AF5A-A95C4E4D4E8F'
} as const;

export interface OrderTimelineStep {
  label: string;
  statusId: string;
}

export const ORDER_TIMELINE_STEPS: OrderTimelineStep[] = [
  {
    label: 'Nuevo',
    statusId: ORDER_STATUS_IDS.nuevo
  },
  {
    label: 'En Proceso',
    statusId: ORDER_STATUS_IDS.enProceso
  },
  {
    label: 'Declaración',
    statusId: ORDER_STATUS_IDS.declaracion
  },
  {
    label: 'Autorizado',
    statusId: ORDER_STATUS_IDS.autorizado
  },
  {
    label: 'Finalizado',
    statusId: ORDER_STATUS_IDS.finalizado
  }
];
