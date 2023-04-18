import * as Raven from 'raven-js';
import * as React from 'react';
// import * as PropTypes from 'prop-types';
import * as moment from 'moment';

import {
  CarReduxAction,
  ICarsState,
  getCarAction,
  isLoadingAction
} from '../../actions/cars.actions';
import {
  IDashboardState,
  getParticipant,
  loadParticipantInCarAction
} from '../../actions/dashboard.actions';

import AppContainer from '../../container/AppContainer';
import CopyText from '../Utils/CopyText';
import { Dispatch } from 'redux';
import { ErrorInfo } from 'react';
import { IParticipant } from '../../../../../../src/form/interfaces/participant.interface';
import ModalView from '../Modal/ModalView';
import { RouteComponentProps } from 'react-router';
import Row from '../Utils/Row';
import TimeLineForm from './TimeLineForm';
import TimeLineInventory from './TimeLineInventory';
import TrackingBasePage from '../Utils/TrackingBasePage';
import { connect } from 'react-redux';
import { parseReplicableURL } from '../../utils/common';

interface IPropsType extends RouteComponentProps<{ id: string }> {
  dispatch: Dispatch<CarReduxAction>;
  cars: ICarsState;
  dashboard: IDashboardState;

  getCarAction(id: string): void;
  isLoadingAction(loading: boolean): void;

  getParticipant(id: string): void;

  loadParticipantInCarAction(participant: IParticipant): void;
}

interface IStateType {
  error: Error | null;
}

class CarDetailView extends TrackingBasePage<IPropsType, IStateType> {
  title: string;

  state = {
    error: null,
    highlight: []
  };

  constructor(props: IPropsType) {
    super(props);
    this.title = '- Detalle';
  }

  componentWillMount() {
    const { id } = this.props.match.params;
    this.props.getCarAction(id);
  }

  componentDidMount() {
    super.componentDidMount();
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error });
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public componentDidUpdate(
    prevProps: Readonly<IPropsType>,
    prevState: Readonly<IStateType>,
    snapshot?: any
  ): void {
    $('[data-toggle="tooltip"]').tooltip();
  }

  public componentWillUnmount() {
    // cancel request if component is inmounted
    // this.props.isLoadingAction(true);
    if (this.props.cars.source) {
      this.props.cars.source.cancel('Operation canceled by the user.');
    }
  }

  public render(): React.ReactElement<IPropsType> {
    const { loading, car, carEvents } = this.props.cars;
    const { loadingParticipant } = this.props.dashboard;
    const { getParticipant } = this.props;
    const { params } = this.props.match;
    const isSameCar = !!(car?._id === params.id);
    return (
      <AppContainer
        title={`${isSameCar ? car?.vin : ''}`}
        cMenu="1"
        cSubMenu="1.0"
        cAction="Detalle">
        <section className="content">
          <Row>
            <div className="col-md-3 col-lg-3">
              {loading && !isSameCar ? (
                <div className="box">
                  <div className="box-body text-center">
                    <p>&nbsp;</p>
                  </div>
                  <div className="overlay">
                    <i className="fa fa-spinner fa-spin text-purple" />
                  </div>
                </div>
              ) : (
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
                    <h3 className="profile-username text-center text-black">
                      {car && car.brand ? car.brand : '-'}
                    </h3>
                    <p className="text-muted text-center text-black">
                      {car && car.denomination ? car.denomination : '-'}
                    </p>
                    <ul className="list-group list-group-unbordered no-margin text-muted">
                      <li className="list-group-item">
                        <strong>VIN</strong>
                        <span className="pull-right text-primary">
                          <CopyText value={car?.vin ?? ''}>
                            <strong>{car && car.vin ? car.vin : '-'}</strong>
                          </CopyText>
                        </span>
                      </li>
                      <li className="list-group-item">
                        <strong>Color</strong>
                        <strong className="pull-right">
                          {car && car.color ? car.color : '-'}
                        </strong>
                      </li>
                      <li className="list-group-item">
                        <strong>Material</strong>
                        <strong className="pull-right">
                          {car && car.material ? car.material : '-'}
                        </strong>
                      </li>
                      <li className="list-group-item">
                        <strong>Patente</strong>
                        <strong className="pull-right">
                          {car && car.patent ? car.patent : '-'}
                        </strong>
                      </li>
                      <li className="list-group-item">
                        <strong>Nº Interno</strong>
                        <strong className="pull-right">
                          {car && car.internalNumber ? car.internalNumber : '-'}
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
                      className="btn btn-primary btn-block"
                      onClick={() => {
                        this.props.history.replace(
                          parseReplicableURL(`/cars/${car?._id}`)
                        );
                      }}>
                      <strong>Ver Controles</strong>
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="col-md-9 col-lg-9">
              {loading ? (
                <div className="box">
                  <div className="box-body text-center">
                    <p>&nbsp;</p>
                  </div>
                  <div className="overlay">
                    <i className="fa fa-spinner fa-spin text-purple" />
                  </div>
                </div>
              ) : (
                <div className="nav-tabs-custom">
                  <ul className="nav nav-tabs">
                    <li className="active">
                      <a
                        href="#timeline"
                        data-toggle="tab"
                        aria-expanded="true">
                        Timeline
                      </a>
                    </li>
                  </ul>
                  <div
                    className="tab-content"
                    style={{
                      backgroundColor: '#f9f9f9'
                      // maxHeight: '80vh',
                      // overflowX: 'auto'
                    }}>
                    <div className="tab-pane active" id="timeline">
                      <ul className="timeline">
                        {Object.keys(carEvents).map((event) => {
                          const events = carEvents[event];
                          return (
                            <React.Fragment key={event}>
                              <li className="time-label">
                                <span className="bg-blue">
                                  {moment(event).format('MMMM YYYY')}
                                </span>
                              </li>
                              {events.map((data: any) => {
                                return data.typeEvent === 'created' ? (
                                  <li
                                    style={{ marginRight: '0' }}
                                    key={data._id}>
                                    <i
                                      className={`fa fa-cloud-upload bg-green`}
                                    />
                                    <div className="timeline-item">
                                      <span
                                        className="time"
                                        style={{
                                          color: '#888',
                                          fontSize: '13px'
                                        }}>
                                        <div
                                          className="text-muted text-sm"
                                          data-toggle="tooltip"
                                          data-placement="top"
                                          title={moment(data.createdAt).format(
                                            'LLL'
                                          )}>
                                          <i className="fa fa-fw fa-clock-o" />{' '}
                                          {moment(data.createdAt).fromNow()}
                                        </div>
                                      </span>
                                      <h3 className="timeline-header">
                                        <a href="javascript:void(0)">
                                          VEHÍCULO IMPORTADO
                                        </a>
                                      </h3>
                                      <div className="timeline-body text-sm text-muted">
                                        El vehículo fue importado al sistema el{' '}
                                        {data.createdAt.format('LLLL')}.
                                      </div>
                                    </div>
                                  </li>
                                ) : data.typeEvent === 'revision' ? (
                                  <TimeLineForm
                                    form={data}
                                    getParticipant={getParticipant}
                                    loadingParticipant={loadingParticipant}
                                    key={data._id}
                                  />
                                ) : (
                                  <TimeLineInventory
                                    inventory={data}
                                    key={data._id}
                                  />
                                );
                              })}
                            </React.Fragment>
                          );
                        })}
                        <li>
                          <i className="fa fa-clock-o bg-gray" />
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Row>
          <ModalView />
        </section>
      </AppContainer>
    );
  }
}

const mapStateToProps = (state: {
  cars: ICarsState;
  dashboard: IDashboardState;
}) => {
  return {
    cars: state.cars,
    dashboard: state.dashboard
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch,
    isLoadingAction: (loading: boolean) => dispatch(isLoadingAction(loading)),
    getCarAction: (id: string) => dispatch(getCarAction(id)),
    getParticipant: (id: string) => dispatch(getParticipant(id)),
    loadParticipantInCarAction: (participant: IParticipant) =>
      dispatch(loadParticipantInCarAction(participant))
  };
};

export default connect<{}, {}, IPropsType>(
  mapStateToProps,
  mapDispatchToProps
)(CarDetailView);
