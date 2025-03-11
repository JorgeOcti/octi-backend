export enum StatusHistory {
  created = 'created',
  available = 'available',
  inTransit = 'inTransit',
  unknown = 'unknown',
  sale = 'sale',
  found = 'found',
  readyToClient = 'readyToClient',
}

export const statusHistory= [
  StatusHistory.created,
  StatusHistory.available,
  StatusHistory.inTransit,
  StatusHistory.unknown,
  StatusHistory.sale,
  StatusHistory.found,
  StatusHistory.readyToClient,
];

export enum ModuleHistory {
  import = 'import',
  form = 'form',
  deliveryCertificate = 'deliveryCertificate',
  inventory = 'inventory',
  request = 'request',
  transportation = 'transportation',
  assignment = 'assignment',
  scheduling = 'scheduling',
}

export const modulesHistory = [
  ModuleHistory.import,
  ModuleHistory.form,
  ModuleHistory.deliveryCertificate,
  ModuleHistory.inventory,
  ModuleHistory.request,
  ModuleHistory.transportation,
  ModuleHistory.assignment,
  ModuleHistory.scheduling,
];
