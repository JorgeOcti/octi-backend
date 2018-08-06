///<reference path="../../../node_modules/sweetalert/typings/sweetalert.d.ts"/>
import * as PropTypes from 'prop-types';
import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {IPermission} from '../../../../../../src/interfaces/permision.interface';
import {IUser} from '../../../../../../src/interfaces/user.interface';
import {IUsersState} from '../../actions/users';

interface IPropsType {
  users: IUsersState;
  venues: any[];
  permissions: any[];
  user?: IUser;
  changeTempUser(user: any): void;
}

interface IStateType {
  error: Error | null;
}

class UserFormView extends React.Component<IPropsType, IStateType> {

  static propTypes = {
    venues: PropTypes.array.isRequired,
    changeTempUser: PropTypes.func.isRequired
  };

  readonly state = {
    error: null
  };

  constructor(props: IPropsType) {
    super(props);
    this.addPermission = this.addPermission.bind(this);
    this.deletePermission = this.deletePermission.bind(this);
  }

  public componentDidMount() {
    ($('#permission-select') as any).chosen().change((e: React.ChangeEvent<HTMLSelectElement>) => {
      this.addPermission(e.target.value);
    });
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  componentDidUpdate() {
    $('#permission-select').trigger('chosen:updated');
  }

  public render(): React.ReactElement<IPropsType> {
    const {changeTempUser, venues, permissions} = this.props;
    const {tempUser} = this.props.users;
    const userPermissions: IPermission[] = [];
    const selectPermissions: IPermission[] = [];
    const idsUserPermissions = tempUser && tempUser.userPermissions.length ? tempUser.userPermissions.map((userPermission) => userPermission._id) : [];
    permissions.forEach((permission) => {
      if (idsUserPermissions.includes(permission._id)) {
        userPermissions.push(permission);
      } else {
        selectPermissions.push(permission);
      }
    });
    return (
      <div className="row">
        <div className="col-md-12">
          <div className="form-group">
            <label>Nombres</label>
            <input
              type="text"
              name="fistName"
              className="form-control"
              maxLength={50}
              defaultValue={tempUser ? tempUser.firstName : undefined}
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
              defaultValue={tempUser ? tempUser.lastName : undefined}
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
              defaultValue={tempUser ? tempUser.email : undefined}
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
              defaultValue={tempUser && tempUser.venue ? tempUser.venue : undefined}
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
        <div className="col-md-12">
          <label>Permisos</label>
          <div className="form-group">
            <select id="permission-select" className="form-control" style={{minWidth: '200px'}} onChange={undefined}>
              <option value="">Selecciones permiso</option>
              {
                selectPermissions.map((permission) => {
                  return (
                    <option key={permission._id} value={permission._id}>{permission.name}</option>
                  );
                })
              }
            </select>
          </div>
        </div>
        <div className="col-md-12">
          <table className="table table-striped">
            <thead>
              <tr>
                <th style={{width: '20%'}}>Code</th>
                <th style={{width: '70%'}}>Name</th>
                <th style={{width: '10%'}}/>
              </tr>
            </thead>
            <tbody>
            {
              userPermissions.length ? userPermissions.map((permission: any) => {
                  return (
                    <tr key={permission._id}>
                      <td>{permission.codeName}</td>
                      <td>{permission.name}</td>
                      <td className="text-center text-red pointer" onClick={() => this.deletePermission(permission._id)}><i
                        className="fa fa-minus-circle"/></td>
                    </tr>
                  );
                }) :
                <tr>
                  <td colSpan={3}>Aún no se han seleccionado permisos.</td>
                </tr>
            }
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  private addPermission(id: string) {
    const {changeTempUser} = this.props;
    const {tempUser} = this.props.users;
    const {permissions} = this.props;
    const findPermision = permissions.find((permission) => permission._id === id);
    if (findPermision) {
      changeTempUser({
        userPermissions: [findPermision, ...tempUser.userPermissions]
      });
    }
  }

  private deletePermission(id: string) {
    const {changeTempUser} = this.props;
    const {tempUser} = this.props.users;
    changeTempUser({
      userPermissions: tempUser ? tempUser.userPermissions.filter((permission) => permission._id !== id) : []
    });
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
    dispatch
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(UserFormView);
