///<reference path="../../../node_modules/sweetalert/typings/sweetalert.d.ts"/>
// import * as PropTypes from 'prop-types';
import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {ICompany} from '../../../../../../src/interfaces/company.interface';
import {IForm} from '../../../../../../src/interfaces/form.interface';
import {IPermission} from '../../../../../../src/interfaces/permision.interface';
import {IUser} from '../../../../../../src/interfaces/user.interface';
import {IVenue} from '../../../../../../src/interfaces/venue.interface';
import {IUsersState} from '../../actions/users.actions';

interface IPropsType {
  users: IUsersState;
  venues: IVenue[];
  forms: IForm[];
  permissions: IPermission[];
  companies: ICompany[];
  user?: IUser;
  create: boolean;
  changeTempUser(user: any): void;
}

interface IStateType {
  error: Error | null;
}

class UserFormView extends React.Component<IPropsType, IStateType> {

  // static propTypes = {
  //   venues: PropTypes.array.isRequired,
  //   changeTempUser: PropTypes.func.isRequired
  // };

  readonly state = {
    error: null
  };

  constructor(props: IPropsType) {
    super(props);
    this.addPermission = this.addPermission.bind(this);
    this.deletePermission = this.deletePermission.bind(this);
    this.addForm = this.addForm.bind(this);
    this.deleteForm = this.deleteForm.bind(this);
  }

  public componentDidMount() {
    const {changeTempUser, companies} = this.props;
    const chosenOptions = {
      no_results_text: 'Sin resultados para:'
    };
    ($('#id-forms') as any).chosen(chosenOptions).change((e: React.ChangeEvent<HTMLSelectElement>) => {
      this.addForm(e.target.value);
    });
    ($('#id-form-default') as any).chosen(chosenOptions).change((e: React.ChangeEvent<HTMLSelectElement>) => {
      changeTempUser({preferred: e.target.value});
    });
    ($('#id-venue') as any).chosen(chosenOptions).change((e: React.ChangeEvent<HTMLSelectElement>) => {
      changeTempUser({venue: e.target.value});
    });
    ($('#id-company') as any).chosen(chosenOptions).change((e: React.ChangeEvent<HTMLSelectElement>) => {
      changeTempUser({company: companies.find((company) => company._id === e.target.value)});
    });
    ($('#id-permissions') as any).chosen(chosenOptions).change((e: React.ChangeEvent<HTMLSelectElement>) => {
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
    $('#id-forms').trigger('chosen:updated');
    $('#id-form-default').trigger('chosen:updated');
    $('#id-venue').trigger('chosen:updated');
    $('#id-permissions').trigger('chosen:updated');
    $('#id-company').trigger('chosen:updated');
  }

  public render(): React.ReactElement<IPropsType> {
    const {changeTempUser, venues, permissions, forms, create, companies} = this.props;
    const {tempUser} = this.props.users;
    const userPermissions: IPermission[] = [];
    const selectPermissions: IPermission[] = [];
    const userForms: IForm[] = [];
    const selectForms: IForm[] = [];
    const idsUserPermissions = tempUser && tempUser.userPermissions.length ? tempUser.userPermissions.map((userPermission) => userPermission._id) : [];
    const idsUserForms = tempUser && tempUser.userForms.length ? tempUser.userForms.map((userForm) => userForm._id) : [];
    permissions.forEach((permission) => {
      if (idsUserPermissions.includes(permission._id)) {
        userPermissions.push(permission);
      } else {
        selectPermissions.push(permission);
      }
    });
    forms.forEach((form) => {
      if (idsUserForms.includes(form._id)) {
        userForms.push(form);
      } else {
        selectForms.push(form);
      }
    });
    return (
      <React.Fragment>
        <ul className="nav nav-tabs" style={{marginBottom: '15px'}}>
          <li className="active"><a data-toggle="tab" href="#general">General</a></li>
          <li><a data-toggle="tab" href="#permissions">Permisos</a></li>
          <li><a data-toggle="tab" href="#access">Accesos</a></li>
        </ul>
        <div className="tab-content">
          <div id="general" className="tab-pane fade in active">
            <div className="row">
              <div className="col-md-12">
                <div className="form-group">
                  <label>Nombres</label>
                  <input
                    type="text"
                    name="firstName"
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
                    disabled={!create}
                    className="form-control"
                    maxLength={80}
                    defaultValue={tempUser ? tempUser.email : undefined}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => changeTempUser({email: e.target.value})}
                  />
                </div>
              </div>
              <div className="col-md-12">
                <div className="form-group">
                  <label htmlFor="id-company">Empresa</label>
                  <select
                    className="chosen-select form-control"
                    id="id-company"
                    name="venue"
                    defaultValue={tempUser && tempUser.company ? tempUser.company._id : undefined}
                    onChange={undefined}
                    data-placeholder={'Seleccione empresa'}
                  >
                    <option value="" />
                    {
                      companies.map((company) => (
                        <option key={company._id} value={company._id}>{company.name}</option>
                      ))
                    }
                  </select>
                </div>
              </div>
              <div className="col-md-12">
                <div className="form-group">
                  <label htmlFor="id-venue">Sucursal</label>
                  <select
                    className="chosen-select form-control"
                    id="id-venue"
                    name="venue"
                    defaultValue={tempUser && tempUser.venue ? tempUser.venue : undefined}
                    onChange={undefined}
                    data-placeholder={'Seleccione sucursal'}
                  >
                    <option value="" />
                    {
                      venues
                        .filter((venue) => (
                          venue.company && tempUser.company && tempUser.company._id === venue.company._id
                        ))
                        .map((venue) => (
                          <option key={venue._id} value={venue._id}>{venue.name}</option>
                        ))
                    }
                  </select>
                </div>
              </div>
              <div className="col-md-12">
                <div className="form-group">
                  <label>Formularios</label>
                  <select
                    id="id-forms"
                    className="chosen-select form-control"
                    style={{minWidth: '200px'}}
                    onChange={undefined}
                    data-placeholder={'Seleccione formularios'}
                  >
                    <option value="" />
                    {
                      selectForms.map((form) => {
                        return (
                          <option key={form._id} value={form._id}>{form.name}</option>
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
                    <th style={{width: '90%'}}>Name</th>
                    <th style={{width: '10%'}}/>
                  </tr>
                  </thead>
                  <tbody>
                  {
                    userForms.length ? userForms.map((form: any) => {
                        return (
                          <tr key={form._id}>
                            <td>{form.name}</td>
                            <td className="text-center text-red pointer" onClick={() => this.deleteForm(form._id)}><i
                              className="fa fa-minus-circle"/></td>
                          </tr>
                        );
                      }) :
                      <tr>
                        <td colSpan={2}>Aún no se han seleccionado permisos.</td>
                      </tr>
                  }
                  </tbody>
                </table>
              </div>
              <div className="col-md-12">
                <div className="form-group">
                  <label>Formulario por defecto</label>
                  <select
                    id="id-form-default"
                    className="chosen-select form-control"
                    style={{minWidth: '200px'}}
                    defaultValue={tempUser && tempUser.preferred ? tempUser.preferred : undefined}
                    onChange={undefined}
                    data-placeholder={'Seleccione formularios'}
                  >
                    <option value="" />
                    {
                      userForms.map((form) => {
                        return (
                          <option key={form._id} value={form._id}>{form.name}</option>
                        );
                      })
                    }
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div id="permissions" className="tab-pane fade">
            <div className="row">
              <div className="col-md-12">
                <div className="form-group">
                  <label>Permisos</label>
                  <select
                    id="id-permissions"
                    className="chosen-select form-control"
                    style={{minWidth: '200px'}}
                    data-placeholder={'Seleccione permiso'}
                  >
                    <option value="" />
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
          </div>
          <div id="access" className="tab-pane fade">
          </div>
        </div>
      </React.Fragment>
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

  private addForm(id: string) {
    const {changeTempUser} = this.props;
    const {tempUser} = this.props.users;
    const {forms} = this.props;
    const findForm = forms.find((form) => form._id === id);
    if (findForm) {
      changeTempUser({
        userForms: [findForm, ...tempUser.userForms]
      });
    }
  }

  private deleteForm(id: string) {
    const {changeTempUser} = this.props;
    const {tempUser} = this.props.users;
    changeTempUser({
      userForms: tempUser ? tempUser.userForms.filter((form) => form._id !== id) : []
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
