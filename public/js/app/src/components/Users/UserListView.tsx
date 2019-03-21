///<reference path="../../../node_modules/sweetalert/typings/sweetalert.d.ts"/>
import {AxiosError, default as Axios} from 'axios';
import * as moment from 'moment';
// import * as PropTypes from 'prop-types';
import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import {debounce} from 'throttle-debounce';
import {IUser} from '../../../../../../src/interfaces/user.interface';
import {loadDataAction, ModalReduxAction} from '../../actions/modal.actions';
import {
  changeTempUserAction,
  createUserAction,
  deleteUserAction,
  getUsersAction,
  ITempUser,
  IUsersState,
  updateUserAction,
  UserReduxAction
} from '../../actions/users.actions';
import AppContainer from '../../container/AppContainer';
import {IWindow} from '../../interfaces/window';
import ApiService from '../../utils/axios';
import {hasPermission, showModal, statusFooterButttonsModal} from '../../utils/common';
import ModalView from '../Modal/ModalView';
import Paginator from '../Utils/Paginator';
import UserFormChangePasswordView from './UserFormChangePasswordView';
import UserFormView from './UserFormView';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<UserReduxAction>;
  users: IUsersState;

  getUsersAction(page: number, search?: string): UserReduxAction;
  createUserAction(): UserReduxAction;
  updateUserAction(): UserReduxAction;
  deleteUserAction(id?: string): UserReduxAction;
  changeTempUserAction(user: ITempUser): UserReduxAction;
  loadDataAction(title: string, body: JSX.Element, footer: JSX.Element): ModalReduxAction;
}

interface IStateType {
  error: Error | null;
  searchText: string;
  exporing: boolean;
}

declare let window: IWindow;

class UserListView extends React.Component<IPropsType, IStateType> {

  // static propTypes = {
  //   users: PropTypes.object.isRequired,
  //   dispatch: PropTypes.func.isRequired,
  //   getUsersAction: PropTypes.func.isRequired
  // };
  readonly state = {
    error: null,
    searchText: '',
    exporing: false
  };

  private socket: SocketIOClient.Socket;

  constructor(props: IPropsType) {
    super(props);
    this.createUser = this.createUser.bind(this);
    this.processCreateUser = this.processCreateUser.bind(this);
    this.updateUser = this.updateUser.bind(this);
    this.processUpdateUser = this.processUpdateUser.bind(this);
    this.changePage = this.changePage.bind(this);
    this.changeTempUser = this.changeTempUser.bind(this);
    this.changePassword = this.changePassword.bind(this);
    this.processChangePassword = this.processChangePassword.bind(this);
    this.onChangeSearch = this.onChangeSearch.bind(this);
    this.exportExcel = this.exportExcel.bind(this);
    this.debounceOnChangeSearch = debounce(300, this.debounceOnChangeSearch);
  }

  public componentWillMount(): void {
    const {pagination} = this.props.users;
    // set the title of the page
    document.title = 'OSA Andes | Listado de usuarios';
    this.props.getUsersAction(pagination.page);

    // socket
    this.socket = io.connect(`${location.protocol}//${location.host}`, {
      secure: location.protocol === 'https:',
      transports: ['websocket'],
      reconnection: true,
      query: {token: (window.user as any).token}
    });
    this.socket.on('connect', () => {
      this.socket.emit('join', {room: `user-list-${window.user.team}`});
    });
    this.socket.on('REFRESH', (data: any): void => {
      if (data.update && data.updatedBy !== window.user._id) {
        const {pagination} = this.props.users;
        this.props.getUsersAction(pagination.page);
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
    if (this.props.users.source) {
      this.props.users.source.cancel('Operation canceled by the user.');
    }
    this.socket.disconnect();
  }

  public exportExcel() {
    this.setState({
      exporing: true
    });
    const api: ApiService = new ApiService();
    const instance = api.getInstance();
    instance.defaults.responseType = 'blob';
    instance
      .get(`/settings/users/export/`)
      .then((response) => {
        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const fileName = `${moment().format('YYYYMMDD')}-usuarios .xlsx`;
        if (typeof window.navigator.msSaveBlob !== 'undefined') {
          // IE workaround for "HTML7007: One or more blob URLs were
          // revoked by closing the blob for which they were created.
          // These URLs will no longer resolve as the data backing
          // the URL has been freed."
          window.navigator.msSaveBlob(blob, fileName);
        } else {
          const blobURL = window.URL.createObjectURL(blob);
          const tempLink = document.createElement('a');
          tempLink.style.display = 'none';
          tempLink.href = blobURL;
          tempLink.setAttribute('download', fileName);
          // Safari thinks _blank anchor are pop ups. We only want to set _blank
          // target if the browser does not support the HTML5 download attribute.
          // This allows you to download files in desktop safari if pop up blocking
          // is enabled.
          if (typeof tempLink.download === 'undefined') {
            tempLink.setAttribute('target', '_blank');
          }
          this.setState({
            exporing: false
          });
          document.body.appendChild(tempLink);
          tempLink.click();
          document.body.removeChild(tempLink);
          window.URL.revokeObjectURL(blobURL);
        }
      })
      .catch((err) => {
        this.setState({
          exporing: false
        });
        if (!Axios.isCancel(err)) {
          swal('Exportar usuarios', 'Ha ocurrido un error al general el excel.', 'error');
        }
      });
  }

  public render(): React.ReactElement<IPropsType> {
    const {exporing} = this.state;
    const {loading, users, pagination} = this.props.users;
    return (
      <AppContainer title="" cMenu="10" cSubMenu="10.5" cAction="Listado">
        <section className="content">
          <div className="box">
            <div className="box-header with-border"><h3 className="box-title">Usuarios <small>{pagination.count}</small></h3>
              <div className="box-tools pull-right">
                {
                  hasPermission(window.user, 'addUser') ?
                    <button className="btn btn-sm btn-success" onClick={this.createUser}>Agregar</button>
                    : null
                }
                <button
                  className="btn btn-sm btn-primary  hidden-xs"
                  onClick={this.exportExcel}
                  disabled={exporing}
                  style={{marginLeft: '5px'}}
                >{
                  exporing ?
                    <React.Fragment><i className="fa fa-spin fa-spinner"/> Exportando</React.Fragment>
                    : <React.Fragment><i className="fa fa-fw fa-download"/> Exportar</React.Fragment>
                }
                </button>
              </div>
            </div>
            <div className="box-body no-padding">
              <div className="row">
                <div className="col-md-offset-8 col-md-4">
                  <div className="input-group input-group-sm"
                       style={{padding: '10px'}}
                  >
                    <input
                      type="text"
                      className="form-control pull-right"
                      onChange={this.onChangeSearch}
                      placeholder="Buscar"/>
                    <div className="input-group-btn">
                      <button className="btn btn-default"><i className="fa fa-search"/></button>
                    </div>
                  </div>
                </div>
              </div>
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th style={{width: '33%'}}>Usuario</th>
                    <th style={{width: '33%'}} className="hidden-xs">Sucursal</th>
                    <th style={{width: '33%'}} className="hidden-xs">Modificado</th>
                    {
                      hasPermission(window.user, 'changeUser') ?
                        <th style={{width: '1%'}} className="width-10"/> : null
                    }
                    {
                      hasPermission(window.user, 'changeUser') ?
                        <th style={{width: '1%'}} className="width-10"/> : null
                    }
                    {
                      hasPermission(window.user, 'deleteUser') ?
                      <th style={{width: '1%'}} className="width-10"/> : null
                    }
                  </tr>
                </thead>
                <tbody>
                  {
                    !loading && users.length === 0 && users ? <tr>
                      <td colSpan={6}>No se han encontrado resultados.</td>
                    </tr> : null
                  }
                  {
                    users.map((user: IUser) => {
                      return (
                        <tr
                          key={user._id}
                          id={`user-${user._id}`}
                          className={'background-transition'}
                        >
                          <td className="middle">{user.firstName} {user.lastName}<br />
                            <span className="text-sm text-muted">{user.email}</span>
                            <div className="hidden-lg hidden-md hidden-sm text-sm">
                              <span className="text-sm text-muted">{user.venue ? user.venue.name : ''} - {user.company ? user.company.name : ''}</span>
                            </div>
                          </td>
                          <td className="hidden-xs">{user.venue ? user.venue.name : ''}<br />
                            <span className="text-sm text-muted">{user.company ? user.company.name : ''}</span>
                          </td>
                          <td className="middle hidden-xs text-muted">{moment(user.updatedAt).format('LLL')}</td>
                          {
                            hasPermission(window.user, 'changeUser') ?
                              <td className="middle-center text-yellow pointer" onClick={() => this.changePassword(user)}><i className="fa fa-lock"/></td> : null
                          }
                          {
                            hasPermission(window.user, 'changeUser') ?
                              <td className="middle-center text-blue pointer" onClick={() => this.updateUser(user)}><i className="fa fa-pencil"/></td> : null
                          }
                          {
                            hasPermission(window.user, 'deleteUser') ?
                              <td className="middle-center text-red pointer" onClick={() => this.deleteUser(user)}><i className="fa fa-minus-circle"/></td> : null
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
                  <i className="fa fa-spinner fa-spin text-purple"/>
                </div>
            }
          </div>
          <ModalView />
        </section>
      </AppContainer>
    );
  }

  private onChangeSearch(e: React.ChangeEvent<HTMLInputElement>): void {
    e.preventDefault();
    const value = e.target.value.trim();
    this.setState({
      searchText: value
    });
    this.debounceOnChangeSearch();
  }

  private debounceOnChangeSearch(): void {
    const {searchText} = this.state;
    if (searchText && searchText.length) {
      this.props.getUsersAction(1, searchText);
    } else {
      this.props.getUsersAction(1);
    }
  }

  private createUser(): void {
    const {changeTempUser} = this;
    const {venues, permissions, forms, companies} = this.props.users;
    this.props.changeTempUserAction({
      _id: '',
      firstName: '',
      lastName: '',
      company: null,
      email: '',
      venue: '',
      userPermissions: [],
      venuesAccess: [],
      userForms: []
    });
    setTimeout(() => {
      this.props.loadDataAction(
        'Agregar Usuario',
        <UserFormView create={true} changeTempUser={changeTempUser} venues={venues} companies={companies} users={this.props.users} forms={forms} permissions={permissions}/>,
        <React.Fragment>
          <button type="button" className="btn btn-sm btn-default" data-dismiss="modal">Cancelar</button>
          <button type="button" className="btn btn-sm btn-primary" onClick={this.processCreateUser}>Grabar</button>
        </React.Fragment>
      );
    }, 400);
  }

  private processCreateUser(): void {
    const {firstName, lastName, email, venue} = this.props.users.tempUser;
    if (!firstName || !firstName.trim().length) {
      swal('Agregar usuario', 'El nombres es requerido', 'error');
    } else if (!lastName || !lastName.trim().length) {
      swal('Agregar usuario', 'El apellidos es requerido', 'error');
    } else if (!email || !email.trim().length) {
      swal('Agregar usuario', 'El email es requerido', 'error');
    } else if (!venue || !venue.trim().length) {
      swal('Agregar usuario', 'El sucursal es requerido', 'error');
    } else {
      statusFooterButttonsModal(true);
      this.props.createUserAction();
    }
  }

  private changePassword(user: IUser): void {
    const {changeTempUser} = this;
    const tmpUser = {
      ...user,
      password: ''
    };
    changeTempUser(tmpUser);
    setTimeout(() => {
      this.props.loadDataAction(
        `Cambiando contraseña a ${user.firstName} ${user.lastName}`,
        <UserFormChangePasswordView changeTempUser={changeTempUser} users={this.props.users} user={user}/>,
        <React.Fragment>
          <button type="button" className="btn btn-sm btn-default" data-dismiss="modal">Cancelar</button>
          <button type="button" className="btn btn-sm btn-primary" onClick={this.processChangePassword}>Cambiar</button>
        </React.Fragment>
      );
    }, 400);
  }

  private processChangePassword() {
    const {password, _id} = this.props.users.tempUser;
    statusFooterButttonsModal(true);
    if (password && password.trim().length >= 6 && _id) {
      const api: ApiService = new ApiService();
      api.changePasswordUser(_id, password)
        .then((response) => {
          statusFooterButttonsModal(false);
          showModal(false);
          swal(response.data.message, {
            icon: 'success'
          });
        })
        .catch((err: AxiosError) => {
          statusFooterButttonsModal(false);
          api.errorHandler(err);
        });
    } else {
      swal('Cambiar contraseña', 'La contraseña debe tener al menos 6 caracteres.', 'error');
      statusFooterButttonsModal(false);
    }
  }

  private updateUser(user: IUser): void {
    const {changeTempUser} = this;
    const {venues, permissions, forms, companies} = this.props.users;
    const tmpUser = {...user};
    tmpUser.venue = tmpUser.venue ? tmpUser.venue._id : '';
    changeTempUser(tmpUser);
    setTimeout(() => {
      this.props.loadDataAction(
        `Editando a ${user.firstName} ${user.lastName}`,
        <UserFormView create={false}  changeTempUser={changeTempUser} companies={companies} venues={venues} users={this.props.users} forms={forms} permissions={permissions} user={user}/>,
        <React.Fragment>
          <button type="button" className="btn btn-sm btn-default" data-dismiss="modal">Cancelar</button>
          <button type="button" className="btn btn-sm btn-primary" onClick={this.processUpdateUser}>Editar</button>
        </React.Fragment>
      );
    }, 400);
  }

  private processUpdateUser() {
    const {firstName, lastName, email, venue} = this.props.users.tempUser;
    if (!firstName || !firstName.trim().length) {
      swal('Agregar usuario', 'El nombres es requerido', 'error');
    } else if (!lastName || !lastName.trim().length) {
      swal('Agregar usuario', 'El apellidos es requerido', 'error');
    } else if (!email || !email.trim().length) {
      swal('Agregar usuario', 'El email es requerido', 'error');
    } else if (!venue || !venue.trim().length) {
      swal('Agregar usuario', 'El sucursal es requerido', 'error');
    } else {
      statusFooterButttonsModal(true);
      this.props.updateUserAction();
    }
  }

  private changeTempUser({_id, firstName, lastName, email, venue, userPermissions, preferred, userForms, company, venuesAccess, password}: ITempUser) {
    const tempUser: ITempUser = {
      _id: _id ? _id : this.props.users.tempUser._id,
      firstName: firstName ? firstName : this.props.users.tempUser.firstName,
      lastName: lastName ? lastName : this.props.users.tempUser.lastName,
      password: password ? password : '',
      email: email ? email : this.props.users.tempUser.email,
      userPermissions: userPermissions ? userPermissions : this.props.users.tempUser.userPermissions,
      userForms: userForms ? userForms : this.props.users.tempUser.userForms,
      preferred: preferred ? preferred : preferred === undefined ? this.props.users.tempUser.preferred : null,
      venue: venue ? venue : venue === undefined ? this.props.users.tempUser.venue : null,
      venuesAccess: venuesAccess ? venuesAccess : venuesAccess === undefined ? this.props.users.tempUser.venuesAccess : [],
      company: company ? company : company === undefined ? this.props.users.tempUser.company : null
    };
    this.props.changeTempUserAction(tempUser);
  }

  private deleteUser(user: IUser) {
    // ask if you are sure that you are going to delete the user?
    swal({
      title: '¿Estás seguro?',
      text: `Vas a eliminar el usuario ${user.firstName || ''} ${user.lastName || ''}`,
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
        this.props.deleteUserAction(user._id);
      }
    });
  }

  private changePage(page: number): void {
    // change the page
    this.props.getUsersAction(page);
  }
}

const mapStateToProps = (state: { users: IUsersState }) => {
  return {
    users: state.users
  };
};

// const mapDispatchToProps = (dispatch: Dispatch<UserReduxAction> ) => {
const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    getUsersAction: (page: number, search?: string) => dispatch(getUsersAction(page, search)),
    deleteUserAction: (id: string) => dispatch(deleteUserAction(id)),
    changeTempUserAction: (user: ITempUser) => dispatch(changeTempUserAction(user)),
    createUserAction: () => dispatch(createUserAction()),
    updateUserAction: () => dispatch(updateUserAction()),
    loadDataAction: (title: string, body: JSX.Element, footer: JSX.Element) => dispatch(loadDataAction(title, body, footer))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(UserListView);
