import * as moment from 'moment-timezone';
import * as Raven from 'raven-js';
import * as React from 'react';
import { ErrorInfo } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';
import * as io from 'socket.io-client';
import * as swal from 'sweetalert';
import { IRequestItem } from '../../../../../../src/interfaces/requestItem.interface';
import { getRequestAction, updateRequestItemActionInDetail, updateRequestItemInDetailReduxAction } from '../../actions/requests.actions';
import { IRequestsState } from '../../actions/requests.types';
import AppContainer from '../../container/AppContainer';
import { IWindow } from '../../interfaces/window';
import DateRangePicker from '../Utils/DateRangePicker';

interface IPropsType extends RouteComponentProps<{ id: string }> {
  requests: IRequestsState;
  getRequestAction(id: string): void;
  updateRequestItemActionInDetail: (item: IRequestItem) => void;
  updateRequestItemInDetailReduxAction: (idRequest: string, item: IRequestItem) => void;
}

interface IStateType {
  error: Error | null;
}

declare let window: IWindow;

class RequestDetailView extends React.Component<IPropsType, IStateType> {

  readonly state = {
    error: null
  };

  private socket: SocketIOClient.Socket;

  constructor(props: IPropsType) {
    super(props);
    this.deleteRequest = this.deleteRequest.bind(this);
  }

  public componentWillMount(): void {
    const { id } = this.props.match.params;
    document.title = 'OSA Andes | Detalle Solicitud';
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
      this.socket.emit('join', {room: `request-detail-${window.user.team}`});
    });
    this.socket.on('UPDATE_ITEM', (data: any): void => {
      if (data.idRequest === id) {
        this.props.updateRequestItemActionInDetail(data.item);
        const $item = $(`#request-item-${data.item._id}`);
        if ($item) {
          $item.addClass('bg-aqua-active');
          setTimeout(() => {
            $item.removeClass('bg-aqua-active');
          }, 300);
        }
      }
    });
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public componentWillUnmount(): void {
    // cancel request if component is inmounted
    // if (this.props.requests.source) {
    //   this.props.requests.source.cancel('Operation canceled by the user.');
    // }
    this.socket.disconnect();
  }

  public render(): React.ReactElement<IPropsType> {
    const {request, loading, requestItemStatus, carriers, reasons} = this.props.requests;
    return (
      <AppContainer title="" cMenu="3" cSubMenu="3.1" cAction={'Detalle solicitud'}>
        <section className="content">
          <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">Detalle solicitud #{this.padNumber(request?.number)}</h3>
              <div className="pull-right box-tools">
                <button
                  className="btn btn-sm btn-danger"
                  onClick={this.deleteRequest}
                >
                  <i className="fa fa-fw fa-trash" /> Eliminar solicitud
                </button>
              </div>
            </div>
            <div className="box-body request-detail no-padding table-responsive">
              {
                Object.keys(request).length ?
                  <React.Fragment>
                    <div className="row summary bg-blue">
                      <div className="col-md-2">
                        <i className="fa fa-fw fa-user" /> {request?.createdBy?.firstName} {request?.createdBy?.lastName}
                      </div>
                      <div className="col-md-2">
                        <i className="fa fa-fw fa-building" /> {request?.destination?.name}
                      </div>
                      <div className="col-md-2 col-md-offset-6 text-right">
                        <i className="fa fa-fw fa-calendar-o" /> {moment(request.createdAt).format('DD-MM-YY')}
                      </div>
                    </div>
                    <table className="table table-xs table-hover">
                      <thead>
                        <tr>
                          <th className="middle-center" style={{width: '25px'}}>#</th>
                          <th className="middle" style={{width: '28px'}}/>
                          <th className="middle">Marca</th>
                          <th className="middle">Modelo</th>
                          <th className="middle">Material</th>
                          <th className="middle">Color</th>
                          <th className="middle">Estado</th>
                          <th className="middle">VIN</th>
                          <th className="middle">CDO</th>
                          <th className="middle" style={{ width: '100px' }}>Motivo</th>
                          <th className="middle">Carrocería</th>
                          <th className="middle">Pre-Entrega</th>
                          <th className="middle">Transporte</th>
                          <th style={{ width: '70px' }}>Fecha carga</th>
                          <th style={{ width: '70px' }}>LLegada llegada</th>
                          <th className="middle" style={{width: '30px'}}/>
                        </tr>
                      </thead>
                      <tbody>
                        {
                          request!.items!.map((item, index) => (
                            <tr key={item._id} id={`request-item-${item._id}`} className={'background-transition'}>
                              <td className="middle-center">{index + 1}</td>
                              <td
                                className="middle-center pointer"
                                onClick={() => {
                                  this.props.updateRequestItemInDetailReduxAction(request._id, {
                                    ...item,
                                    priority: !item.priority
                                  });
                                }}
                              >
                                {item.priority ? <i className="fa fa-star text-yellow" /> : <i className="fa fa-star text-muted" />}
                              </td>
                              <td className="middle">{item.car.brand}</td>
                              <td className="middle">{item.car.denomination}</td>
                              <td className="middle">{item.car.material}ASFG58644</td>
                              {/* <td className="middle">{item.car.color}</td> */}
                              <td className="middle">
                                <input type="text"
                                  className="form-control input-sm"
                                  defaultValue={item.car.color}
                                  style={{width: '80px'}}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    this.props.updateRequestItemInDetailReduxAction(request._id, {
                                      ...item,
                                      car: {
                                        ...item.car,
                                        color: e.target.value
                                      }
                                    });
                                  }}
                                />
                              </td>
                              {/* <td className="middle">{item.status.name}</td> */}
                              <td className="middle">
                                <select className="form-control select-sm font-12" value={item.status?._id ?? ''}
                                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                    this.props.updateRequestItemInDetailReduxAction(request._id, {
                                      ...item,
                                      status: e.target.value
                                    });
                                  }}
                                >
                                  <option value="" disabled={true}>-</option>
                                  {
                                    requestItemStatus.map((req) => (
                                      <option key={req._id} value={req._id}>{req.name}</option>
                                    ))
                                  }

                                </select>
                              </td>
                              {/* <td className="middle">{item.car.vin}12345678901234567</td> */}
                              <td className="middle">
                                <input
                                  type="text"
                                  style={{width: '125px'}}
                                  className="form-control input-sm"
                                  defaultValue="12345678901234567"
                                />
                              </td>
                              <td className="middle">
                                <input type="text"
                                  className="form-control input-sm"
                                  style={{width: '80px'}}
                                  defaultValue={item.car.internalNumber}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    this.props.updateRequestItemInDetailReduxAction(request._id, {
                                      ...item,
                                      car: {
                                        ...item.car,
                                        internalNumber: e.target.value
                                      }
                                    });
                                  }}
                                />
                              </td>
                              {/* <td className="middle">{item.reason?.name}</td> */}
                              <td className="middle">
                                <select
                                  className="form-control select-sm font-12" value={item.reason?._id ?? ''}
                                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                    this.props.updateRequestItemInDetailReduxAction(request._id, {
                                      ...item,
                                      reason: e.target.value as any
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
                              <td className="middle">
                                <div className="flex-wrap">
                                  <div
                                    className={`flex-wrap-item-center ${ undefined ?? 'pointer'} ${item.equipment ? '' : 'text-gray'}`}
                                    onClick={() => {
                                      this.props.updateRequestItemInDetailReduxAction(request._id, {
                                        ...item,
                                        equipment: !item.equipment
                                      });
                                    }}
                                  >
                                    <i className="material-icons font-14">library_add</i>
                                  </div>
                                  <div
                                    className={`flex-wrap-item-center ${ undefined ?? 'pointer'} ${item.body ? '' : 'text-gray'}`}
                                    onClick={() => {
                                      this.props.updateRequestItemInDetailReduxAction(request._id, {
                                        ...item,
                                        body: !item.body
                                      });
                                    }}
                                  >
                                    <i className="material-icons font-14">rv_hookup</i>
                                  </div>
                                </div>
                              </td>
                              <td className="middle">
                                <div className="flex-wrap">
                                  <div
                                    className={`flex-wrap-item-center ${ undefined ?? 'pointer'} ${item.washed ? '' : 'text-gray'}`}
                                    onClick={() => {
                                      this.props.updateRequestItemInDetailReduxAction(request._id, {
                                        ...item,
                                        washed: !item.washed
                                      });
                                    }}
                                  >
                                    <i className="material-icons font-14">local_car_wash</i>
                                  </div>
                                  <div
                                    className={`flex-wrap-item-center ${ undefined ?? 'pointer'} ${item.review ? '' : 'text-gray'}`}
                                    onClick={() => {
                                      this.props.updateRequestItemInDetailReduxAction(request._id, {
                                        ...item,
                                        review: !item.review
                                      });
                                    }}
                                  >
                                    <i className="material-icons font-14">build</i>
                                  </div>
                                </div>
                              </td>
                              {/* <td className="middle">{item.carrier?.name}</td> */}
                              <td className="middle">
                                <select className="form-control select-sm font-12" value={item.carrier?._id ?? ''}
                                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                    this.props.updateRequestItemInDetailReduxAction(request._id, {
                                      ...item,
                                      carrier: !e.target.value.length ? null : e.target.value
                                    });
                                  }}
                                >
                                  <option value="">-</option>
                                  {
                                    carriers.map((carrier) => (
                                      <option key={carrier._id} value={carrier._id}>{carrier.name}</option>
                                    ))
                                  }
                                </select>
                              </td>
                              <td className="middle">
                                <DateRangePicker
                                  className={'input-xs'}
                                  value={item.uploadDate}
                                  onChange={(e) => {
                                    this.props.updateRequestItemInDetailReduxAction(request._id, {
                                      ...item,
                                      uploadDate: e as any
                                    });
                                  }}
                                />
                              </td>
                              <td className="middle">
                                <DateRangePicker
                                  className={'input-xs'}
                                  value={item.estimatedArrival}
                                  onChange={(e) => {
                                    this.props.updateRequestItemInDetailReduxAction(request._id, {
                                      ...item,
                                      estimatedArrival: e as any
                                    });
                                  }}
                                />
                              </td>
                              <td className="middle-center text-red pointer">
                                <i className="fa fa-minus-circle" />
                              </td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                    <div className="row">
                      <div className="col-md-12 text-right">
                        <button className="btn btn-sm btn-success"><i className="fa fa-fw fa-plus" />Agregar vehículo</button>
                      </div>
                    </div>
                    <div className="row">
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
                    </div>
                  </React.Fragment>
                  : null
              }
            </div>
            {
              loading &&
              <div className="overlay">
                <i className="fa fa-spinner fa-spin text-purple"/>
              </div>
            }
          </div>
        </section>
      </AppContainer>
    );
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
        this.props.history.push('/requests/');
      }
    });
  }

  private padNumber(n: number| undefined): string {
    if(n){
      const s = '000' + n;
      return s.substr(s.length-4);
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
    updateRequestItemActionInDetail: (item: IRequestItem) => dispatch(updateRequestItemActionInDetail(item)),
    updateRequestItemInDetailReduxAction: (idRequest: string, item: IRequestItem) => dispatch(updateRequestItemInDetailReduxAction(idRequest, item)),
    getRequestAction: (id: string) => dispatch(getRequestAction(id))
  };
};


export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(RequestDetailView);
