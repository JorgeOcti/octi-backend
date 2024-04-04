export enum StatsDashboardTypes {
  UNIT_CONTROL = "UNIT_CONTROL",
  INVENTORY = "INVENTORY",
  DISTRIBUTION = "DISTRIBUTION",
  PLANIFICATION = "PLANIFICATION",
  OSA = "OSA",
}

export const DashboardTypesDictionary: { [id: string]: string } = {
  [StatsDashboardTypes.UNIT_CONTROL]: "Control de unidades",
  [StatsDashboardTypes.INVENTORY]: "Inventarios",
  [StatsDashboardTypes.DISTRIBUTION]: "Distribución",
  [StatsDashboardTypes.PLANIFICATION]: "Planificación",
  [StatsDashboardTypes.OSA]: "OSA"
};
