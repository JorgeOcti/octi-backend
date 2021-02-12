import * as React from 'react';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import {DashboardReduxAction, getRevisionStats, IDashboardState} from '../../actions/dashboard.actions';
import AppContainer from '../../container/AppContainer';
import InfoCard, {CardColors} from './InfoCard';
import CircleChartCard from './CircleChartCard';
import FilterableVenueTable from './FilterableVenueTable';
import {connect} from 'react-redux';

interface IPropsType extends RouteComponentProps<{}> {
  dispatch: Dispatch<DashboardReduxAction>;
  dashboard: IDashboardState;
  getRevisionStats(): void;
}

interface IStateType {
  error: Error | null;
}

class DashboardRevisionsView extends React.Component<IPropsType, IStateType> {
  readonly state: IStateType = {
    error: null,
    loading: false
  };

  constructor(props: IPropsType) {
    super(props);
  }

  componentDidMount() {
    this.props.getRevisionStats();
  }

  public render() {
    const {loading, revisionStats} = this.props.dashboard;
    let today: number,
      yesterday: number,
      dayVariation: number,
      currentMonthMean: number,
      lastMonthMean: number,
      monthMeanVariation: number,
      totalRevisions: number,
      participantAcceptance: number,
      shipAcceptance: number,
      receiveAcceptance: number,
      venueActivity: number;

    if (revisionStats){
      today = revisionStats.revisions.today
      yesterday = revisionStats.revisions.yesterday
      dayVariation = yesterday ? 100 * (today-yesterday)/yesterday : Infinity;

      currentMonthMean = revisionStats.revisions.currentMonthTotal/moment().date()
      lastMonthMean = revisionStats.revisions.lastMonthTotal/moment().subtract(1, "month").daysInMonth()
      monthMeanVariation = lastMonthMean ? 100 * (currentMonthMean-lastMonthMean)/(lastMonthMean) : Infinity;

      totalRevisions = revisionStats.revisions.totalRevisions;

      let acceptedRevisions = revisionStats.revisions.sentStats.accepted + revisionStats.revisions.receivedStats.accepted;
      let rejectedRevisions = revisionStats.revisions.sentStats.rejected + revisionStats.revisions.receivedStats.rejected;

      participantAcceptance = 100*acceptedRevisions/(acceptedRevisions + rejectedRevisions);

      let totalSent = (revisionStats.revisions.sentStats.accepted  +  revisionStats.revisions.sentStats.rejected );
      let totalReceive = (revisionStats.revisions.receivedStats.accepted  +  revisionStats.revisions.receivedStats.rejected );
      shipAcceptance = totalSent ? 100 * revisionStats.revisions.sentStats.accepted/ totalSent : Infinity;
      receiveAcceptance = totalReceive ? 100 * revisionStats.revisions.receivedStats.accepted/ totalReceive : Infinity;

      let totalVenues = (revisionStats.venues.activeVenues + revisionStats.venues.inactiveVenues);
      venueActivity = 100 * revisionStats.venues.activeVenues/ totalVenues;

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
              icon={ !dayVariation || dayVariation === Infinity || dayVariation === 0 ? "fa-search" :
                dayVariation > 0 ? "fa-caret-up" : "fa-caret-down"
              }
              iconBackgroundColor={ !dayVariation || dayVariation === Infinity || dayVariation === 0 ? null :
                dayVariation > 0 ? CardColors.GREEN : CardColors.RED
              }
              title="REVISIONES ÚLTIMO DÍA"
              value={yesterday}
              showLoading={loading}>
              { !dayVariation || dayVariation === Infinity || dayVariation === 0 ? null :
                <span className={`${ !dayVariation || dayVariation === Infinity || dayVariation === 0 ? "fa-search" :
                  dayVariation > 0 ? "green" : "red"
                } font-normal font-14`} style={{marginLeft: "5px"}}>
                      ({dayVariation.toFixed(0)}% vs día anterior)
                    </span>
              }
            </InfoCard>
            <InfoCard
              className="col-md-6 col-lg-3"
              icon={ !monthMeanVariation || monthMeanVariation === Infinity || monthMeanVariation === 0 ? "fa-search" :
                monthMeanVariation > 0 ? "fa-caret-up" : "fa-caret-down"
              }
              iconBackgroundColor={ !monthMeanVariation || monthMeanVariation === Infinity || monthMeanVariation === 0 ? null :
                monthMeanVariation > 0 ? CardColors.GREEN : CardColors.RED
              }
              title="PROMEDIO DIARIO MES"
              value={currentMonthMean}
              showLoading={loading}>
              { !monthMeanVariation || monthMeanVariation === Infinity || monthMeanVariation === 0 ? null :
                <span className={`${ !monthMeanVariation || monthMeanVariation === Infinity || monthMeanVariation === 0 ? "fa-search" :
                monthMeanVariation > 0 ? "green" : "red"
              } font-normal font-14`} style={{marginLeft: "5px"}}>
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
              <CircleChartCard className="col-md-6 col-lg-4 lg-tm-10" title="% ACEPTA REVISIÓN (pórtico)" value={participantAcceptance} bordered showLoading={loading}>
                <div>
                { !receiveAcceptance || receiveAcceptance === Infinity || receiveAcceptance === 0 ? null :
                  <span className="info-box-text xs-center-text">ACEPTA RECEPCIÓN {receiveAcceptance.toFixed(0)}%</span>
                }
                { !shipAcceptance || shipAcceptance === Infinity || shipAcceptance === 0 ? null :
                  <span className="info-box-text xs-center-text">ACEPTA DESPACHO {shipAcceptance.toFixed(0)}%</span>
                }
              </div>
                </CircleChartCard>
                <CircleChartCard className="col-md-6 col-lg-4 lg-tm-10" title="SUCURSALES ACTIVAS MES" value={venueActivity} bordered showLoading={loading}/>
                <FilterableVenueTable className="col-md-12 col-lg-4 lg-tm-10" bordered/>
              </div>
            </div>
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

const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    getRevisionStats: () => dispatch(getRevisionStats())
  };
};


export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(DashboardRevisionsView);
