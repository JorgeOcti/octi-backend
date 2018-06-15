import * as React from 'react';
import {AxiosError, AxiosResponse, CancelTokenSource, default as Axios} from "axios";
import ApiService from "../utils/axios";
import {Dispatch} from "redux";
import {loadDataAction} from './modal';
import {ICar} from "../../../../../src/interfaces/car.interface";
import {IParticipantSection} from "../../../../../src/interfaces/participant.interface";
import * as moment from "moment";

export interface IDashboardState {
  loading: boolean;
  source: CancelTokenSource | null;
  cars: any[];
  car: ICar | null;
  participantsPerDate: any[];
  loadingParticipant: string | null;
  pagination: {
    count: number;
    page: number;
    pages: number;
  }
}

interface IIsLoading {
  type: '/DASHBOARD/IS_LOADING';
  payload:{
    loading: boolean;
  }
}

export function isLoadingAction(loading: boolean): IIsLoading {
  return {
    type: '/DASHBOARD/IS_LOADING',
    payload: {
      loading
    }
  }
}

interface ICancelRequest {
  type: '/DASHBOARD/CANCEL_REQUEST';
  payload: {
    source: CancelTokenSource;
  }
}

export function cancelRequestAction(source: CancelTokenSource): ICancelRequest {
  return {
    type: '/DASHBOARD/CANCEL_REQUEST',
    payload: {
      source,
    }
  }
}

interface ILoadCars {
  type: '/DASHBOARD/LOAD_CARS';
  payload: {
    cars: ICar[];
    count: number;
    pages: number
  }
}

export function loadCarsAction(cars: ICar[], count:number, pages: number): ILoadCars {
  return {
    type: '/DASHBOARD/LOAD_CARS',
    payload: {
      cars,
      count,
      pages
    }
  }
}

interface ILoadCar {
  type: '/DASHBOARD/LOAD_CAR';
  payload: {
    car: ICar;
  }
}

export function loadCarAction(car: ICar): ILoadCar {
  return {
    type: '/DASHBOARD/LOAD_CAR',
    payload: {
      car
    }
  }
}

interface IChangePage {
  type: '/DASHBOARD/CHANGE_PAGE';
  payload:{
    page: number;
  }
}

export function changePageAction(page: number): IChangePage {
  return {
    type: '/DASHBOARD/CHANGE_PAGE',
    payload: {
      page
    }
  }
}

export function getCarsAction(nextPage?: number, loading: boolean = true) {
  return (dispatch: Dispatch<DashboardReduxAction>, getState: () => {dashboard: IDashboardState}) => {
    const api: ApiService = new ApiService();
    const state = getState();
    dispatch(cancelRequestAction(api.getSource()));
    if (loading) dispatch(isLoadingAction(true));
    const page = nextPage ? nextPage : state.dashboard.pagination.page;
    if (nextPage) {
      dispatch(changePageAction(nextPage));
    }
    api.getCars(page)
      .then((response: AxiosResponse) => {
        dispatch(loadCarsAction(response.data.results, response.data.count, response.data.pages));
        if (loading) dispatch(isLoadingAction(false));
      })
      .catch((err: AxiosError) => {
        // if the request is canceled
        if (Axios.isCancel(err)) {
          if (loading) dispatch(isLoadingAction(true));
        } else {
          if (loading) dispatch(isLoadingAction(false));
          api.errorHandler(err);
        }
      });
  };
}


interface ILoadingParticipant {
  type: '/DASHBOARD/LOADING_PARTICIPANT';
  payload:{
    loadingParticipant: string | null;
  }
}

export function loadingParticipantAction(loadingParticipant: string | null): ILoadingParticipant {
  return {
    type: '/DASHBOARD/LOADING_PARTICIPANT',
    payload: {
      loadingParticipant
    }
  }
}

export function getParticipant(id: string) {
  return (dispatch: Dispatch<DashboardReduxAction>) => {
    const api: ApiService = new ApiService();
    dispatch(cancelRequestAction(api.getSource()));
    dispatch(loadingParticipantAction(id));
    api.getParticipant(id)
      .then((response: AxiosResponse) => {
        console.log(response.data.data);
        dispatch(loadDataAction(
          response.data.data.name,
          <div id="form-detail">
            <table>
              <tbody>
                <tr>
                  <td style={{width:'40%'}}><strong>Supervisor</strong></td>
                  <td>{response.data.data.user ? response.data.data.user.firstName : ''} {response.data.data.user ? response.data.data.user.lastName : ''}</td>
                </tr>
                <tr>
                  <td style={{width:'40%'}}><strong>Fecha</strong></td>
                  <td>{moment(response.data.data.createdAt).format('LLL')}</td>
                </tr>
              <tr>
                  <td style={{width:'40%'}}><strong>Calificación</strong></td>
                  <td>{Math.round(response.data.data.qualification)}%</td>
                </tr>
              </tbody>
            </table>
            {
              response.data.data.sections.map((section: IParticipantSection, index: number) => {
                return (
                  <div className="section" key={index}>
                    <h4>{section.name} <small>{Math.round(section.qualification)}%</small></h4>
                      {
                        section.answers.map((answer) => {
                          return (
                            <div className="question" key={answer._id}>
                              <p><strong>{answer.order} {answer.question}</strong></p>
                              <div className="btn-group btn-group-justified" role="group" aria-label="...">
                                {
                                  answer.scale.choices.map((choice, index) => {
                                    let btnClass = 'btn-default';
                                    if (choice.backgroundColor === 'blue') btnClass = 'btn-primary';
                                    else if (choice.backgroundColor === 'green') btnClass = 'btn-success';
                                    else if (choice.backgroundColor === 'yellow') btnClass = 'btn-warning';
                                    else if (choice.backgroundColor === 'red') btnClass = 'btn-danger';
                                    return (
                                      <div className="btn-group" role="group" key={choice._id}>
                                        <button
                                          type="button"
                                          className={`btn ${choice._id === answer.answer ? btnClass : 'btn-default '}`}
                                          disabled={true}
                                        >{choice.choice}</button>
                                      </div>
                                    )
                                  })
                                }
                              </div>
                            </div>
                          )
                        })
                      }
                  </div>
                )
              })
            }
          </div>
          ) as any);
        dispatch(loadingParticipantAction(null));
      })
      .catch((err: AxiosError) => {
        if (Axios.isCancel(err)) {
          dispatch(loadingParticipantAction(null));
        } else {
          dispatch(loadingParticipantAction(null));
          api.errorHandler(err);
        }
      });
  };
}

interface ILoadParticipantsPerDate {
  type: '/DASHBOARD/LOAD_PARTICIPANTS_PER_DATE';
  payload: {
    participantsPerDate: any;
  }
}

export function loadParticipantsPerDateAction(participantsPerDate: any): ILoadParticipantsPerDate {
  return {
    type: '/DASHBOARD/LOAD_PARTICIPANTS_PER_DATE',
    payload: {
      participantsPerDate
    }
  }
}

export function getParticipantsPerDateAction() {
  return (dispatch: Dispatch<DashboardReduxAction>) => {
    const api: ApiService = new ApiService();
    dispatch(cancelRequestAction(api.getSource()));
    dispatch(isLoadingAction(true));
    api.getParticipantsPerDate()
      .then((response: AxiosResponse) => {
        dispatch(loadParticipantsPerDateAction(response.data.data));
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

export function getCarAction(id: string) {
  return (dispatch: Dispatch<DashboardReduxAction>) => {
    const api: ApiService = new ApiService();
    dispatch(cancelRequestAction(api.getSource()));
    dispatch(isLoadingAction(true));
    api.getCar(id)
      .then((response: AxiosResponse) => {
        document.title = `OSA Andes | Detalle VIN ${response.data.data.vin}`;
        dispatch(loadCarAction(response.data.data));
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

export type DashboardReduxAction = IIsLoading | ICancelRequest | ILoadCars | ILoadCar | ILoadParticipantsPerDate | ILoadingParticipant | IChangePage;
