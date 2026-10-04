import type { ICar } from '../../app/interfaces/car.interface';
import type { ICarModel } from '../../app/models/car.model';
import type { ICompany } from '../../app/interfaces/company.interface';
import type { IForm } from '../../form/interfaces/form.interface';
import type { IFormModel } from '../../form/models/form.model';
import type { IParticipant } from '../../form/interfaces/participant.interface';
import type { IParticipantModel } from '../../form/models/participant.model';
import type { IShipmentModel } from '../models/shipment.model';
import type { ITeam } from '../../app/interfaces/team.interface';
import type { ITeamModel } from '../../app/models/team.model';
import type { IUser } from '../../app/interfaces/user.interface';
import type { IVenue } from '../../app/interfaces/venue.interface';
import type { IVenueModel } from '../../app/models/venue.model';

/** Datos del camión y su chofer. Espeja transmittalTransporterSchema. */
export interface IShipmentTransporter {
  carrier?: any;
  driverName?: string;
  driverRut?: string;
  phone?: string;
}

export interface IShipment {
  _id?: any;
  team: ITeam | ITeamModel;
  /** Company que despacha (la del usuario). */
  handlerCompany: ICompany | any;
  /** Dueña de las unidades. Una sola por patente (R2). */
  clientCompany: ICompany | any;
  /** Patente del camión, normalizada. Identifica el envío (R1). */
  plate: string;
  transporter: IShipmentTransporter;
  venue: IVenue | IVenueModel;
  /** Se responde por cada unidad cargada (R4). */
  unitForm: IForm | IFormModel;
  /** Se responde una vez, al registrar la salida (R4.b). */
  departureForm: IForm | IFormModel;
  /** Respuesta del formulario de salida. */
  participant?: IParticipant | IParticipantModel;
  status: string;
  observation?: string;
  createdBy: IUser | any;
  shippedAt?: Date;
  shippedBy?: IUser | any;
  cancelledAt?: Date;
  /**
   * Cuántas unidades se cargaron alguna vez. Sirve para no cancelar un envío
   * recién creado que todavía no tuvo ninguna (R8).
   */
  itemsEverLoaded: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IShipmentItem {
  _id?: any;
  shipment: IShipment | IShipmentModel;
  team: ITeam | ITeamModel;
  car: ICar | ICarModel;
  /** Respuesta del formulario de la unidad. */
  participant?: IParticipant | IParticipantModel;
  status: string;
  loadedBy: IUser | any;
  loadedAt: Date;
  /** Baja lógica: nunca se borra el registro (R7). */
  removedAt?: Date;
  removedBy?: IUser | any;
  createdAt?: Date;
  updatedAt?: Date;
}
