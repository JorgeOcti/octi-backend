import * as Raven from 'raven-js';
import * as React from 'react';
import { ErrorInfo } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import { Dispatch } from 'redux';
import { FormAction, submit } from 'redux-form';
import * as swal from 'sweetalert';
import { ISalesChannel } from '../../../../../../src/request/interfaces/salesChannel.interface';
import { loadDataAction, ModalReduxAction } from '../../actions/modal.actions';
import { ISalesChannelState, RequestChannelReduxActions } from '../../actions/requestChannel.types';
import {
  createRequestChannelThunkAction,
  deleteRequestChannelItemThunkAction,
  getRequestChannelThunkAction,
  updateRequestChannelThunkAction
} from '../../actions/requestChannel.actions';
import AppContainer from '../../container/AppContainer';
import { IWindow } from '../../interfaces/window';
import { hasPermission, showModal, statusFooterButttonsModal } from '../../utils/common';
import ModalView from '../Modal/ModalView';
import Paginator from '../Utils/Paginator';
import TrackingBasePage from '../Utils/TrackingBasePage';
import ChannelForm from './ChannelForm';
import ShowIf from '../Utils/ShowIf';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<RequestChannelReduxActions | FormAction>;
  requestChannel: ISalesChannelState;

  getRequestChannelThunkAction(nextPage: number, orderBy: string, orderType: string, hideLoading?: boolean): RequestChannelReduxActions;
  createRequestChannelThunkAction(requestChannel: ISalesChannel): RequestChannelReduxActions;
  updateRequestChannelThunkAction(requestChannel: ISalesChannel): RequestChannelReduxActions;
  deleteRequestChannelThunkAction(requestChannel: ISalesChannel): RequestChannelReduxActions;
  loadDataAction(title: string, body: JSX.Element, footer: JSX.Element): ModalReduxAction;
}

interface IStateType {
  error: Error | null;
  exporing: boolean;
}

declare let window: IWindow;

class RequestChannelListView extends TrackingBasePage<IPropsType, IStateType> {
  title: string;

  private socket: SocketIOClient.Socket;
  readonly state = {
    error: null,
    exporing: false
  };

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Listado de Canales';
    this.changePage = this.changePage.bind(this);
    this.createRequestChannel = this.createRequestChannel.bind(this);
    this.processCreateRequestChannel = this.processCreateRequestChannel.bind(this);
    this.updateReaon = this.updateReaon.bind(this);
    this.processUpdateRequestChannel = this.processUpdateRequestChannel.bind(this);
    this.deleteRequestChannel = this.deleteRequestChannel.bind(this);
  }

  public componentWillMount(): void {
    const { pagination } = this.props.requestChannel;
    const { orderBy, orderType } = this.props.requestChannel.options;
    this.props.getRequestChannelThunkAction(pagination.page, orderBy, orderType);

    // socket
    this.socket = io.connect(`${location.protocol}//${location.host}`, {
      secure: location.protocol === 'https:',
      transports: ['websocket'],
      reconnection: true,
      query: { token: (window.user as any).token }
    });
    this.socket.on('connect', () => {
      this.socket.emit('join', { room: `request-status-list-${window.user.team._id}` });
    });
    this.socket.on('REFRESH', (data: any): void => {
      if (data.update) {
        const { pagination } = this.props.requestChannel;
        const { orderBy, orderType } = this.props.requestChannel.options;
        this.props.getRequestChannelThunkAction(pagination.page, orderBy, orderType, true);
      }
    });
  }


  public componentDidUpdate(prevProps: Readonly<IPropsType>, prevState: Readonly<IStateType>, snapshot?: any): void {
    if (this.props.requestChannel.pagination !== prevProps.requestChannel.pagination) {
      window.scrollTo(0, 0);
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error });
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public componentWillUnmount(): void {
    // cancel request if component is inmounted
    if (this.props.requestChannel.source) {
      this.props.requestChannel.source.cancel('Operation canceled by the user.');
    }
    this.socket.disconnect();
  }

  public render(): React.ReactElement<IPropsType> {
    const { loading, channels, pagination } = this.props.requestChannel;
    const canEdit = hasPermission(window.user, 'adminRequest');
    const canDelete = hasPermission(window.user, 'adminRequest');
    return (
      <AppContainer title="" cMenu="3" cSubMenu="3.3" cAction="Canales">
        <section className="content">
          <div className="row">
            <div className="col-md-3">
              <div className="list-group">
                <Link to="/requests/settings/reasons/" className="list-group-item">
                  Motivos
                </Link>
                <Link to="/requests/settings/channels/" className="list-group-item active">
                  Canales
                </Link>
                <Link to="/requests/settings/status/" className="list-group-item ">
                  Estados
                </Link>
                <Link to="/requests/settings/operations-type/" className="list-group-item ">
                  Tipos de operación
                </Link>
                <ShowIf condition={window.user.isAdmin}>
                  <Link to='/transmittals/settings/milestone/' className='list-group-item'>
                    Hitos
                  </Link>
                </ShowIf>
              </div>
            </div>
            <div className="col-md-9">
              <div className="box">
                <div className="box-header with-border">
                  <h3 className="box-title">Estados <small>{pagination.count}</small></h3>
                  <div className="box-tools pull-right">
                    {
                      hasPermission(window.user, 'addVenue') ?
                        <button className="btn btn-sm btn-success"
                          onClick={this.createRequestChannel}
                        ><i className="fa fa-plus" />  Agregar</button>
                        : null
                    }
                  </div>
                </div>
                <div className="box-body table-responsive no-padding">
                  <table className="table table-andes table-striped">
                    <thead>
                      <tr>
                        <th style={{ width: '98%' }} className="middle">Nombre</th>
                        {
                          canEdit ?
                            <th style={{ width: '1%' }} className="width-10" /> : null
                        }
                        {
                          canDelete ?
                            <th style={{ width: '1%' }} className="width-10" /> : null
                        }
                      </tr>
                    </thead>
                    <tbody>
                      {
                        channels.map((item) => {
                          return (
                            <tr key={item._id}>
                              <td className="middle">{item.name}</td>
                              {
                                canEdit ?
                                  <td
                                    className="middle text-blue pointer"
                                    onClick={() => this.updateReaon(item)}
                                  >
                                    <i className="fa fa-pencil" />
                                  </td> : null
                              }
                              {
                                canDelete ?
                                  <td
                                    className={canDelete ? 'middle text-red pointer' : 'middle text-muted not-allowed'}
                                    // className={'middle text-red pointer'}
                                    onClick={canDelete ? () => this.deleteRequestChannel(item) : undefined}
                                  >
                                    <i className="fa fa-minus-circle" />
                                  </td> : null
                              }
                            </tr>
                          );
                        })
                      }
                    </tbody>
                  </table>
                </div>
                {
                  pagination.pages > 1 &&
                  <div className="box-footer text-right">
                    <Paginator changePage={this.changePage} page={pagination.page} pages={pagination.pages} />
                  </div>
                }
                {
                  loading &&
                  <div className="overlay">
                    <i className="fa fa-spinner fa-spin text-purple" />
                  </div>
                }
              </div>
            </div>
          </div>
          <ModalView />
        </section>
      </AppContainer>
    );
  }

  private createRequestChannel(): void {
    this.props.loadDataAction(
      'Agregar Canal',
      <ChannelForm
        initialValues={{ update: false }}
        onSubmit={this.processCreateRequestChannel}
      />,
      <React.Fragment>
        <button type="button" className="btn btn-sm btn-default" data-dismiss="modal">Cancelar</button>
        <button type="button" className="btn btn-sm btn-primary" onClick={() => this.props.dispatch(submit('channelForm'))}>Grabar</button>
      </React.Fragment>
    );
  }

  private processCreateRequestChannel(requestChannel: any): void {
    statusFooterButttonsModal(true);
    this.props.createRequestChannelThunkAction(requestChannel);
    statusFooterButttonsModal(false);
    showModal(false);
  }

  private updateReaon(reason: any): void {
    this.props.loadDataAction(
      'Editar Canal',
      <ChannelForm
        initialValues={{ update: false, ...reason }}
        onSubmit={this.processUpdateRequestChannel}
      />,
      <React.Fragment>
        <button type="button" className="btn btn-sm btn-default" data-dismiss="modal">Cancelar</button>
        <button type="button" className="btn btn-sm btn-primary" onClick={() => this.props.dispatch(submit('channelForm'))}>Editar</button>
      </React.Fragment>
    );
  }

  private processUpdateRequestChannel(requestChannel: any): void {
    statusFooterButttonsModal(true);
    this.props.updateRequestChannelThunkAction(requestChannel);
    statusFooterButttonsModal(false);
    showModal(false);
  }

  private deleteRequestChannel(requestChannel: ISalesChannel): void {
    // ask if you are sure that you are going to delete the user?
    swal({
      title: '¿Estás seguro?',
      text: `Vas a eliminar el canal ${requestChannel.name} `,
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
        this.props.deleteRequestChannelThunkAction(requestChannel);
      }
    });
  }

  private changePage(page: number): void {
    // change the page
    const { orderBy, orderType } = this.props.requestChannel.options;
    this.props.getRequestChannelThunkAction(page, orderBy, orderType);
  }
}

const mapStateToProps = (state: { requestChannel: ISalesChannelState }) => {
  return {
    requestChannel: state.requestChannel
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch,
    getRequestChannelThunkAction: (nextPage: number, orderBy: string, orderType: string, hideLoading?: boolean) => dispatch(getRequestChannelThunkAction(nextPage, orderBy, orderType, hideLoading)),
    createRequestChannelThunkAction: (requestChannel: ISalesChannel) => dispatch(createRequestChannelThunkAction(requestChannel)),
    updateRequestChannelThunkAction: (requestChannel: ISalesChannel) => dispatch(updateRequestChannelThunkAction(requestChannel)),
    deleteRequestChannelThunkAction: (requestChannel: ISalesChannel) => dispatch(deleteRequestChannelItemThunkAction(requestChannel)),
    loadDataAction: (title: string, body: JSX.Element, footer: JSX.Element) => dispatch(loadDataAction(title, body, footer))
  };
};

export default connect<{ requestChannel: ISalesChannelState }, { dispatch: any }, IPropsType>(mapStateToProps, mapDispatchToProps)(RequestChannelListView);
