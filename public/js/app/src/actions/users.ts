import {AxiosError, AxiosResponse} from "axios";
import {Dispatch} from "redux";
import ApiService from "../utils/axios";

export interface IUsersState {
  text: string;
  done: boolean;
  loading: boolean;
}

interface IIsLoading {
  type: 'IS_LOADING';
  loading: boolean;
}

export function isLoadingAction(loading: boolean): IIsLoading {
  return {
    type: 'IS_LOADING',
    loading
  }
}

interface AddTodo {
  type: "ADD_TODO";
  text: string;
}

interface ToggleTodo {
  type: "TOGGLE_TODO";
  index: number;
}

export function getUsersAction() {
  return (dispatch: Dispatch<any, any>) => {
    const api: ApiService = new ApiService();
    dispatch(isLoadingAction(true));
    api.getUsers()
      .then((response: AxiosResponse) => {
        console.log(response);
        // dispatch(getTeamsDataSuccessAction(response.data.data));
        dispatch(isLoadingAction(false));
      })
      .catch((err: AxiosError) => {
        dispatch(isLoadingAction(false));
        api.errorHandler(err);
      });
  };
}


export type ReduxAction = IIsLoading | AddTodo | ToggleTodo;
