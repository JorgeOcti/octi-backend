import * as Raven from 'raven-js';
import * as React from 'react';
import {Dispatch, ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import * as io from 'socket.io-client';
import AppContainer from '../../container/AppContainer';
import {IWindow} from '../../interfaces/window';
import TrackingBasePage from "../Utils/TrackingBasePage";
import TransmittalActions from "../../actions/transmittal.actions";
import {ITransmittalActionTypes, ITransmittalState} from "../../actions/transmittal.types";
import TransmittalForm from './TransmittalForms/TransmittalForm'
import {submit} from "redux-form";

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<ITransmittalActionTypes>;
  transmittal: ITransmittalState;
  transmittalActions: TransmittalActions
}

interface IStateType {
  error: Error | null;
  exporing: boolean;
}

declare let window: IWindow;

class TransmittalCreateView extends TrackingBasePage<IPropsType, IStateType> {
  title: string;

  readonly state = {
    error: null,
    exporing: false
  };

  private socket: SocketIOClient.Socket;

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Transporte';
    this.processForm = this.processForm.bind(this);
    this.cancel = this.cancel.bind(this);
    this.submitForm = this.submitForm.bind(this);
  }

  public componentWillMount(): void {
    // socket
    this.socket = io.connect(`${location.protocol}//${location.host}`, {
      secure: location.protocol === 'https:',
      transports: ['websocket'],
      reconnection: true,
      query: {
        token: window.user.token
      }
    });

    this.socket.on('connect', () => {
      this.socket.emit('join', {
        room: `distribution-create-${window.user.team._id}`
      });
    });
  }

  public componentDidMount(): void {
    super.componentDidMount();
    window.scrollTo(0, 0);
  }

  public componentDidUpdate(prevProps: IPropsType): void {
    $('[data-toggle="tooltip"]').tooltip();
  }

  public componentWillUnmount(): void {
    // cancel request if component is inmounted
    if (this.props.transmittal.source) {
      this.props.transmittal.source.cancel('Operation canceled by the user.');
    }
    this.socket.emit('leave', {room: `distribution-create-${window.user.team._id}`});
    this.socket.disconnect();
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public render(): React.ReactElement<IPropsType> {
    const {transmittalActions} = this.props;
    const {loading} = this.props.transmittal;
    return (
      <AppContainer title="" cMenu="3" cSubMenu="3.4" cAction="Crear Order">
        <section className="content">
          <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">Crear Order</h3>
            </div>
            <div className="box-body">
              <TransmittalForm
                initialValues={{}}
                onSubmit={this.processForm}
              />
            </div>
            <div className="box-footer text-right">
              <button type="button" className="btn btn-sm btn-default" onClick={this.cancel}>Cancelar</button>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                style={{marginLeft: '5px'}}
                onClick={this.submitForm}
              >
                Editar
              </button>
            </div>
            {
              loading &&
              <div className="overlay">
                <i className="fa fa-spinner fa-spin text-purple"/>
              </div>
            }
          </div>
        </section>
      </AppContainer>
    );
  }

  private submitForm() {
    this.props.dispatch(submit('transmittalForm'))
  }

  private cancel(): void {
    this.props.history.push('/transmittals/');
  }

  private processForm(data: any) {
    console.log(data);
  }

}

const mapStateToProps = (state: { transmittal: ITransmittalState }) => {
  return {
    transmittal: state.transmittal
  };
};

const mapDispatchToProps = (dispatch: any) => {
  const transmittalActions = new TransmittalActions(dispatch);
  return {
    dispatch,
    transmittalActions
  };
};


export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(TransmittalCreateView);
