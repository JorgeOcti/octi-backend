export enum StatusHistory {
  created = 'created',
  available = 'available',
  inTransit = 'inTransit',
  sale = 'sale'
}

export const statusHistory= [
  StatusHistory.created,
  StatusHistory.available,
  StatusHistory.inTransit,
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
