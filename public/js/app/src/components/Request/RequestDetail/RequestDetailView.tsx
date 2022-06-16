import { AxiosError, AxiosResponse } from 'axios';
import * as moment from 'moment-timezone';
import * as Raven from 'raven-js';
import * as React from 'react';
import { ErrorInfo } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Socket } from 'socket.io-client/build/esm/socket';
import * as swal from 'sweetalert';
import { debounce } from 'throttle-debounce';
import { ICar } from '../../../../../../../src/app/interfaces/car.interface';
import { IRequestItem } from '../../../../../../../src/request/interfaces/requestItem.interface';
import {
  createRequestItemActionInDetail,
  deleteRequestItemActionInDetail,
  deleteRequestThunkAction,
  getRequestThunkAction,
  updateRequestItemActionInDetail
} from '../../../actions/requests.actions';
import { IRequestsState } from '../../../actions/requests.types';
import AppContainer from '../../../container/AppContainer';
import { IWindow } from '../../../interfaces/window';
import ApiService from '../../../utils/axios';
import { disabledTView, goToSection, hasPermission, parseReplicableURL } from '../../../utils/common';
import AutoCompleteInput from '../../Utils/AutoCompleteInput';
import RequestItem from './RequestItem';
import TrackingBasePage from '../../Utils/TrackingBasePage';
import ShowIf from '../../Utils/ShowIf';

interface IPropsType extends RouteComponentProps<{ id: string }> {
  router: any;
  requests: IRequestsState;
  getRequestAction: (id: string) => void;
  createRequestItemActionInDetail: (item: IRequestItem) => void;
  updateRequestItemActionInDetail: (item: IRequestItem) => void;
  deleteRequestItemActionInDetail: (item: IRequestItem) => void;
  deleteRequestThunkAction: (id: string) => void;
}

interface IStateType {
  error: Error | null;
  recommends: ICar[];
  car: Partial<ICar & { reason: string }>;
}

declare let window: IWindow;

class RequestDetailView extends TrackingBasePage<IPropsType, IStateType> {
  title: string;

  readonly api: ApiService;
  readonly state = {
    error: null,
    recommends: [],
    car: {
      brand: '',
      denomination: '',
      material: '',
      color: '',
      reason: ''
    }
  };

  private socket: Socket;

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Detalle Solicitud';
    this.search = debounce(500, this.search.bind(this));
    this.api = new ApiService();
    this.deleteRequest = this.deleteRequest.bind(this);
    this.createItem = this.createItem.bind(this);
  }

  componentDidMount() {
    super.componentDidMount();
    // const { location: { query: item } } = this.props.router;
    // if(item.length > 0) {
    //   goToSection(`#request-item-${item}`);
    // }
  }

  public render(): React.ReactElement<IPropsType> {
    const { request, loading, reasons, requestSettings } = this.props.requests;
    const { recommends, car } = this.state;
    const canChangeRequest = hasPermission(window.user, 'changeRequest') || window.user.isAdmin;
    const vehiclesView = this.props.location.pathname.includes('requests/vehicles');
    return (
      <AppContainer title='' cMenu='3' cSubMenu={vehiclesView ? '3.2' : '3.1'} cAction={'Detalle solicitud'}>
        <section className='content'>
          <div className='box'>
            <div className='box-header with-border'>
              <h3 className='box-title'>Detalle solicitud #{request?.number}</h3>
              {
                hasPermission(window.user, 'deleteRequest') ?
                  <div className='pull-right box-tools'>
                    <button
                      className='btn btn-sm btn-danger'
                      onClick={this.deleteRequest}
                    >
                      <i className='fa fa-fw fa-trash' /> Eliminar solicitud
                    </button>
                  </div>
                  : null
              }
            </div>
            <div className='box-body request-detail no-padding table-responsive'>
              {
                Object.keys(request).length ?
                  <React.Fragment>
                    <div className={'bg-blue'} style={{ padding: '5px', minWidth: '900px' }}>
                      <table className='table table-xs bg-blue' style={{ minWidth: '900px' }}>
                        <tbody>
                        <tr>
                          <td style={{ borderTop: '0' }}>
                            <span style={{ paddingLeft: '17px' }}>Vendedor</span><br />
                            <strong><i className='fa fa-fw fa-user-o' /> {request.createdBy?.firstName} {request.createdBy?.lastName}</strong>
                          </td>
                          {/*<td style={{ borderTop: '0' }}>*/}
                          {/*  <span style={{ paddingLeft: '17px' }}> Vendedor</span><br />*/}
                          {/*  <strong><i className='fa fa-fw fa-handshake' /> {request.sellerText?.length ? request.sellerText : '-'}</strong>*/}
                          {/*</td>*/}
                          <td style={{ borderTop: '0' }}>
                            Canal<br />
                            <strong>{request.channel?.name}</strong>
                          </td>
                          <td style={{ borderTop: '0' }}>
                            ID Cotización<br />
                            <strong>{request.conectaID}</strong>
                          </td>
                          <td style={{ borderTop: '0' }}>
                            <span style={{ paddingLeft: '17px' }}> Destino</span><br />
                            <strong><i className='fa fa-fw fa-building-o' /> {request.destination?.name}</strong>
                          </td>
                          <td style={{ width: '30%', borderTop: '0' }}>
                            Dirección<br />
                            <strong>{request?.deliveryAddress}</strong>
                          </td>
                          <td style={{ borderTop: '0' }}>
                            <span style={{ paddingLeft: '17px' }}> Creada</span><br />
                            <strong><i className='fa fa-fw fa-calendar-o' /> {moment(request.createdAt).format('DD-MM-YYYY')}</strong>
                          </td>
                          <td style={{ borderTop: '0' }}>
                            <span style={{ paddingLeft: '17px' }}> Entrega esperada</span><br />
                            <strong><i
                              className='fa fa-fw fa-calendar-check-o' /> {request.deliveryDate ? moment(request.deliveryDate).format('DD-MM-YYYY') : '-'}
                            </strong>
                          </td>
                        </tr>
                        </tbody>
                      </table>
                    </div>
                    <div style={{ padding: '5px', backgroundColor: '#f9f9f9', minWidth: '900px' }}>
                      <table className='table table-xs text-black' style={{ minWidth: '900px', backgroundColor: '#f9f9f9' }}>
                        <tbody>
                        <tr>
                          <td style={{ borderTop: '0' }}>
                            <span style={{ paddingLeft: '17px' }}>Cliente</span><br />
                            <strong><i className='fa fa-fw fa-address-book-o' /> {request.customerInformation?.name} </strong>
                          </td>
                          <td style={{ borderTop: '0' }}>
                            Rut Cliente<br />
                            <strong>{request.customerInformation?.rut} </strong>
                          </td>
                          <td style={{ borderTop: '0' }}>
                            <span style={{ paddingLeft: '17px' }}>Correo Cliente</span><br />
                            <strong><i className='fa fa-fw fa-envelope-o' /> {
                              request.customerInformation?.email ?
                                <a href={`mailto:${request.customerInformation.email}`}>{request.customerInformation.email}</a> : '-'
                            } </strong>
                          </td>
                          <td style={{ width: '40%', borderTop: '0' }} />
                        </tr>
                        </tbody>
                      </table>
                    </div>
                    <table className='table table-xs table-hover' style={{ minWidth: '900px' }}>
                      <thead>
                      <tr>
                        {/*<ShowIf condition={requestSettings.priority}>*/}
                          <th className='middle' style={{ width: '28px' }} />
                        {/*</ShowIf>*/}
                        <th className='middle-center' style={{ width: '25px' }}>#</th>
                        {/*<th className='middle' style={{ width: '10px' }}>Propiedad</th>*/}
                        <ShowIf
                          condition={
                            !['5bf2de35caf8ef7096105cdd'].includes(window.user.team._id) &&
                            requestSettings.entry
                          }
                        >
                          <th className='middle' style={{ width: '100px' }}>Partida</th>
                        </ShowIf>
                        <ShowIf
                          condition={
                            ['5bf2de35caf8ef7096105cdd'].includes(window.user.team._id) &&
                            requestSettings.material
                          }
                        >
                          <th className='middle' style={{ width: '100px' }}>Material</th>
                        </ShowIf>
                        <th className='middle' style={{ width: '200px' }}>VIN</th>
                        <ShowIf condition={requestSettings.brand}>
                          <th className='middle' style={{ width: '100px' }}>Marca</th>
                        </ShowIf>
                        <ShowIf condition={requestSettings.denomination}>
                          <th className='middle' style={{ maxWidth: '300px' }}>Modelo</th>
                        </ShowIf>
                        <ShowIf condition={requestSettings.color}>
                          <th className='middle'  style={{ maxWidth: '300px' }}>Color</th>
                        </ShowIf>

                        <th className='middle' style={{ minWidth: '100px' }}>Estado</th>
                        <ShowIf condition={requestSettings.ticket}>
                          <th
                            className='middle-center pointer'
                            style={{ minWidth: '40px', maxWidth: '40px' }}
                          >
                            Ticket
                          </th>
                        </ShowIf>
                        <ShowIf
                          condition={
                            ['5bf2de35caf8ef7096105cdd'].includes(window.user.team._id) &&
                            requestSettings.internalNumber
                          }
                        >
                          <th className='middle' style={{ width: '80px' }}>CDO</th>
                        </ShowIf>
                        <ShowIf condition={false && requestSettings.reason}>
                          <th className='middle' style={{ minWidth: '100px' }}>Motivo</th>
                        </ShowIf>
                        <th className='middle-center' style={{ width: '40px' }}></th>
                        <th className='middle' style={{ width: '20px' }}></th>
                        {
                          hasPermission(window.user, 'deleteRequest') ?
                            <th className='middle' style={{ width: '30px' }} />
                            : null
                        }
                      </tr>
                      </thead>
                      <tbody>
                      {
                        request!.items!.map((item, index) => (
                          <RequestItem
                            history={this.props.history}
                            key={item._id}
                            index={index}
                            request={request}
                            item={item}
                          />
                        ))
                      }
                      </tbody>
                    </table>
                    {
                      canChangeRequest && disabledTView ?
                        <div className='row' style={{ minWidth: '900px' }}>
                          <div className='col-md-10 col-md-offset-2' style={{ paddingRight: '5px' }}>
                            <div className='container-table-add-car' style={{ padding: '5px', marginTop: '20px', marginBottom: '20px' }}>
                              <table className='table table-xs'>
                                <thead>
                                <tr>
                                  <ShowIf condition={requestSettings.brand}>
                                    <th>Marca</th>
                                  </ShowIf>
                                  <ShowIf condition={requestSettings.denomination}>
                                    <th>Modelo</th>
                                  </ShowIf>
                                  <ShowIf condition={requestSettings.material}>
                                    <th>Material</th>
                                  </ShowIf>
                                  <ShowIf condition={requestSettings.color}>
                                    <th>Color</th>
                                  </ShowIf>
                                  <ShowIf condition={requestSettings.reason}>
                                    <th style={{ width: '100px' }}>Motivo</th>
                                  </ShowIf>
                                  <th style={{ width: '100px' }} />
                                </tr>
                                </thead>
                                <tbody>
                                <tr>
                                  <ShowIf condition={requestSettings.brand}>
                                    <td>
                                      <AutoCompleteInput
                                        value={car.brand}
                                        inputClass={'input-sm'}
                                        items={recommends}
                                        renderItem={(car, index) => (
                                          <div key={index} className='item'>
                                            {car.denomination} <br />
                                            <strong>{car.brand}</strong>
                                          </div>
                                        )}
                                        onChange={(e) => {
                                          const { value } = e.target;
                                          this.setState({
                                            car: {
                                              ...this.state.car,
                                              brand: value
                                            }
                                          });
                                          this.search(value);
                                        }}
                                        onSelect={(car: any) => {
                                          this.setState({
                                            car: {
                                              ...this.state.car,
                                              brand: car.brand,
                                              denomination: car.denomination,
                                              material: car.material ?? ''
                                            }
                                          });
                                        }}
                                      />
                                    </td>
                                  </ShowIf>
                                  <ShowIf condition={requestSettings.denomination}>
                                    <td>
                                      <AutoCompleteInput
                                        value={car.denomination}
                                        inputClass={'input-sm'}
                                        items={recommends}
                                        renderItem={(car, index) => (
                                          <div key={index} className='item'>
                                            {car.denomination} <br />
                                            <strong>{car.denomination}</strong>
                                          </div>
                                        )}
                                        onChange={(e) => {
                                          const { value } = e.target;
                                          this.setState({
                                            car: {
                                              ...this.state.car,
                                              denomination: value
                                            }
                                          });
                                          this.search(value);
                                        }}
                                        onSelect={(car: any) => {
                                          this.setState({
                                            car: {
                                              ...this.state.car,
                                              brand: car.brand,
                                              denomination: car.denomination,
                                              material: car.material ?? ''
                                            }
                                          });
                                        }}
                                      />
                                    </td>
                                  </ShowIf>
                                  <ShowIf condition={requestSettings.material}>
                                    <td>
                                      <AutoCompleteInput
                                        value={car.material}
                                        inputClass={'input-sm'}
                                        items={recommends}
                                        renderItem={(car, index) => (
                                          <div key={index} className='item'>
                                            {car.denomination} <br />
                                            <strong>{car.brand}</strong>
                                          </div>
                                        )}
                                        onChange={(e) => {
                                          const { value } = e.target;
                                          this.setState({
                                            car: {
                                              ...this.state.car,
                                              material: value
                                            }
                                          });
                                          this.search(value);
                                        }}
                                        onSelect={(car: any) => {
                                          this.setState({
                                            car: {
                                              ...this.state.car,
                                              brand: car.brand,
                                              denomination: car.denomination,
                                              material: car.material ?? ''
                                            }
                                          });
                                        }}
                                      />
                                    </td>
                                  </ShowIf>
                                  <ShowIf condition={requestSettings.color}>
                                    <td>
                                      <input
                                        type='text'
                                        className='form-control input-sm'
                                        value={this.state.car.color}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                          const { value } = e.target;
                                          this.setState({
                                            car: {
                                              ...this.state.car,
                                              color: value
                                            }
                                          });
                                        }}
                                      />
                                    </td>
                                  </ShowIf>
                                  <ShowIf condition={requestSettings.reason}>
                                    <td>
                                      <select
                                        className='form-control select-sm font-12' value={this.state.car.reason}
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                          const { value } = e.target;
                                          this.setState({
                                            car: {
                                              ...this.state.car,
                                              reason: value
                                            }
                                          });
                                        }}
                                      >
                                        <option value='' disabled={true}>-</option>
                                        {
                                          reasons.map((reason) => (
                                            <option key={reason._id} value={reason._id}>{reason.name}</option>
                                          ))
                                        }
                                      </select>
                                    </td>
                                  </ShowIf>
                                  <td className='text-right'>
                                    <button
                                      className='btn btn-sm btn-block btn-success'
                                      onClick={this.createItem}
                                      disabled={!this.state.car.brand || !this.state.car.color || !this.state.car.denomination || !this.state.car.reason}
                                    >
                                      <i className='fa fa-fw fa-plus' />Agregar vehículo
                                    </button>
                                  </td>
                                </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                        : null
                    }
                  </React.Fragment>
                  : null
              }
            </div>
            <div className='box-footer text-right'>
              <button className='btn btn-sm btn-default' onClick={() => {
                this.props.history.push(parseReplicableURL(vehiclesView ? '/requests/vehicles/' : '/requests/'));
              }}>Cancelar
              </button>
            </div>
            {
              !Object.keys(request).length && loading &&
              <div className='overlay'>
                <i className='fa fa-spinner fa-spin text-purple' />
              </div>
            }
          </div>
        </section>
      </AppContainer>
    );
  }

  public componentWillMount(): void {
    const { id } = this.props.match.params;
    window.scrollTo(0, 0);

    this.props.getRequestAction(id);

    this.socket = io(`${location.protocol}//${location.host}`, {
      secure: location.protocol === 'https:',
      transports: ['websocket'],
      reconnection: true,
      query: {
        token: window.user.token
      }
    });

    this.socket.on('connect', () => {
      this.socket.emit('join', { room: `request-detail-${window.user.team._id}` });
    });

    this.socket.on('UPDATE_REQUEST_ITEM', (data: any): void => {
      if (data.idRequest === id) {
        this.props.updateRequestItemActionInDetail(data.item);
        const $item = $(`#request-item-${data.item._id}`);
        if ($item) {
          $item.addClass('bg-aqua-active');
        }
        setTimeout(() => {
          $item.removeClass('bg-aqua-active');
        }, 300);
      }
    });

    this.socket.on('DELETE_REQUEST_ITEM', (data: any): void => {
      if (data.idRequest === id) {
        const $item = $(`#request-item-${data.item._id}`);
        if ($item) {
          $item.addClass('bg-red-active');
        }
        setTimeout(() => {
          this.props.deleteRequestItemActionInDetail(data.item);
        }, 300);
      }
    });

    this.socket.on('DELETE_REQUEST', (data: any): void => {
      if (data.idRequest === id) {
        const vehiclesView = this.props.location.pathname.includes('requests/vehicles');
        this.props.history.push(parseReplicableURL(vehiclesView ? '/requests/vehicles/' : '/requests/'));
      }
    });

    this.socket.on('CREATE_REQUEST_ITEM', (data: any): void => {
      if (data.idRequest === id) {
        this.props.createRequestItemActionInDetail(data.item);
        const $item = $(`#request-item-${data.item._id}`);
        if ($item) {
          $item.addClass('bg-green-active');
        }
        setTimeout(() => {
          $item.removeClass('bg-green-active');
        }, 300);
      }
    });
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error });
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public componentDidUpdate(prevProps: IPropsType): void {
    $('[data-toggle="tooltip"]').tooltip();
  }

  public componentWillUnmount(): void {
    // cancel request if component is inmounted
    if (this.props.requests.source) {
      this.props.requests.source.cancel('Operation canceled by the user.');
    }
    this.socket.disconnect();
  }

  private search(text: string): void {
    this.api
      .searchCar(text)
      .then((response: AxiosResponse): void => {
        this.setState({
          recommends: response.data.cars
        });
      })
      .catch((err: AxiosError): void => {
        this.api.errorHandler(err);
      });
  }

  private createItem() {
    const { id } = this.props.match.params;
    const { car } = this.state;
    this.api
      .createRequestItem(id, car)
      .then((response: AxiosResponse): void => {
        this.setState({
          car: {
            brand: '',
            denomination: '',
            material: '',
            color: '',
            reason: ''
          }
        });
      })
      .catch((err: AxiosError): void => {
        this.api.errorHandler(err);
      });
  }

  private deleteRequest() {
    swal({
      title: '¿Estás seguro?',
      text: `Vas a eliminar esta solicitud.`,
      icon: 'warning',
      dangerMode: true,
      buttons: {
        cancel: 'Cancelar' as any,
        confirm: {
          text: 'Sí'
        }
      }
    }).then((willDelete) => {
      if (willDelete) {
        const { id } = this.props.match.params;
        this.props.deleteRequestThunkAction(id);
      }
    });
  }

}

const mapStateToProps = (state: { requests: IRequestsState, router: any  }) => {
  return {
    requests: state.requests,
    router: state.router
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch,
    createRequestItemActionInDetail: (item: IRequestItem) => dispatch(createRequestItemActionInDetail(item)),
    updateRequestItemActionInDetail: (item: IRequestItem) => dispatch(updateRequestItemActionInDetail(item)),
    deleteRequestItemActionInDetail: (item: IRequestItem) => dispatch(deleteRequestItemActionInDetail(item)),
    deleteRequestThunkAction: (id: string) => dispatch(deleteRequestThunkAction(id)),
    getRequestAction: (id: string) => dispatch(getRequestThunkAction(id))
  };
};


export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(RequestDetailView);
