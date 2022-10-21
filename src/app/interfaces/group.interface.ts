import { ICompany } from './company.interface';
import { IForm } from '../../form/interfaces/form.interface';
import { IPermission } from '../../billing/interfaces/permission.interface';
import { IVenue } from './venue.interface';
import { ITeam } from './team.interface';
import { IModule } from '../../billing/interfaces';

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
