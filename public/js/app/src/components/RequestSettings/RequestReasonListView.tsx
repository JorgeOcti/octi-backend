import * as Raven from 'raven-js';
import * as React from 'react';
import { ErrorInfo } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import { Dispatch } from 'redux';
import { FormAction, submit } from 'redux-form';
import * as swal from 'sweetalert';
import { IReason } from '../../../../../../src/request/interfaces/reason.interface';
import { loadDataAction, ModalReduxAction } from '../../actions/modal.actions';
import {
  createReasonThunkAction,
  deleteReasonThunkAction,
  getReasonsThunkAction, updateReasonThunkAction
} from '../../actions/reasons.actions';
import { IReasonsState, ReasonsReduxActions } from '../../actions/reasons.types';
import AppContainer from '../../container/AppContainer';
import { IWindow } from '../../interfaces/window';
import { hasPermission, showModal, statusFooterButttonsModal } from '../../utils/common';
import ModalView from '../Modal/ModalView';
import Paginator from '../Utils/Paginator';
import TrackingBasePage from '../Utils/TrackingBasePage';
import ReasonForm from './ReasonForm';
import ShowIf from '../Utils/ShowIf';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<ReasonsReduxActions | FormAction>;
  reasons: IReasonsState;

  getReasonsThunkAction(nextPage: number, orderBy: string, orderType: string, hideLoading?: boolean): ReasonsReduxActions;
  createReasonThunkAction(reason: IReason): ReasonsReduxActions;
  updateReasonThunkAction(reason: IReason): ReasonsReduxActions;
  deleteReasonThunkAction(reason: IReason): ReasonsReduxActions;
  loadDataAction(title: string, body: JSX.Element, footer: JSX.Element): ModalReduxAction;
}

interface IStateType {
  error: Error | null;
  exporing: boolean;
}

declare let window: IWindow;

class RequestReasonListView extends TrackingBasePage<IPropsType, IStateType> {
  title: string;

  private socket: SocketIOClient.Socket;
  readonly state = {
    error: null,
    exporing: false
  };

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Listado de Motivos';
    this.changePage = this.changePage.bind(this);
    this.createReason = this.createReason.bind(this);
    this.processCreateReason = this.processCreateReason.bind(this);
    this.updateReaon = this.updateReaon.bind(this);
    this.processUpdateReason = this.processUpdateReason.bind(this);
    this.deleteReason = this.deleteReason.bind(this);
  }

  public componentWillMount(): void {
    const { pagination } = this.props.reasons;
    const { orderBy, orderType } = this.props.reasons.options;
    this.props.getReasonsThunkAction(pagination.page, orderBy, orderType);

    // socket
    this.socket = io.connect(`${location.protocol}//${location.host}`, {
      secure: location.protocol === 'https:',
      transports: ['websocket'],
      reconnection: true,
      query: { token: (window.user as any).token }
    });
    this.socket.on('connect', () => {
      this.socket.emit('join', { room: `reasons-list-${window.user.team._id}` });
    });
    this.socket.on('REFRESH', (data: any): void => {
      if (data.update) {
        const { pagination } = this.props.reasons;
        const { orderBy, orderType } = this.props.reasons.options;
        this.props.getReasonsThunkAction(pagination.page, orderBy, orderType, true);
      }
    });
  }


  public componentDidUpdate(prevProps: Readonly<IPropsType>, prevState: Readonly<IStateType>, snapshot?: any): void {
    if (this.props.reasons.pagination !== prevProps.reasons.pagination) {
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
    if (this.props.reasons.source) {
      this.props.reasons.source.cancel('Operation canceled by the user.');
    }
    this.socket.disconnect();
  }

  public render(): React.ReactElement<IPropsType> {
    // const { exporing } = this.state;
    const { loading, reasons, pagination } = this.props.reasons;
    const canEdit = hasPermission(window.user, 'adminRequest');
    const canDelete = hasPermission(window.user, 'adminRequest');
    return (
      <AppContainer title="" cMenu="3" cSubMenu="3.3" cAction="Motivos">
        <section className="content">
          <div className="row">
            <div className="col-md-3">
              <div className="list-group">
                <Link to="/requests/settings/reasons/" className="list-group-item active">
                  Motivos
                </Link>
                <Link to="/requests/settings/channels/" className="list-group-item ">
                  Canales
                </Link>
                <Link to="/requests/settings/status/" className="list-group-item ">
                  Estados
                </Link>
                <Link to="/requests/settings/operations-type/" className="list-group-item ">
                  Tipos de operación
                </Link>
                <ShowIf condition={process.env.NODE_ENV === 'development'}>
                  <Link to='/transmittals/settings/milestone/' className='list-group-item'>
                    Hitos
                  </Link>
                </ShowIf>
              </div>
            </div>
            <div className="col-md-9">
              <div className="box">
                <div className="box-header with-border">
                  <h3 className="box-title">Motivos <small>{pagination.count}</small></h3>
                  <div className="box-tools pull-right">
                    {
                      hasPermission(window.user, 'addVenue') ?
                        <button className="btn btn-sm btn-success"
                        onClick={this.createReason}
                        ><i className="fa fa-plus" />  Agregar</button>
                        : null
                    }
                  </div>
                </div>
                <div className="box-body table-responsive no-padding">
                  <table className="table table-andes table-striped">
                    <thead>
                      <tr>
                        <th style={{ width: '50%' }} className="middle">Nombre</th>
                        <th style={{ width: '15%' }} className="middle-center">Archivos</th>
                        <th style={{ width: '15%' }} className="middle-center">Preguntas</th>
                        {/* <th style={{ width: '20%' }} className="middle hidden-xs">Modificado</th> */}
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
                        reasons.map((reason) => {
                          return (
                            <tr key={reason._id}>
                              <td>{reason.name}</td>
                              <td className="middle-center">
                                <i
                                  className={
                                    reason.file.active ?
                                      'fa fa-check-circle text-green' :
                                      'fa fa-times-circle text-red'
                                  }
                                />
                              </td>
                              <td className="middle-center">{reason.questions.length}</td>
                              {
                                canEdit ?
                                  <td
                                    className="middle text-blue pointer"
                                    onClick={() => this.updateReaon(reason)}
                                  >
                                    <i className="fa fa-pencil" />
                                  </td> : null
                              }
                              {
                                canDelete ?
                                  <td
                                    className={canDelete ? 'middle text-red pointer' : 'middle text-muted not-allowed'}
                                    // className={'middle text-red pointer'}
                                    onClick={canDelete ? () => this.deleteReason(reason) : undefined}
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

  private createReason(): void {
    this.props.loadDataAction(
      'Agregar Motivo',
      <ReasonForm
        initialValues={{ update: false }}
        onSubmit={this.processCreateReason}
      />,
      <React.Fragment>
        <button type="button" className="btn btn-sm btn-default" data-dismiss="modal">Cancelar</button>
        <button type="button" className="btn btn-sm btn-primary" onClick={() => this.props.dispatch(submit('reasonForm'))}>Grabar</button>
      </React.Fragment>
    );
  }

  private processCreateReason(reason: IReason): void {
    statusFooterButttonsModal(true);
    this.props.createReasonThunkAction(reason);
    statusFooterButttonsModal(false);
    showModal(false);
  }

  private updateReaon(reason: IReason): void {
    this.props.loadDataAction(
      'Editar Motivo',
      <ReasonForm
        initialValues={{ update: false, ...reason }}
        onSubmit={this.processUpdateReason}
      />,
      <React.Fragment>
        <button type="button" className="btn btn-sm btn-default" data-dismiss="modal">Cancelar</button>
        <button type="button" className="btn btn-sm btn-primary" onClick={() => this.props.dispatch(submit('reasonForm'))}>Editar</button>
      </React.Fragment>
    );
  }

  private processUpdateReason(reason: any): void {
    statusFooterButttonsModal(true);
    this.props.updateReasonThunkAction(reason);
    statusFooterButttonsModal(false);
    showModal(false);
  }

  private deleteReason(reason: IReason): void {
    // ask if you are sure that you are going to delete the user?
    swal({
      title: '¿Estás seguro?',
      text: `Vas a eliminar el motivo ${reason.name} `,
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
        this.props.deleteReasonThunkAction(reason);
      }
    });
  }

  private changePage(page: number): void {
    // change the page
    const { orderBy, orderType } = this.props.reasons.options;
    this.props.getReasonsThunkAction(page, orderBy, orderType);
  }
}

const mapStateToProps = (state: { reasons: IReasonsState }) => {
  return {
    reasons: state.reasons
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch,
    getReasonsThunkAction: (nextPage: number, orderBy: string, orderType: string, hideLoading?: boolean) => dispatch(getReasonsThunkAction(nextPage, orderBy, orderType, hideLoading)),
    createReasonThunkAction: (reason: IReason) => dispatch(createReasonThunkAction(reason)),
    updateReasonThunkAction: (reason: IReason) => dispatch(updateReasonThunkAction(reason)),
    deleteReasonThunkAction: (reason: IReason) => dispatch(deleteReasonThunkAction(reason)),
    loadDataAction: (title: string, body: JSX.Element, footer: JSX.Element) => dispatch(loadDataAction(title, body, footer))
  };
};

export default connect<{ reasons: IReasonsState }, { dispatch: any }, IPropsType>(mapStateToProps, mapDispatchToProps)(RequestReasonListView);
