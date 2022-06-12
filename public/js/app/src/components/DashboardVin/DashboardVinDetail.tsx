// import * as PropTypes from 'prop-types';
import * as moment from 'moment-timezone';
import * as Raven from 'raven-js';
import { ErrorInfo } from 'react';
import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { Dispatch } from 'redux';
import { io } from 'socket.io-client';
import { Socket } from 'socket.io-client/build/esm/socket';

import { IParticipant } from '../../../../../../src/form/interfaces/participant.interface';
import {
  DashboardReduxAction,
  getCarAction,
  getParticipant,
  IDashboardState,
  loadParticipantInCarAction
} from '../../actions/dashboard.actions';
import AppContainer from '../../container/AppContainer';
import { IWindow } from '../../interfaces/window';
import ModalView from '../Modal/ModalView';
import TrackingBasePage from '../Utils/TrackingBasePage';
import ShowIf from '../Utils/ShowIf';
import { parseReplicableURL } from '../../utils/common';
import CopyText from '../Utils/CopyText';

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

  constructor(props: IPropsType) {
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

  private socket: Socket;

  componentWillMount() {
    // set the title of the page
    const { id } = this.props.match.params;
    this.props.getCarAction(id);

    // socket
    this.socket = io(`${location.protocol}//${location.host}`, {
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
    this.setState({ carLoading });
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
          this.setState({ carLoading: '' });
          // document.body.removeChild(iframe)
        }, 1);
      };
    }
    iframe.src = `${url}?timezone=${timezone}`;
  }

  public componentDidUpdate(prevProps: Readonly<IPropsType>, prevState: Readonly<IStateType>, snapshot?: any): void {
    $('[data-toggle="tooltip"]').tooltip();
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error });
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
    const { loading, car, loadingParticipant, requests } = this.props.dashboard;
    const { highlight, carLoading } = this.state;
    const { getParticipant } = this.props;
    return (
      <AppContainer title={`Detalle ${car ? car.vin : null}`} cMenu='1' cSubMenu='1.2' cAction={`Detalle`}>
        <section className='content'>
          <div className='row'>
            <div className='col-md-3 col-lg-3'>
              <div className='box box-primary'>
                <div className='box-body box-profile'>
                  {/*<ImageLazyLoad url={decodeURI(image.file.url)} height={'100px'} maxHeight={'100px'} maxWidth={'100px'} small={true}/>*/}
                  {/*<img*/}
                  {/*className="profile-user-img img-responsive img-circle"*/}
                  {/*src="https://cdn.forbes.com.mx/2018/03/Auto-Carretera-1280x720.jpg"*/}
                  {/*alt="User profile picture"*/}
                  {/*style={{*/}
                  {/*fontFamily: 'object-fit:cover',*/}
                  {/*objectFit: 'cover',*/}
                  {/*width: '100px',*/}
                  {/*height: '100px'*/}
                  {/*}}*/}
                  {/*/>*/}
                  <h3 className='profile-username text-center text-black'>{car && car.brand ? car.brand : '-'}</h3>
                  <p className='text-muted text-center text-black'>{car && car.denomination ? car.denomination : '-'}</p>
                  <ul className='list-group list-group-unbordered no-margin text-muted'>
                    <li className='list-group-item'>
                      <strong>VIN</strong>
                      <span className='pull-right text-primary'>
                        <CopyText value={car?.vin ?? ''}>
                          <strong>{
                            car && car.vin ? car.vin : '-'
                          }</strong>
                        </CopyText>
                      </span>
                    </li>
                    <li className='list-group-item'>
                      <strong>Color</strong>
                      <strong className='pull-right'>
                        {
                          car && car.color ? car.color : '-'
                        }
                      </strong>
                    </li>
                    <li className='list-group-item'>
                      <strong>Material</strong>
                      <strong className='pull-right'>
                        {
                          car && car.material ? car.material : '-'
                        }
                      </strong>
                    </li>
                    <li className='list-group-item'>
                      <strong>Patente</strong>
                      <strong className='pull-right'>
                        {
                          car && car.patent ? car.patent : '-'
                        }
                      </strong>
                    </li>
                    <li className='list-group-item'>
                      <strong>Nº Interno</strong>
                      <strong className='pull-right'>
                        {
                          car && car.internalNumber ? car.internalNumber : '-'
                        }
                      </strong>
                    </li>

                    {/*<li className='list-group-item'>*/}
                    {/*  <strong>Revisiones</strong>*/}
                    {/*  <span className='pull-right'>*/}
                    {/*    {*/}
                    {/*      car && car.participants ? car.participants.length : 0*/}
                    {/*    }*/}
                    {/*  </span>*/}
                    {/*</li>*/}
                    {/*<li className='list-group-item'>*/}
                    {/*  <strong>Inventarios</strong>*/}
                    {/*  <span className='pull-right'>*/}
                    {/*    {*/}
                    {/*      car && car.inventories ? car.inventories.length : 0*/}
                    {/*    }*/}
                    {/*  </span>*/}
                    {/*</li>*/}
                  </ul>
                  <button
                    className='btn btn-primary btn-block'
                    onClick={() => {
                      this.props.history.push(parseReplicableURL(`/settings/cars/${car?._id}`));
                    }}
                  >
                    <strong>Detalle</strong>
                  </button>
                </div>
              </div>
            </div>
            <div className='col-md-9 col-lg-9'>
              <div className='nav-tabs-custom'>
                <ul className='nav nav-tabs'>
                  <li className='active'><a href='#checklist' data-toggle='tab' aria-expanded='false'>Controles
                    ({car?.participants?.length ?? '0'})</a>
                  </li>
                  {/*<li className=''><a href='#distribution' data-toggle='tab' aria-expanded='true'>Distribución ({requests?.length ?? '0'})</a></li>*/}
                  {/*<li className="dropdown">
                        <a className="dropdown-toggle" data-toggle="dropdown" href="#">
                          Dropdown <span className="caret"></span>
                        </a>
                        <ul className="dropdown-menu">
                          <li role="presentation"><a role="menuitem" tabIndex={-1} href="#">Action</a></li>
                          <li role="presentation"><a role="menuitem" tabIndex={-1} href="#">Another action</a></li>
                          <li role="presentation"><a role="menuitem" tabIndex={-1} href="#">Something else here</a></li>
                          <li role="presentation" className="divider"></li>
                          <li role="presentation"><a role="menuitem" tabIndex={-1} href="#">Separated link</a></li>
                        </ul>
                      </li>
                      <li className="pull-right"><a href="#" className="text-muted"><i className="fa fa-gear"></i></a></li>*/}
                </ul>
                <div className='tab-content no-padding'>
                  {/*style={{maxHeight: '80vh', overflowX: 'scroll'}}*/}
                  <div className='tab-pane active' id='checklist'>
                    <table className='table table-striped no-margin'>
                      <thead>
                      <tr>
                        <th className='middle' style={{ width: '40%' }}>Control</th>
                        {/*<th className="middle hidden-xs">Supervisor</th>*/}
                        <th className='middle hidden-xs' style={{ width: '40%' }}>Realizado en</th>
                        <th className='middle hidden-xs' style={{ width: '20%' }}></th>
                        <th className='middle-center hidden-xs' style={{ width: '3%' }}></th>
                        <th style={{ width: '1%' }} />
                      </tr>
                      </thead>
                      <tbody>
                      {
                        car?.participants?.map((participant) => (
                          <tr key={participant._id}
                              className={highlight.length && highlight.includes(participant._id as never) ? 'highlight-info' : ''}>
                            <td className='middle text-sm' style={{
                              paddingTop: '10px',
                              paddingBottom: '10px'
                            }}>
                              <div className='visible-xs visible-sm'>
                                <strong className='text-muted'>
                                  #{participant.number}
                                </strong><br />
                                <strong className='text-primary'>{participant.name}</strong>
                              </div>
                              <div className='hidden-xs hidden-sm '>
                                <strong className='text-primary'>{participant.name}</strong><br />
                                <strong className='text-muted'>
                                  #{participant.number}
                                </strong>
                              </div>
                              <div className='text-muted text-sm'>
                                <div className='visible-xs visible-sm'>
                                  <strong>
                                    <i className='fa fa-fw fa-user-o' /> {participant.user?.firstName ?? ''} {participant.user?.lastName ?? ''}
                                  </strong>
                                    <div><i className='fa fa-fw fa-flag-o' /> {participant.venue ? participant.venue.name : '-'} <ShowIf
                                  condition={participant.hasDamages}
                                >
                                  <React.Fragment>
                                    {' '}<i
                                    className='fa fa-fw fa-warning text-red'
                                    data-toggle='tooltip'
                                    data-placement='top'
                                    title='Daños encontrados en esta revisión.'
                                  />
                                  </React.Fragment>
                                </ShowIf></div>
                                  <div>{participant.company?.name}</div>
                                  <div>
                                    <i
                                      className='fa fa-clock-o fa-fw' /> {moment(participant.createdAt).fromNow()} ({moment(participant.createdAt).format('LLL')})
                                  </div>
                                </div>
                              </div>
                            </td>
                            {/*<td className="middle hidden-xs">{participant.user ? participant.user.firstName : ''} {participant.user ? participant.user.lastName : ''}</td>*/}
                            <td className='middle hidden-xs text-sm text-muted text-ellipsis' style={{
                              paddingTop: '10px',
                              paddingBottom: '10px'
                            }}>
                              <strong className='text-muted'>
                                <i
                                  className='fa fa-fw fa-user-o' /> {participant.user ? participant.user.firstName : ''} {participant.user ? participant.user.lastName : ''}
                              </strong>
                              <div><i className='fa fa-fw fa-flag-o' /> {participant.venue ? participant.venue.name : '-'} <ShowIf
                              condition={participant.hasDamages}
                            >
                              <React.Fragment>
                                {' '}<i
                                className='fa fa-fw fa-warning text-red'
                                data-toggle='tooltip'
                                data-placement='top'
                                title='Daños encontrados en esta revisión.'
                              />
                              </React.Fragment>
                            </ShowIf></div>
                              {participant.company?.name}
                            </td>
                            <td className='middle-center hidden-xs text-muted text-sm text-ellipsis'>
                              <div
                                className='text-muted text-sm' data-toggle='tooltip'
                                data-placement='top'
                                title={moment(participant.createdAt).format('LLL')}
                              >
                                <i className='fa fa-fw fa-clock-o' /> {moment(participant.createdAt).fromNow()}
                              </div>
                            </td>
                            <td className='middle-center hidden-xs text-muted text-sm'>
                              <ShowIf
                                condition={!!(participant.hasOwnProperty('qualification') && participant.qualification)}
                                alternative={''}
                              >
                                {`${Math.round(participant.qualification)}%`}
                              </ShowIf>
                            </td>
                            <td className='text-primary middle-center text-ellipsis'>
                              <div
                                className='hidden-xs hidden-sm'
                              >
                                <div className='btn-group' style={{ width: '70px' }}>
                                  <button
                                    className='btn btn-sm btn-default'
                                    disabled={carLoading === participant._id}
                                    onClick={() => this.printPdf(`/report/forms/pdf/${participant._id}.pdf`, participant._id)}
                                  ><i className={carLoading === participant._id ? 'fa fa-spinner fa-spin' : 'fa fa-print'} /></button>
                                  <button
                                    className='btn btn-sm btn-primary'
                                    disabled={!!(loadingParticipant && loadingParticipant === participant._id)}
                                    onClick={loadingParticipant ? undefined : () => getParticipant(participant._id)}
                                  >
                                    <ShowIf
                                      condition={!!(loadingParticipant && loadingParticipant === participant._id)}
                                      alternative={<i className='fa fa-bar-chart' />}
                                    >
                                      <i className='fa fa-spin fa-spinner' />
                                    </ShowIf>
                                  </button>
                                </div>
                              </div>
                              <div
                                className='visible-xs visible-sm'
                              >
                                <button
                                  className='btn btn-sm btn-primary'
                                  disabled={!!(loadingParticipant && loadingParticipant === participant._id)}
                                  onClick={loadingParticipant ? undefined : () => getParticipant(participant._id)}
                                >
                                  <ShowIf
                                    condition={!!(loadingParticipant && loadingParticipant === participant._id)}
                                    alternative={<i className='fa fa-bar-chart' />}
                                  >
                                    <i className='fa fa-spin fa-spinner' />
                                  </ShowIf>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      }
                      </tbody>
                    </table>
                  </div>
                  <div className='tab-pane' id='distribution' style={{ maxHeight: '80vh', overflowX: 'scroll' }}>
                    <table className='table table-striped'>
                      <thead>
                      <tr>
                        <th className='middle'>Nº</th>
                        <th className='middle'>Estado</th>
                        <th className='middle'>Solicitante</th>
                        <th className='middle'>Vendedor</th>
                        <th className='middle'>Cliente</th>
                        <th className='middle'>RUT Cliente</th>
                        <th className='middle'>Correo</th>
                        <th className='middle-center'>Ticket</th>
                        <th className='middle'>Nº Ticket</th>
                        <th className='middle'>Sucursal</th>
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
                          );
                        })
                      }
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
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

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch,
    getCarAction: (id: string) => dispatch(getCarAction(id)),
    getParticipant: (id: string) => dispatch(getParticipant(id)),
    loadParticipantInCarAction: (participant: IParticipant) => dispatch(loadParticipantInCarAction(participant))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(DashboardVinDetail);
