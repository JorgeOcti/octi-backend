import * as Raven from 'raven-js';
import * as React from 'react';
import { ErrorInfo } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import { Dispatch } from 'redux';
import { FormAction, submit } from 'redux-form';
import * as swal from 'sweetalert';
import { IMilestoneType } from '../../../../../../src/distribution/interfaces/milestoneType.interface';
import { loadDataAction, ModalReduxAction } from '../../actions/modal.actions';
import { IMilestoneTypeState, MilestoneTypeReduxActions } from '../../actions/milestoneType.types';
import {
  createMilestoneTypeThunkAction,
  deleteMilestoneTypeItemThunkAction,
  getMilestoneTypesThunkAction,
  updateMilestoneTypeThunkAction
} from '../../actions/milestoneType.actions';
import AppContainer from '../../container/AppContainer';
import { IWindow } from '../../interfaces/window';
import { hasPermission, showModal, statusFooterButttonsModal } from '../../utils/common';
import ModalView from '../Modal/ModalView';
import Paginator from '../Utils/Paginator';
import TrackingBasePage from '../Utils/TrackingBasePage';
import MilestoneTypeForm from './MilestoneTypeForm';
import ShowIf from '../Utils/ShowIf';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<MilestoneTypeReduxActions | FormAction>;
  milestoneType: IMilestoneTypeState;

  getMilestoneTypeThunkAction(nextPage: number, orderBy: string, orderType: string, hideLoading?: boolean): MilestoneTypeReduxActions;

  createMilestoneTypeThunkAction(milestoneType: IMilestoneType): MilestoneTypeReduxActions;

  updateMilestoneTypeThunkAction(milestoneType: IMilestoneType): MilestoneTypeReduxActions;

  deleteMilestoneTypeThunkAction(milestoneType: IMilestoneType): MilestoneTypeReduxActions;

  loadDataAction(title: string, body: JSX.Element, footer: JSX.Element): ModalReduxAction;
}

interface IStateType {
  error: Error | null;
  exporing: boolean;
}

declare let window: IWindow;

class MilestoneTypeListView extends TrackingBasePage<IPropsType, IStateType> {
  title: string;

  private socket: SocketIOClient.Socket;
  readonly state = {
    error: null,
    exporing: false
  };

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Listado Tipo de Hitos';
    this.changePage = this.changePage.bind(this);
    this.createMilestoneType = this.createMilestoneType.bind(this);
    this.processCreateMilestoneType = this.processCreateMilestoneType.bind(this);
    this.updateReaon = this.updateReaon.bind(this);
    this.processUpdateMilestoneType = this.processUpdateMilestoneType.bind(this);
    this.deleteMilestoneType = this.deleteMilestoneType.bind(this);
  }

  public componentWillMount(): void {
    const { pagination } = this.props.milestoneType;
    const { orderBy, orderType } = this.props.milestoneType.options;
    this.props.getMilestoneTypeThunkAction(pagination.page, orderBy, orderType);

    // socket
    this.socket = io.connect(`${location.protocol}//${location.host}`, {
      secure: location.protocol === 'https:',
      transports: ['websocket'],
      reconnection: true,
      query: { token: (window.user as any).token }
    });
    this.socket.on('connect', () => {
      this.socket.emit('join', { room: `milestone-type-list-${window.user.team._id}` });
    });
    this.socket.on('REFRESH', (data: any): void => {
      if (data.update) {
        const { pagination } = this.props.milestoneType;
        const { orderBy, orderType } = this.props.milestoneType.options;
        this.props.getMilestoneTypeThunkAction(pagination.page, orderBy, orderType, true);
      }
    });
  }


  public componentDidUpdate(prevProps: Readonly<IPropsType>, prevState: Readonly<IStateType>, snapshot?: any): void {
    if (this.props.milestoneType.pagination !== prevProps.milestoneType.pagination) {
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
    if (this.props.milestoneType.source) {
      this.props.milestoneType.source.cancel('Milestone canceled by the user.');
    }
    this.socket.disconnect();
  }

  public render(): React.ReactElement<IPropsType> {
    const { loading, milestoneTypes, pagination } = this.props.milestoneType;
    const canEdit = hasPermission(window.user, 'adminRequest');
    const canDelete = hasPermission(window.user, 'adminRequest');
    return (
      <AppContainer title='' cMenu='3' cSubMenu='3.3' cAction='Tipos de Hitos'>
        <section className='content'>
          <div className='row'>
            <div className='col-md-3'>
              <div className='list-group'>
                <Link to='/requests/settings/reasons/' className='list-group-item'>
                  Motivos
                </Link>
                <Link to='/requests/settings/channels/' className='list-group-item'>
                  Canales
                </Link>
                <Link to='/requests/settings/status/' className='list-group-item'>
                  Estados
                </Link>
                <Link to='/requests/settings/operations-type/' className='list-group-item'>
                  Tipos de operación
                </Link>
                <Link to="/requests/settings/payment-methods/" className="list-group-item">
                  Métodos de pago
                </Link>
                <ShowIf condition={window.user.isAdmin}>
                  <Link to='/transmittals/settings/milestone-type/' className='list-group-item active'>
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
            <div className='col-md-9'>
              <div className='box'>
                <div className='box-header with-border'>
                  <h3 className='box-title'>Tipos de Hitos <small>{pagination.count}</small></h3>
                  <div className='box-tools pull-right'>
                    {
                      hasPermission(window.user, 'addVenue') ?
                        <button className='btn btn-sm btn-success'
                                onClick={this.createMilestoneType}
                        ><i className='fa fa-plus' /> Agregar</button>
                        : null
                    }
                  </div>
                </div>
                <div className='box-body table-responsive no-padding'>
                  <table className='table table-andes table-striped'>
                    <thead>
                    <tr>
                      <th style={{ width: '98%' }} className='middle'>Nombre</th>
                      {
                        canEdit ?
                          <th style={{ width: '1%' }} className='width-10' /> : null
                      }
                      {
                        canDelete ?
                          <th style={{ width: '1%' }} className='width-10' /> : null
                      }
                    </tr>
                    </thead>
                    <tbody>
                    {
                      milestoneTypes.map((item) => {
                        return (
                          <tr key={item._id}>
                            <td className='middle'>{item.name}</td>
                            {
                              canEdit ?
                                <td
                                  className='middle text-blue pointer'
                                  onClick={() => this.updateReaon(item)}
                                >
                                  <i className='fa fa-pencil' />
                                </td> : null
                            }
                            {
                              canDelete ?
                                <td
                                  className={canDelete ? 'middle text-red pointer' : 'middle text-muted not-allowed'}
                                  // className={'middle text-red pointer'}
                                  onClick={canDelete ? () => this.deleteMilestoneType(item) : undefined}
                                >
                                  <i className='fa fa-minus-circle' />
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
                  <div className='box-footer text-right'>
                    <Paginator changePage={this.changePage} page={pagination.page} pages={pagination.pages} />
                  </div>
                }
                {
                  loading &&
                  <div className='overlay'>
                    <i className='fa fa-spinner fa-spin text-purple' />
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

  private createMilestoneType(): void {
    this.props.loadDataAction(
      'Agregar tipo de Hitos',
      <MilestoneTypeForm
        initialValues={{ update: false }}
        onSubmit={this.processCreateMilestoneType}
      />,
      <React.Fragment>
        <button type='button' className='btn btn-sm btn-default' data-dismiss='modal'>Cancelar</button>
        <button type='button' className='btn btn-sm btn-primary' onClick={() => this.props.dispatch(submit('milestoneTypeForm'))}>Grabar</button>
      </React.Fragment>
    );
  }

  private processCreateMilestoneType(milestoneType: any): void {
    statusFooterButttonsModal(true);
    this.props.createMilestoneTypeThunkAction(milestoneType);
    statusFooterButttonsModal(false);
    showModal(false);
  }

  private updateReaon(reason: any): void {
    this.props.loadDataAction(
      'Editar tipo de Hitos',
      <MilestoneTypeForm
        initialValues={{ update: false, ...reason }}
        onSubmit={this.processUpdateMilestoneType}
      />,
      <React.Fragment>
        <button type='button' className='btn btn-sm btn-default' data-dismiss='modal'>Cancelar</button>
        <button type='button' className='btn btn-sm btn-primary' onClick={() => this.props.dispatch(submit('milestoneTypeForm'))}>Editar</button>
      </React.Fragment>
    );
  }

  private processUpdateMilestoneType(milestoneType: any): void {
    statusFooterButttonsModal(true);
    this.props.updateMilestoneTypeThunkAction(milestoneType);
    statusFooterButttonsModal(false);
    showModal(false);
  }

  private deleteMilestoneType(milestoneType: IMilestoneType): void {
    // ask if you are sure that you are going to delete the user?
    swal({
      title: '¿Estás seguro?',
      text: `Vas a eliminar el tipo de hito: ${milestoneType.name} `,
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
        this.props.deleteMilestoneTypeThunkAction(milestoneType);
      }
    });
  }

  private changePage(page: number): void {
    // change the page
    const { orderBy, orderType } = this.props.milestoneType.options;
    this.props.getMilestoneTypeThunkAction(page, orderBy, orderType);
  }
}

const mapStateToProps = (state: { milestoneType: IMilestoneTypeState }) => {
  return {
    milestoneType: state.milestoneType
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch,
    getMilestoneTypeThunkAction: (nextPage: number, orderBy: string, orderType: string, hideLoading?: boolean) => dispatch(getMilestoneTypesThunkAction(nextPage, orderBy, orderType, hideLoading)),
    createMilestoneTypeThunkAction: (milestoneType: IMilestoneType) => dispatch(createMilestoneTypeThunkAction(milestoneType)),
    updateMilestoneTypeThunkAction: (milestoneType: IMilestoneType) => dispatch(updateMilestoneTypeThunkAction(milestoneType)),
    deleteMilestoneTypeThunkAction: (milestoneType: IMilestoneType) => dispatch(deleteMilestoneTypeItemThunkAction(milestoneType)),
    loadDataAction: (title: string, body: JSX.Element, footer: JSX.Element) => dispatch(loadDataAction(title, body, footer))
  };
};

export default connect<{ milestoneType: IMilestoneTypeState }, { dispatch: any }, IPropsType>(mapStateToProps, mapDispatchToProps)(MilestoneTypeListView);
