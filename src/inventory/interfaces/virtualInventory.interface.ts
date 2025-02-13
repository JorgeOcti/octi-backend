import type { ICompany } from '../../app/interfaces/company.interface';
import type { ITeam } from '../../app/interfaces/team.interface';

export interface IVirtualInventory {
  name: string;
  status: string;
  company: ICompany;
  team: ITeam;
  createdAt: Date;
  updatedAt: Date;
}
