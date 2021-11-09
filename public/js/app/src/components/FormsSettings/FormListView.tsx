import * as Raven from 'raven-js';
import * as React from 'react';
import { ErrorInfo } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import { Dispatch } from 'redux';
import { FormAction, submit } from 'redux-form';
import * as swal from 'sweetalert';
import { IForm } from '../../../../../../src/form/interfaces/form.interface';
import { loadDataAction, ModalReduxAction } from '../../actions/modal.actions';
import { IFormsState, FormReduxActions } from '../../actions/form.types';
import {
  createFormThunkAction,
  deleteFormItemThunkAction,
  getFormsThunkAction,
  updateFormThunkAction
} from '../../actions/form.actions';
import AppContainer from '../../container/AppContainer';
import { IWindow } from '../../interfaces/window';
import { hasPermission, showModal, statusFooterButttonsModal } from '../../utils/common';
import ModalView from '../Modal/ModalView';
import Paginator from '../Utils/Paginator';
import TrackingBasePage from '../Utils/TrackingBasePage';
import FormSettingsForm from './FormForm';
import ShowIf from '../Utils/ShowIf';
import BootstrapSwitch from '../Utils/BootstrapSwitch';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<FormReduxActions | FormAction>;
  forms: IFormsState;

  getFormThunkAction(nextPage: number, hideLoading?: boolean): FormReduxActions;

  createFormThunkAction(form: IForm): FormReduxActions;

  updateFormThunkAction(form: IForm): FormReduxActions;

  deleteFormThunkAction(form: IForm): FormReduxActions;

  loadDataAction(title: string, body: JSX.Element, footer: JSX.Element): ModalReduxAction;
}

interface IStateType {
  error: Error | null;
  exporing: boolean;
}

declare let window: IWindow;

class FormListView extends TrackingBasePage<IPropsType, IStateType> {
  title: string;

  private socket: SocketIOClient.Socket;
  readonly state = {
    error: null,
    exporing: false
  };

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Listado Formularios';
    this.changePage = this.changePage.bind(this);
    this.createForm = this.createForm.bind(this);
    this.processCreateForm = this.processCreateForm.bind(this);
    this.updateForm = this.updateForm.bind(this);
    this.processUpdateForm = this.processUpdateForm.bind(this);
    this.deleteForm = this.deleteForm.bind(this);
  }

  public componentWillMount(): void {
    const { pagination } = this.props.forms;
    // const { orderBy, orderType } = this.props.form.options;
    this.props.getFormThunkAction(pagination.page);

    // socket
    this.socket = io.connect(`${location.protocol}//${location.host}`, {
      secure: location.protocol === 'https:',
      transports: ['websocket'],
      reconnection: true,
      query: { token: (window.user as any).token }
    });
    this.socket.on('connect', () => {
      this.socket.emit('join', { room: `forms-list-${window.user.team._id}` });
    });
    this.socket.on('REFRESH', (data: any): void => {
      if (data.update) {
        const { pagination } = this.props.forms;
        // const { orderBy, orderType } = this.props.form.options;
        this.props.getFormThunkAction(pagination.page, true);
      }
    });
  }


  public componentDidUpdate(prevProps: Readonly<IPropsType>, prevState: Readonly<IStateType>, snapshot?: any): void {
    if (this.props.forms.pagination !== prevProps.forms.pagination) {
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
    if (this.props.forms.source) {
      this.props.forms.source.cancel('Operation canceled by the user.');
    }
    this.socket.disconnect();
  }

  public render(): React.ReactElement<IPropsType> {
    const { loading, forms, pagination } = this.props.forms;
    const canEdit = hasPermission(window.user, 'adminRequest');
    const canDelete = hasPermission(window.user, 'adminRequest');
    return (
      <AppContainer title='' cMenu='1' cSubMenu='1.10' cAction='Formularios'>
        <section className='content'>
          <div className='row'>
            <div className='col-md-3'>
              <div className='list-group'>
                <ShowIf condition={window.user.isAdmin}>
                  <Link to='/requests/settings/forms/' className='list-group-item active'>
                    Formularios
                  </Link>
                </ShowIf>
              </div>
            </div>
            <div className='col-md-9'>
              <div className='box'>
                <div className='box-header with-border'>
                  <h3 className='box-title'>Formularios <small>{pagination.count}</small></h3>
                  <div className='box-tools pull-right'>
                    <ShowIf condition={hasPermission(window.user, 'addVenue')}>
                      <button
                        className='btn btn-sm btn-success'
                        onClick={this.createForm}
                      >
                        <i className='fa fa-plus' /> Agregar
                      </button>
                    </ShowIf>
                  </div>
                </div>
                <div className='box-body table-responsive no-padding'>
                  <table className='table table-andes table-striped'>
                    <thead>
                    <tr>
                      <th style={{ width: '70%' }} className='middle'>Nombre</th>
                      <th style={{ width: '16%' }} className='middle-center'>Activo</th>
                      <th style={{ width: '15%' }} className='middle-center'>Triggers</th>
                      <ShowIf condition={canEdit}>
                        <th style={{ width: '1%' }} className='width-10' />
                      </ShowIf>
                      <ShowIf condition={canDelete}>
                        <th style={{ width: '1%' }} className='width-10' />
                      </ShowIf>
                    </tr>
                    </thead>
                    <tbody>
                    {
                      forms.map((item) => {
                        return (
                          <tr key={item._id}>
                            <td className='middle'>{item.name}</td>
                            <td className='middle-center' style={{ paddingTop: '15px' }}>
                              <BootstrapSwitch
                                checked={item.active}
                                onChange={() => {
                                  // this.props.changeLabelAction({
                                  //   ...label,
                                  //   active: !label.active
                                  // });
                                }}
                              />
                            </td>
                            <td className='middle-center'><strong>{item.triggers?.length}</strong></td>
                            <ShowIf condition={canEdit}>
                              <td
                                className='middle text-blue pointer'
                                onClick={() => this.updateForm(item)}
                              >
                                <i className='fa fa-pencil' />
                              </td>
                            </ShowIf>
                            <ShowIf condition={canDelete}>
                              <td
                                className={'middle text-red pointer'}
                                onClick={() => this.deleteForm(item)}
                              >
                                <i className='fa fa-minus-circle' />
                              </td>
                            </ShowIf>
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

  private createForm(): void {
    this.props.loadDataAction(
      'Agregar formulario',
      <FormSettingsForm
        initialValues={{ update: false }}
        onSubmit={this.processCreateForm}
      />,
      <React.Fragment>
        <button type='button' className='btn btn-sm btn-default' data-dismiss='modal'>Cancelar</button>
        <button type='button' className='btn btn-sm btn-primary' onClick={() => this.props.dispatch(submit('formForm'))}>Grabar</button>
      </React.Fragment>
    );
  }

  private processCreateForm(form: any): void {
    statusFooterButttonsModal(true);
    this.props.createFormThunkAction(form);
    statusFooterButttonsModal(false);
    showModal(false);
  }

  private updateForm(form: any): void {
    this.props.loadDataAction(
      'Editar formulario',
      <FormSettingsForm
        initialValues={{ update: false, ...form }}
        onSubmit={this.processUpdateForm}
      />,
      <React.Fragment>
        <button type='button' className='btn btn-sm btn-default' data-dismiss='modal'>Cancelar</button>
        <button type='button' className='btn btn-sm btn-primary' onClick={() => this.props.dispatch(submit('formForm'))}>Editar</button>
      </React.Fragment>
    );
  }

  private processUpdateForm(form: any): void {
    statusFooterButttonsModal(true);
    this.props.updateFormThunkAction(form);
    statusFooterButttonsModal(false);
    showModal(false);
  }

  private deleteForm(form: IForm): void {
    // ask if you are sure that you are going to delete the user?
    swal({
      title: '¿Estás seguro?',
      text: `Vas a eliminar el formulario: ${form.name} `,
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
        this.props.deleteFormThunkAction(form);
      }
    });
  }

  private changePage(page: number): void {
    // change the page
    // const { orderBy, orderType } = this.props.form.options;
    this.props.getFormThunkAction(page);
  }
}

const mapStateToProps = (state: { forms: IFormsState }) => {
  return {
    forms: state.forms
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch,
    getFormThunkAction: (nextPage: number, hideLoading?: boolean) => dispatch(getFormsThunkAction(nextPage, hideLoading)),
    createFormThunkAction: (form: IForm) => dispatch(createFormThunkAction(form)),
    updateFormThunkAction: (form: IForm) => dispatch(updateFormThunkAction(form)),
    deleteFormThunkAction: (form: IForm) => dispatch(deleteFormItemThunkAction(form)),
    loadDataAction: (title: string, body: JSX.Element, footer: JSX.Element) => dispatch(loadDataAction(title, body, footer))
  };
};

export default connect<{ forms: IFormsState }, { dispatch: any }, IPropsType>(mapStateToProps, mapDispatchToProps)(FormListView);
