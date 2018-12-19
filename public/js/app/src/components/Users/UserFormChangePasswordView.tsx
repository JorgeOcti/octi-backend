///<reference path="../../../node_modules/sweetalert/typings/sweetalert.d.ts"/>
import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {IUser} from '../../../../../../src/interfaces/user.interface';
import {IUsersState} from '../../actions/users.actions';

interface IPropsType {
  users: IUsersState;
  user?: IUser;
  changeTempUser(user: any): void;
}

interface IStateType {
  error: Error | null;
  type: string;
}

class UserFormChangePasswordView extends React.Component<IPropsType, IStateType> {

  readonly state = {
    error: null,
    type: 'password'
  };

  constructor(props: IPropsType) {
    super(props);
    this.changeType = this.changeType.bind(this);
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public render(): React.ReactElement<IPropsType> {
    const {changeTempUser} = this.props;
    const {tempUser} = this.props.users;

    return (
      <div className="row">
        <div className="col-md-12">
          <div className="form-group">
            <label>Nueva Contraseña</label>
            <div className="input-group">
              <input
                type={this.state.type}
                className="form-control"
                defaultValue={tempUser ? tempUser.password : undefined}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => changeTempUser({password: e.target.value})}
              />
              <span className="input-group-addon pointer" onClick={this.changeType}><i className={`fa ${this.state.type === 'text' ? 'fa-eye-slash' : 'fa-eye'}`} /></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  private changeType() {
    this.setState({
      type: this.state.type === 'text' ? 'password' : 'text'
    });
  }
}

const mapStateToProps = (state: { users: IUsersState }) => {
  return {
    users: state.users
  };
};

const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(UserFormChangePasswordView);
