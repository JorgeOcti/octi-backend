import type { ICompany } from './company.interface';
import type { IForm } from '../../form/interfaces/form.interface';
import type { IPermission } from '../../billing/interfaces/permission.interface';
import type { IVenue } from './venue.interface';
import type { ITeam } from './team.interface';
import type { IModule } from '../../billing/interfaces/module.interface';

export interface IGroup {
  name: string;
  team: ITeam[];
  companies: ICompany[];
  modules: IModule[];
  permissions: IPermission[];
  forms: IForm[];
  venues: IVenue[];
  active: boolean;
  updatedAt: Date;
  createdAt: Date;
}
