import {AxiosError, AxiosResponse, CancelTokenSource, default as Axios} from 'axios';
import {Dispatch} from 'redux';
import {IBaseVenue, IVenue} from '../../../../../src/interfaces/venue.interface';
import ApiService from '../utils/axios';
import {showModal, statusFooterButttonsModal} from '../utils/common';

export interface IVenuesState {
  venues: IVenue[];
  loading: boolean;
  tempVenue: IBaseVenue;
  source: CancelTokenSource | null;
  pagination: {
    count: number;
    page: number;
    pages: number;
  };
}

interface ICancelRequest {
  type: '/VENUES/CANCEL_REQUEST';
  payload: {
    source: CancelTokenSource;
  };
}

export function cancelRequestAction(source: CancelTokenSource): ICancelRequest {
  return {
    type: '/VENUES/CANCEL_REQUEST',
    payload: {
      source
    }
  };
}

interface IIsLoading {
  type: '/VENUES/IS_LOADING';
  payload: {
    loading: boolean;
  };
}

export function isLoadingAction(loading: boolean): IIsLoading {
  return {
    type: '/VENUES/IS_LOADING',
    payload: {
      loading
    }
  };
}

interface IChangePage {
  type: '/VENUES/CHANGE_PAGE';
  payload: {
    page: number;
  };
}

export function changePageAction(page: number): IChangePage {
  return {
    type: '/VENUES/CHANGE_PAGE',
    payload: {
      page
    }
  };
}

interface ILoadVenues {
  type: '/VENUES/LOAD_VENUES';
  payload: {
    venues: any;
    count: number;
    pages: number
  };
}

export function loadVenuesAction(venues: any, count: number, pages: number): ILoadVenues {
  return {
    type: '/VENUES/LOAD_VENUES',
    payload: {
      venues,
      count,
      pages
    }
  };
}

export function getVenuesAction(nextPage: number) {
  return (dispatch: Dispatch<VenueReduxAction>, getState: () => {venues: IVenuesState}) => {
    const api: ApiService = new ApiService();
    const state = getState();

    dispatch(isLoadingAction(true));
    dispatch(cancelRequestAction(api.getSource()));
    const page = nextPage ? nextPage : state.venues.pagination.page;
    if (nextPage) {
      dispatch(changePageAction(nextPage));
    }
    api.getVenues(page)
      .then((response: AxiosResponse) => {
        dispatch(loadVenuesAction(response.data.results, response.data.count, response.data.pages));
        dispatch(isLoadingAction(false));
      })
      .catch((err: AxiosError) => {
        // if the request is canceled
        if (Axios.isCancel(err)) {
          dispatch(isLoadingAction(true));
        } else {
          dispatch(isLoadingAction(false));
          api.errorHandler(err);
        }
      });
  };
}

interface IDeleteVenue {
  type: '/VENUES/DELETE_VENUE';
  payload: {
    id: string;
  };
}

export function removeVenueAction(id: string): IDeleteVenue {
  return {
    type: '/VENUES/DELETE_VENUE',
    payload: {
      id
    }
  };
}

export function deleteVenueAction(id: string) {
  return (dispatch: Dispatch<VenueReduxAction>) => {
    const api: ApiService = new ApiService();
    api.deleteVenue(id)
      .then((response: AxiosResponse): void => {
        // effect when removing user
        swal(response.data.message, {
          icon: 'success'
        });
        $(`#venue-${id}`)
          .addClass('deleted-item');
        setTimeout(() => {
          dispatch(removeVenueAction(id));
        }, 500);
      })
      .catch((err: AxiosError): void => {
        dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });
  };
}

interface IChangeTempVenue {
  type: '/VENUES/CHANGE_TEMP_VENUE';
  payload: {
    venue: IBaseVenue;
  };
  meta: {
    debounce: {
      time: number
    }
  };
}

export function changeTempVenueAction(venue: IBaseVenue): IChangeTempVenue {
  return {
    type: '/VENUES/CHANGE_TEMP_VENUE',
    payload: {
      venue
    },
    meta: {
      debounce: {
        time: 300
      }
    }
  };
}

interface IChangeVenue {
  type: '/VENUES/CHANGE_VENUE';
  payload: {
    venue: IBaseVenue;
  };
}

export function changeVenueAction(venue: IBaseVenue): IChangeVenue {
  return {
    type: '/VENUES/CHANGE_VENUE',
    payload: {
      venue
    }
  };
}

export function editVenueAction() {
  return (dispatch: Dispatch<VenueReduxAction>, getState: () => {venues: IVenuesState}) => {
    const state = getState();
    const {tempVenue} = state.venues;
    const api: ApiService = new ApiService();
    api.editVenue(tempVenue)
      .then((response: AxiosResponse) => {
        statusFooterButttonsModal(false);
        showModal(false);
        dispatch(changeVenueAction(response.data.venue));
        $(`#venue-${tempVenue._id}`).addClass('editing-item');
        swal(response.data.message, {
          icon: 'success'
        });
        setTimeout(() => {
          $(`#venue-${tempVenue._id}`).removeClass('editing-item');
        }, 1000);
      })
      .catch((err: AxiosError) => {
        statusFooterButttonsModal(false);
        $(`#venue-${tempVenue._id}`).removeClass('editing-item');
        dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });
  };
}

export function addVenueAction() {
  return (dispatch: Dispatch<VenueReduxAction>, getState: () => {venues: IVenuesState}) => {
    dispatch(isLoadingAction(true));
    const state = getState();
    const {tempVenue} = state.venues;
    const api: ApiService = new ApiService();
    api.addVenue(tempVenue)
      .then((response: AxiosResponse) => {
        statusFooterButttonsModal(false);
        showModal(false);
        dispatch(getVenuesAction(1) as any);
        swal(response.data.message, {
          icon: 'success'
        });
      })
      .catch((err: AxiosError) => {
        statusFooterButttonsModal(false);

        dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });
  };
}

export type VenueReduxAction = ICancelRequest | IIsLoading | IChangePage | ILoadVenues | IDeleteVenue | IChangeTempVenue | IChangeVenue;
