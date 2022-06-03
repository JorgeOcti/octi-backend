import { ModuleHistory } from '../../models/history.types';

export interface InventoryCarProps {
  id: any;
}

export interface fromParticipantProps {
  id: any;
}

export interface importToSistemProps {
  car: string;
  team: string;
  company: string;
  createdBy: any;
  executedAt: Date;
  module?: ModuleHistory;
}
