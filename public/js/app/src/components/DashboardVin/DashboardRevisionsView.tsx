import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Dispatch } from 'redux';
import { DashboardReduxAction, getRevisionStats, IDashboardState } from '../../actions/dashboard.actions';
import AppContainer from '../../container/AppContainer';
import InfoCard, { CardColors } from './InfoCard';
import CircleChartCard from './CircleChartCard';
import FilterableVenueTable from './FilterableVenueTable';
import { connect } from 'react-redux';
import * as moment from 'moment';
import NumberFormat from 'react-number-format';
import { IWindow } from '../../interfaces/window';
import { IUser } from '../../../../../../src/app/interfaces/user.interface';
import TrackingBasePage from '../Utils/TrackingBasePage';

declare let window: IWindow;

interface IPropsType extends RouteComponentProps<{}> {
  dispatch: Dispatch<DashboardReduxAction>;
  dashboard: IDashboardState;
  getRevisionStats(): void;
}

interface IStateType {
  error: Error | null;
}


class DashboardRevisionsView extends TrackingBasePage<IPropsType, IStateType> {
  title: string;
  readonly state: IStateType = {
    error: null
  };

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Dashboard Revisiones';
  }

  componentDidMount() {
    super.componentDidMount();
    this.props.getRevisionStats();
  }

  private isSALFARAC() {
    const user: IUser = window.user;
    return user.company._id === '5ef1271dd569c10013d17e8b';
  }

  public render() {
    const { revisionStats, loading } = this.props.dashboard;
    // tslint:disable-next-line: one-variable-per-declaration
    let today: number = 0,
      yesterday: number = 0,
      dayVariation: number = 0,
      currentMonthMean: number = 0,
      lastMonthMean: number = 0,
      monthMeanVariation: number = 0,
      totalRevisions: number = 0,
      participantAcceptance: number = 0,
      shipAcceptance: number = 0,
      receiveAcceptance: number = 0,
      venueActivity: number = 0;

    if (revisionStats) {
      today = revisionStats.revisions.today;
      yesterday = revisionStats.revisions.yesterday;
      dayVariation = yesterday ? 100 * (today - yesterday) / yesterday : Infinity;

      currentMonthMean = revisionStats.revisions.currentMonthTotal / moment().date();
      lastMonthMean = revisionStats.revisions.lastMonthTotal / moment().subtract(1, 'month').daysInMonth();
      monthMeanVariation = lastMonthMean ? 100 * (currentMonthMean - lastMonthMean) / (lastMonthMean) : Infinity;

      totalRevisions = revisionStats.revisions.totalRevisions;

      if (revisionStats.revisions.sentStats && revisionStats.revisions.receivedStats) {
        const acceptedRevisions = revisionStats.revisions.sentStats.accepted + revisionStats.revisions.receivedStats.accepted;
        const rejectedRevisions = revisionStats.revisions.sentStats.rejected + revisionStats.revisions.receivedStats.rejected;

        participantAcceptance = 100 * acceptedRevisions / (acceptedRevisions + rejectedRevisions);

        const totalSent = (revisionStats.revisions.sentStats.accepted + revisionStats.revisions.sentStats.rejected);
        const totalReceive = (revisionStats.revisions.receivedStats.accepted + revisionStats.revisions.receivedStats.rejected);
        shipAcceptance = totalSent ? 100 * revisionStats.revisions.sentStats.accepted / totalSent : Infinity;
        receiveAcceptance = totalReceive ? 100 * revisionStats.revisions.receivedStats.accepted / totalReceive : Infinity;
      }

      const totalVenues = (revisionStats.venues.activeVenues + revisionStats.venues.inactiveVenues);
      venueActivity = 100 * revisionStats.venues.activeVenues / totalVenues;

    }

    return (
      <AppContainer title="" cMenu="1" cSubMenu="1.3">
        <section className="content">
          <div className="row" style={{ marginTop: '10px' }}>
            <InfoCard
              icon="fa-search"
              title="REVISIONES HOY" value={today}
              className="col-md-6 col-lg-3"
              showLoading={loading}
            />
            <InfoCard
              className="col-md-6 col-lg-3"
              icon={!dayVariation || dayVariation === Infinity || dayVariation === 0 ? 'fa-search' :
                dayVariation > 0 ? 'fa-caret-up' : 'fa-caret-down'
              }
              iconBackgroundColor={!dayVariation || dayVariation === Infinity || dayVariation === 0 ? null :
                dayVariation > 0 ? CardColors.GREEN : CardColors.RED
              }
              title="REVISIONES ÚLTIMO DÍA"
              value={yesterday}
              showLoading={loading}>
              {!dayVariation || dayVariation === Infinity || dayVariation === 0 ? null :
                <span className={`${!dayVariation || dayVariation === Infinity || dayVariation === 0 ? 'fa-search' :
                  dayVariation > 0 ? 'green' : 'red'
                  } font-normal font-14`} style={{ marginLeft: '5px' }}>
                  ({dayVariation.toFixed(0)}% vs día anterior)
                    </span>
              }
            </InfoCard>
            <InfoCard
              className="col-md-6 col-lg-3"
              icon={!monthMeanVariation || monthMeanVariation === Infinity || monthMeanVariation === 0 ? 'fa-search' :
                monthMeanVariation > 0 ? 'fa-caret-up' : 'fa-caret-down'
              }
              iconBackgroundColor={!monthMeanVariation || monthMeanVariation === Infinity || monthMeanVariation === 0 ? null :
                monthMeanVariation > 0 ? CardColors.GREEN : CardColors.RED
              }
              title="PROMEDIO DIARIO MES"
              value={currentMonthMean}
              showLoading={loading}>
              {!monthMeanVariation || monthMeanVariation === Infinity || monthMeanVariation === 0 ? null :
                <span className={`${!monthMeanVariation || monthMeanVariation === Infinity || monthMeanVariation === 0 ? 'fa-search' :
                  monthMeanVariation > 0 ? 'green' : 'red'
                  } font-normal font-14`} style={{ marginLeft: '5px' }}>
                  ({monthMeanVariation.toFixed(0)}% vs mes anterior)
                    </span>
              }
            </InfoCard>
            <InfoCard
              className="col-md-6 col-lg-3"
              bordered
              icon="fa-search"
              title="TOTAL REVISIONES"
              showLoading={loading}
              value={totalRevisions}
            />
          </div>
          <div className="box">
            <div className="box-header with-border bg-">
              <h3 className="box-title">Reporte Revisiones</h3>
            </div>
            <div className="box-body">
              <div className="row">
                <CircleChartCard className="col-md-6 col-lg-4 lg-tm-10"
                  title={this.isSALFARAC() ?
                    '% DE ENTREGAS/RECEPCIONES POR USUARIO HABITUAL' :
                    '% ACEPTA REVISIÓN (pórtico)'}
                  value={participantAcceptance}
                  bordered
                  showLoading={loading}>
                  <div>
                    {!receiveAcceptance || receiveAcceptance === Infinity || receiveAcceptance === 0 ? null :
                      <span className="info-box-text xs-center-text text-wrap">
                        {this.isSALFARAC() ?
                          'ENTREGA USUARIO HABITUAL ' :
                          'ACEPTA RECEPCIÓN '}
                        <NumberFormat
                          value={receiveAcceptance}
                          displayType={'text'}
                          thousandSeparator={'.'}
                          decimalScale={0}
                          decimalSeparator={','}
                          suffix="%" />
                      </span>
                    }
                    {!shipAcceptance || shipAcceptance === Infinity || shipAcceptance === 0 ? null :
                      <span className="info-box-text xs-center-text text-wrap">
                        {
                          this.isSALFARAC() ?
                          'RECIBE USUARIO HABITUAL ' :
                          'ACEPTA DESPACHO '
                        }
                        <NumberFormat
                          value={shipAcceptance}
                          displayType={'text'}
                          thousandSeparator={'.'}
                          decimalScale={0}
                          decimalSeparator={','}
                          suffix="%" />
                      </span>
                    }
                  </div>
                </CircleChartCard>
                <CircleChartCard className="col-md-6 col-lg-4 lg-tm-10" title="SUCURSALES ACTIVAS MES" value={venueActivity} bordered showLoading={loading} />
                <FilterableVenueTable className="col-md-12 col-lg-4 lg-tm-10" bordered />
              </div>
            </div>
            {
              loading &&
              <div className="overlay">
                <i className="fa fa-spinner fa-spin text-purple" />
              </div>
            }
          </div>
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

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch,
    getRevisionStats: () => dispatch(getRevisionStats())
  };
};


export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(DashboardRevisionsView);
