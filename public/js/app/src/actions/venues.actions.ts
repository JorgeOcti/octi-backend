import {
  CancelTokenSource,
  default as Axios
} from 'axios';
import {
  IVenue
} from '../../../../../src/interfaces/venue.interface';

export interface IVenuesState {
  venues: IVenue[];
  loading: boolean;
  // tempUser: ITempUser;
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

export type VenueReduxAction = ICancelRequest | IIsLoading | IChangePage;
