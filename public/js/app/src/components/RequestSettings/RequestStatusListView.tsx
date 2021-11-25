import * as Raven from 'raven-js';
import * as React from 'react';
import { ErrorInfo } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import { Dispatch } from 'redux';
import { FormAction, submit } from 'redux-form';
import * as swal from 'sweetalert';
import { IRequestStatus } from '../../../../../../src/request/interfaces/requestStatus.interface';
import { loadDataAction, ModalReduxAction } from '../../actions/modal.actions';
import {
  createRequestStatusThunkAction,
  deleteRequestStatusItemThunkAction,
  getRequestStatusThunkAction,
  updateRequestStatusThunkAction
} from '../../actions/requestStatus.actions';
import { IRequestStatusState, RequestStatusReduxActions } from '../../actions/requestStatus.types';
import AppContainer from '../../container/AppContainer';
import { IWindow } from '../../interfaces/window';
import { hasPermission, showModal, statusFooterButttonsModal } from '../../utils/common';
import ModalView from '../Modal/ModalView';
import Paginator from '../Utils/Paginator';
import TrackingBasePage from '../Utils/TrackingBasePage';
import StatusForm from './StatusForm';
import ShowIf from '../Utils/ShowIf';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<RequestStatusReduxActions | FormAction>;
  requestStatus: IRequestStatusState;

  getRequestStatusThunkAction(nextPage: number, orderBy: string, orderType: string, hideLoading?: boolean): RequestStatusReduxActions;
  createRequestStatusThunkAction(requestStatus: IRequestStatus): RequestStatusReduxActions;
  updateRequestStatusThunkAction(requestStatus: IRequestStatus): RequestStatusReduxActions;
  deleteRequestStatusThunkAction(requestStatus: IRequestStatus): RequestStatusReduxActions;
  loadDataAction(title: string, body: JSX.Element, footer: JSX.Element): ModalReduxAction;
}

interface IStateType {
  error: Error | null;
  exporing: boolean;
}

declare let window: IWindow;

class RequestStatusListView extends TrackingBasePage<IPropsType, IStateType> {
  title: string;

  private socket: SocketIOClient.Socket;
  readonly state = {
    error: null,
    exporing: false
  };

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Listado de Status';
    this.changePage = this.changePage.bind(this);
    this.createRequestStatus = this.createRequestStatus.bind(this);
    this.processCreateRequestStatus = this.processCreateRequestStatus.bind(this);
    this.updateReaon = this.updateReaon.bind(this);
    this.processUpdateRequestStatus = this.processUpdateRequestStatus.bind(this);
    this.deleteRequestStatus = this.deleteRequestStatus.bind(this);
  }

  public componentWillMount(): void {
    const { pagination } = this.props.requestStatus;
    const { orderBy, orderType } = this.props.requestStatus.options;
    this.props.getRequestStatusThunkAction(pagination.page, orderBy, orderType);

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
        const { pagination } = this.props.requestStatus;
        const { orderBy, orderType } = this.props.requestStatus.options;
        this.props.getRequestStatusThunkAction(pagination.page, orderBy, orderType, true);
      }
    });
  }


  public componentDidUpdate(prevProps: Readonly<IPropsType>, prevState: Readonly<IStateType>, snapshot?: any): void {
    if (this.props.requestStatus.pagination !== prevProps.requestStatus.pagination) {
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
    if (this.props.requestStatus.source) {
      this.props.requestStatus.source.cancel('Operation canceled by the user.');
    }
    this.socket.disconnect();
  }

  public render(): React.ReactElement<IPropsType> {
    const { loading, status, pagination } = this.props.requestStatus;
    const canEdit = hasPermission(window.user, 'adminRequest');
    const canDelete = hasPermission(window.user, 'adminRequest');
    return (
      <AppContainer title="" cMenu="3" cSubMenu="3.3" cAction="Estados">
        <section className="content">
          <div className="row">
            <div className="col-md-3">
              <div className="list-group">
                <Link to="/requests/settings/reasons/" className="list-group-item">
                  Motivos
                </Link>
                <Link to="/requests/settings/channels/" className="list-group-item">
                  Canales
                </Link>
                <Link to="/requests/settings/status/" className="list-group-item active">
                  Estados
                </Link>
                <Link to="/requests/settings/operations-type/" className="list-group-item ">
                  Tipos de operación
                </Link>
                <ShowIf condition={window.user.isAdmin}>
                  <Link to='/transmittals/settings/milestone-type/' className='list-group-item'>
                    Tipos de hitos
                  </Link>
                </ShowIf>
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
                        onClick={this.createRequestStatus}
                        ><i className="fa fa-plus" />  Agregar</button>
                        : null
                    }
                  </div>
                </div>
                <div className="box-body table-responsive no-padding">
                  <table className="table table-andes table-striped">
                    <thead>
                      <tr>
                        <th style={{ width: '70%' }} className="middle">Nombre</th>
                        <th style={{ width: '10%' }} className="middle">Peso</th>
                        <th style={{ width: '18%' }} className="middle text-center">Default</th>
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
                        status.map((item) => {
                          return (
                            <tr key={item._id}>
                              <td className="middle">{item.name}</td>
                              <td className="middle">{item.weigth}</td>
                              <td className="middle text-center">
                                <i
                                  className={
                                    item.default ?
                                      'fa fa-check-circle text-green':
                                      'fa fa-times-circle text-red'
                                  }
                                />
                              </td>
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
                                !item.default && canDelete ?
                                  <td
                                    className={canDelete ? 'middle text-red pointer' : 'middle text-muted not-allowed'}
                                    // className={'middle text-red pointer'}
                                    onClick={canDelete ? () => this.deleteRequestStatus(item) : undefined}
                                  >
                                    <i className="fa fa-minus-circle"/>
                                  </td> : canDelete ?
                                    <td/> : null
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

  private createRequestStatus(): void {
    this.props.loadDataAction(
      'Agregar Estado',
      <StatusForm
        initialValues={{ update: false }}
        onSubmit={this.processCreateRequestStatus}
      />,
      <React.Fragment>
        <button type="button" className="btn btn-sm btn-default" data-dismiss="modal">Cancelar</button>
        <button type="button" className="btn btn-sm btn-primary" onClick={() => this.props.dispatch(submit('statusForm'))}>Grabar</button>
      </React.Fragment>
    );
  }

  private processCreateRequestStatus(requestStatus: any): void {
    statusFooterButttonsModal(true);
    this.props.createRequestStatusThunkAction(requestStatus);
    statusFooterButttonsModal(false);
    showModal(false);
  }

  private updateReaon(reason: any): void {
    this.props.loadDataAction(
      'Editar Estado',
      <StatusForm
        initialValues={{ update: false, ...reason }}
        onSubmit={this.processUpdateRequestStatus}
      />,
      <React.Fragment>
        <button type="button" className="btn btn-sm btn-default" data-dismiss="modal">Cancelar</button>
        <button type="button" className="btn btn-sm btn-primary" onClick={() => this.props.dispatch(submit('statusForm'))}>Editar</button>
      </React.Fragment>
    );
  }

  private processUpdateRequestStatus(requestStatus: any): void {
    statusFooterButttonsModal(true);
    this.props.updateRequestStatusThunkAction(requestStatus);
    statusFooterButttonsModal(false);
    showModal(false);
  }

  private deleteRequestStatus(requestStatus: IRequestStatus): void {
    // ask if you are sure that you are going to delete the user?
    swal({
      title: '¿Estás seguro?',
      text: `Vas a eliminar el estado: ${requestStatus.name} `,
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
        this.props.deleteRequestStatusThunkAction(requestStatus);
      }
    });
  }

  private changePage(page: number): void {
    // change the page
    const { orderBy, orderType } = this.props.requestStatus.options;
    this.props.getRequestStatusThunkAction(page, orderBy, orderType);
  }
}

const mapStateToProps = (state: { requestStatus: IRequestStatusState }) => {
  return {
    requestStatus: state.requestStatus
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch,
    getRequestStatusThunkAction: (nextPage: number, orderBy: string, orderType: string, hideLoading?: boolean) => dispatch(getRequestStatusThunkAction(nextPage, orderBy, orderType, hideLoading)),
    createRequestStatusThunkAction: (requestStatus: IRequestStatus) => dispatch(createRequestStatusThunkAction(requestStatus)),
    updateRequestStatusThunkAction: (requestStatus: IRequestStatus) => dispatch(updateRequestStatusThunkAction(requestStatus)),
    deleteRequestStatusThunkAction: (requestStatus: IRequestStatus) => dispatch(deleteRequestStatusItemThunkAction(requestStatus)),
    loadDataAction: (title: string, body: JSX.Element, footer: JSX.Element) => dispatch(loadDataAction(title, body, footer))
  };
};

export default connect<{ requestStatus: IRequestStatusState }, { dispatch: any }, IPropsType>(mapStateToProps, mapDispatchToProps)(RequestStatusListView);
