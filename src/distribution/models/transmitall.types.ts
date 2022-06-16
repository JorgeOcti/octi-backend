export enum ChoicesStatusTransmittal {
  pending = 'pending',
  inTransit = 'inTransit',
  damaged = 'damaged',
  completed = 'completed',
}

export const choicesStatusTransmittal = [
  ChoicesStatusTransmittal.pending,
  ChoicesStatusTransmittal.inTransit,
  ChoicesStatusTransmittal.damaged,
  ChoicesStatusTransmittal.completed,
];
