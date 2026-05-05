import type { ICompany } from '../../app/interfaces/company.interface';
import type { ITeam } from '../../app/interfaces/team.interface';

interface IIFile {
  url: string;
  type: string;
  name: string;
  size: number;
}

export type InvoiceDetailAction =
  | 'inventory'
  | 'desconsolidado'
  | 'aforo'
  | 'aforoSAG';

export type InvoiceDetailKind =
  | 'container'
  | 'codedUnit'
  | 'generalUnit'
  | 'aforo'
  | 'aforoSAG';

export interface IInvoiceDetailItem {
  action: InvoiceDetailAction;
  kind: InvoiceDetailKind;
  // Container BIC code (when kind === 'container')
  bic?: string;
  // Car VIN / unit identifier (when kind is codedUnit / generalUnit / aforo / aforoSAG)
  vin?: string;
  // Internal ids useful for traceability / future drill-downs
  carId?: any;
  inventoryCarId?: any;
  inventoryId?: any;
  containerCarId?: any;
  participantId?: any;
  formId?: any;
  contentType?: 'coded-items' | 'general-items';
  // Extra fields from InventoryCar.extra
  nave?: string;
  viaje?: string;
  // Load date/time for inventory & desconsolidado, revision time for aforo
  datetime?: Date;
  // Unit price in USD applied for this line
  price?: number;
}

export interface IInvoiceDetailGroup {
  count: number;
  price: number;
  items: IInvoiceDetailItem[];
}

export interface IInvoiceDetail {
  desconsolidado?: {
    containers?: IInvoiceDetailGroup;
    codedUnits?: IInvoiceDetailGroup;
  };
  aforo?: {
    aforo?: IInvoiceDetailGroup;
    aforoSAG?: IInvoiceDetailGroup;
  };
}

export interface IInvoice {
  _id?: any;
  team: ITeam;
  company: ICompany;
  period: string;
  inventoryPrice: number;
  checklistPrice: number;
  requestPrice: number;
  deliveryPrice: number;
  inventoryCars: number;
  checklistCars: number;
  deliveryCars: number;
  requestCars: number;
  containers: number;
  containersPrice: number;
  totalUF: number;
  totalDolar: number;
  totalPeso: number;
  valueUF: number;
  valueDolar: number;
  file: IIFile;
  detail: IInvoiceDetail;
  updatedAt?: Date;
  createdAt?: Date;
}
