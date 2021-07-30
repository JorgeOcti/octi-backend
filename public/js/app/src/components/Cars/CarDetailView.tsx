// import * as PropTypes from 'prop-types';
import * as moment from 'moment';
import * as Raven from 'raven-js';
import {ErrorInfo} from 'react';
import * as React from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import {IParticipant} from '../../../../../../src/form/interfaces/participant.interface';
import {CarReduxAction, getCarAction, ICarsState} from '../../actions/cars.actions';
import {getParticipant, IDashboardState, loadParticipantInCarAction} from '../../actions/dashboard.actions';
import AppContainer from '../../container/AppContainer';
import {IWindow} from '../../interfaces/window';
import ModalView from '../Modal/ModalView';
import Row from '../Utils/Row';
import TimeLineForm from './TimeLineForm';
import TimeLineInventory from './TimeLineInventory';
import TrackingBasePage from '../Utils/TrackingBasePage';

declare let window: IWindow;

interface IPropsType extends RouteComponentProps<{ id: string }> {
  dispatch: Dispatch<CarReduxAction>;
  cars: ICarsState;
  dashboard: IDashboardState;
  getCarAction(id: string): void;
  getParticipant(id: string): void;

  loadParticipantInCarAction(participant: IParticipant): void;
}

interface IStateType {
  error: Error | null;
}

class CarDetailView extends TrackingBasePage<IPropsType, IStateType> {
  title : string;

  state = {
    error: null,
    highlight: []
  };

  constructor(props : IPropsType) {
    super(props);
    this.title = 'Detalle VIN';
  }

  componentWillMount() {
    const {id} = this.props.match.params;
    this.props.getCarAction(id);
  }

  componentDidMount() {
    super.componentDidMount();
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public componentDidUpdate(prevProps: Readonly<IPropsType>, prevState: Readonly<IStateType>, snapshot?: any): void {
    $('[data-toggle="tooltip"]').tooltip();
  }

  public componentWillUnmount() {
    // cancel request if component is inmounted
    if (this.props.cars.source) {
      this.props.cars.source.cancel('Operation canceled by the user.');
    }
  }

  public render(): React.ReactElement<IPropsType> {
    const {loading, car, carEvents} = this.props.cars;
    const {loadingParticipant} = this.props.dashboard;
    const {getParticipant} = this.props;
    return (
      <AppContainer title={`Detalle VIN ${car ? car.vin : null}`} cMenu="10" cSubMenu="10.2"  cAction="Detalle Vehículo">
        <section className="content">
          <Row>
            <div className="col col-md-3">
              <div className="box box-primary">
                <div className="box-body box-profile">
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
                  <h3 className="profile-username text-center">{car && car.brand ? car.brand : '-'}</h3>
                  <p className="text-muted text-center">{car && car.denomination ? car.denomination : '-'}</p>
                  <ul className="list-group list-group-unbordered">
                    <li className="list-group-item">
                      <strong>VIN</strong>
                      <a className="pull-right">
                        {
                          car && car.vin ? car.vin : '-'
                        }
                      </a>
                    </li>
                    <li className="list-group-item">
                      <strong>Nº Interno</strong>
                      <a className="pull-right">
                        {
                          car && car.internalNumber ? car.internalNumber : '-'
                        }
                      </a>
                    </li>
                    <li className="list-group-item">
                      <strong>Patente</strong>
                      <a className="pull-right">
                        {
                          car && car.patent ? car.patent : '-'
                        }
                      </a>
                    </li>
                    <li className="list-group-item">
                      <strong>Color</strong>
                      <a className="pull-right">
                        {
                          car && car.color ? car.color : '-'
                        }
                      </a>
                    </li>
                    <li className="list-group-item">
                      <strong>Revisiones</strong>
                      <a className="pull-right">
                        {
                          car && car.participants ? car.participants.length : 0
                        }
                      </a>
                    </li>
                    <li className="list-group-item">
                      <strong>Inventarios</strong>
                      <a className="pull-right">
                        {
                          car && car.inventories ? car.inventories.length : 0
                        }
                      </a>
                    </li>
                  </ul>
                    {/*<a href="#" className="btn btn-primary btn-block"><b>Follow</b></a>*/}
                </div>
              </div>
            </div>
            <div className="col col-md-9">
              {
                loading ?
                  <div className="box">
                    <div className="box-body text-center">
                      <p>&nbsp;</p>
                    </div>
                      <div className="overlay">
                        <i className="fa fa-spinner fa-spin text-purple"/>
                      </div>
                  </div> :
                  <div className="nav-tabs-custom">
                    <ul className="nav nav-tabs">
                      <li className="active"><a href="#timeline" data-toggle="tab" aria-expanded="true">Timeline</a></li>
                    </ul>
                    <div className="tab-content" style={{
                      backgroundColor: '#f9f9f9'
                      // maxHeight: '80vh',
                      // overflowX: 'auto'
                    }}>
                      <div className="tab-pane active" id="timeline">
                        <ul className="timeline">
                          {
                            Object.keys(carEvents).map((event) => {
                              const events = carEvents[event];
                              return <React.Fragment key={event}>
                                <li className="time-label">
                                  <span className="bg-blue">
                                      {moment(event).format('MMMM YYYY')}
                                  </span>
                                </li>
                                {
                                  events.map((data: any) => {
                                    return (
                                      data.typeEvent === 'created' ?
                                        <li style={{marginRight: '0'}} key={data._id}>
                                          <i className={`fa fa-cloud-upload bg-green`}/>
                                          <div className="timeline-item">
                                            <span className="time" style={{
                                              color: '#888',
                                              fontSize: '13px'
                                            }}>
                                              <i className="fa fa-fw fa-calendar-o"/> {data.createdAt.format('LL')}
                                            </span>
                                            <h3 className="timeline-header"><a href="javascript:void(0)">VEHÍCULO IMPORTADO</a></h3>
                                            <div className="timeline-body">
                                              El vehículo fue importado al sistema
                                              el {data.createdAt.format('LLLL')}.
                                            </div>
                                          </div>
                                        </li>
                                        : data.typeEvent === 'revision' ?
                                        <TimeLineForm form={data} getParticipant={getParticipant} loadingParticipant={loadingParticipant} key={data._id}/>
                                        : <TimeLineInventory inventory={data} key={data._id}/>
                                    );
                                  })
                                }
                              </React.Fragment>;
                            })
                          }
                          <li>
                            <i className="fa fa-clock-o bg-gray"/>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
              }
            </div>
          </Row>
          <ModalView />
        </section>
      </AppContainer>
    );
  }
}

const mapStateToProps = (state: { cars: ICarsState, dashboard: IDashboardState }) => {
  return {
    cars: state.cars,
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

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(CarDetailView);
