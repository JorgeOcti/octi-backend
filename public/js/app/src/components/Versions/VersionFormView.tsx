import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {IUser} from '../../../../../../src/interfaces/user.interface';

interface IPropsType {
  changeTempVersion: (tempVersion: ITempVersion) => void;
}

interface ITempVersion {
  ios: string;
  android: string;
}

interface IStateType {
  error: Error | null;
  tempVersion: ITempVersion;
  currentUser: string;
}

class VersionFormView extends React.Component<IPropsType, IStateType> {

  readonly state = {
    error: null,
    currentUser: '',
    tempVersion: {
      description: '',
      ios: '',
      android: ''
    }
  };

  constructor(props: IPropsType) {
    super(props);
    this.onChangeDescription = this.onChangeDescription.bind(this);
    this.onChangeiOS = this.onChangeiOS.bind(this);
    this.onChangeAndroid = this.onChangeAndroid.bind(this);
  }


  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  componentDidUpdate() {
    this.props.changeTempVersion(this.state.tempVersion);
  }

  public render(): React.ReactElement<IPropsType> {
    return (
      <div className={'row'}>
        <div className="col-md-12">
          <div className="form-group">
            <label>Descripción</label>
            <input
              type="text"
              className="form-control"
              maxLength={200}
              onChange={this.onChangeDescription}
            />
          </div>
        </div>
        <div className="col-md-12">
          <div className="form-group">
            <label>iOS</label>
            <input
              type="text"
              className="form-control"
              maxLength={200}
              onChange={this.onChangeiOS}
            />
          </div>
        </div>
        <div className="col-md-12">
          <div className="form-group">
            <label>Android</label>
            <input
              type="text"
              className="form-control"
              maxLength={200}
              onChange={this.onChangeAndroid}
            />
          </div>
        </div>
      </div>
    );
  }

  private onChangeDescription(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      tempVersion: {
        ...this.state.tempVersion,
        description: e.target.value.trim()
      }
    });
  }

  private onChangeiOS(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      tempVersion: {
        ...this.state.tempVersion,
        ios: e.target.value.trim()
      }
    });
  }

  private onChangeAndroid(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      tempVersion: {
        ...this.state.tempVersion,
        android: e.target.value.trim()
      }
    });
  }

}

export default VersionFormView;
