import * as moment from 'moment-timezone';
import * as Raven from 'raven-js';
import * as React from 'react';
import { ErrorInfo } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';
import * as io from 'socket.io-client';
import * as swal from 'sweetalert';
import { IRequestItem } from '../../../../../../../src/interfaces/requestItem.interface';
import { getRequestThunkAction, updateRequestItemActionInDetail } from '../../../actions/requests.actions';
import { IRequestsState } from '../../../actions/requests.types';
import AppContainer from '../../../container/AppContainer';
import { IWindow } from '../../../interfaces/window';
import RequestItem from './RequestItem';

interface IPropsType extends RouteComponentProps<{ id: string }> {
  requests: IRequestsState;
  getRequestAction(id: string): void;
  updateRequestItemActionInDetail: (item: IRequestItem) => void;
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
    const {request, loading} = this.props.requests;
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
                        <i className="fa fa-fw fa-user" /> {request.createdBy?.firstName} {request.createdBy?.lastName}
                      </div>
                      <div className="col-md-2">
                        <i className="fa fa-fw fa-building" /> {request.destination?.name}
                      </div>
                      <div className="col-md-2 col-md-offset-6 text-right">
                        <i className="fa fa-fw fa-calendar-o" /> {moment(request.createdAt).format('DD-MM-YY')}
                      </div>
                    </div>
                    <table className="table table-xs table-hover">
                      <thead>
                        <tr>
                          <th className="middle-center" style={{ width: '25px' }}>#</th>
                          <th className="middle" style={{ width: '28px' }} />
                          <th className="middle" style={{ width: '100px' }}>Marca</th>
                          <th className="middle" style={{ width: '180px' }}>Modelo</th>
                          <th className="middle" style={{ width: '100px' }}>Material</th>
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
                          <th className="middle" style={{ width: '30px' }} />
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
    getRequestAction: (id: string) => dispatch(getRequestThunkAction(id))
  };
};


export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(RequestDetailView);
