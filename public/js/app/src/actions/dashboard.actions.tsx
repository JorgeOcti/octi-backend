import {AxiosError, AxiosResponse, CancelTokenSource, default as Axios} from 'axios';
import * as moment from 'moment';
import * as React from 'react';
import {Dispatch} from 'redux';
import {ICar} from '../../../../../src/app/interfaces/car.interface';
import {
  IParticipant,
  IParticipantSection
} from '../../../../../src/form/interfaces/participant.interface';
import ImageLazyLoad from '../components/Utils/ImageLazyLoad';
import ApiService from '../utils/axios';
import {loadDataAction} from './modal.actions';
import ShowIf from '../components/Utils/ShowIf';

export interface IDashboardState {
  loading: boolean;
  source: CancelTokenSource | null;
  participants: any[];
  companies: any[];
  car: ICar | null;
  carEvents: any;
  participantsReceivedPerDate: any[];
  participantsSentPerDate: any[];
  carsPerDate: any[];
  planningPerDate: any[];
  planningProcessPerDate: any[];
  carsByVenue: any[];
  searchText: string;
  searchFrom: string,
  searchTo: string,
  participantPerRange: any[];
  loadingParticipant: string | null;
  totalCars: number;
  venueStats: any[] | null;
  revisionStats: any;
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

interface ILoadRevisions {
  type: '/DASHBOARD/LOAD_PARTICIPANTS';
  payload: {
    participants: IParticipant[];
    count: number;
    pages: number
  };
}

export function loadCarsAction(participants: IParticipant[], count: number, pages: number): ILoadRevisions {
  return {
    type: '/DASHBOARD/LOAD_PARTICIPANTS',
    payload: {
      participants,
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

interface IChangeSearchDashboard {
  type: '/DASHBOARD/CHANGE_SEARCH';
  payload: {
    searchText: string;
  };
}

export function changeSearchDashboardAction(searchText: string): IChangeSearchDashboard {
  return {
    type: '/DASHBOARD/CHANGE_SEARCH',
    payload: {
      searchText
    }
  };
}

interface IChangeRangeDashboard {
  type: '/DASHBOARD/CHANGE_RANGE';
  payload: {
    from: string,
    to: string,
  };
}

export function changeRangeDashboardAction(from: string, to: string): IChangeRangeDashboard
{
  return {
    type: '/DASHBOARD/CHANGE_RANGE',
    payload: {
      from,
      to
    }
  }
}

export function getRevisionsAction(nextPage: number, loading: boolean, search?: string, from?: string, to?: string, onlyControls : Boolean = true) {
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
    const { searchText, searchFrom, searchTo } = state.dashboard;
    api.getRevisions(onlyControls, page, searchText, searchFrom, searchTo)
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
            <table style={{width: '100%'}}>
              <tbody>
              <tr>
                <td style={{width: '40%'}}><strong>Supervisor</strong></td>
                <td>{data.user ? data.user.firstName : ''} {data.user ? data.user.lastName : ''}</td>
              </tr>
              <tr>
                <td style={{width: '40%'}}><strong>Fecha</strong></td>
                <td>{moment(data.createdAt).format('LLL')}</td>
              </tr>
              {/* <tr>
                <td style={{width: '40%'}}><strong>Calificación</strong></td>
                <td>{Math.round(data.qualification)}%</td>
              </tr> */}
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
                      <strong>Recepcionado desde</strong>
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
                data.carrier && data.carrierBy ?
                  <tr>
                    <td style={{width: '40%'}}>
                      <strong>Transportista</strong>
                    </td>
                    <td>{data.carrierBy.name}</td>
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
                        section.answers.map((answer: any) => {
                          const selectChoice = answer.scale ? answer.scale.choices.find((choice: any) => choice._id === answer.answer) : undefined;
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
                          // no show conciliation questions if no require
                          if (answer.conciliation && !selectChoice) {
                            return null;
                          }
                          const accesorySeletedIds = answer.accesoriesAnswered ? answer.accesoriesAnswered.map((accesory:any) => accesory.item) : [];
                          const items = answer.accessories ? answer.accessories.items.filter((item:any) => accesorySeletedIds.includes(item._id)) : [];
                          return (
                            <div className="question" key={answer._id}>
                              <p><strong>{answer.order} {answer.question} {!answer.optional ? <span className="red text-bold">*</span> : null }</strong>
                              {answer.hint && answer.hint !== "" ? <small><br/>{answer.hint}</small> : null}</p>
                              {
                                answer.scale ?
                                  <div className="flex" role="group" aria-label="..." key={answer._id}>
                                    {
                                      answer.scale.choices.map((choice: any) => {
                                        const btnDefault = 'btn-default';
                                        const optionsClass: any = {
                                          blue: 'btn-primary',
                                          green: 'btn-success',
                                          yellow: 'btn-warning',
                                          red: 'btn-danger'
                                        };
                                        const btnClass = optionsClass.hasOwnProperty(choice.backgroundColor) ? optionsClass[choice.backgroundColor] : btnDefault;
                                        return (
                                          <button
                                            key={choice._id}
                                            type="button"
                                            className={`btn flex-row-item text-wrap ${choice._id === answer.answer ? btnClass : btnDefault}`}
                                            style={{margin: '2px'}}
                                            disabled={true}
                                          >{choice.choice}</button>
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
                                      answer.damagesSelected.map((ds: any, index: number) => (
                                        <div className="col-md-12 damage" key={index}>
                                          <div className="damage-detail">
                                            <p className="damage-description">
                                              <strong className="title">{parts.hasOwnProperty(ds.part) ? parts[ds.part] : '-'}</strong><br/>
                                              <strong>Daño</strong> {kinds.hasOwnProperty(ds.kind) ? kinds[ds.kind] : '-'}{' '}
                                              <strong>Posición</strong> {positions.hasOwnProperty(ds.position) ? positions[ds.position] : '-'}
                                            </p>
                                            <ShowIf
                                              condition={!!ds.images.length}
                                              alternative={
                                                <p style={{ padding: '0 5px' }} className="text-muted">
                                                  No se reportaron imágenes.
                                                </p>
                                              }
                                            >
                                              <div className='row images'>
                                                {
                                                  ds.images.map((image: any) => {
                                                    return (
                                                      <div
                                                        className='col-md-3 col-sm-4 col-xs-4 text-center'
                                                        key={image._id}
                                                        data-toggle='tooltip'
                                                        data-placement='bottom'
                                                        title={image.file.name}
                                                      >
                                                        <a
                                                          href={image.file.url}
                                                          data-toggle='lightbox'
                                                          className='zoom-in'
                                                          data-gallery={ds._id}
                                                          data-title={parts.hasOwnProperty(ds.part) ? parts[ds.part] : '-'}
                                                        >
                                                          <ImageLazyLoad
                                                            url={image.file.url}
                                                            height={'100px'}
                                                          />
                                                        </a>
                                                        {/*<p*/}
                                                        {/*  className={'text-ellipsis'}*/}
                                                        {/*  data-toggle='tooltip'*/}
                                                        {/*  data-placement='top'*/}
                                                        {/*  title={image.file.name}*/}
                                                        {/*>*/}
                                                        {/*  {image.file.name}*/}
                                                        {/*</p>*/}
                                                      </div>
                                                    );
                                                  })
                                                }
                                              </div>
                                            </ShowIf>
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
                                        items.length ? items.map((item:any) => {
                                          return (
                                            <p key={item._id}
                                              // className={answer.accesoriesAnswered.includes(item._id) ? 'text-green' : 'text-red'}
                                            >
                                              {
                                                /*
                                                answer.accesoriesSelected.includes(item._id) ?
                                                  <i className="fa fa-check" style={{marginRight: '5px'}}/> :
                                                  <i className="fa fa-times" style={{marginRight: '5px', width: '14px'}}/>
                                                 */
                                              } - {item.item} {item.amount ? `(${answer.accesoriesAnswered.find((accesory:any) => accesory.item === item._id).amount})` : ''}
                                            </p>
                                          );
                                        }) : 'No se seleccionaron items.'
                                      }
                                    </div>
                                  </div>
                                  : null
                              }
                              {
                                ((selectChoice && selectChoice.requireImage) || answer.kind === 'image') && answer.images && answer.images.length ?
                                  <div className="row images">
                                    {
                                      answer.images.map((image: any) => {
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
                                (answer.kind === 'text' || selectChoice && selectChoice.requireComment) && answer.comment && answer.comment.length ?
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
            <small>Las preguntas marcadas con <span className="red text-bold">*</span> son obligatorias.</small>
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
    companies: any[];
    participantsReceivedPerDate: any;
    participantsSentPerDate: any;
    carsPerDate: any;
    planningPerDate: any;
    planningProcessPerDate: any;
    carsByVenue: any;
    totalCars: number;
    participantPerRange: any;
  };
}

export function loadParticipantsPerDateAction(companies: any[], participantsReceivedPerDate: any, participantsSentPerDate:any, carsPerDate: any, planningPerDate: any, planningProcessPerDate:any, totalCars: number, carsByVenue: any, participantPerRange: any): ILoadParticipantsPerDate {
  return {
    type: '/DASHBOARD/LOAD_PARTICIPANTS_PER_DATE',
    payload: {
      companies,
      participantsReceivedPerDate,
      participantsSentPerDate,
      carsPerDate,
      planningPerDate,
      planningProcessPerDate,
      carsByVenue,
      totalCars,
      participantPerRange
    }
  };
}

export function getParticipantsPerDateAction(companies?:string, onlyControls: boolean = true) {
  return (dispatch: Dispatch<DashboardReduxAction>) => {
    const api: ApiService = new ApiService();
    dispatch(cancelRequestAction(api.getSource()));
    dispatch(isLoadingAction(true));
    api.getParticipantsPerDate(onlyControls, companies)
      .then((response: AxiosResponse) => {
        dispatch(loadParticipantsPerDateAction(response.data.companies, response.data.participantsReceived, response.data.participantsSent, response.data.cars, response.data.planning, response.data.planningProcess, response.data.totalCars, response.data.carsByVenue, response.data.participantPerRange));
        dispatch(isLoadingAction(false));
      })
      .catch((err: AxiosError) => {
        // if the request is canceled
        if (Axios.isCancel(err)) {
          dispatch(isLoadingAction(true));
        } else {
          dispatch(isLoadingAction(true));
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
          dispatch(isLoadingAction(true));
          api.errorHandler(err);
        }
      });
  };
}

interface ILoadingVenuesStats {
  type: '/DASHBOARD/LOAD_VENUES_STATS';
  payload: {
    venuesStats: any[];
  };
}

export function loadVenuesStats(venuesStats: any[]): ILoadingVenuesStats {
  return {
    type: '/DASHBOARD/LOAD_VENUES_STATS',
    payload: {
      venuesStats
    }
  };
}

export function getVenuesStats(from: number, to: number){
  return (dispatch: Dispatch<DashboardReduxAction>) => {
    const api: ApiService = new ApiService();
    dispatch(cancelRequestAction(api.getSource()));
    api.getVenuesStats(from, to)
      .then((response: AxiosResponse) => {
        dispatch(loadVenuesStats(response.data as any[]));
      })
      .catch((err: AxiosError) => {
        // if the request is canceled
        if (Axios.isCancel(err)) {
        } else {
          api.errorHandler(err);
        }
      });
  };
}

interface ILoadingRevisionsStats {
  type: '/DASHBOARD/LOAD_REVISION_STATS';
  payload: {
    revisionStats: any;
  };
}

export function loadRevisionsStats(revisionStats: any[]): ILoadingRevisionsStats {
  return {
    type: '/DASHBOARD/LOAD_REVISION_STATS',
    payload: {
      revisionStats
    }
  };
}

export function getRevisionStats(){
  return (dispatch: Dispatch<DashboardReduxAction>) => {
    const api: ApiService = new ApiService();
    dispatch(cancelRequestAction(api.getSource()));
    dispatch(isLoadingAction(true));
    api.getRevisionsStats()
      .then((response: AxiosResponse) => {
        dispatch(loadRevisionsStats(response.data));
        dispatch(isLoadingAction(false));
      })
      .catch((err: AxiosError) => {
        // if the request is canceled
        if (Axios.isCancel(err)) {
          dispatch(isLoadingAction(true));
        } else {
          dispatch(isLoadingAction(true));
          api.errorHandler(err);
        }
      });
  };
}

export type DashboardReduxAction =
  IIsLoading |
  ICancelRequest |
  ILoadRevisions |
  IChangeSearchDashboard |
  IChangeRangeDashboard |
  ILoadCar |
  ILoadParticipantsPerDate |
  ILoadingParticipant |
  IChangePage |
  ILoadParticipantInCar |
  ILoadingVenuesStats |
  ILoadingRevisionsStats;
