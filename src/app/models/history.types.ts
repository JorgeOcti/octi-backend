export enum StatusHistory {
  created = 'created',
  available = 'available',
  inTransit = 'inTransit',
  unknown = 'unknown',
  sale = 'sale'
}

export const statusHistory= [
  StatusHistory.created,
  StatusHistory.available,
  StatusHistory.inTransit,
  StatusHistory.unknown,
  StatusHistory.sale
];

export enum ModuleHistory {
  import = 'import',
  form = 'form',
  inventory = 'inventory',
}

export const modulesHistory = [
  ModuleHistory.import,
  ModuleHistory.form,
  ModuleHistory.inventory
];
