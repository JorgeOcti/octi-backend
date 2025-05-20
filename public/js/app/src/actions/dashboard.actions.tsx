import {
  AxiosError,
  AxiosResponse,
  CancelTokenSource,
  default as Axios
} from 'axios';
import * as moment from 'moment';
import * as React from 'react';
import { Dispatch } from 'redux';
import { ICar } from '../../../../../src/app/interfaces/car.interface';
import { IBrand } from '../../../../../src/app/interfaces/brand.interface';
import {
  IParticipant,
  IParticipantSection
} from '../../../../../src/form/interfaces/participant.interface';
import ImageLazyLoad from '../components/Utils/ImageLazyLoad';
import ApiService from '../utils/axios';
import { loadDataAction } from './modal.actions';
import ShowIf from '../components/Utils/ShowIf';
import { IForm } from '../../../../../src/form/interfaces/form.interface';
import * as swal from 'sweetalert';

export interface IDashboardFilter {
  searchForms: string[];
  searchBrands: string[];
  searchText: string;
  searchFrom: Date;
  searchTo: Date;
}

interface WebQuestion {
  question: string;
  type: string; 
  answer: string;
}

export interface IDashboardState {
  forms: IForm[];
  loading: boolean;
  source: CancelTokenSource | null;
  participants: any[];
  revisionAnswers: Record<string, WebQuestion>;
  filter: IDashboardFilter;
  requests: any[];
  companies: any[];
  car: ICar | null;
  brands: IBrand[];
  carEvents: any;
  participantsReceivedPerDate: any[];
  participantsSentPerDate: any[];
  carsPerDate: any[];
  planningPerDate: any[];
  planningProcessPerDate: any[];
  carsByVenue: any[];
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
    pages: number;
  };
}

export function loadCarsAction(
  participants: IParticipant[],
  count: number,
  pages: number
): ILoadRevisions {
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

interface ILoadRequestsInCar {
  type: '/DASHBOARD/LOAD_REQUESTS_IN_CAR';
  payload: {
    requests: any;
  };
}

export function loadParticipantInCarAction(
  participant: IParticipant
): ILoadParticipantInCar {
  return {
    type: '/DASHBOARD/LOAD_PARTICIPANT_IN_CAR',
    payload: {
      participant
    }
  };
}

export function loadRequestsInCarAction(requests: any): ILoadRequestsInCar {
  return {
    type: '/DASHBOARD/LOAD_REQUESTS_IN_CAR',
    payload: {
      requests
    }
  };
}

interface ILoadBrands {
  type: '/DASHBOARD/LOAD_BRANDS';
  payload: {
    brands: IBrand[];
  };
}

export function loadBrandsAction(brands: IBrand[]): ILoadBrands {
  return {
    type: '/DASHBOARD/LOAD_BRANDS',
    payload: {
      brands: brands
    }
  }
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

interface IUpdateFilterDashboard {
  type: '/DASHBOARD/UPDATE_FILTER';
  payload: {
    filter: IDashboardFilter;
  };
}

export function updateFilterDashboardAction(
  filter: IDashboardFilter
): IUpdateFilterDashboard {
  return {
    type: '/DASHBOARD/UPDATE_FILTER',
    payload: {
      filter: filter
    }
  };
}


interface ILoadingForms {
  type: '/DASHBOARD/LOAD_FORMS';
  payload: {
    forms: IForm[];
  };
}

export function loadForms(forms: IForm[]): ILoadingForms {
  return {
    type: '/DASHBOARD/LOAD_FORMS',
    payload: {
      forms
    }
  };
}

export function changingParticipantAnswer(revisionId: string, answer: string) {
  return (
    dispatch: Dispatch<DashboardReduxAction>
  ) => {
    const api: ApiService = new ApiService();
    dispatch(cancelRequestAction(api.getSource()));
    dispatch(isLoadingAction(true));
    api.addAnswerParticipant(revisionId, answer)
      .then((response: AxiosResponse) => {
        const data = response.data;
        dispatch(addParticipantAnswer(data));
        dispatch(isLoadingAction(false));
        if (data.status === 200) {
          swal!(
            'Respuesta web guardada',
            'La respuesta fue guardada correctamente',
            'success'
          );
        }
      })
      .catch((err: AxiosError) => {
        api.errorHandler(err);
      });
  }
}



interface IUpdateParticipantAnswer {
  type: '/DASHBOARD/UPDATE_PARTICIPANT_ANSWER';
  payload: {
    answers: Record<string, WebQuestion>;
  };
}

export function addParticipantAnswer(
  answer: Record<string, WebQuestion>
): IUpdateParticipantAnswer {
  return {
    type: '/DASHBOARD/UPDATE_PARTICIPANT_ANSWER',
    payload: {
      answers: answer
    }
  };
}


export function changeFilterDashboardAction(filter: IDashboardFilter) {
  return (
    dispatch: Dispatch<DashboardReduxAction>,
    getState: () => { dashboard: IDashboardState }
  ) => {
    dispatch(updateFilterDashboardAction(filter));
    const getRevisions = getRevisionsAction(1, false);
    getRevisions(dispatch, getState);
  }
}

export function getRevisionsThunkAction(
  nextPage: number,
  loading: boolean,
  search?: string,
  from?: string,
  to?: string,
  onlyControls: boolean = true
) {
  return (
    dispatch: Dispatch<DashboardReduxAction>,
    getState: () => { dashboard: IDashboardState }
  ) => {
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

    if (state.dashboard.brands.length === 0) {
      api.getBrands({page: 1, pageSize: 500})
        .then((response: AxiosResponse) => {
          dispatch(loadBrandsAction(response.data.results));
        })
        .catch((err: AxiosError) => {
          api.errorHandler(err);
        });
    }
    const { filter } = state.dashboard;
    Axios.all([
      api.getRevisions({
        onlyControls,
        deliveries: false,
        page,
        search: filter.searchText,
        from: filter.searchFrom,
        to: filter.searchTo,
        forms: filter.searchForms,
        brands: filter.searchBrands
      }),
      api.getUserForms({ deliveries: false })
    ])
      .then(
        Axios.spread((response, forms) => {
          dispatch(
            loadCarsAction(
              response.data.results,
              response.data.count,
              response.data.pages
            )
          );
          dispatch(loadForms(forms.data.results));
          if (loading) {
            dispatch(isLoadingAction(false));
          }
        })
      )
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

export function getRevisionsAction(
  nextPage: number,
  loading: boolean,
  search?: string,
  from?: string,
  to?: string,
  onlyControls: boolean = true
) {
  return (
    dispatch: Dispatch<DashboardReduxAction>,
    getState: () => { dashboard: IDashboardState }
  ) => {
    const api: ApiService = new ApiService();
    const state = getState();
    dispatch(cancelRequestAction(api.getSource()));
    if (!loading) {
      dispatch(isLoadingAction(true));
    }
    const page = nextPage ? nextPage : state.dashboard.pagination.page;
    if (nextPage) {
      dispatch(changePageAction(nextPage));
    }
    const { filter } = state.dashboard;
    api
      .getRevisions({
        onlyControls,
        deliveries: false,
        page,
        search: filter.searchText,
        from: filter.searchFrom,
        to: filter.searchTo,
        forms: filter.searchForms,
        brands: filter.searchBrands
      })
      .then((response: AxiosResponse) => {
        dispatch(
          loadCarsAction(
            response.data.results,
            response.data.count,
            response.data.pages
          )
        );
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

interface ILoadingParticipant {
  type: '/DASHBOARD/LOADING_PARTICIPANT';
  payload: {
    loadingParticipant: string | null;
  };
}

export function loadingParticipantAction(
  loadingParticipant: string | null
): ILoadingParticipant {
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
    api
      .getParticipant(id)
      .then((response: AxiosResponse) => {
        const data = response.data.data;
        dispatch(
          loadDataAction(
           <strong className='text-muted'>{data.name}</strong>,
            <div id="form-detail">
              <table style={{ width: '100%' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '40%' }}>
                      <strong>Fecha</strong>
                    </td>
                    <td className='text-muted'>
                      {moment(data.createdAt).format('LLL')?.toUpperCase()}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ width: '40%' }}>
                      <strong>Supervisor</strong>
                    </td>
                    <td className="text-primary">
                      <strong>
                        {data.user?.firstName?.toUpperCase() ?? ''}{' '}
                        {data.user?.lastName?.toUpperCase() ?? ''}
                      </strong>
                    </td>
                  </tr>

                  {/* <tr>
                <td style={{width: '40%'}}><strong>Calificación</strong></td>
                <td>{Math.round(data.qualification)}%</td>
              </tr> */}
                  {data.receptionText && data.receptionText.length ? (
                    <tr>
                      <td style={{ width: '40%' }}>
                        <strong>Recepcionado</strong>
                      </td>
                      <td>
                        {data.receptionConfirmation ? (
                          <i className="fa fa-check text-success" />
                        ) : (
                          <i className="fa fa-close text-danger" />
                        )}
                      </td>
                    </tr>
                  ) : null}
                  {data.receptionText &&
                  data.receptionText.length &&
                  data.receptionImages.length ? (
                    <tr>
                      <td style={{ width: '40%' }}></td>
                      <td>
                        {
                          <div className="row special-question images">
                            {data.receptionImages.map((image: any) => {
                              return (
                                <div
                                  className="col-md-2 col-sm-2 col-xs-2 text-center"
                                  key={image._id}>
                                  <a
                                    href={image.file.url}
                                    data-toggle="lightbox"
                                    data-gallery={'reception'}>
                                    <ImageLazyLoad
                                      url={image.file.url}
                                      small={true}
                                      height={'50px'}
                                    />
                                  </a>
                                </div>
                              );
                            })}
                          </div>
                        }
                      </td>
                    </tr>
                  ) : null}
                  {data.receiveFrom ? (
                    <tr>
                      <td style={{ width: '40%' }}>
                        <strong>Recepcionado desde</strong>
                      </td>
                      <td>{data.receiveFrom.name}</td>
                    </tr>
                  ) : null}
                  {data.sendTo ? (
                    <tr>
                      <td style={{ width: '40%' }}>
                        <strong>Enviado a</strong>
                      </td>
                      <td>{data.sendTo.name}</td>
                    </tr>
                  ) : null}
                  {data.carrier && data.carrierBy ? (
                    <tr>
                      <td style={{ width: '40%' }}>
                        <strong>Transportista</strong>
                      </td>
                      <td>{data.carrierBy.name.toUpperCase()}</td>
                    </tr>
                  ) : null}

                  {data.shippingText && data.shippingText.length ? (
                    <tr>
                      <td style={{ width: '40%' }}>
                        <strong>Enviado</strong>
                      </td>
                      <td>
                        {data.shipping ? (
                          <i className="fa fa-check text-success" />
                        ) : (
                          <i className="fa fa-close text-danger" />
                        )}
                      </td>
                    </tr>
                  ) : null}
                  {data.shippingText &&
                  data.shippingText.length &&
                  data.shippingImages.length ? (
                    <tr>
                      <td style={{ width: '40%' }}></td>
                      <td>
                        {
                          <div className="row special-question images">
                            {data.shippingImages.map((image: any) => {
                              return (
                                <div
                                  className="col-md-2 col-sm-2 col-xs-2 text-center"
                                  key={image._id}>
                                  <a
                                    href={image.file.url}
                                    data-toggle="lightbox"
                                    data-gallery={'shipping'}>
                                    <ImageLazyLoad
                                      url={image.file.url}
                                      small={true}
                                      height={'50px'}
                                    />
                                  </a>
                                </div>
                              );
                            })}
                          </div>
                        }
                      </td>
                    </tr>
                  ) : null}
                  {data.conciliationText && data.conciliationText.length ? (
                    <tr>
                      <td style={{ width: '40%' }}>
                        <strong>Conciliado</strong>
                      </td>
                      <td>
                        {data.conciliation ? (
                          <i className="fa fa-check text-success" />
                        ) : (
                          <i className="fa fa-close text-danger" />
                        )}
                      </td>
                    </tr>
                  ) : null}
                  {data.conciliationText &&
                  data.conciliationText.length &&
                  data.conciliationImages.length ? (
                    <tr>
                      <td style={{ width: '40%' }}></td>
                      <td>
                        {
                          <div className="row special-question images">
                            {data.conciliationImages.map((image: any) => {
                              return (
                                <div
                                  className="col-md-2 col-sm-2 col-xs-2 text-center"
                                  key={image._id}>
                                  <a
                                    href={image.file.url}
                                    data-toggle="lightbox"
                                    data-gallery={'conciliation'}>
                                    <ImageLazyLoad
                                      url={image.file.url}
                                      small={true}
                                      height={'50px'}
                                    />
                                  </a>
                                </div>
                              );
                            })}
                          </div>
                        }
                      </td>
                    </tr>
                  ) : null}
                  <tr>
                    <td style={{ width: '40%' }}>&nbsp;</td>
                    <td>&nbsp;</td>
                  </tr>
                  {data?.car?.vin ? (
                    <tr>
                      <td style={{ width: '40%' }}>
                        <strong>VIN</strong>
                      </td>
                      <td><strong>{data?.car?.vin.toUpperCase()}</strong></td>
                    </tr>
                  ) : null}
                  {data?.car?.brand ? (
                    <tr>
                      <td style={{ width: '40%' }}>
                        <strong>Marca</strong>
                      </td>
                      <td className='text-primary'><strong>{data?.car?.brand.toUpperCase()}</strong></td>
                    </tr>
                  ) : null}
                  {data?.car?.denomination ? (
                    <tr>
                      <td style={{ width: '40%' }}>
                        <strong>Denominación</strong>
                      </td>
                      <td><strong className='text-muted'>{data?.car?.denomination.toUpperCase()}</strong></td>
                    </tr>
                  ) : null}
                  {data?.car?.color ? (
                    <tr>
                      <td style={{ width: '40%' }}>
                        <strong>Color</strong>
                      </td>
                      <td className='text-muted'>{data?.car?.color.toUpperCase()}</td>
                    </tr>
                  ) : null}
                  {data?.car?.patent ? (
                    <tr>
                      <td style={{ width: '40%' }}>
                        <strong>Identificación</strong>
                      </td>
                      <td className='text-muted'>{data?.car?.patent.toUpperCase()}</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
              {data.sections.map(
                (section: IParticipantSection, index: number) => {
                  return (
                    <div className="section" key={index}>
                      <h4>
                        {section.order} {section.name}{' '}
                        <small>{Math.round(section.qualification)}%</small>
                      </h4>
                      {section.answers.map((answer: any, index: number) => {
                        const selectChoice = answer.scale
                          ? answer.scale.choices.find(
                              (choice: any) => choice._id === answer.answer
                            )
                          : undefined;
                        const kinds: any =
                          answer.damages &&
                          answer.damages.hasOwnProperty('kinds')
                            ? answer.damages.kinds.reduce(
                                (acc: any, cur: any) => {
                                  acc[cur._id] = cur.name;
                                  return acc;
                                },
                                {}
                              )
                            : {};
                        const parts: any =
                          answer.damages &&
                          answer.damages.hasOwnProperty('parts')
                            ? answer.damages.parts.reduce(
                                (acc: any, cur: any) => {
                                  acc[cur._id] = cur.name;
                                  return acc;
                                },
                                {}
                              )
                            : {};
                        const positions: any =
                          answer.damages &&
                          answer.damages.hasOwnProperty('positions')
                            ? answer.damages.positions.reduce(
                                (acc: any, cur: any) => {
                                  acc[cur._id] = cur.name;
                                  const severity: string =
                                    answer.damages &&
                                    answer.requireSeverity &&
                                    answer.damages.hasOwnProperty('severity')
                                      ? answer.damages.severity
                                      : '';
                                  return acc;
                                },
                                {}
                              )
                            : {};
                        // no show conciliation questions if no require
                        if (answer.conciliation && !selectChoice) {
                          return null;
                        }
                        const accesorySeletedIds = answer.accesoriesAnswered
                          ? answer.accesoriesAnswered.map(
                              (accesory: any) => accesory.item
                            )
                          : [];
                        const items = answer.accessories
                          ? answer.accessories.items.filter((item: any) =>
                              accesorySeletedIds.includes(item._id)
                            )
                          : [];
                        return (
                          <div className="question" key={answer._id}>
                            <p>
                              <strong>
                                {section.order}.{index + 1} {answer.question}{' '}
                                {!answer.optional ? (
                                  <span className="red text-bold">*</span>
                                ) : null}
                              </strong>
                              {answer.hint && answer.hint !== '' ? (
                                <small className="text-muted text-sm">
                                  <br />
                                  {answer.hint}
                                </small>
                              ) : null}
                            </p>
                            {answer.scale ? (
                              <div
                                className="flex"
                                style={{ padding: '5px' }}
                                role="group"
                                aria-label="..."
                                key={answer._id}>
                                {answer.scale.choices.map((choice: any) => {
                                  const btnDefault = 'btn-default';
                                  const optionsClass: any = {
                                    blue: 'btn-primary',
                                    green: 'btn-success',
                                    yellow: 'btn-warning',
                                    red: 'btn-danger'
                                  };
                                  const btnClass = optionsClass.hasOwnProperty(
                                    choice.backgroundColor
                                  )
                                    ? optionsClass[choice.backgroundColor]
                                    : btnDefault;
                                  return (
                                    <button
                                      key={choice._id}
                                      type="button"
                                      className={`btn flex-row-item text-wrap ${
                                        choice._id === answer.answer
                                          ? btnClass
                                          : btnDefault
                                      }`}
                                      style={{ margin: '2px' }}
                                      disabled={true}>
                                      {choice.choice}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : null}
                            {
                              // TODO: validate by kind question
                              answer.damagesSelected &&
                              answer.damagesSelected.length ? (
                                <div
                                  className="row"
                                  style={{ marginTop: '10px' }}>
                                  {answer.damagesSelected.map(
                                    (ds: any, index: number) => (
                                      <div
                                        className="col-md-12 damage"
                                        key={index}>
                                        <div className="damage-detail">
                                          <p className="damage-description">
                                            <strong className="title">
                                              {parts.hasOwnProperty(ds.part)
                                                ? parts[ds.part]
                                                : '-'}
                                            </strong>
                                            <br />
                                            <strong>Daño</strong>{' '}
                                            {kinds.hasOwnProperty(ds.kind) ? (
                                              <span className="text-primary">
                                                {kinds[ds.kind]}
                                              </span>
                                            ) : (
                                              '-'
                                            )}{' '}
                                            <strong>Posición</strong>{' '}
                                            {positions.hasOwnProperty(
                                              ds.position
                                            ) ? (
                                              <span className="text-primary">
                                                {positions[ds.position]}
                                              </span>
                                            ) : (
                                              '-'
                                            )}
                                            {answer.damages &&
                                            answer.requireSeverity &&
                                            ds.hasOwnProperty('severity') ? (
                                              <>
                                                {' '}
                                                <strong>Severidad</strong>{' '}
                                                {ds.severity}{' '}
                                              </>
                                            ) : null}
                                          </p>
                                          <ShowIf
                                            condition={!!ds.images.length}
                                            alternative={
                                              <p
                                                style={{ padding: '0 5px' }}
                                                className="text-sm text-muted">
                                                No se reportaron imágenes.
                                              </p>
                                            }>
                                            <div className="row images">
                                              {ds.images.map((image: any) => {
                                                return (
                                                  <div
                                                    className="col-md-3 col-sm-4 col-xs-4 text-center"
                                                    key={image._id}
                                                    data-toggle="tooltip"
                                                    data-placement="bottom"
                                                    title={image.file.name}>
                                                    <a
                                                      href={image.file.url}
                                                      data-toggle="lightbox"
                                                      className="zoom-in"
                                                      data-gallery={ds._id}
                                                      data-title={
                                                        parts.hasOwnProperty(
                                                          ds.part
                                                        )
                                                          ? parts[ds.part]
                                                          : '-'
                                                      }>
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
                                              })}
                                            </div>
                                          </ShowIf>
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              ) : answer.damages &&
                                answer.damages.hasOwnProperty('parts') ? (
                                <p style={{ padding: '5px' }}>
                                  <span className="text-muted">
                                    - No se reportaron daños.
                                  </span>
                                </p>
                              ) : null
                            }
                            {selectChoice &&
                            selectChoice.requireAccesories &&
                            answer.accessories &&
                            answer.accessories.items.length ? (
                              <div
                                className="row"
                                style={{ marginTop: '10px' }}>
                                <div className="col-md-12">
                                  <div style={{ padding: '5px' }}>
                                    <p className="text-muted">
                                      <strong>
                                        {answer.accessories.question}
                                      </strong>
                                    </p>
                                    {items.length
                                      ? items.map((item: any) => {
                                          return (
                                            <p
                                              key={item._id}
                                              className="text-primary"
                                              // className={answer.accesoriesAnswered.includes(item._id) ? 'text-green' : 'text-red'}
                                            >
                                              <strong>
                                                {/*
                                                answer.accesoriesSelected.includes(item._id) ?
                                                  <i className="fa fa-check" style={{marginRight: '5px'}}/> :
                                                  <i className="fa fa-times" style={{marginRight: '5px', width: '14px'}}/>
                                                 */}{' '}
                                                - {item.item}{' '}
                                                {item.amount
                                                  ? `(${
                                                      answer.accesoriesAnswered.find(
                                                        (accesory: any) =>
                                                          accesory.item ===
                                                          item._id
                                                      ).amount
                                                    })`
                                                  : ''}
                                              </strong>
                                            </p>
                                          );
                                        })
                                      : 'No se seleccionaron items.'}
                                  </div>
                                </div>
                              </div>
                            ) : null}
                            {((selectChoice && selectChoice.requireImage) ||
                              answer.kind === 'image') &&
                            answer.images &&
                            answer.images.length ? (
                              <div className="row images">
                                {answer.images.map((image: any) => {
                                  return (
                                    <div
                                      className="col-md-3 col-sm-4 col-xs-4 text-center"
                                      key={image._id}>
                                      <a
                                        href={image.file.url}
                                        className="zoom-in"
                                        data-toggle="lightbox"
                                        data-gallery={answer._id}>
                                        <ImageLazyLoad
                                          url={image.file.url}
                                          height={'100px'}
                                        />
                                      </a>
                                      {/* <p
                                              className={'text-ellipsis'}
                                              data-toggle="tooltip"
                                              data-placement="top"
                                              title={image.file.name}
                                            >
                                              <span className='text-sm text-muted'>{image.file.name}</span>
                                            </p> */}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : null}
                            {(answer.kind === 'text' ||
                              (selectChoice && selectChoice.requireComment)) &&
                            answer.comment &&
                            answer.comment.length ? (
                              <div
                                className="row"
                                style={{ marginTop: '10px' }}>
                                <div className={`col-md-12`}>
                                  <p style={{ padding: '5px' }}>
                                    <span className="text-muted text-sm">
                                      Comentario
                                    </span>
                                    <br />
                                    {answer.comment?.toUpperCase().split('\n').map((str: string) => <p className="text-primary" >{str}</p>)}
                                  </p>
                                </div>
                              </div>
                            ) : null}

                            {answer.kind === 'numeric-scale' &&
                            answer.score != -1 ? (
                              <div
                                className="row"
                                style={{ marginTop: '10px' }}>
                                <div className="col-md-12">
                                  <p style={{ padding: '5px' }}>
                                    <strong>Evaluación</strong>:{' '}
                                    <span className="text-muted">
                                      {answer.score} (Del {answer.minValue} al{' '}
                                      {answer.maxValue})
                                    </span>
                                  </p>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  );
                }
              )}
              <small className="text-muted">
                Las preguntas marcadas con{' '}
                <span className="red text-bold">*</span> son obligatorias.
              </small>
            </div>
          ) as any
        );
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

export function loadParticipantsPerDateAction(
  companies: any[],
  participantsReceivedPerDate: any,
  participantsSentPerDate: any,
  carsPerDate: any,
  planningPerDate: any,
  planningProcessPerDate: any,
  totalCars: number,
  carsByVenue: any,
  participantPerRange: any
): ILoadParticipantsPerDate {
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

export function getParticipantsPerDateAction(
  companies?: string,
  onlyControls: boolean = true
) {
  return (dispatch: Dispatch<DashboardReduxAction>) => {
    const api: ApiService = new ApiService();
    dispatch(cancelRequestAction(api.getSource()));
    dispatch(isLoadingAction(true));
    api
      .getParticipantsPerDate(onlyControls, companies)
      .then((response: AxiosResponse) => {
        dispatch(
          loadParticipantsPerDateAction(
            response.data.companies,
            response.data.participantsReceived,
            response.data.participantsSent,
            response.data.cars,
            response.data.planning,
            response.data.planningProcess,
            response.data.totalCars,
            response.data.carsByVenue,
            response.data.participantPerRange
          )
        );
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
    Axios.all([api.getCar(id), api.getRequestsByCar(id)])
      .then(
        Axios.spread((car, requests) => {
          // dispatch(loadDashboardCleaningAction(dashboard.data));
          document.title = `${car.data.data.vin} - Detalle | OSA Andes`;
          dispatch(loadCarAction(car.data.data));
          dispatch(loadRequestsInCarAction(requests.data));
          dispatch(isLoadingAction(false));
          window.scrollTo(0, 0);
        })
      )
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

export function getVenuesStats(from: number, to: number) {
  return (dispatch: Dispatch<DashboardReduxAction>) => {
    const api: ApiService = new ApiService();
    dispatch(cancelRequestAction(api.getSource()));
    api
      .getVenuesStats(from, to)
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

export function loadRevisionsStats(
  revisionStats: any[]
): ILoadingRevisionsStats {
  return {
    type: '/DASHBOARD/LOAD_REVISION_STATS',
    payload: {
      revisionStats
    }
  };
}

export function getRevisionStats() {
  return (dispatch: Dispatch<DashboardReduxAction>) => {
    const api: ApiService = new ApiService();
    dispatch(cancelRequestAction(api.getSource()));
    dispatch(isLoadingAction(true));
    api
      .getRevisionsStats()
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
  | IIsLoading
  | ICancelRequest
  | ILoadRevisions
  | ILoadBrands
  | ILoadCar
  | ILoadParticipantsPerDate
  | ILoadingParticipant
  | IChangePage
  | ILoadParticipantInCar
  | ILoadRequestsInCar
  | ILoadingVenuesStats
  | ILoadingRevisionsStats
  | ILoadingForms
  | IUpdateFilterDashboard
  | IUpdateParticipantAnswer;
