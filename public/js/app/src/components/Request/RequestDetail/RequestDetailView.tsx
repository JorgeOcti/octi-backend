import { AxiosError, AxiosResponse } from 'axios';
import * as moment from 'moment-timezone';
import * as Raven from 'raven-js';
import * as React from 'react';
import { ErrorInfo } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';
import * as io from 'socket.io-client';
import * as swal from 'sweetalert';
import { debounce } from 'throttle-debounce';
import { ICar } from '../../../../../../../src/interfaces/car.interface';
import { IRequestItem } from '../../../../../../../src/interfaces/requestItem.interface';
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
import { hasPermission } from '../../../utils/common';
import AutocompleteInput from '../../Utils/AutocompleteInput';
import RequestItem from './RequestItem';
import TrackingBasePage from '../../Utils/TrackingBasePage';

interface IPropsType extends RouteComponentProps<{ id: string }> {
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
  car: Partial<ICar & {reason: string}>;
}

declare let window: IWindow;

class RequestDetailView extends TrackingBasePage<IPropsType, IStateType> {
  title : string;

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

  private socket: SocketIOClient.Socket;

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
  }

  public componentWillMount(): void {
    const { id } = this.props.match.params;
    window.scrollTo(0, 0);

    this.props.getRequestAction(id);

    this.socket = io.connect(`${location.protocol}//${location.host}`, {
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
        this.props.history.push(vehiclesView ? '/requests/vehicles/' : '/requests/');
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

  public render(): React.ReactElement<IPropsType> {
    const { request, loading, reasons} = this.props.requests;
    const { recommends, car } = this.state;
    const canChangeRequest = hasPermission(window.user, 'changeRequest');
    const vehiclesView = this.props.location.pathname.includes('requests/vehicles');
    return (
      <AppContainer title="" cMenu="3" cSubMenu={vehiclesView ? '3.2' : '3.1'} cAction={'Detalle solicitud'}>
        <section className="content">
          <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">Detalle solicitud #{this.padNumber(request?.number)}</h3>
              {
                hasPermission(window.user, 'deleteRequest') ?
                  <div className="pull-right box-tools">
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={this.deleteRequest}
                    >
                      <i className="fa fa-fw fa-trash" /> Eliminar solicitud
                </button>
                  </div>
                  : null
              }
            </div>
            <div className="box-body request-detail no-padding table-responsive">
              {
                Object.keys(request).length ?
                  <React.Fragment>
                    <div className="row summary bg-blue">
                      <div className="col-md-2">
                        <i className="fa fa-fw fa-user" /> {request.createdBy?.firstName} {request.createdBy?.lastName}
                      </div>
                      <div className="col-md-2">
                        <i className="fa fa-fw fa-handshake-o" /> {request.sellerText?.length ? request.sellerText : '-'}
                      </div>
                      <div className="col-md-2">
                        <i className="fa fa-fw fa-building" /> {request.destination?.name}
                      </div>
                      <div className="col-md-2 col-md-offset-4 text-right">
                        <i className="fa fa-fw fa-calendar-o" /> {moment(request.createdAt).format('DD-MM-YY')}
                      </div>
                    </div>
                    <table className="table table-xs table-hover">
                      <thead>
                        <tr>
                          <th className="middle-center" style={{ width: '25px' }}>#</th>
                          <th className="middle" style={{ width: '28px' }} />
                          <th className="middle" style={{ width: '10px' }}>Propiedad</th>
                          <th className="middle" style={{ width: '100px' }}>Marca</th>
                          <th className="middle" style={{ width: '160px' }}>Modelo</th>
                          <th className="middle" style={{ width: '100px' }}>Material</th>
                          <th className="middle" style={{ width: '100px' }}>Color</th>
                          <th className="middle">Estado</th>
                          <th className="middle" style={{ width: '125px' }}>VIN</th>
                          <th className="middle" style={{ width: '80px' }}>CDO</th>
                          <th className="middle" style={{ width: '100px' }}>Motivo</th>
                          {/* <th className="middle">Carrocería</th>
                          <th className="middle">Pre-Entrega</th> */}
                          <th className="middle">Adj</th>
                          <th className="middle">Obs</th>
                          {/* <th className="middle">Transporte</th>
                          <th style={{ width: '70px' }}>Fecha carga</th>
                          <th style={{ width: '70px' }}>LLegada llegada</th> */}
                          {
                            hasPermission(window.user, 'deleteRequest') ?
                              <th className="middle" style={{ width: '30px' }} />
                              : null
                          }
                        </tr>
                      </thead>
                      <tbody>
                        {
                          request!.items!.map((item, index) => (
                            <RequestItem
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
                      canChangeRequest ?
                        <div className="row" style={{marginBottom: '50px'}}>
                          <div className="col-md-8 col-md-offset-4">
                            <div className="container-table-add-car">
                              <table className="table table-xs">
                                <thead>
                                  <tr>
                                    <th>Marca</th>
                                    <th>Modelo</th>
                                    <th>Material</th>
                                    <th>Color</th>
                                    <th>Motivo</th>
                                    <th></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td>
                                      <AutocompleteInput
                                        value={car.brand}
                                        inputClass={'input-sm'}
                                        items={recommends}
                                        renderItem={(car, index) => (
                                          <div key={index} className="item">
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
                                    <td>
                                      <AutocompleteInput
                                        value={car.denomination}
                                        inputClass={'input-sm'}
                                        items={recommends}
                                        renderItem={(car, index) => (
                                          <div key={index} className="item">
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
                                    <td>
                                      <AutocompleteInput
                                        value={car.material}
                                        inputClass={'input-sm'}
                                        items={recommends}
                                        renderItem={(car, index) => (
                                          <div key={index} className="item">
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
                                    <td>
                                      <input type="text"
                                        className="form-control input-sm"
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
                                    <td>
                                      <select
                                        className="form-control select-sm font-12" value={this.state.car.reason}
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
                                        <option value="" disabled={true}>-</option>
                                        {
                                          reasons.map((reason) => (
                                            <option key={reason._id} value={reason._id}>{reason.name}</option>
                                          ))
                                        }
                                      </select>
                                    </td>
                                    <td className="text-right">
                                      <button
                                        className="btn btn-sm btn-block btn-success"
                                        onClick={this.createItem}
                                        disabled={!this.state.car.brand || !this.state.car.color || !this.state.car.denomination || !this.state.car.reason}
                                      >
                                        <i className="fa fa-fw fa-plus" />Agregar vehículo
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
                    {/* <div className="row">
                      <div className="col-md-12">
                        <div className="activity-comments">
                          <h4>Actividad y comentarios</h4>
                          <div className="comment">
                            <textarea className="form-control" placeholder="Comentar" />
                          </div>
                          <div className="comments">
                            <p className="text-center text-muted">No hay comentarios en esta solicitud</p>
                          </div>
                        </div>
                      </div>
                    </div> */}
                  </React.Fragment>
                  : null
              }
            </div>
            {
              loading &&
              <div className="overlay">
                <i className="fa fa-spinner fa-spin text-purple" />
              </div>
            }
          </div>
        </section>
      </AppContainer>
    );
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

  private padNumber(n: number | undefined): string {
    if (n) {
      const s = '000' + n;
      return s.substr(s.length - 4);
    }
    return '0000';
  }
}


const mapStateToProps = (state: { requests: IRequestsState }) => {
  return {
    requests: state.requests
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
