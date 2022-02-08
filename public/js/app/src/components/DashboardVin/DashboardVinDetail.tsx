// import * as PropTypes from 'prop-types';
import * as moment from 'moment';
import * as Raven from 'raven-js';
import {ErrorInfo} from 'react';
import * as React from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import * as io from 'socket.io-client';
import {IParticipant} from '../../../../../../src/form/interfaces/participant.interface';
import {
  DashboardReduxAction,
  getCarAction,
  getParticipant,
  IDashboardState,
  loadParticipantInCarAction
} from '../../actions/dashboard.actions';
import AppContainer from '../../container/AppContainer';
import {IWindow} from '../../interfaces/window';
import ModalView from '../Modal/ModalView';
import TrackingBasePage from '../Utils/TrackingBasePage';
import ShowIf from '../Utils/ShowIf';
import { parseReplicableURL } from '../../utils/common';

declare let window: IWindow;

interface IPropsType extends RouteComponentProps<{ id: string }> {
  dispatch: Dispatch<DashboardReduxAction>;
  dashboard: IDashboardState;
  getCarAction(id: string): void;
  getParticipant(id: string): void;

  loadParticipantInCarAction(participant: IParticipant): void;
}

interface IStateType {
  error: Error | null;
  highlight: string[];
  carLoading: string;
}

class DashboardVinDetail extends TrackingBasePage<IPropsType, IStateType> {
  title: string;

  // static propTypes = {
  //   dashboard: PropTypes.object.isRequired,
  //   dispatch: PropTypes.func.isRequired,
  //   getCarAction: PropTypes.func.isRequired,
  //   getParticipant: PropTypes.func.isRequired
  // };

  constructor(props : IPropsType) {
    super(props);
    this.title = 'Detalle VIN';
    this.openBlank = this.openBlank.bind(this);
  }

  readonly state = {
    error: null,
    highlight: [],
    carLoading: ''
  };
  protected printIframe: any;

  private socket: SocketIOClient.Socket;

  componentWillMount() {
    // set the title of the page
    const { id } = this.props.match.params;
    this.props.getCarAction(id);

    // socket
    this.socket = io.connect(`${location.protocol}//${location.host}`, {
      secure: location.protocol === 'https:',
      transports: ['websocket'],
      reconnection: true,
      query: {
        token: (window.user as any).token
      }
    });
    this.socket.on('connect', () => {
      this.socket.emit('join', { room: `dashboard-vin-detail-${window.user.team._id}-${id}` });
    });
    this.socket.on('ADD_PARTICIPANT', (data: any): void => {
      this.setState({
        highlight: [data._id, ...this.state.highlight]
      });
      this.props.loadParticipantInCarAction(data);
    });

  }

  componentDidMount() {
    super.componentDidMount();
  }

  public printPdf(url: string, carLoading: string) {
    this.setState({carLoading});
    let iframe: any = this.printIframe;
    const timezone = moment.tz.guess();
    if (!this.printIframe) {
      iframe = this.printIframe = document.createElement('iframe');
      document.body.appendChild(iframe);
      iframe.style.display = 'none';
      iframe.onload = () => {
        setTimeout(() => {
          iframe.focus();
          iframe.contentWindow.print();
          this.setState({carLoading: ''});
          // document.body.removeChild(iframe)
        }, 1);
      };
    }
    iframe.src = `${url}?timezone=${timezone}`;
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public componentWillUnmount() {
    // cancel request if component is inmounted
    if (this.props.dashboard.source) {
      this.props.dashboard.source.cancel('Operation canceled by the user.');
    }
    this.socket.disconnect();
  }

  public render(): React.ReactElement<IPropsType> {
    const {loading, car, loadingParticipant, requests} = this.props.dashboard;
    const {highlight, carLoading} = this.state;
    const {getParticipant} = this.props;
    return (
      <AppContainer title="" cMenu="1" cSubMenu="1.2" cAction={`Detalle`}>
        <section className="content">
          <div className="box">
            <div className="box-header with-border"><h3 className="box-title">Detalle VIN {car ? car.vin : null}</h3>
              <div className="box-tools pull-right">
              </div>
            </div>
            <div className="box-body">
              <table style={{width: '100%'}}>
                <tbody>
                  <tr>
                    <td style={{padding: '5px'}}><strong>Último Checkeo</strong></td>
                    <td style={{padding: '5px'}}>
                      {
                        car && car.participants && `${moment(car.participants[0].createdAt).format('LLL')}`
                      }
                    </td>
                  </tr>
                  <tr>
                    <td style={{padding: '5px'}}><strong>Por</strong></td>
                    <td style={{padding: '5px'}}>
                      {
                        car && car.participants && car.participants[0].user ? `${car.participants[0].user.firstName} ${car.participants[0].user.lastName}` : '-'
                      }
                    </td>
                  </tr>
                <tr>
                    <td style={{padding: '5px'}}><strong>Marca</strong></td>
                    <td style={{padding: '5px'}}>
                      {
                        car && car.brand ? car.brand : '-'
                      }
                    </td>
                  </tr>
                <tr>
                    <td style={{padding: '5px'}}><strong>Denominación</strong></td>
                    <td style={{padding: '5px'}}>
                      {
                        car && car.denomination ? car.denomination : '-'
                      }
                    </td>
                  </tr>
                </tbody>
              </table>
              <h4>Detalle</h4>
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th className="middle">Nº</th>
                    <th className="middle">Fecha</th>
                    <th className="middle">Formulario</th>
                    <th className="middle hidden-xs">Supervisor</th>
                    <th className="middle hidden-xs">Sucursal</th>
                    <th className="middle-center hidden-xs">Calificación</th>
                    <th className="width-10"/>
                    <th className="width-10"/>
                  </tr>
                </thead>
                <tbody>
                {
                  car &&  car.participants && car.participants.map((participant) => (
                    <tr key={participant._id} className={highlight.length && highlight.includes(participant._id as never) ? 'highlight-info' : ''}>
                      <td className="middle">{participant.number}</td>
                      <td className="middle">{moment(participant.createdAt).format('LLL')}</td>
                      <td className="middle">{participant.name}</td>
                      <td className="middle hidden-xs">{participant.user ? participant.user.firstName : ''} {participant.user ? participant.user.lastName : ''}</td>
                      <td className="middle hidden-xs">{participant.venue ? participant.venue.name : '-'}</td>
                      <td className="middle-center hidden-xs">
                        <ShowIf
                          condition={!!(participant.hasOwnProperty('qualification') && participant.qualification)}
                          alternative={'-'}
                        >
                          {`${Math.round(participant.qualification)}%`}
                        </ShowIf>
                        <ShowIf
                          condition={participant.hasDamages}
                        >
                          <React.Fragment>
                            {' '}<i
                            className='fa fa-warning text-red'
                            data-toggle='tooltip'
                            data-placement='top'
                            title='Daños encontrados en esta revisión.'
                          />
                          </React.Fragment>
                        </ShowIf>
                      </td>
                      <td className="text-primary middle-center">
                        <button
                          className="btn btn-xs btn-default"
                          disabled={carLoading === participant._id}
                          onClick={() => this.printPdf(`/report/forms/pdf/${participant._id}.pdf`, participant._id)}
                        ><i className={carLoading === participant._id ? 'fa fa-spinner fa-spin' : 'fa fa-print'}/></button>
                      </td>
                      <td className="middle pointer">
                        <button
                          className="btn btn-xs btn-primary"
                          disabled={!!(loadingParticipant && loadingParticipant === participant._id)}
                          onClick={loadingParticipant ? undefined : () => getParticipant(participant._id)}
                        >
                          <ShowIf
                            condition={!!(loadingParticipant && loadingParticipant === participant._id)}
                            alternative={<i className="fa fa-bar-chart"/>}
                          >
                            <i className="fa fa-spin fa-spinner"/>
                          </ShowIf>
                        </button>
                      </td>
                    </tr>
                  ))
                }
                </tbody>
              </table>
              <h4>Solicitudes</h4>
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th className="middle">Nº</th>
                    <th className="middle">Estado</th>
                    <th className="middle">Solicitante</th>
                    <th className="middle">Vendedor</th>
                    <th className="middle">Cliente</th>
                    <th className="middle">RUT Cliente</th>
                    <th className="middle">Correo</th>
                    <th className="middle-center">Ticket</th>
                    <th className="middle">Nº Ticket</th>
                    <th className="middle">Sucursal</th>
                  </tr>
                </thead>
                <tbody>
                {
                  requests.map((request) => {
                    return (
                      <tr key={request._id}>
                        <td>
                          <a
                            href={parseReplicableURL(`/requests/vehicles/${request.request._id}/`)}
                            target='_blank'
                            style={{
                              textDecoration: 'underline'
                            }}
                          >#{request.request.number} <i className='fa fa-fw fa-share-alt-square' /></a>
                        </td>
                        <td>{request.status?.name}</td>
                        <td>{request.request.createdBy ? `${request.request.createdBy.firstName} ${request.request.createdBy.lastName}` : ''}</td>
                        <td>{request.request.sellerText}</td>
                        <td>{request.request?.customerInformation?.name}</td>
                        <td>{request.request?.customerInformation?.rut}</td>
                        <td>{request.request?.customerInformation?.email}</td>
                        <td className='middle-center'>
                          {
                            request.request?.advancePaymentInformation?.files?.length ?
                              <i
                                className='fa fa-check-circle text-green pointer'
                                onClick={() => this.openBlank(request.request.advancePaymentInformation.files[0].file.url)}
                              /> : ''
                          }
                        </td>
                        <td className='middle'>{request.request?.advancePaymentInformation?.number}</td>
                        <td>{request.destination?.name}</td>
                      </tr>
                    )
                  })
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

  private openBlank(url: string) {
    window.open(url, '_blank');
  }
}

const mapStateToProps = (state: { dashboard: IDashboardState }) => {
  return {
    dashboard: state.dashboard
  };
};

const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    getCarAction: (id: string) => dispatch(getCarAction(id)),
    getParticipant: (id: string) => dispatch(getParticipant(id)),
    loadParticipantInCarAction: (participant: IParticipant) => dispatch(loadParticipantInCarAction(participant))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(DashboardVinDetail);
