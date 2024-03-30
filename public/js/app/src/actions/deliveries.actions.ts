import ApiService from '../utils/axios';
import { Dispatch } from 'redux';
import {
  CANCEL_DELIVERIES,
  CHANGE_FILTER_DELIVERIES,
  DeliveriesFilter,
  IDeliveriesActionTypes,
  IDeliveriesState,
  IDeliveryDispatch,
  LOAD_DELIVERIES,
  LOAD_FORMS,
  LOAD_BRANDS,
  LOADING_DELIVERIES
} from './deliveries.types';
import { AxiosError, AxiosResponse, CancelTokenSource, default as Axios } from 'axios';
import { IParticipant } from '../../../../../src/form/interfaces/participant.interface';
import { IBrand } from '../../../../../src/app/interfaces/brand.interface';
import { IForm } from '../../../../../src/form/interfaces/form.interface';

export default class DeliveriesActions {

  private api: ApiService;

  constructor(private dispatch: IDeliveryDispatch) {
    this.api = new ApiService();
  }

  public loadingAction(loading: boolean): void {
    this.dispatch({
      type: LOADING_DELIVERIES,
      payload: {
        loading
      }
    });
  }

  public loadDeliveriesAction(participants: IParticipant[], count: number, page: number, pages: number): void {
    this.dispatch({
      type: LOAD_DELIVERIES,
      payload: {
        participants,
        count,
        page,
        pages
      }
    });
  }

  public loadBrandsAction(brands: IBrand[]): void {
    this.dispatch({
      type: LOAD_BRANDS,
      payload: {
        brands: brands
      }
    });
  }

  public loadFormsAction(forms: IForm[]): void {
    this.dispatch({
      type: LOAD_FORMS,
      payload: {
        forms
      }
    });
  }

  public updateFiltersAction(filters: Partial<DeliveriesFilter>): void {
    Object.entries(filters).forEach(([key, value]) => {
      this.changeFilterAction({ [key]: value });
    });
    this.getDeliveriesThunkAction(1, true);
  }

  public changeFilterAction(filters: Partial<DeliveriesFilter>): void {
    this.dispatch({
      type: CHANGE_FILTER_DELIVERIES,
      payload: filters
    });
  }

  public getDeliveriesThunkAction(nextPage: number, loading: boolean): void {
    this.dispatch((dispatch: Dispatch<IDeliveriesActionTypes>, getState: () => { deliveries: IDeliveriesState }) => {
      const { deliveries } = getState();
      const { pagination, filters } = deliveries;
      const page = nextPage ? nextPage : pagination.page;
      this.loadingAction(true);
      this.cancelAction(this.api.getSource());
      if(filters.brands.length === 0) {
        this.api.getBrands({page: 1, pageSize: 500})
          .then((response: AxiosResponse) => {
            this.loadBrandsAction(response.data.results);
          })
          .catch((err: AxiosError) => {
            this.api.errorHandler(err);
          });
      }

      Axios
        .all([
          this.api.getRevisions({
            onlyControls:true,
            deliveries: true,
            page,
            forms: filters.forms,
            from: filters.from,
            to: filters.to,
            search: filters.searchText,
            delivery: filters.searchDelivery,
            brands: filters.brands
          }),
          this.api.getUserForms({ deliveries: true })
        ])
        .then(Axios.spread((deliveries, forms) => {
          const { results, count, pages } = deliveries.data;
          this.loadDeliveriesAction(results, count, page, pages);
          this.loadFormsAction(forms.data.results);
          this.loadingAction(false);
        }))
        .catch((err: AxiosError) => {
          if (Axios.isCancel(err)) {
            if (loading) {
              this.loadingAction(true);
            }
          } else {
            if (loading) {
              this.loadingAction(false);
            }
            this.api.errorHandler(err);
          }
        });
    });
  }

  private cancelAction(source: CancelTokenSource): void {
    this.dispatch({
      type: CANCEL_DELIVERIES,
      payload: {
        source
      }
    });
  }
}
