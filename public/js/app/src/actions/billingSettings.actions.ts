import ApiService from '../utils/axios';
import { ThunkDispatch } from 'redux-thunk';
import { autofill, FormAction, submit } from 'redux-form';
import {
  CANCEL_BILLING_SETINGS,
  IBillingSettingsActionTypes,
  IBillingSettingsState,
  LOAD_ALL_COMPANIES_BILLING_SETINGS,
  LOAD_ALL_MODULES_BILLING_SETINGS,
  LOAD_BILLING_SETINGS, LOAD_INVOICE,
  LOADING_BILLING_SETINGS
} from './billingSettings.types';
import Axios, { AxiosError, CancelTokenSource } from 'axios';
import { ICompany } from '../../../../../src/app/interfaces/company.interface';
import { IModule } from '../../../../../src/billing/interfaces/module.interface';
import { ITeamBilling } from '../../../../../src/billing/interfaces/teamBiling.interfaces';
import { IInvoiceTeamBilling } from '../../../../../src/billing/interfaces/invoiceTeamBilling.interface';
import { Moment } from 'moment';

export default class BillingSettingsActions {

  readonly form = 'billingSettingsForm';
  private api: ApiService;

  constructor(
    private dispatch: ThunkDispatch<{ transmittal: IBillingSettingsState }, {}, IBillingSettingsActionTypes | FormAction>
  ) {
    this.api = new ApiService();
  }

  public loadingAction(loading: boolean): void {
    this.dispatch({
      type: LOADING_BILLING_SETINGS,
      payload: {
        loading
      }
    });
  }

  public loadInvoiceAction(invoice: IInvoiceTeamBilling, oldest: Moment, last: Moment): void {
    this.dispatch({
      type: LOAD_INVOICE,
      payload: {
        invoice,
        oldest,
        last
      }
    });
  }

  public loadBillingSettingsAction(billingSettings: ITeamBilling): void {
    this.dispatch({
      type: LOAD_BILLING_SETINGS,
      payload: {
        billingSettings
      }
    });
  }

  public loadAllCompanies(companies: ICompany[]): void {
    this.dispatch({
      type: LOAD_ALL_COMPANIES_BILLING_SETINGS,
      payload: {
        companies
      }
    });
  }

  public loadAllModules(modules: IModule[]): void {
    this.dispatch({
      type: LOAD_ALL_MODULES_BILLING_SETINGS,
      payload: {
        modules
      }
    });
  }

  public cancelRequestAction(source: CancelTokenSource): void {
    this.dispatch({
      type: CANCEL_BILLING_SETINGS,
      payload: {
        source
      }
    });
  }

  public submit(form: string) {
    this.dispatch(submit(form));
  }

  public autofill(field: string, value: any) {
    this.dispatch(
      autofill(this.form, field, value),
    );
  }

  public getInvoice({ period }: { period?: string }): void {
    this.dispatch((dispatch) => {
      const actions = new BillingSettingsActions(dispatch);
      actions.loadingAction(true);
      Axios
        .all([
          this.api.getInvoiceCorporate({ period })
        ])
        .then(Axios.spread((
          invoice) => {
          const {results, oldestInvoice, lastInvoice} = invoice.data;
          actions.loadInvoiceAction(results, oldestInvoice, lastInvoice);
          actions.loadingAction(false);
        }))
        .catch((err: AxiosError): void => {
          actions.loadingAction(true);
          this.api.errorHandler(err);
        });
    });
  }

  public getTeamSettings(): void {
    this.dispatch((dispatch) => {
      const actions = new BillingSettingsActions(dispatch);
      actions.loadingAction(true);
      Axios
        .all([
          this.api.getAllCompanies(),
          this.api.getAllModules(),
          this.api.getBillingByCorporate(),
          // this.api.getDrivers(1, 200),
          // this.api.getMilestoneTypes({ page: 1, pageSize: 200 })
        ])
        .then(Axios.spread((
          companies,
          modules,
          billingSettings) => {
          actions.loadAllCompanies(companies.data.results);
          actions.loadAllModules(modules.data.results);
          actions.loadBillingSettingsAction(billingSettings.data.results);
          // actions.loadDrivers(drivers.data.results);
          // actions.loadMilestoneTypes(milestones.data.results);
          actions.loadingAction(false);
        }))
        .catch((err: AxiosError): void => {
          actions.loadingAction(true);
          this.api.errorHandler(err);
        });
    });
  }

}
