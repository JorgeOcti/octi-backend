import * as PropTypes from 'prop-types';
import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import {DashboardReduxAction, getParticipantsPerDateAction, IDashboardState} from '../../actions/dashboard';
import AppContainer from '../../container/AppContainer';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<DashboardReduxAction>;
  dashboard: IDashboardState;

  getParticipantsPerDateAction(): void;
}

interface IStateType {
  error: Error | null;
}

class DashboardGeneralView extends React.Component<IPropsType, IStateType> {

  static propTypes = {
    dashboard: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    getParticipantsPerDateAction: PropTypes.func.isRequired
  };

  participantsPerDayChart: any;

  constructor(props: IPropsType) {
    super(props);
    this.resizeCharts = this.resizeCharts.bind(this);
  }

  public componentWillMount(): void {
    // set the title of the page
    document.title = 'OSA Andes | Reportes generales';
    this.props.getParticipantsPerDateAction();
    window.addEventListener('resize', this.resizeCharts, false);
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public componentDidUpdate(prevProps: IPropsType, prevState: IStateType): void {
    const {participantsPerDate, carsPerDate, loading} = this.props.dashboard;

    const $participantPerDate = document.getElementById('participant-per-date') as HTMLDivElement;
    const categories: any[] = [];
    const totals: any[] = [];
    const totalsCars: any[] = [];

    if (participantsPerDate.length) {
      participantsPerDate.forEach((day) => {
        categories.push(day._id);
        totals.push(day.total);
      });
    }
    if (carsPerDate.length) {
      carsPerDate.forEach((day) => {
        totalsCars.push(day.total);
      });
    }
    if ($participantPerDate && !loading) {
      this.participantsPerDayChart = echarts.init($participantPerDate);
      const option = {
        title: {
          text: 'Revisiones y cargas realizadas por día',
          x: 'center',
          textStyle: {
            align: 'center'
          }
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          x: 'center',
          y: 'bottom',
          data: ['Revisiones', 'Cargados']
        },
        xAxis: {
          type: 'category',
          data: categories,
          axisLine: {
            lineStyle: {
              color: 'rgba(0, 0, 0, 0.5)'
            }
          },
          axisLabel: {
            rotate: 45
            // fontSize: 10
          }
        },
        yAxis: {
          minInterval: 1,
          type: 'value',
          axisLine: {
            lineStyle: {
              color: 'rgba(0, 0, 0, 0.5)'
            }
          }
        },
        grid: {
          // left
          x: 30,
          // right
          x2: 10,
          containLabel: true
          // borderColor: '#FF0000'
        },
        series: [{
          data: totals,
          name: 'Revisiones',
          type: 'line',
          color: '#009cde',
          smooth: true
        }, {
          data: totalsCars,
          name: 'Cargados',
          type: 'line',
          color: '#6d7a89',
          smooth: true
        }]
      };
      this.participantsPerDayChart.setOption(option);
    }
  }

  public componentWillUnmount() {
    // cancel request if component is inmounted
    window.removeEventListener('resize', this.resizeCharts, false);
    if (this.props.dashboard.source) {
      this.props.dashboard.source.cancel('Operation canceled by the user.');
    }
  }

  public render(): React.ReactElement<IPropsType> {
    const {loading, participantsPerDate, carsPerDate} = this.props.dashboard;
    return (
      <AppContainer title="" cMenu="1" cSubMenu="1.1">
        <section className="content">
          <div className="row">
            <div className="col-md-3 col-sm-6 col-xs-12">
              <div className="info-box">
                <span className="info-box-icon bg-aqua"><i className="fa fa-clipboard"/></span>
                <div className="info-box-content">
                  <span className="info-box-text">Revisiones Hoy</span>
                  <span className="info-box-number">{participantsPerDate.length ? participantsPerDate[participantsPerDate.length - 1 ].total : 0}</span>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6 col-xs-12">
              <div className="info-box">
                <span className="info-box-icon bg-yellow"><i className="fa fa-check-square"/></span>
                <div className="info-box-content">
                  <span className="info-box-text">Cargar Hoy</span>
                  <span className="info-box-number">{carsPerDate.length ? carsPerDate[carsPerDate.length - 1 ].total : 0}</span>
                </div>
              </div>
            </div>
            {/*<div className="clearfix visible-sm-block"/>*/}
            {/*<div className="col-md-3 col-sm-6 col-xs-12">*/}
              {/*<div className="info-box">*/}
                {/*<span className="info-box-icon bg-green"><i className="ion ion-ios-cart-outline"/></span>*/}
                {/*<div className="info-box-content">*/}
                  {/*<span className="info-box-text">Sales</span>*/}
                  {/*<span className="info-box-number">760</span>*/}
                {/*</div>*/}
              {/*</div>*/}
            {/*</div>*/}
            {/*<div className="col-md-3 col-sm-6 col-xs-12">*/}
              {/*<div className="info-box">*/}
                {/*<span className="info-box-icon bg-yellow"><i className="ion ion-ios-people-outline"/></span>*/}
                {/*<div className="info-box-content">*/}
                  {/*<span className="info-box-text">New Members</span>*/}
                  {/*<span className="info-box-number">2,000</span>*/}
                {/*</div>*/}
              {/*</div>*/}
            {/*</div>*/}
          </div>
          <div className="box">
            <div className="box-header with-border"><h3 className="box-title">Dashboard General</h3>
              <div className="box-tools pull-right">
              </div>
            </div>
            <div className="box-body">
              {
                participantsPerDate.length ?
                  <div id="participant-per-date" style={{height: '400px', maxWidth: '100%'}}/>
                  : !loading ? <strong>Aún no se han realizado revisiones.</strong> : null
              }
            </div>
            {/*<div className="box-footer">Footer</div>*/}
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

  private resizeCharts() {
    if (this.participantsPerDayChart && this.participantsPerDayChart !== undefined) {
      this.participantsPerDayChart.resize();
    }
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
    getParticipantsPerDateAction: () => dispatch(getParticipantsPerDateAction())
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(DashboardGeneralView);
