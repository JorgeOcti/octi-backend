///<reference path="../../../node_modules/sweetalert/typings/sweetalert.d.ts"/>
import * as PropTypes from 'prop-types';
import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {IUser} from '../../../../../../src/interfaces/user.interface';

interface IPropsType {
  users: IUser[];
  changeTempAlert: (tempAlert: ITempAlert) => void;
}

interface ITempAlert {
  name: string;
  gte: number;
  lte: number;
  users: string[];
  type: string;
}

interface IStateType {
  error: Error | null;
  tempAlert: ITempAlert;
  currentUser: string;
}

class AlertFormView extends React.Component<IPropsType, IStateType> {

  static propTypes = {
    users: PropTypes.array.isRequired
  };

  readonly state = {
    error: null,
    currentUser: '',
    tempAlert: {
      name: '',
      type: 'lte',
      gte: 0,
      lte: 0,
      users: []
    }
  };

  constructor(props: IPropsType) {
    super(props);
    this.onChangeSelectUser = this.onChangeSelectUser.bind(this);
    this.addUser = this.addUser.bind(this);
    this.changeQualification = this.changeQualification.bind(this);
    this.onChangeType = this.onChangeType.bind(this);
    this.onChangeName = this.onChangeName.bind(this);
    this.deleteUser = this.deleteUser.bind(this);
  }

  public componentDidMount() {
    ($('#user-select') as any).chosen().change((e: React.ChangeEvent<HTMLSelectElement>) => {
      this.onChangeSelectUser(e);
      // console.log(e.target.value)
    });
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  componentDidUpdate() {
    $('#user-select').trigger('chosen:updated');
    this.props.changeTempAlert(this.state.tempAlert);
  }

  public render(): React.ReactElement<IPropsType> {
    const { users } = this.props;
    const { tempAlert } = this.state;
    const usersToNotify = users.filter((user) => (tempAlert.users as string[]).includes(user._id));
    return (
      <div className={'row'}>
        <div className="col-md-12">
          <div className="form-group">
            <label>Nombre</label>
            <input
              type="text"
              className="form-control"
              maxLength={200}
              onChange={this.onChangeName}
            />
          </div>
        </div>
        <div className="col-md-12">
          <div className="form-group">
            <label>Usuarios a notificar</label>
            <select id="user-select" className="form-control" style={{minWidth: '200px'}} onChange={this.onChangeSelectUser}>
              <option value="">Selecciones usuarios.</option>
              {
                users.filter((user) => !(tempAlert.users as string[]).includes(user._id)).map((user) => {
                  return (
                    <option key={user._id} value={user._id}>{user.firstName} {user.lastName} {`<${user.email}>`}</option>
                  );
                })
              }
            </select>
            {/*<span className="input-group-btn">*/}
              {/*<button className="btn btn-success" onClick={this.addUser}>agregar</button>*/}
            {/*</span>*/}
          </div>
        </div>
        <div className="col-md-12">
          <table className="table table-striped">
            <thead>
              <tr>
                <th style={{width: '40%'}}>Nombre</th>
                <th style={{width: '50%'}}>Email</th>
                <th style={{width: '10%'}}/>
              </tr>
            </thead>
            <tbody>
            {
              usersToNotify.length ? usersToNotify.map((user) => {
                return (
                  <tr key={user._id}>
                    <td>{user.firstName} {user.lastName}</td>
                    <td>{user.email}</td>
                    <td className="text-center text-red pointer" onClick={() => this.deleteUser(user._id)}><i className="fa fa-minus-circle"/></td>
                  </tr>
                );
                }) :
              <tr>
                <td colSpan={3}>Aún no se han seleccionado usuarios.</td>
              </tr>
            }
            </tbody>
          </table>
        </div>
        <div className="col-md-12">
          <div className="form-group" style={{marginBottom: '0px'}}>
            <label>Notificar cuando la calificación sea:</label>
          </div>
          <div>
            <label className="radio-inline">
              <input type="radio" value="lte" checked={this.state.tempAlert.type === 'lte'} onChange={this.onChangeType}/>
              Menor igual que
            </label>
            <label className="radio-inline">
              <input type="radio" value="gte" checked={this.state.tempAlert.type === 'gte'} onChange={this.onChangeType}/>
              Mayor igual que
            </label>
            <input
              type="text"
              className="form-control"
              maxLength={4}
              onChange={this.changeQualification}
              value={this.state.tempAlert.type === 'gte' ? this.state.tempAlert.gte : this.state.tempAlert.lte}
              style={{marginTop: '10px'}}
            />
          </div>
        </div>
      </div>
    );
  }

  private onChangeName(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      tempAlert: {
        ...this.state.tempAlert,
        name: e.target.value.trim()
      }
    });
  }

  private changeQualification(e: React.ChangeEvent<HTMLInputElement>) {
    const pattern = new RegExp(/[^\d]/g);
    const value = e.target.value.replace(pattern, '');
    if (value && value.length) {
      const numberValue = parseInt(value, 10);
      this.setState({
        tempAlert: {
          ...this.state.tempAlert,
          [this.state.tempAlert.type]: numberValue > 100 ? 100 : numberValue
        }
      });
    } else {
      this.setState({
        tempAlert: {
          ...this.state.tempAlert,
          [this.state.tempAlert.type]: ''
        }
      });
    }
  }

  private onChangeType(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      tempAlert: {
        ...this.state.tempAlert,
        type: e.target.value,
        gte: e.target.value === 'gte' ? this.state.tempAlert.lte : 0,
        lte: e.target.value === 'gte' ? 0 : this.state.tempAlert.gte
      }
    });
  }

  private onChangeSelectUser(e: React.ChangeEvent<HTMLSelectElement>) {
    if (e.target.value) {
      this.setState({
        currentUser: e.target.value
      }, () => this.addUser());
    }
  }

  private deleteUser(id: string) {
    this.setState({
      tempAlert: {
        ...this.state.tempAlert,
        users: this.state.tempAlert.users.filter((user) => id !== user)
      }
    });
  }

  private addUser() {
    if (this.state.currentUser && this.state.currentUser.length) {
      this.setState({
        currentUser: '',
        tempAlert: {
          ...this.state.tempAlert,
          users: [this.state.currentUser, ...this.state.tempAlert.users]
        }
      });
    }
  }
}

export default AlertFormView;
