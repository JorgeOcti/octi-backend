export enum ChoicesStatusTransmittal {
  pending = 'pending',
  inTransit = 'inTransit',
  damaged = 'damaged',
  completed = 'completed',
  completed_by_reception = 'completed_by_reception',
}

export const choicesStatusTransmittal = [
  ChoicesStatusTransmittal.pending,
  ChoicesStatusTransmittal.inTransit,
  ChoicesStatusTransmittal.damaged,
  ChoicesStatusTransmittal.completed,
  ChoicesStatusTransmittal.completed_by_reception,
];
