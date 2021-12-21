import * as Raven from 'raven-js';
import * as React from 'react';
import { ErrorInfo } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import { Dispatch } from 'redux';
import { FormAction } from 'redux-form';
import { IMilestone } from '../../../../../../src/distribution/interfaces/milestone.interface';
import { loadDataAction, ModalReduxAction } from '../../actions/modal.actions';
import { IMilestoneState, MilestoneReduxActions } from '../../actions/milestone.types';
import { getMilestonesThunkAction, updateMilestoneThunkAction } from '../../actions/milestone.actions';
import AppContainer from '../../container/AppContainer';
import { IWindow } from '../../interfaces/window';
import { showModal, statusFooterButttonsModal } from '../../utils/common';
import ModalView from '../Modal/ModalView';
import Paginator from '../Utils/Paginator';
import TrackingBasePage from '../Utils/TrackingBasePage';
import ShowIf from '../Utils/ShowIf';
import { IForm } from '../../../../../../src/form/interfaces/form.interface';
import { IRequestItemStatus } from '../../../../../../src/request/interfaces/requestItemStatus.interface';
import Checkbox from '../Utils/CheckBox';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<MilestoneReduxActions | FormAction>;
  milestone: IMilestoneState;

  getMilestoneThunkAction(milestoneType: string, nextPage: number, orderBy: string, orderType: string, hideLoading?: boolean): MilestoneReduxActions;
  // createMilestoneThunkAction(milestone: IMilestone): MilestoneReduxActions;
  updateMilestoneThunkAction(milestone: IMilestone): MilestoneReduxActions;
  // deleteMilestoneThunkAction(milestone: IMilestone): MilestoneReduxActions;
  loadDataAction(title: string, body: JSX.Element, footer: JSX.Element): ModalReduxAction;
}

interface IStateType {
  error: Error | null;
  exporing: boolean;
  milestoneType: string;
}

declare let window: IWindow;

class MilestoneListView extends TrackingBasePage<IPropsType, IStateType> {
  public title: string;

  private socket: SocketIOClient.Socket;
  readonly state = {
    error: null,
    milestoneType: '',
    exporing: false
  };

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Listado Hitos';
    this.changePage = this.changePage.bind(this);
    /*this.createMilestone = this.createMilestone.bind(this);
    this.processCreateMilestone = this.processCreateMilestone.bind(this);*/
    /*this.updateMilestone = this.updateMilestone.bind(this);*/
    this.processUpdateMilestone = this.processUpdateMilestone.bind(this);
    // this.deleteMilestone = this.deleteMilestone.bind(this);
  }

  public componentWillMount(): void {
    const { pagination } = this.props.milestone;
    const { orderBy, orderType } = this.props.milestone.options;
    const { milestoneType } = this.state;
    this.props.getMilestoneThunkAction(milestoneType, pagination.page, orderBy, orderType);

    // socket
    this.socket = io.connect(`${location.protocol}//${location.host}`, {
      secure: location.protocol === 'https:',
      transports: ['websocket'],
      reconnection: true,
      query: { token: (window.user as any).token }
    });
    this.socket.on('connect', () => {
      this.socket.emit('join', { room: `operation-type-list-${window.user.team._id}` });
    });
    this.socket.on('REFRESH', (data: any): void => {
      if (data.update) {
        const { pagination } = this.props.milestone;
        const { orderBy, orderType } = this.props.milestone.options;
        const { milestoneType } = this.state;
        this.props.getMilestoneThunkAction(milestoneType, pagination.page, orderBy, orderType, true);
      }
    });
  }

  public componentDidUpdate(prevProps: Readonly<IPropsType>, prevState: Readonly<IStateType>, snapshot?: any): void {
    if (this.props.milestone.pagination !== prevProps.milestone.pagination) {
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
    if (this.props.milestone.source) {
      this.props.milestone.source.cancel('Operation canceled by the user.');
    }
    this.socket.disconnect();
  }

  public render(): React.ReactElement<IPropsType> {
    const { loading, milestones, pagination, forms, requestStatus, milestoneTypes } = this.props.milestone;
    const { milestoneType } = this.state;
    // const canEdit = hasPermission(window.user, 'adminRequest');
    // const canDelete = hasPermission(window.user, 'adminRequest');
    return (
      <AppContainer title='' cMenu='3' cSubMenu='3.3' cAction='Hitos'>
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
                <ShowIf condition={window.user.isAdmin}>
                  <Link to='/transmittals/settings/milestone-type/' className='list-group-item'>
                    Tipos de hitos
                  </Link>
                </ShowIf>
                <ShowIf condition={window.user.isAdmin}>
                  <Link to='/transmittals/settings/milestone/' className='list-group-item active'>
                    Hitos
                  </Link>
                </ShowIf>
              </div>
            </div>
            <div className='col-md-9'>
              <div className='box'>
                <div className='box-header with-border'>
                  <h3 className='box-title'>Hitos <small>{pagination.count}</small></h3>
                  <div className='box-tools pull-right'>
                   {/* {
                      hasPermission(window.user, 'addVenue') ?
                        <button className='btn btn-sm btn-success'
                                onClick={this.createMilestone}
                        ><i className='fa fa-plus' /> Agregar</button>
                        : null
                    }*/}
                  </div>
                </div>
                <div className='box-body table-responsive no-padding'>
                  <div className='row' style={{padding: '10px'}}>
                    {/*<div className='col-md-offset-8 col-md-4'>*/}
                    <div className='col-md-5'>
                      <div className={`form-group`} style={{margin: '0'}}>
                        <label className='control-label'>Seleccione hito a configurar</label>
                        <div className="input-group">
                        <select
                          className='form-control select-sm font-12'
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                            this.setState({
                              milestoneType: e.target.value
                            }, () => {
                              const { orderBy, orderType } = this.props.milestone.options;
                              const { milestoneType } = this.state;
                              this.props.getMilestoneThunkAction(milestoneType, 1, orderBy, orderType);
                            });
                          }}
                        >
                          <option key={''} value={''}>Seleccione</option>
                          {
                            milestoneTypes.map((milestoneType) => (
                              <option key={milestoneType._id} value={milestoneType._id}>{milestoneType.name}</option>
                            ))
                          }
                        </select>
                          <div className='input-group-addon input-group-primary pointer'>
                            <i className='fa fa-cogs' />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ShowIf condition={!loading && !!milestoneType?.length}>
                    <table className='table table-andes table-striped'>
                      <thead>
                      <tr>
                        <th className='middle' style={{ width: '20px' }}>Orden</th>
                        <th className='middle'>Paso</th>
                        <th className='middle'>Tipo</th>
                        <th className='middle'>Formulario</th>
                        <th className='middle'>Estado solicitudes</th>
                        <th className='middle'>F. Arribo</th>
                      </tr>
                      </thead>
                      <tbody>
                      {
                        milestones.map((item) => {
                          return (
                            <tr key={item._id}>
                              <td className='middle-center'>{item.order}</td>
                              <td className='middle'>{item.name}</td>
                              <td className='middle'>
                                <select
                                  className='form-control select-sm font-12' value={item.kind}
                                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                    this.props.updateMilestoneThunkAction({
                                      ...item,
                                      kind: e.target.value
                                    });
                                  }}
                                >
                                  <option key={'form'} value={'form'}>Formulario</option>
                                  <option key={'file'} value={'file'}>Archivo</option>
                                </select>
                              </td>
                              <td className='middle'>
                                <ShowIf condition={item.kind === 'form'}>
                                  <select
                                    className='form-control select-sm font-12' value={item.form?._id ?? ''}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                      this.props.updateMilestoneThunkAction({
                                        ...item,
                                        form: e.target.value as unknown as IForm
                                      });
                                    }}
                                  >
                                    <option value='' disabled={true}>Seleccione</option>
                                    {
                                      forms.map((form) => (
                                        <option key={form._id} value={form._id}>{`${form.name}`}</option>
                                      ))
                                    }
                                  </select>
                                </ShowIf>
                              </td>
                              <td className='middle'>
                                <select
                                  className='form-control select-sm font-12' value={item.requestItemStatus?._id ?? ''}
                                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                    this.props.updateMilestoneThunkAction({
                                      ...item,
                                      requestItemStatus: e.target.value as unknown as IRequestItemStatus
                                    });
                                  }}
                                >
                                  <option value={''}>Seleccione</option>
                                  {
                                    requestStatus.map((status) => (
                                      <option key={status._id} value={status._id}>{`${status.name}`}</option>
                                    ))
                                  }
                                </select>
                              </td>
                              <td className='middle'>
                                <Checkbox
                                  active={false}
                                  action={()=>{
                                    // call function
                                  }}
                                  classes='icheck-in-checkbox'
                                  style={{ marginTop: '-4px', marginRight: '5px' }}
                                />
                              </td>
                            </tr>
                          );
                        })
                      }
                      </tbody>
                    </table>
                  </ShowIf>
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

  /*private createMilestone(): void {
    this.props.loadDataAction(
      'Agregar tipo de operación',
      <MilestoneForm
        initialValues={{ update: false }}
        onSubmit={this.processCreateMilestone}
      />,
      <React.Fragment>
        <button type='button' className='btn btn-sm btn-default' data-dismiss='modal'>Cancelar</button>
        <button type='button' className='btn btn-sm btn-primary' onClick={() => this.props.dispatch(submit('milestoneForm'))}>Grabar</button>
      </React.Fragment>
    );
  }*/

  /*private processCreateMilestone(milestone: any): void {
    statusFooterButttonsModal(true);
    this.props.createMilestoneThunkAction(milestone);
    statusFooterButttonsModal(false);
    showModal(false);
  }*/

  /*private updateMilestone(milestone: any): void {
    this.props.loadDataAction(
      'Editar hito',
      <MilestoneForm
        initialValues={{ update: false, ...milestone }}
        onSubmit={this.processUpdateMilestone}
      />,
      <React.Fragment>
        <button type='button' className='btn btn-sm btn-default' data-dismiss='modal'>Cancelar</button>
        <button type='button' className='btn btn-sm btn-primary' onClick={() => this.props.dispatch(submit('milestoneForm'))}>Editar</button>
      </React.Fragment>
    );
  }*/

  private processUpdateMilestone(milestone: any): void {
    statusFooterButttonsModal(true);
    this.props.updateMilestoneThunkAction(milestone);
    statusFooterButttonsModal(false);
    showModal(false);
  }

  /*private deleteMilestone(milestone: IMilestone): void {
    // ask if you are sure that you are going to delete the user?
    swal({
      title: '¿Estás seguro?',
      text: `Vas a eliminar el tipo de operación ${milestone.name} `,
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
        this.props.deleteMilestoneThunkAction(milestone);
      }
    });
  }*/

  private changePage(page: number): void {
    // change the page
    const { orderBy, orderType } = this.props.milestone.options;
    const {milestoneType} = this.state;
    this.props.getMilestoneThunkAction(milestoneType, page, orderBy, orderType);
  }
}

const mapStateToProps = (state: { milestone: IMilestoneState }) => {
  return {
    milestone: state.milestone
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch,
    getMilestoneThunkAction: (milestoneType: string,nextPage: number, orderBy: string, orderType: string, hideLoading?: boolean) => dispatch(getMilestonesThunkAction(milestoneType, nextPage, orderBy, orderType, hideLoading)),
    // createMilestoneThunkAction: (milestone: IMilestone) => dispatch(createMilestoneThunkAction(milestone)),
    updateMilestoneThunkAction: (milestone: IMilestone) => dispatch(updateMilestoneThunkAction(milestone)),
    // deleteMilestoneThunkAction: (milestone: IMilestone) => dispatch(deleteMilestoneItemThunkAction(milestone)),
    loadDataAction: (title: string, body: JSX.Element, footer: JSX.Element) => dispatch(loadDataAction(title, body, footer))
  };
};

export default connect<{ milestone: IMilestoneState }, { dispatch: any }, IPropsType>(mapStateToProps, mapDispatchToProps)(MilestoneListView);
