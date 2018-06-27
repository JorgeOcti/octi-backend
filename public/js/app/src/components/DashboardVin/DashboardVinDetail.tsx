import * as Raven from 'raven-js';
import * as React from "react";
import {ErrorInfo} from "react";
import {Dispatch} from "redux";
import {RouteComponentProps} from "react-router";
import {connect} from "react-redux";
import {DashboardReduxAction, IDashboardState, getCarAction, getParticipant, loadParticipantInCarAction} from "../../actions/dashboard";
import AppContainer from "../../container/AppContainer";
import * as moment from "moment";
import * as PropTypes from "prop-types";
import ModalView from "../Modal/ModalView";
import * as io from "socket.io-client";
import {IParticipant} from "../../../../../../src/interfaces/participant.interface";
import {IWindow} from "../../interfaces/window";

declare let window: IWindow;

interface IPropsType extends RouteComponentProps<{ id: string }> {
  dispatch: Dispatch<DashboardReduxAction>;
  dashboard: IDashboardState;
  getCarAction(id: string): void;
  getParticipant(id: string): void;
  loadParticipantInCarAction(participant:IParticipant): void;
}

interface IStateType {
  error: Error | null;
  highlight: string[];
}

class DashboardVinDetail extends React.Component<IPropsType, IStateType> {

  private socket: SocketIOClient.Socket;

  state = {
    error: null,
    highlight: []
  };

  static propTypes = {
    dashboard: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    getCarAction: PropTypes.func.isRequired,
    getParticipant: PropTypes.func.isRequired,
  };

  componentWillMount(){
    // set the title of the page
    const {id} = this.props.match.params;
    document.title = 'OSA Andes | Detalle VIN';
    this.props.getCarAction(id);

    // socket
    this.socket = io.connect(`${location.protocol}//${location.host}`, {
      secure: location.protocol === 'https:',
      reconnection: true,
      query: {token: (window.user as any).token}
    });
    this.socket.on('connect', () => {
      this.socket.emit('join', {room: `dashboard-vin-detail-${id}`});
      this.socket.on('ADD_PARTICIPANT', (data: any): void => {
        this.setState({
          highlight: [data._id, ...this.state.highlight]
        });
        this.props.loadParticipantInCarAction(data);
      });
    })
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public componentWillUnmount(){
    // cancel request if component is inmounted
    if (this.props.dashboard.source) {
      this.props.dashboard.source.cancel('Operation canceled by the user.');
    }
    this.socket.disconnect();
  }

  public render(): React.ReactElement<IPropsType> {
    const {loading, car, loadingParticipant} = this.props.dashboard;
    const {highlight} = this.state;
    const {getParticipant} = this.props;
    return (
      <AppContainer title='' cMenu='1' cSubMenu='1.2' cAction={`Detalle`}>
        <section className="content">
          <div className="box">
            <div className="box-header with-border"><h3 className="box-title">Auto VIN {car ? car.vin : null}</h3>
              <div className="box-tools pull-right">
              </div>
            </div>
            <div className="box-body">
              <table style={{width: '50%'}}>
                <tbody>
                  <tr>
                    <td style={{padding:'5px'}}><strong>Último Checkeo</strong></td>
                    <td style={{padding:'5px'}}>
                      {
                        car && car.participants && `${moment(car.participants[0].createdAt).format('LLL')}`
                      }
                    </td>
                  </tr>
                  <tr>
                    <td style={{padding:'5px'}}><strong>Por</strong></td>
                    <td style={{padding:'5px'}}>
                      {
                        car && car.participants && car.participants[0].user ? `${car.participants[0].user.firstName} ${car.participants[0].user.lastName}` : ''
                      }
                    </td>
                  </tr>
                </tbody>
              </table>
              <h4>Detalle</h4>
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Formulario</th>
                    <th className="hidden-xs">Supervisor</th>
                    <th className="hidden-xs">Calificación</th>
                    <th className="width-10"/>
                  </tr>
                </thead>
                <tbody>
                {
                  car &&  car.participants && car.participants.map((participant) => (
                    <tr key={participant._id} className={highlight.length && highlight.includes(participant._id as never) ? 'highlight-info' : ''}>
                      <td className="middle">{moment(participant.createdAt).format('LLL')}</td>
                      <td className="middle">{participant.name}</td>
                      <td className="middle hidden-xs">{participant.user ? participant.user.firstName : ''} {participant.user ? participant.user.lastName : ''}</td>
                      <td className="middle hidden-xs">{Math.round(participant.qualification)}%</td>
                      <td className="middle pointer">
                        <button
                          className="btn btn-xs btn-primary"
                          disabled={loadingParticipant && loadingParticipant === participant._id ? true : false}
                          onClick={loadingParticipant ? () => {} : () => getParticipant(participant._id)}
                        >
                          {
                            loadingParticipant && loadingParticipant === participant._id ?
                              <i className="fa fa-spin fa-spinner"/>
                              :
                              <i className="fa fa-bar-chart"/>
                          }
                        </button>
                      </td>
                    </tr>
                  ))
                }
                </tbody>
              </table>
            </div>
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
}

const mapStateToProps = (state: { dashboard: IDashboardState }) => {
  return {
    dashboard: state.dashboard
  };
};

//loadParticipantInCarAction(participant:IParticipant): void;
const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    getCarAction: (id: string) => dispatch(getCarAction(id)),
    getParticipant: (id: string) => dispatch(getParticipant(id)),
    loadParticipantInCarAction: (participant:IParticipant) => dispatch(loadParticipantInCarAction(participant))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(DashboardVinDetail);
