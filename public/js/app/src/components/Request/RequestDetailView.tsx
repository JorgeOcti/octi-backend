import * as moment from 'moment-timezone';
import * as Raven from 'raven-js';
import * as React from 'react';
import { ErrorInfo } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';
import * as io from 'socket.io-client';
import * as swal from 'sweetalert';
import { getRequestAction } from '../../actions/requests.actions';
import { IRequestsState } from '../../actions/requests.types';
import AppContainer from '../../container/AppContainer';
import { IWindow } from '../../interfaces/window';
import DateRangePicker from '../Utils/DateRangePicker';

interface IPropsType extends RouteComponentProps<{ id: string }> {
  requests: IRequestsState;
  getRequestAction(id: string): void;
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

    this.props.getRequestAction(id);
    this.socket = io.connect(`${location.protocol}//${location.host}`, {
      secure: location.protocol === 'https:',
      transports: ['websocket'],
      reconnection: true,
      query: {
        token: window.user.token
      }
    });
    window.scrollTo(0, 0);
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
                    <table className="table table-xs table-striped table-hover">
                      <thead>
                        <tr>
                          <th className="middle" style={{width: '25px'}}/>
                          <th className="middle" style={{width: '28px'}}/>
                          <th className="middle">Marca</th>
                          <th className="middle">Modelo</th>
                          <th className="middle">Material</th>
                          <th className="middle">Color</th>
                          <th className="middle">Estado</th>
                          <th className="middle">VIN</th>
                          <th className="middle">CDO</th>
                          <th className="middle">Motivo</th>
                          <th className="middle">Carrocería</th>
                          <th className="middle">Pre-Entrega</th>
                          <th className="middle">Transporte</th>
                          <th className="middle">Fecha carga</th>
                          <th className="middle">Fecha est. Entr.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {
                          request!.items!.map((item, index) => (
                            <tr key={index}>
                              <td className="middle-center">{index + 1}</td>
                              <td className="middle-center">
                                {item.priority ? <i className="fa fa-star text-yellow" /> : null}
                              </td>
                              <td className="middle">{item.car.brand}</td>
                              <td className="middle">{item.car.denomination}</td>
                              <td className="middle">{item.car.material}ASFG58644</td>
                              {/* <td className="middle">{item.car.color}</td> */}
                              <td className="middle">
                                <input type="text" className="form-control input-sm" defaultValue={item.car.color}/>
                              </td>
                              {/* <td className="middle">{item.status.name}</td> */}
                              <td className="middle">
                                <select className="form-control select-sm font-12" value={item.status?._id ?? ''}
                                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                    // this.props.updateRequestItemReduxAction!(request._id, {
                                    //   ...item,
                                    //   status: e.target.value
                                    // });
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
                                <input type="text" className="form-control input-sm" defaultValue="12345678901234567"/>
                              </td>
                              <td className="middle">
                                <input type="text" className="form-control input-sm" defaultValue={item.car.internalNumber}/>
                              </td>
                              {/* <td className="middle">{item.reason?.name}</td> */}
                              <td className="middle">
                                <select className="form-control select-sm font-12" value={item.reason?._id ?? ''}
                                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                    // this.props.updateRequestItemReduxAction!(request._id, {
                                    //   ...item,
                                    //   reason: e.target.value
                                    // });
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
                              <td className="middle"></td>
                              <td className="middle"></td>
                              {/* <td className="middle">{item.carrier?.name}</td> */}
                              <td className="middle">
                                <select className="form-control select-sm font-12" value={item.carrier?._id ?? ''}
                                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                    // this.props.updateRequestItemReduxAction!(request._id, {
                                    //   ...item,
                                    //   carrier: !e.target.value.length ? null : e.target.value
                                    // });
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
                                  style={{ width: '60px' }}
                                  className={'input-xs'}
                                  value={item.uploadDate}
                                  onChange={(e) => {
                                    // this.props.updateRequestItemReduxAction!(request._id, {
                                    //   ...item,
                                    //   uploadDate: e
                                    // });
                                  }}
                                />
                              </td>
                              <td className="middle">
                                <DateRangePicker
                                  style={{ width: '60px' }}
                                  className={'input-xs'}
                                  value={item.estimatedArrival}
                                  onChange={(e) => {
                                    // this.props.updateRequestItemReduxAction!(request._id, {
                                    //   ...item,
                                    //   estimatedArrival: e
                                    // });
                                  }}
                                />
                              </td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
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
    getRequestAction: (id: string) => dispatch(getRequestAction(id))
  };
};


export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(RequestDetailView);
