///<reference path="../../../node_modules/sweetalert/typings/sweetalert.d.ts"/>
import * as moment from 'moment';
import * as PropTypes from 'prop-types';
import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import {IUser} from '../../../../../../src/interfaces/user.interface';
import {loadDataAction, ModalReduxAction} from '../../actions/modal';
import {
  addUserAction,
  changeTempUserAction,
  deleteUserAction,
  editUserAction,
  getUsersAction,
  ITempUser,
  IUsersState,
  UserReduxAction
} from '../../actions/users';
import AppContainer from '../../container/AppContainer';
import {statusFooterButttonsModal} from '../../utils/common';
import ModalView from '../Modal/ModalView';
import Paginator from '../Paginator';

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

class UsersListView extends React.Component<IPropsType, IStateType> {

  static propTypes = {
    users: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    getUsersAction: PropTypes.func.isRequired
  };

  constructor(props: IPropsType) {
    super(props);
    this.changePage = this.changePage.bind(this);
    this.changeTempUser = this.changeTempUser.bind(this);
    this.addUser = this.addUser.bind(this);
    this.processAddUser = this.processAddUser.bind(this);
    this.editUser = this.editUser.bind(this);
    this.processEditUser = this.processEditUser.bind(this);
  }

  public componentWillMount() {
    // set the title of the page
    document.title = 'OSA Andes | Listado de usuarios';
    this.props.getUsersAction();
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public componentWillUnmount() {
    // cancel request if component is inmounted
    if (this.props.users.source) {
      this.props.users.source.cancel('Operation canceled by the user.');
    }
  }

  public render(): React.ReactElement<IPropsType> {
    const {loading, users, pagination} = this.props.users;
    return (
      <AppContainer title="" cMenu="2" cSubMenu="2.1" cAction="Listado">
        <section className="content">
          <div className="box">
            <div className="box-header with-border"><h3 className="box-title">Usuarios <small>{pagination.count}</small></h3>
              <div className="box-tools pull-right">
                <button className="btn btn-sm btn-success" onClick={this.addUser}>Agregar</button>
              </div>
            </div>
            <div className="box-body">
              {/*<div className="pull-right">*/}
                {/*<div className="input-group text-right max-width-300">*/}
                  {/*<input type="text" className="form-control" placeholder="Buscar"/>*/}
                  {/*<span className="input-group-addon input-group-primary"><i className="fa fa-search" /></span>*/}
                {/*</div>*/}
              {/*</div>*/}
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Apellido</th>
                    <th className="hidden-xs">Sucursal</th>
                    <th className="hidden-xs">Email</th>
                    <th className="hidden-xs">Modificado</th>
                    <th className="width-10" />
                    <th className="width-10" />
                  </tr>
                </thead>
                <tbody>
                  {
                    users.map((user: IUser) => {
                      return (
                        <tr key={user._id} id={`user-${user._id}`}>
                          <td>{user.firstName}</td>
                          <td>{user.lastName}</td>
                          <td className="hidden-xs">{user.venue.name}</td>
                          <td className="hidden-xs">{user.email}</td>
                          <td className="hidden-xs">{moment(user.updatedAt).format('LLL')}</td>
                          <td className="text-blue pointer" onClick={() => this.editUser(user)}><i className="fa fa-pencil"/></td>
                          <td className="text-red pointer" onClick={() => this.deleteUser(user)}><i className="fa fa-minus-circle"/></td>
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
    const {venues} = this.props.users;
    this.props.changeTempUserAction({
      _id: '',
      firstName: '',
      lastName: '',
      email: '',
      venue: ''
    });
    this.props.loadDataAction(
      'Agregar Usuario',
      <div className={'row'}>
        <div className="col-md-12">
          <div className="form-group">
            <label>Nombres</label>
            <input
              type="text"
              name="fistName"
              className="form-control"
              maxLength={50}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => changeTempUser({firstName: e.target.value})}
            />
          </div>
        </div>
        <div className="col-md-12">
          <div className="form-group">
            <label>Apellidos</label>
            <input
              type="text"
              name="lastName"
              className="form-control"
              maxLength={50}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => changeTempUser({lastName: e.target.value})}
            />
          </div>
        </div>
        <div className="col-md-12">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              className="form-control"
              maxLength={80}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => changeTempUser({email: e.target.value})}
            />
          </div>
        </div>
        <div className="col-md-12">
          <div className="form-group">
            <label htmlFor="sel1">Sucursal</label>
            <select
              className="form-control"
              name="venue"
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => changeTempUser({venue: e.target.value})}>
              <option value="">Seleccione venue</option>
              {
                venues.map((venue) => (
                  <option key={venue._id} value={venue._id}>{venue.name}</option>
                ))
              }
            </select>
          </div>
        </div>
      </div>,
      <React.Fragment>
        <button type="button" className="btn btn-default" data-dismiss="modal">Cancelar</button>
        <button type="button" className="btn btn-primary" onClick={this.processAddUser}>Grabar</button>
      </React.Fragment>
    );
  }

  private processAddUser(): void {
    const {firstName, lastName, email, venue} = this.props.users.tempUser;
    if (!firstName || !firstName.trim().length) {
      swal('Agregar usuario', 'El campo nombres es requerido', 'error');
    } else if (!lastName || !lastName.trim().length) {
      swal('Agregar usuario', 'El campo apellidos es requerido', 'error');
    } else if (!email || !email.trim().length) {
      swal('Agregar usuario', 'El campo email es requerido', 'error');
    } else if (!venue || !venue.trim().length) {
      swal('Agregar usuario', 'El campo sucursal es requerido', 'error');
    } else {
      statusFooterButttonsModal(true);
      this.props.AddUserAction();
    }
  }

  private editUser(user: IUser) {
    const {changeTempUser} = this;
    const {venues} = this.props.users;
    const tmpUser = {...user};
    tmpUser.venue = tmpUser.venue._id;
    changeTempUser(tmpUser);
    this.props.loadDataAction(
      'Editar Usuario',
      <div className={'row'}>
        <div className="col-md-12">
          <div className="form-group">
            <label>Nombres</label>
            <input type="text" className="form-control" maxLength={50} defaultValue={user.firstName}
                   onChange={(e: React.ChangeEvent<HTMLInputElement>) => changeTempUser({firstName: e.target.value})}/>
          </div>
        </div>
        <div className="col-md-12">
          <div className="form-group">
            <label>Apellidos</label>
            <input type="text" className="form-control" maxLength={50} defaultValue={user.lastName}
                   onChange={(e: React.ChangeEvent<HTMLInputElement>) => changeTempUser({lastName: e.target.value})}/>
          </div>
        </div>
        <div className="col-md-12">
          <div className="form-group">
            <label>Email</label>
            <input type="text" className="form-control" maxLength={100} defaultValue={user.email}
                   onChange={(e: React.ChangeEvent<HTMLInputElement>) => changeTempUser({email: e.target.value})}/>
          </div>
        </div>
        <div className="col-md-12">
          <div className="form-group">
            <label htmlFor="sel1">Sucursal</label>
            <select className="form-control" name="venue"
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => changeTempUser({venue: e.target.value})} defaultValue={user.venue._id}>
              <option value="">Seleccione venue</option>
              {
                venues.map((venue) => (
                  <option key={venue._id} value={venue._id}>{venue.name}</option>
                ))
              }
            </select>
          </div>
        </div>
      </div>,
      <React.Fragment>
        <button type="button" className="btn btn-default" data-dismiss="modal">Cancelar</button>
        <button type="button" className="btn btn-primary" onClick={this.processEditUser}>Editar</button>
      </React.Fragment>
    );
  }

  private processEditUser() {
    const {firstName, lastName, email, venue} = this.props.users.tempUser;
    // debugger;
    if (!firstName || !firstName.trim().length) {
      swal('Agregar usuario', 'El campo nombres es requerido', 'error');
    } else if (!lastName || !lastName.trim().length) {
      swal('Agregar usuario', 'El campo apellidos es requerido', 'error');
    } else if (!email || !email.trim().length) {
      swal('Agregar usuario', 'El campo email es requerido', 'error');
    } else if (!venue || !venue.trim().length) {
      swal('Agregar usuario', 'El campo sucursal es requerido', 'error');
    } else {
      statusFooterButttonsModal(true);
      this.props.editUserAction();
    }
  }

  private changeTempUser({_id, firstName, lastName, email, venue}: ITempUser) {
    const tempUser: ITempUser = {
      _id: _id ? _id : this.props.users.tempUser._id,
      firstName: firstName ? firstName : this.props.users.tempUser.firstName,
      lastName: lastName ? lastName : this.props.users.tempUser.lastName,
      email: email ? email : this.props.users.tempUser.email,
      venue: venue ? venue : this.props.users.tempUser.venue
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

  private changePage(page: number) {
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

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(UsersListView);
