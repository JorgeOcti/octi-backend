import * as Raven from 'raven-js';
import * as React from 'react';
// import * as PropTypes from 'prop-types';
import * as moment from 'moment';

import {
  CarReduxAction,
  ICarsState,
  getCarHistoryAction,
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
import TrackingBasePage from '../Utils/TrackingBasePage';
import { connect } from 'react-redux';
import { parseReplicableURL } from '../../utils/common';
import { ModuleHistory, StatusHistory } from '../../../../../../src/app/models/history.types';
import { ChoicesStatusCarInventory } from '../../../../../../src/app/models/inventoryCar.types';

enum HistoryColors {
  GREEN = "bg-green",
  BLUE = "bg-blue",
  AQUAMARINE = "bg-aqua",
  RED = "bg-red",
  YELLOW = "bg-yellow",
  GRAY = "bg-gray",
  PURPLE = "bg-purple",
}
enum HistoryIcons {
  CHECKLIST_SHIPPING = "fa-check-square-o",
  CHECKLIST_DAMAGES = "fa-exclamation-triangle",
  CHECKLIST_RECEPTION = "fa-truck",
  INVENTORY_PENDING = "fa-clock-o",
  INVENTORY_FOUND = "fa-check",
  INVENTORY_REPORTED = "fa-exclamation",
  INVENTORY_MISSING = "fa-arrow-down",
  INVENTORY_LEFTOVER = "fa-arrow-up",
  IMPORTED_UNIT = "fa-cloud-upload",
  CHECKLIST_CLIENT = "fa-clipboard",
  CHECKLIST_DECONSOLIDATION = "fa-calendar",
  CHECKLIST_READY = "fa-area-chart"
}

interface IPropsType extends RouteComponentProps<{ id: string }> {
  dispatch: Dispatch<CarReduxAction>;
  cars: ICarsState;
  dashboard: IDashboardState;

  getCarHistoryAction(id: string): void;
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
    this.props.getCarHistoryAction(id);
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
    const { loading, car } = this.props.cars;
    const { params } = this.props.match;
    const isSameCar = !!(car?._id === params.id);
    const groupedEvents = car?.events.reduce((groups: { [key: string]: any[] }, event: any) => {
      const date = moment(event.createdAt);
      const monthKey = date.format('YYYY-MM'); // Format as YYYY-MM for sorting
      
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      
      groups[monthKey].push(event);
      return groups;
    }, {});

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
                    }}>
                    <div className="tab-pane active" id="timeline">
                      <ul className="timeline">
                        {groupedEvents && Object.keys(groupedEvents).sort((a, b) => moment(b).diff(moment(a))).map((monthKey) => {
                          const events = groupedEvents[monthKey];
                          const monthDate = moment(monthKey).format('MMMM YYYY');
                          return (
                            <React.Fragment key={monthKey}>
                              <li className="time-label">
                                <span className="bg-blue">
                                  {monthDate}
                                </span>
                              </li>
                              {events.map((event) => {
                                let icon = HistoryIcons.INVENTORY_PENDING;
                                let color = HistoryColors.GRAY;
                                let title = '--';
                                let subtitle = '--';
                                switch (event.module) {
                                  case ModuleHistory.form:
                                    title = event.participant?.form.name ?? title;
                                    if (event.participant.hasDamages === true) {
                                      icon = HistoryIcons.CHECKLIST_DAMAGES;
                                      color = HistoryColors.RED;
                                      subtitle = `En ${event?.from?.name}`;
                                    } else if(event.participant.shipping === false) {
                                      icon = HistoryIcons.CHECKLIST_RECEPTION;
                                      color = HistoryColors.AQUAMARINE;
                                      subtitle = `Despacho desde ${event?.from?.name}`;
                                    }
                                    break;
                                  case ModuleHistory.inventory:
                                    title = event?.inventory?.name ?? title;
                                    switch (event?.inventoryCar?.status) {
                                      case ChoicesStatusCarInventory.pending:
                                        icon = HistoryIcons.INVENTORY_PENDING;
                                        color = HistoryColors.AQUAMARINE;
                                        subtitle = `Unidad designada PENDIENTE en ${event?.from?.name}`;
                                        break;
                                      case ChoicesStatusCarInventory.found:
                                        icon = HistoryIcons.INVENTORY_FOUND;
                                        color = HistoryColors.GREEN;
                                        subtitle = `Unidad designada ENCONTRADA en ${event?.from?.name}`;
                                        break;
                                      case ChoicesStatusCarInventory.reported:
                                        icon = HistoryIcons.INVENTORY_REPORTED;
                                        color = HistoryColors.GRAY;
                                        subtitle = `Unidad designada REPORTADA en ${event?.from?.name}`;
                                        break;
                                      case ChoicesStatusCarInventory.missing:
                                        icon = HistoryIcons.INVENTORY_MISSING;
                                        color = HistoryColors.RED;
                                        subtitle = `Unidad designada FALTANTE en ${event?.from?.name}`;
                                        break;
                                      case ChoicesStatusCarInventory.leftover:
                                        icon = HistoryIcons.INVENTORY_LEFTOVER;
                                        color = HistoryColors.YELLOW;
                                        subtitle = `Unidad designada SOBRANTE en ${event?.from?.name}`;
                                        break;
                                    }
                                    break;
                                }
                                switch (event.status) {
                                  case StatusHistory.created:
                                    icon = HistoryIcons.IMPORTED_UNIT;
                                    color = HistoryColors.GREEN;
                                    title = `Unidad importada`;
                                    subtitle = `Unidad fue importada al sistema`;
                                    break;
                                  case StatusHistory.readyToClient:
                                    icon = HistoryIcons.CHECKLIST_READY;
                                    color = HistoryColors.PURPLE;
                                    title = `Planificado para despacho`;
                                    subtitle = `Para ser retirado por el cliente`;
                                    break;
                                  case StatusHistory.sale:
                                    icon = HistoryIcons.CHECKLIST_CLIENT;
                                    color = HistoryColors.AQUAMARINE;
                                    title = `Entregada al cliente`;
                                    subtitle = `Entregada por ${event?.createdBy?.firstName} ${event?.createdBy?.lastName} en ${event?.from?.name}`;
                                    break;
                                }
                                return (
                                  <UnitHistoryTile
                                    color={color}
                                    title={title}
                                    subtitle={subtitle}
                                    icon={icon}
                                    date={event.createdAt}
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
    getCarHistoryAction: (id: string) => dispatch(getCarHistoryAction(id)),
    getParticipant: (id: string) => dispatch(getParticipant(id)),
    loadParticipantInCarAction: (participant: IParticipant) =>
      dispatch(loadParticipantInCarAction(participant))
  };
};

export default connect<{}, {}, IPropsType>(
  mapStateToProps,
  mapDispatchToProps
)(CarDetailView);

const UnitHistoryTile: React.FC<{color: string, title: string, subtitle: string, icon: string, date: Date}> = ({color, title, subtitle, icon, date}) => {
  return (
      <li
        style={{ marginRight: '0' }}
      >
        <i
          className={`fa ${icon} ${color}`}
        />
        <div className="timeline-item">
          <span
            className="time"
            style={{
              color: color,
              fontSize: '13px'
            }}>
            <div
              className="text-muted text-sm"
              data-toggle="tooltip"
              data-placement="top"
              title={moment(date).format(
                'LLL'
              )}>
              <i className="fa fa-fw fa-clock-o" />{' '}
              {moment(date).fromNow()}
            </div>
          </span>
          <h3 className="timeline-header">
            <a href="javascript:void(0)">
              {title}
            </a>
          </h3>
          <div className="timeline-body text-sm text-muted">
            {subtitle}
          </div>
        </div>
      </li>
  )
}
