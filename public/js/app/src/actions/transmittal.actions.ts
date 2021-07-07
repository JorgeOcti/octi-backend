import {ITransmittal} from '../../../../../src/interfaces/transmittal.interface';
import {
  CANCEL_REQUEST_TRANSMITTAL,
  CHANGE_ORDER_TRANSMITTAL,
  ITransmittalActionTypes,
  ITransmittalState,
  LOAD_CARRIERS_TRANSMITTAL,
  LOAD_TRANSMITTAL,
  LOAD_VENUES_TRANSMITTAL,
  LOADING_TRANSMITTAL
} from "./transmittal.types";
import ApiService from "../utils/axios";
import Axios, {AxiosError, CancelTokenSource} from "axios";
import {ThunkDispatch} from "redux-thunk";
import {IVenueModel} from '../../../../../src/app/models/venue.model';
import {ICarrierModel} from '../../../../../src/app/models/carrier.model';
import {arrayPush, autofill} from "redux-form";

export default class TransmittalActions {
  private api: ApiService;

  public formName: string = 'transmittalForm';

  constructor(
    private dispatch: ThunkDispatch<{ transmittal: ITransmittalState }, {}, ITransmittalActionTypes>
  ) {
    this.api = new ApiService();
  }

  public loadingAction(loading: boolean): void {
    this.dispatch({
      type: LOADING_TRANSMITTAL,
      payload: {
        loading,
      }
    })
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
    })
  }

  public cancelRequestAction(source: CancelTokenSource): void {
    this.dispatch({
      type: CANCEL_REQUEST_TRANSMITTAL,
      payload: {
        source
      }
    })
  }

  public changeOrderAction(orderBy: string, orderType: string): void {
    this.dispatch({
      type: CHANGE_ORDER_TRANSMITTAL,
      payload: {
        orderBy,
        orderType
      }
    })
  }

  public loadCarriers(carriers:  ICarrierModel[]): void {
    this.dispatch({
      type: LOAD_CARRIERS_TRANSMITTAL,
      payload: {
        carriers,
      }
    })
  }


  public loadVenues(venues:  IVenueModel[]): void {
    this.dispatch({
      type: LOAD_VENUES_TRANSMITTAL,
      payload: {
        venues,
      }
    })
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

  public getFormBaseData(): void {
    this.dispatch((dispatch) => {
      const transmittalActions = new TransmittalActions(dispatch);
      transmittalActions.loadingAction(true);
      Axios
        .all([
          this.api.getVenues(1, 200, true, true),
          this.api.getCarriers(1, 200)
        ])
        .then(Axios.spread((venues, carriers) => {
          transmittalActions.loadVenues(venues.data.results);
          transmittalActions.loadCarriers(carriers.data.results);
          transmittalActions.loadingAction(false);
        }))
        .catch((err: AxiosError): void => {
          transmittalActions.loadingAction(false);
          this.api.errorHandler(err);
        });
    })
  }

  public getTransmittalsThunkAction(nextPage: number, orderBy: string, orderType: string, hideLoading?: boolean): void {
    this.dispatch((dispatch, getState) => {
      const state = getState();
      const transmittalActions = new TransmittalActions(dispatch);
      const page = nextPage ? nextPage : state.transmittal.pagination.page;
      transmittalActions.loadingAction(!hideLoading);
      transmittalActions.changeOrderAction(orderBy, orderType);
      transmittalActions.cancelRequestAction(this.api.getSource());
      Axios
        .all([
          this.api.getTransmittals({page, orderBy, orderType})
        ])
        .then(Axios.spread((transmittals) => {
          const {data} = transmittals;
          transmittalActions.loadAction(data.results, data.count, data.pages, page);
          transmittalActions.loadingAction(false);
        }))
        .catch((err: AxiosError) => {
          transmittalActions.loadingAction(false);
          this.api.errorHandler(err);
        });
    });
  }
}
