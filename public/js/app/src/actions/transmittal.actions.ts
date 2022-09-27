import {ITransmittal} from '../../../../../src/distribution/interfaces/transmittal.interface';
import {
  CANCEL_REQUEST_TRANSMITTAL,
  CHANGE_ORDER_TRANSMITTAL,
  CREATE_TRANSMITTAL_ITEM_TRANSMITTAL,
  DELETE_TRANSMITTAL_ITEM_TRANSMITTAL,
  DELETE_TRANSMITTAL_TRANSMITTAL,
  FILTER_REQUEST_ITEMS_TRANSMITTAL,
  IRequestItemsFilters,
  ITransmittalActionTypes,
  ITransmittalState,
  LOAD_CARRIERS_TRANSMITTAL,
  LOAD_DRIVERS_TRANSMITTAL, LOAD_MILESTONE_TYPES_TRANSMITTAL,
  LOAD_REQUEST_ITEMS_TRANSMITTAL,
  LOAD_TRANSMITTAL,
  LOAD_VENUES_TRANSMITTAL,
  LOADING_REQUEST_ITEMS_TRANSMITTAL,
  LOADING_TRANSMITTAL,
  TOOGLE_TAB_TRANSMITTAL,
  UPDATE_TRANSMITTAL_ITEM_TRANSMITTAL,
  UPDATE_TRANSMITTAL_TRANSMITTAL,
  TRANSPORT_MILESTONE_LOAD_STATUS, LOAD_TRANSMITTAL_RESUME,
} from './transmittal.types';
import ApiService from "../utils/axios";
import Axios, {AxiosError, AxiosResponse, CancelTokenSource} from "axios";
import {ThunkDispatch} from "redux-thunk";
import {IVenue} from '../../../../../src/app/interfaces/venue.interface';
import {ICarrier} from '../../../../../src/app/interfaces/carrier.interface';
import {arrayPush, autofill, FormAction, submit} from "redux-form";
import {IUser} from '../../../../../src/app/interfaces/user.interface';
import {IRequestItem} from '../../../../../src/request/interfaces/requestItem.interface';
import {ITransmittalItem} from '../../../../../src/distribution/interfaces/transmittalItem.interface';
import { IMilestoneType } from '../../../../../src/distribution/interfaces/milestoneType.interface';
import {IMilestone} from "../../../../../src/distribution/interfaces";

export default class TransmittalActions {
  private api: ApiService;

  public formName: string = 'transmittalForm';

  constructor(
    private dispatch: ThunkDispatch<{ transmittal: ITransmittalState }, {}, ITransmittalActionTypes | FormAction>
  ) {
    this.api = new ApiService();
  }

  public loadingAction(loading: boolean): void {
    this.dispatch({
      type: LOADING_TRANSMITTAL,
      payload: {
        loading
      }
    });
  }

  public loadAction(data: ITransmittal[], count: number, pages: number, page: number): void {
    this.dispatch({
      type: LOAD_TRANSMITTAL,
      payload: {
        data,
        count,
        pages,
        page
      }
    });
  }

  public cancelRequestAction(source: CancelTokenSource): void {
    this.dispatch({
      type: CANCEL_REQUEST_TRANSMITTAL,
      payload: {
        source
      }
    });
  }

  public changeOrderAction(orderBy: string, orderType: string): void {
    this.dispatch({
      type: CHANGE_ORDER_TRANSMITTAL,
      payload: {
        orderBy,
        orderType
      }
    });
  }

  public loadCarriers(carriers:  ICarrier[]): void {
    this.dispatch({
      type: LOAD_CARRIERS_TRANSMITTAL,
      payload: {
        carriers,
      }
    });
  }

  public loadDrivers(drivers: IUser[]): void {
    this.dispatch({
      type: LOAD_DRIVERS_TRANSMITTAL,
      payload: {
        drivers,
      }
    });
  }

  public loadMilestoneTypes(milestoneTypes: IMilestoneType[]): void {
    this.dispatch({
      type: LOAD_MILESTONE_TYPES_TRANSMITTAL,
      payload: {
        milestoneTypes,
      }
    });
  }

  public loadVenues(venues:  IVenue[]): void {
    this.dispatch({
      type: LOAD_VENUES_TRANSMITTAL,
      payload: {
        venues,
      }
    });
  }

  public toogleTab(transmittalId:  string, status?: boolean): void {
    this.dispatch({
      type: TOOGLE_TAB_TRANSMITTAL,
      payload: {
        transmittalId,
        status
      }
    });
  }

  public submit(form: string) {
    this.dispatch(submit(form));
  }

  public autofill(field: string, value: any) {
    this.dispatch(
      autofill(this.formName, field, value),
    );
  }

  public pushItem(value: any) {
    this.dispatch(
      arrayPush(this.formName, 'items', value)
    );
  }

  public updateTransmittalAction(transmittal: Partial<ITransmittal>){
    this.dispatch({
      type: UPDATE_TRANSMITTAL_TRANSMITTAL,
      payload: {
        transmittal
      }
    })
  }

  public updateTransmittalThunkAction(transmittal: any) {
    this.dispatch((dispatch) => {
      const transmittalActions = new TransmittalActions(dispatch);
      this.api.updateTransmittal(transmittal)
        .then((response: AxiosResponse) => {
          transmittalActions.updateTransmittalAction(response.data.data);
        })
        .catch((err: AxiosError) => {
          this.api.errorHandler(err);
        });
    });
  }

  public deleteTransmittalAction(transmittal: Partial<ITransmittal>){
    this.dispatch({
      type: DELETE_TRANSMITTAL_TRANSMITTAL,
      payload: {
        transmittal
      }
    })
  }

  public deleteTransmittalItemAction(transmittalItem: Partial<ITransmittalItem>){
    this.dispatch({
      type: DELETE_TRANSMITTAL_ITEM_TRANSMITTAL,
      payload: {
        transmittalItem
      }
    })
  }

  public createTransmittalItemAction(transmittalItem: Partial<ITransmittal>){
    this.dispatch({
      type: CREATE_TRANSMITTAL_ITEM_TRANSMITTAL,
      payload: {
        transmittalItem
      }
    })
  }

  public updateTransmittalItemAction(transmittalItem: Partial<ITransmittal>){
    this.dispatch({
      type: UPDATE_TRANSMITTAL_ITEM_TRANSMITTAL,
      payload: {
        transmittalItem
      }
    })
  }

  public loadMilestoneAction(milestones: IMilestone[]): void {
    this.dispatch( {
      type: TRANSPORT_MILESTONE_LOAD_STATUS,
      payload: {
        milestones
      }
    });
  }

  public updateTransmittalItemThunkAction(transmitallItem: any) {
    this.dispatch((dispatch) => {
      const transmittalActions = new TransmittalActions(dispatch);
      this.api.updateTransmittalItem(transmitallItem)
        .then((response: AxiosResponse) => {
          transmittalActions.updateTransmittalItemAction(response.data.data);
        })
        .catch((err: AxiosError) => {
          this.api.errorHandler(err);
        });
    });
  }

  public getFormBaseData(): void {
    this.dispatch((dispatch) => {
      const transmittalActions = new TransmittalActions(dispatch);
      transmittalActions.loadingAction(true);
      Axios
        .all([
          this.api.getVenues({ page: 1, pageSize: 200, noPopulate: true }),
          this.api.getCarriers(1, 200),
          this.api.getDrivers(1, 200),
          this.api.getMilestoneTypes({ page: 1, pageSize: 200 })
        ])
        .then(Axios.spread((venues, carriers, drivers,milestones) => {
          transmittalActions.loadVenues(venues.data.results);
          transmittalActions.loadCarriers(carriers.data.results);
          transmittalActions.loadDrivers(drivers.data.results);
          transmittalActions.loadMilestoneTypes(milestones.data.results);
          transmittalActions.loadingAction(false);
        }))
        .catch((err: AxiosError): void => {
          transmittalActions.loadingAction(false);
          this.api.errorHandler(err);
        });
    })
  }

  public getTransmittalsThunkAction({
  nextPage, orderBy, orderType, hideLoading, number, plate, drivers, from, to
}:{
    nextPage: number,
    orderBy: string,
    orderType: string,
    number?: string,
    hideLoading?: boolean,
    plate?: string,
    drivers?: string[],
    from: number,
    to: number
}): void {
    this.dispatch((dispatch, getState) => {
      const state = getState();
      const transmittalActions = new TransmittalActions(dispatch);
      const page = nextPage ? nextPage : state.transmittal.pagination.page;
      transmittalActions.loadingAction(!hideLoading);
      transmittalActions.changeOrderAction(orderBy, orderType);
      transmittalActions.cancelRequestAction(this.api.getSource());
      Axios
        .all([
          this.api.getTransmittals({page, orderBy, orderType, number, plate, drivers, from, to}),
          this.api.getVenues({ page: 1, pageSize: 200, noPopulate: true }),
          this.api.getCarriers(1, 200),
          this.api.getDrivers(1, 200),
          this.api.getMilestoneTypes({ page: 1, pageSize: 200 }),
          this.api.getMilestones({ page: 1, pageSize: 200 })
        ])
        .then(Axios.spread((transmittals,venues, carriers, drivers, milestoneTypes, milestones) => {
          const {data} = transmittals;
          transmittalActions.loadAction(data.results, data.count, data.pages, page);
          transmittalActions.loadVenues(venues.data.results);
          transmittalActions.loadCarriers(carriers.data.results);
          transmittalActions.loadDrivers(drivers.data.results);
          transmittalActions.loadDrivers(drivers.data.results);
          transmittalActions.loadMilestoneTypes(milestoneTypes.data.results);
          transmittalActions.loadMilestoneAction(milestones.data.results);
          transmittalActions.loadingAction(false);
        }))
        .catch((err: AxiosError) => {
          transmittalActions.loadingAction(false);
          this.api.errorHandler(err);
        });
    });
  }

  public loadingRequestItemAction(requestItemsLoading: boolean): void {
    this.dispatch({
      type: LOADING_REQUEST_ITEMS_TRANSMITTAL,
      payload: {
        requestItemsLoading,
      }
    });
  }

  public filterRequestItemAction(key: keyof IRequestItemsFilters, value: any | any[]): void {
    this.dispatch({
      type: FILTER_REQUEST_ITEMS_TRANSMITTAL,
      payload: {
        key,
        value
      }
    });
  }

  public loadRequestItemAction(requestItems: IRequestItem[], count: number, pages: number, page: number): void {
    this.dispatch({
      type: LOAD_REQUEST_ITEMS_TRANSMITTAL,
      payload: {
        requestItems,
        count,
        pages,
        page
      }
    });
  }

  public getRequestItemThunkAction(nextPage: number, hideLoading?: boolean) {
    this.dispatch((dispatch, getState) => {
      const state = getState();
      const transmittalActions = new TransmittalActions(dispatch);
      const page = nextPage ? nextPage : state.transmittal.requestItemsPagination.page;
      transmittalActions.loadingRequestItemAction(!hideLoading);
      transmittalActions.cancelRequestAction(this.api.getSource());
      this.api.getRequestItems({
        page,
        pageSize: 20,
        orderBy: "request.number",
        orderType: "descending",
        filters: {
          ...state.transmittal.requestItemsfilters,
          transmitttalModule: true
        },
      })
        .then((response: AxiosResponse) => {
          const {data} = response;
          transmittalActions.loadRequestItemAction(data.results, data.count, data.pages, page);
          transmittalActions.loadingRequestItemAction(false);
        })
        .catch((err: AxiosError) => {
          transmittalActions.loadingRequestItemAction(false);
          this.api.errorHandler(err);
        });
    });
  }

  public loadTransmittalResumeAction(resume: any[]): void{
    this.dispatch({
      type: LOAD_TRANSMITTAL_RESUME,
      payload: {resume: resume}
    })
  }

  public loadTransmittalResume(from: string, to: string): void {
    this.dispatch((dispatch, getState) => {
      const state = getState();
      const transmittalActions = new TransmittalActions(dispatch);
      transmittalActions.loadingAction(true);
      this.api.getTransmittalResume(from, to).then((response: AxiosResponse) => {
        transmittalActions.loadTransmittalResumeAction(response.data.data);
        transmittalActions.loadingAction(false);
      })
        .catch((err: AxiosError) => {
          transmittalActions.loadTransmittalResumeAction([]);
          transmittalActions.loadingAction(false);
          this.api.errorHandler(err);
        });
    });
  }

}
