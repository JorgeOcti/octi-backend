///<reference path="../../../node_modules/sweetalert/typings/sweetalert.d.ts"/>
import * as moment from 'moment';
// import * as PropTypes from 'prop-types';
import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import {IUser} from '../../../../../../src/interfaces/user.interface';
import {loadDataAction, ModalReduxAction} from '../../actions/modal.actions';
import {
  addUserAction,
  changeTempUserAction,
  deleteUserAction,
  editUserAction,
  getUsersAction,
  ITempUser,
  IUsersState,
  UserReduxAction
} from '../../actions/users.actions';
import AppContainer from '../../container/AppContainer';
import {IWindow} from '../../interfaces/window';
import {hasPermission, statusFooterButttonsModal} from '../../utils/common';
import ModalView from '../Modal/ModalView';
import Paginator from '../Paginator';
import UserFormView from './UserFormView';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<UserReduxAction>;
  users: IUsersState;

  getUsersAction(page?: number): UserReduxAction;
  deleteUserAction(id?: string): UserReduxAction;
  changeTempUserAction(user: ITempUser): UserReduxAction;
  editUserAction(): UserReduxAction;
  loadDataAction(title: string, body: JSX.Element, footer: JSX.Element): ModalReduxAction;
  AddUserAction(): UserReduxAction;
}

interface IStateType {
  error: Error | null;
}

declare let window: IWindow;

class UserListView extends React.Component<IPropsType, IStateType> {

  // static propTypes = {
  //   users: PropTypes.object.isRequired,
  //   dispatch: PropTypes.func.isRequired,
  //   getUsersAction: PropTypes.func.isRequired
  // };

  constructor(props: IPropsType) {
    super(props);
    this.changePage = this.changePage.bind(this);
    this.changeTempUser = this.changeTempUser.bind(this);
    this.addUser = this.addUser.bind(this);
    this.processAddUser = this.processAddUser.bind(this);
    this.editUser = this.editUser.bind(this);
    this.processEditUser = this.processEditUser.bind(this);
  }

  public componentWillMount(): void {
    // set the title of the page
    document.title = 'OSA Andes | Listado de usuarios';
    this.props.getUsersAction();
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
  }

  public render(): React.ReactElement<IPropsType> {
    const {loading, users, pagination} = this.props.users;
    return (
      <AppContainer title="" cMenu="10" cSubMenu="10.3" cAction="Listado">
        <section className="content">
          <div className="box">
            <div className="box-header with-border"><h3 className="box-title">Usuarios <small>{pagination.count}</small></h3>
              {
                hasPermission(window.user, 'addUser') ?
                  <div className="box-tools pull-right">
                    <button className="btn btn-sm btn-success" onClick={this.addUser}>Agregar</button>
                  </div>
                  : null
              }
            </div>
            <div className="box-body no-padding">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th style={{width: '20%'}}>Nombre</th>
                    <th style={{width: '20%'}}>Apellido</th>
                    <th style={{width: '20%'}} className="hidden-xs">Sucursal</th>
                    <th style={{width: '20%'}} className="hidden-xs">Email</th>
                    <th style={{width: '20%'}} className="hidden-xs">Modificado</th>
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
                    users.map((user: IUser) => {
                      return (
                        <tr key={user._id} id={`user-${user._id}`}>
                          <td>{user.firstName}</td>
                          <td>{user.lastName}</td>
                          <td className="hidden-xs">{user.venue ? user.venue.name : ''}</td>
                          <td className="hidden-xs">{user.email}</td>
                          <td className="hidden-xs">{moment(user.updatedAt).format('LLL')}</td>
                          {
                            hasPermission(window.user, 'changeUser') ?
                              <td className="text-blue pointer" onClick={() => this.editUser(user)}><i className="fa fa-pencil"/></td> : null
                          }
                          {
                            hasPermission(window.user, 'deleteUser') ?
                              <td className="text-red pointer" onClick={() => this.deleteUser(user)}><i className="fa fa-minus-circle"/></td> : null
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

  private addUser(): void {
    const {changeTempUser} = this;
    const {venues, permissions, forms} = this.props.users;
    this.props.changeTempUserAction({
      _id: '',
      firstName: '',
      lastName: '',
      email: '',
      venue: '',
      userPermissions: [],
      userForms: []
    });
    setTimeout(() => {
      this.props.loadDataAction(
        'Agregar Usuario',
        <UserFormView changeTempUser={changeTempUser} venues={venues} users={this.props.users} forms={forms} permissions={permissions}/>,
        <React.Fragment>
          <button type="button" className="btn btn-default" data-dismiss="modal">Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={this.processAddUser}>Grabar</button>
        </React.Fragment>
      );
    }, 200);
  }

  private processAddUser(): void {
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
      this.props.AddUserAction();
    }
  }

  private editUser(user: IUser): void {
    const {changeTempUser} = this;
    const {venues, permissions, forms} = this.props.users;
    const tmpUser = {...user};
    tmpUser.venue = tmpUser.venue ? tmpUser.venue._id : '';
    changeTempUser(tmpUser);
    setTimeout(() => {
      this.props.loadDataAction(
        `Editando a ${user.firstName} ${user.lastName}`,
        <UserFormView changeTempUser={changeTempUser} venues={venues} users={this.props.users} forms={forms} permissions={permissions} user={user}/>,
        <React.Fragment>
          <button type="button" className="btn btn-default" data-dismiss="modal">Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={this.processEditUser}>Editar</button>
        </React.Fragment>
      );
    }, 200);
  }

  private processEditUser() {
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
      this.props.editUserAction();
    }
  }

  private changeTempUser({_id, firstName, lastName, email, venue, userPermissions, preferred, userForms}: ITempUser) {
    const tempUser: ITempUser = {
      _id: _id ? _id : this.props.users.tempUser._id,
      firstName: firstName ? firstName : this.props.users.tempUser.firstName,
      lastName: lastName ? lastName : this.props.users.tempUser.lastName,
      email: email ? email : this.props.users.tempUser.email,
      userPermissions: userPermissions ? userPermissions : this.props.users.tempUser.userPermissions,
      userForms: userForms ? userForms : this.props.users.tempUser.userForms,
      preferred: preferred ? preferred : preferred === undefined ? this.props.users.tempUser.preferred : null,
      venue: venue ? venue : venue === undefined ? this.props.users.tempUser.venue : null
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
    getUsersAction: (page?: number) => dispatch(getUsersAction(page)),
    deleteUserAction: (id: string) => dispatch(deleteUserAction(id)),
    changeTempUserAction: (user: ITempUser) => dispatch(changeTempUserAction(user)),
    AddUserAction: () => dispatch(addUserAction()),
    editUserAction: () => dispatch(editUserAction()),
    loadDataAction: (title: string, body: JSX.Element, footer: JSX.Element) => dispatch(loadDataAction(title, body, footer))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(UserListView);
