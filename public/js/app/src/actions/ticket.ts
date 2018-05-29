import {
  AxiosError,
  AxiosResponse
} from 'axios';
import {
  Dispatch
} from 'redux';

import ApiService from '../utils/axios';

export function getTeamsDataAction() {
  // return (dispatch: Dispatch<{}>, getState: () => ITicketsState) => {
  // return (dispatch: Dispatch<any, ITicketState>) => {
  return (dispatch: Dispatch<any>) => {
    const api: ApiService = new ApiService();
    // dispatch(isLoadingAction(true));
    api.getTeams()
      .then((response: AxiosResponse) => {
        // dispatch(getTeamsDataSuccessAction(response.data.data));
        // dispatch(isLoadingAction(false));
      })
      .catch((err: AxiosError) => {
        // dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });
  };
}
