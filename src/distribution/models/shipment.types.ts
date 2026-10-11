export enum ChoicesStatusShipment {
  /** El camión se está cargando. Admite unidades. */
  open = 'open',
  /** Se registró la salida. Inmutable a partir de acá. */
  shipped = 'shipped',
  /** Se bajaron todas las unidades que alguna vez se cargaron (R8). */
  cancelled = 'cancelled'
}

export const choicesStatusShipment = [
  ChoicesStatusShipment.open,
  ChoicesStatusShipment.shipped,
  ChoicesStatusShipment.cancelled
];

export enum ChoicesStatusShipmentItem {
  /**
   * Reservada: el VIN ya se reclamó pero el formulario de la unidad todavía no
   * se respondió. Sigue tomando el candado —si no, dos operarios llenarían el
   * formulario de la misma unidad y el segundo perdería su trabajo al final—
   * pero no cuenta como cargada.
   */
  claiming = 'claiming',
  /**
   * Cargada en un camión abierto. Es el ÚNICO estado que bloquea la unidad:
   * el índice único parcial de shipmentItem filtra por este valor.
   */
  loaded = 'loaded',
  /** La bajaron del camión (R7). Libera la unidad para otro envío. */
  removed = 'removed',
  /** El camión salió (R5). El re-envío lo impide Car.handlerCompany, no el índice. */
  shipped = 'shipped'
}

export const choicesStatusShipmentItem = [
  ChoicesStatusShipmentItem.claiming,
  ChoicesStatusShipmentItem.loaded,
  ChoicesStatusShipmentItem.removed,
  ChoicesStatusShipmentItem.shipped
];
