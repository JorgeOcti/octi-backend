import { CancelTokenSource } from 'axios';
import { IModule, ITeamBilling } from '../../../../../src/billing/interfaces';
import { ICompany } from '../../../../../src/app/interfaces';
import { IInvoiceTeamBilling } from '../../../../../src/billing/interfaces/invoiceTeamBilling.interface';
import { Moment } from 'moment';

export const LOADING_BILLING_SETINGS = '@billingSettings/IS_LOADING';
export const LOAD_BILLING_SETINGS = '@billingSettings/LOAD_BILLING_SETINGS';
export const LOAD_INVOICE = '@billingSettings/LOAD_INVOICE';
export const LOAD_ALL_COMPANIES_BILLING_SETINGS = '@billingSettings/LOAD_ALL_COMPANIES';
export const LOAD_ALL_MODULES_BILLING_SETINGS = '@billingSettings/LOAD_ALL_MODULES';
export const CANCEL_BILLING_SETINGS = '@billingSettings/CANCEL_REQUEST';


interface IBillingSettingsLoadingAction {
  type: typeof LOADING_BILLING_SETINGS;
  payload: {
    loading: boolean;
  };
}

interface IBillingSettingsLoadAllCompaniesAction {
  type: typeof LOAD_ALL_COMPANIES_BILLING_SETINGS;
  payload: {
    companies: ICompany[];
  };
}

interface IBillingSettingsLoadAllModulesAction {
  type: typeof LOAD_ALL_MODULES_BILLING_SETINGS;
  payload: {
    modules: IModule[];
  };
}

interface IBillingSettingsCancerlRequestAction {
  type: typeof CANCEL_BILLING_SETINGS;
  payload: {
    source: CancelTokenSource;
  };
}

interface IBillingSettingsLoadAction {
  type: typeof LOAD_BILLING_SETINGS;
  payload: {
    billingSettings: ITeamBilling;
    // count: number;
    // pages: number;
    // page: number;
  };
}

interface IInvoiceLoadAction {
  type: typeof LOAD_INVOICE;
  payload: {
    invoice: IInvoiceTeamBilling;
    oldest: Moment;
    last: Moment;
  };
}

export interface IBillingSettingsState {
  loading: boolean;
  source: CancelTokenSource | null;
  billingSettings: ITeamBilling | null;
  invoice: IInvoiceTeamBilling | null;
  oldest: Moment | null;
  last: Moment | null;
  companies: ICompany[];
  modules: IModule[];
}

export type IBillingSettingsActionTypes =
  IBillingSettingsLoadingAction |
  IInvoiceLoadAction |
  IBillingSettingsLoadAllCompaniesAction |
  IBillingSettingsLoadAllModulesAction |
  IBillingSettingsCancerlRequestAction |
  IBillingSettingsLoadAction;

