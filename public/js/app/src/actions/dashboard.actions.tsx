import {AxiosError, AxiosResponse, CancelTokenSource, default as Axios} from 'axios';
import * as moment from 'moment';
import * as React from 'react';
import {Dispatch} from 'redux';
import {ICar} from '../../../../../src/interfaces/car.interface';
import {
  IParticipant,
  IParticipantSection
} from '../../../../../src/interfaces/participant.interface';
import ImageLazyLoad from '../components/Utils/ImageLazyLoad';
import ApiService from '../utils/axios';
import {loadDataAction} from './modal.actions';

export interface IDashboardState {
  loading: boolean;
  source: CancelTokenSource | null;
  cars: any[];
  car: ICar | null;
  carEvents: any;
  participantsPerDate: any[];
  carsPerDate: any[];
  carsByVenue: any[];
  participantPerRange: any[];
  loadingParticipant: string | null;
  totalCars: number;
  pagination: {
    count: number;
    page: number;
    pages: number;
  };
}

interface IIsLoading {
  type: '/DASHBOARD/IS_LOADING';
  payload: {
    loading: boolean;
  };
}

export function isLoadingAction(loading: boolean): IIsLoading {
  return {
    type: '/DASHBOARD/IS_LOADING',
    payload: {
      loading
    }
  };
}

interface ICancelRequest {
  type: '/DASHBOARD/CANCEL_REQUEST';
  payload: {
    source: CancelTokenSource;
  };
}

export function cancelRequestAction(source: CancelTokenSource): ICancelRequest {
  return {
    type: '/DASHBOARD/CANCEL_REQUEST',
    payload: {
      source
    }
  };
}

interface ILoadCars {
  type: '/DASHBOARD/LOAD_CARS';
  payload: {
    cars: ICar[];
    count: number;
    pages: number
  };
}

export function loadCarsAction(cars: ICar[], count: number, pages: number): ILoadCars {
  return {
    type: '/DASHBOARD/LOAD_CARS',
    payload: {
      cars,
      count,
      pages
    }
  };
}

interface ILoadParticipantInCar {
  type: '/DASHBOARD/LOAD_PARTICIPANT_IN_CAR';
  payload: {
    participant: IParticipant;
  };
}

export function loadParticipantInCarAction(participant: IParticipant): ILoadParticipantInCar {
  return {
    type: '/DASHBOARD/LOAD_PARTICIPANT_IN_CAR',
    payload: {
      participant
    }
  };
}

interface ILoadCar {
  type: '/DASHBOARD/LOAD_CAR';
  payload: {
    car: ICar;
  };
}

export function loadCarAction(car: ICar): ILoadCar {
  return {
    type: '/DASHBOARD/LOAD_CAR',
    payload: {
      car
    }
  };
}

interface IChangePage {
  type: '/DASHBOARD/CHANGE_PAGE';
  payload: {
    page: number;
  };
}

export function changePageAction(page: number): IChangePage {
  return {
    type: '/DASHBOARD/CHANGE_PAGE',
    payload: {
      page
    }
  };
}

export function getCarsAction(nextPage: number, loading: boolean, search?: string) {
  return (dispatch: Dispatch<DashboardReduxAction>, getState: () => {dashboard: IDashboardState}) => {
    const api: ApiService = new ApiService();
    const state = getState();
    dispatch(cancelRequestAction(api.getSource()));
    if (loading) {
      dispatch(isLoadingAction(true));
    }
    const page = nextPage ? nextPage : state.dashboard.pagination.page;
    if (nextPage) {
      dispatch(changePageAction(nextPage));
    }
    api.getCars(page, search)
      .then((response: AxiosResponse) => {
        dispatch(loadCarsAction(response.data.results, response.data.count, response.data.pages));
        if (loading) {
          dispatch(isLoadingAction(false));
        }
      })
      .catch((err: AxiosError) => {
        // if the request is canceled
        if (Axios.isCancel(err)) {
          if (loading) {
            dispatch(isLoadingAction(true));
          }
        } else {
          if (loading) {
            dispatch(isLoadingAction(false));
          }
          api.errorHandler(err);
        }
      });
  };
}

interface ILoadingParticipant {
  type: '/DASHBOARD/LOADING_PARTICIPANT';
  payload: {
    loadingParticipant: string | null;
  };
}

export function loadingParticipantAction(loadingParticipant: string | null): ILoadingParticipant {
  return {
    type: '/DASHBOARD/LOADING_PARTICIPANT',
    payload: {
      loadingParticipant
    }
  };
}

export function getParticipant(id: string) {
  return (dispatch: Dispatch<DashboardReduxAction>) => {
    const api: ApiService = new ApiService();
    dispatch(cancelRequestAction(api.getSource()));
    dispatch(loadingParticipantAction(id));
    api.getParticipant(id)
      .then((response: AxiosResponse) => {
        const data = response.data.data;
        dispatch(loadDataAction(
          data.name,
          <div id="form-detail">
            <table>
              <tbody>
              <tr>
                <td style={{width: '40%'}}><strong>Supervisor</strong></td>
                <td>{data.user ? data.user.firstName : ''} {data.user ? data.user.lastName : ''}</td>
              </tr>
              <tr>
                <td style={{width: '40%'}}><strong>Fecha</strong></td>
                <td>{moment(data.createdAt).format('LLL')}</td>
              </tr>
              <tr>
                <td style={{width: '40%'}}><strong>Calificación</strong></td>
                <td>{Math.round(data.qualification)}%</td>
              </tr>
              {
                data.receptionText && data.receptionText.length ?
                  <tr>
                    <td style={{width: '40%'}}>
                      <strong>Recepcionado</strong>
                    </td>
                    <td>{data.receptionConfirmation ? <i className="fa fa-check text-success" /> : <i className="fa fa-close text-danger" />}</td>
                  </tr> : null
              }
              {
                data.receptionText && data.receptionText.length && data.receptionImages.length ?
                  <tr>
                    <td style={{width: '40%'}}>
                    </td>
                    <td>{
                      <div className="row special-question images">
                        {
                          data.receptionImages.map((image: any) => {
                            return (
                              <div className="col-md-2 col-sm-2 col-xs-2 text-center" key={image._id}>
                                <a href={image.file.url} data-toggle="lightbox" data-gallery={'reception'}>
                                  <ImageLazyLoad
                                    url={image.file.url}
                                    small={true}
                                    height={'50px'}
                                  />
                                </a>
                              </div>
                            );
                          })
                        }
                      </div>
                    }</td>
                  </tr> : null
              }
              {
                data.receiveFrom ?
                  <tr>
                    <td style={{width: '40%'}}>
                      <strong>Recepcionado en</strong>
                    </td>
                    <td>{data.receiveFrom.name}</td>
                  </tr> : null
              }
              {
                data.sendTo ?
                  <tr>
                    <td style={{width: '40%'}}>
                      <strong>Enviado a</strong>
                    </td>
                    <td>{data.sendTo.name}</td>
                  </tr> : null
              }
              {
                data.shippingText && data.shippingText.length ?
                  <tr>
                    <td style={{width: '40%'}}>
                      <strong>Enviado</strong>
                    </td>
                    <td>{data.shipping ? <i className="fa fa-check text-success" /> : <i className="fa fa-close text-danger" />}</td>
                  </tr> : null
              }
              {
                data.shippingText && data.shippingText.length && data.shippingImages.length ?
                  <tr>
                    <td style={{width: '40%'}}>
                    </td>
                    <td>{
                      <div className="row special-question images">
                        {
                          data.shippingImages.map((image: any) => {
                            return (
                              <div className="col-md-2 col-sm-2 col-xs-2 text-center" key={image._id}>
                                <a href={image.file.url} data-toggle="lightbox" data-gallery={'shipping'}>
                                  <ImageLazyLoad
                                    url={image.file.url}
                                    small={true}
                                    height={'50px'}
                                  />
                                </a>
                              </div>
                            );
                          })
                        }
                      </div>
                    }</td>
                  </tr> : null
              }
              {
                data.conciliationText && data.conciliationText.length ?
                  <tr>
                    <td style={{width: '40%'}}>
                      <strong>Conciliado</strong>
                    </td>
                    <td>{data.conciliation ? <i className="fa fa-check text-success" /> : <i className="fa fa-close text-danger" />}</td>
                  </tr> : null
              }
              {
                data.conciliationText && data.conciliationText.length && data.conciliationImages.length ?
                  <tr>
                    <td style={{width: '40%'}}>
                    </td>
                    <td>{
                      <div className="row special-question images">
                        {
                          data.conciliationImages.map((image: any) => {
                            return (
                              <div className="col-md-2 col-sm-2 col-xs-2 text-center" key={image._id}>
                                <a href={image.file.url} data-toggle="lightbox" data-gallery={'conciliation'}>
                                  <ImageLazyLoad
                                    url={image.file.url}
                                    small={true}
                                    height={'50px'}
                                  />
                                </a>
                              </div>
                            );
                          })
                        }
                      </div>
                    }</td>
                  </tr> : null
              }
              </tbody>
            </table>
            {
              data.sections.map((section: IParticipantSection, index: number) => {
                return (
                  <div className="section" key={index}>
                    <h4>{section.name} <small>{Math.round(section.qualification)}%</small></h4>
                      {
                        section.answers.map((answer) => {
                          const selectChoice = answer.scale ? answer.scale.choices.find((choice) => choice._id === answer.answer) : undefined;
                          const kinds: any = answer.damages && answer.damages.hasOwnProperty('kinds') ? answer.damages.kinds.reduce((acc: any, cur: any) => {
                            acc[cur._id] = cur.name;
                            return acc;
                          }, {}) : {};
                          const parts: any = answer.damages && answer.damages.hasOwnProperty('parts') ? answer.damages.parts.reduce((acc: any, cur: any) => {
                            acc[cur._id] = cur.name;
                            return acc;
                          }, {}) : {};
                          const positions: any = answer.damages && answer.damages.hasOwnProperty('positions') ? answer.damages.positions.reduce((acc: any, cur: any) => {
                            acc[cur._id] = cur.name;
                            return acc;
                          }, {}) : {};
                          // const positions =
                          // const parts =
                          // no show conciliation questions if no require
                          if (answer.conciliation && !selectChoice) {
                            return null;
                          }
                          return (
                            <div className="question" key={answer._id}>
                              <p><strong>{answer.order} {answer.question}</strong></p>
                              {
                                answer.scale ?
                                  <div className="btn-group btn-group-justified" role="group" aria-label="...">
                                    {
                                      answer.scale.choices.map((choice) => {
                                        const btnDefault = 'btn-default';
                                        const optionsClass: any = {
                                          blue: 'btn-primary',
                                          green: 'btn-success',
                                          yellow: 'btn-warning',
                                          red: 'btn-danger'
                                        };
                                        const btnClass = optionsClass.hasOwnProperty(choice.backgroundColor) ? optionsClass[choice.backgroundColor] : btnDefault;
                                        return (
                                          <div className="btn-group" role="group" key={choice._id}>
                                            <button
                                              type="button"
                                              className={`btn ${choice._id === answer.answer ? btnClass : btnDefault}`}
                                              disabled={true}
                                            >{choice.choice}</button>
                                          </div>
                                        );
                                      })
                                    }
                                  </div>
                                  : null
                              }
                              {
                                // TODO: validate by kind question
                                answer.damagesSelected && answer.damagesSelected.length ?
                                  <div className="row" style={{marginTop: '10px'}}>
                                    {
                                      answer.damagesSelected.map((ds, index) => (
                                        <div className="col-md-12 damage" key={index}>
                                          <div className="damage-detail">
                                            <p className="damage-description">
                                              <strong className="title">{parts.hasOwnProperty(ds.part) ? parts[ds.part] : '-'}</strong><br/>
                                              <strong>Daño</strong> {kinds.hasOwnProperty(ds.kind) ? kinds[ds.kind] : '-'}{' '}
                                              <strong>Posición</strong> {positions.hasOwnProperty(ds.position) ? positions[ds.position] : '-'}
                                            </p>
                                            <div className="row images">
                                              {
                                                ds.images.map((image) => {
                                                  return (
                                                    <div className="col-md-3 col-sm-4 col-xs-4 text-center" key={image._id}>
                                                      <a
                                                        href={image.file.url}
                                                        data-toggle="lightbox"
                                                        className="zoom-in"
                                                        data-gallery={ds._id}
                                                        data-title={parts.hasOwnProperty(ds.part) ? parts[ds.part] : '-'}
                                                      >
                                                        <ImageLazyLoad
                                                          url={image.file.url}
                                                          height={'100px'}
                                                        />
                                                      </a>
                                                      <p
                                                        className={'text-ellipsis'}
                                                        data-toggle="tooltip"
                                                        data-placement="top"
                                                        title={image.file.name}>
                                                        {image.file.name}
                                                      </p>
                                                    </div>
                                                  );
                                                })
                                              }
                                            </div>
                                          </div>
                                        </div>
                                      ))
                                    }
                                  </div>
                                  : answer.damages && answer.damages.hasOwnProperty('parts') ? 'No se han seleccionado daños.' : null
                              }
                              {
                                selectChoice && selectChoice.requireAccesories && answer.accessories && answer.accessories.items.length ?
                                  <div className="row" style={{marginTop: '10px'}}>
                                    <div className="col-md-12">
                                      <p><strong>{answer.accessories.question}</strong></p>
                                      {
                                        answer.accessories.items.map((item) => {
                                          return (
                                            <p key={item._id}
                                               className={answer.accesoriesSelected.includes(item._id) ? 'text-green' : 'text-red'}
                                            >{answer.accesoriesSelected.includes(item._id) ?
                                              <i className="fa fa-check" style={{marginRight: '5px'}}/> :
                                              <i className="fa fa-times" style={{marginRight: '5px', width: '14px'}}/>} {item.item}
                                            </p>
                                          );
                                        })
                                      }
                                    </div>
                                  </div>
                                  : null
                              }
                              {
                                selectChoice && selectChoice.requireImage && answer.images && answer.images.length ?
                                  <div className="row images">
                                    {
                                      answer.images.map((image) => {
                                        return (
                                          <div className="col-md-3 col-sm-4 col-xs-4 text-center" key={image._id}>
                                            <a
                                              href={image.file.url}
                                              className="zoom-in"
                                              data-toggle="lightbox"
                                              data-gallery={answer._id}
                                            >
                                              <ImageLazyLoad
                                                url={image.file.url}
                                                height={'100px'}
                                              />
                                            </a>
                                            <p
                                              className={'text-ellipsis'}
                                              data-toggle="tooltip"
                                              data-placement="top"
                                              title={image.file.name}
                                            >
                                              {image.file.name}
                                            </p>
                                          </div>
                                        );
                                      })
                                    }
                                  </div>
                                : null
                              }
                              {
                                selectChoice && selectChoice.requireComment && answer.comment && answer.comment.length ?
                                  <div className="row" style={{marginTop: '10px'}}>
                                    <div className="col-md-12">
                                      <p><strong>Comentario</strong>: <span className="text-muted">{answer.comment}</span></p>
                                    </div>
                                  </div>
                                : null
                              }
                            </div>
                          );
                        })
                      }
                  </div>
                );
              })
            }
          </div>
          ) as any);
        dispatch(loadingParticipantAction(null));
        ($('[data-toggle="tooltip"]') as any).tooltip();
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
    carsPerDate: any;
    carsByVenue: any;
    totalCars: number;
    participantPerRange: any;
  };
}

export function loadParticipantsPerDateAction(participantsPerDate: any, carsPerDate: any, totalCars: number, carsByVenue: any, participantPerRange: any): ILoadParticipantsPerDate {
  return {
    type: '/DASHBOARD/LOAD_PARTICIPANTS_PER_DATE',
    payload: {
      participantsPerDate,
      carsPerDate,
      carsByVenue,
      totalCars,
      participantPerRange
    }
  };
}

export function getParticipantsPerDateAction() {
  return (dispatch: Dispatch<DashboardReduxAction>) => {
    const api: ApiService = new ApiService();
    dispatch(cancelRequestAction(api.getSource()));
    dispatch(isLoadingAction(true));
    api.getParticipantsPerDate()
      .then((response: AxiosResponse) => {
        dispatch(loadParticipantsPerDateAction(response.data.participants, response.data.cars, response.data.totalCars, response.data.carsByVenue, response.data.participantPerRange));
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

export type DashboardReduxAction = IIsLoading | ICancelRequest | ILoadCars | ILoadCar | ILoadParticipantsPerDate | ILoadingParticipant | IChangePage | ILoadParticipantInCar;
