// import * as PropTypes from 'prop-types';
import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import {DashboardReduxAction} from '../../actions/dashboard.actions';
import { getDashboardTiming, getDashboardTimingPerVenue, IDashboardTimingState} from '../../actions/dashboardTiming.actions';
import AppContainer from '../../container/AppContainer';
import Row from '../Utils/Row';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<DashboardReduxAction>;
  dashboard: IDashboardTimingState;

  getDashboardTiming(): void;
  getDashboardTimingPerVenue(period: string): void;
}

interface IStateType {
  error: Error | null;
}

class DashboardTimingView extends React.Component<IPropsType, IStateType> {

  timingPerMonthChart: echarts.ECharts;
  timingPerVenueChart: echarts.ECharts;

  constructor(props: IPropsType) {
    super(props);
    this.resizeCharts = this.resizeCharts.bind(this);
    this.updateTimingPerMonthChart = this.updateTimingPerMonthChart.bind(this);
    this.onClickBar = this.onClickBar.bind(this);
  }

  public componentWillMount(): void {
    // set the title of the page
    document.title = 'OSA Andes | Reportería de tiempos de traslado';
    // get data
    this.props.getDashboardTiming();
    // add listeners
    window.addEventListener('resize', this.resizeCharts, false);
  }

  public componentDidMount(): void {
    const $timingPerMonth = document.getElementById('damages-per-month') as HTMLDivElement;
    this.timingPerMonthChart = echarts.init($timingPerMonth);
    this.timingPerMonthChart.on('click', this.onClickBar);
    const $timingPerVenueChart = document.getElementById('damages-per-venue') as HTMLDivElement;
    this.timingPerVenueChart = echarts.init($timingPerVenueChart);
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public componentDidUpdate(prevProps: IPropsType, prevState: IStateType): void {
    const {loading, loadingPerVenue, perVenue} = this.props.dashboard;
    if (!loading) {
      this.updateTimingPerMonthChart();
    }

    if (!loadingPerVenue) {
      if (Object.keys(perVenue).length > 0) {
        this.updateTimingPerVenueChart();
      }
    }
  }

  public componentWillUnmount() {
    // remove listeners
    window.removeEventListener('resize', this.resizeCharts, false);

  }

  public render(): React.ReactElement<IPropsType> {
    const {loading, loadingPerVenue} = this.props.dashboard;
    return (
      <AppContainer title="" cMenu="1" cSubMenu="1.4">
        <section className="content">
          <Row>
            <div className="col-md-12">
              <div className="box">
                <div className="box-header with-border"><h3 className="box-title">Traslados nacionales por mes</h3>
                  <div className="box-tools pull-right">
                  </div>
                </div>
                <div className="box-body">
                  <div id="damages-per-month" style={{height: '500px', maxWidth: '100%'}}/>
                </div>
                {
                  loading &&
                  <div className="overlay">
                    <i className="fa fa-spinner fa-spin text-purple"/>
                  </div>
                }
              </div>
            </div>
          </Row>
          <Row>
            <div id="per-venue" className="col-md-12">
              <div className="box">
                <div className="box-header with-border"><h3 className="box-title">Detalle por sucursal</h3>
                  <div className="box-tools pull-right">
                  </div>
                </div>
                <div className="box-body">
                  <div id="damages-per-venue" style={{height: '500px', maxWidth: '100%'}}/>
                </div>
                {
                  loadingPerVenue &&
                  <div className="overlay">
                    <i className="fa fa-spinner fa-spin text-purple"/>
                  </div>
                }
              </div>
            </div>
          </Row>
        </section>
      </AppContainer>
    );
  }

  private updateTimingPerMonthChart() {

    const {data} = this.props.dashboard;

    const option: echarts.EChartOption = {
      color: ['#f1392c', '#00aa51'],
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: ['No cumple', 'Cumple'],
        x: 'center',
        bottom: 50
      },
      xAxis: {
        type: 'value',
        position: 'top'
      },
      yAxis: {
        type: 'category',
        data: data.months
      },
      grid: {
        top: 30,
        bottom: 100,
        // left
        x: 20,
        // right
        x2: 40,
        containLabel: true
      },
      series: [
        {
          name: 'No cumple',
          type: 'bar',
          stack: '1',
          itemStyle : { normal: {label : {show: true, position: 'insideRight'}}},
          data: data.overdue

        },
        {
          name: 'Cumple',
          type: 'bar',
          stack: '1',
          itemStyle : { normal: {label : {show: true, position: 'insideRight'}}},
          data: data.ontime
        }
      ]
    };
    this.timingPerMonthChart.setOption(option);

  }

  private updateTimingPerVenueChart() {
    const { perVenue, venuesDict } = this.props.dashboard;
    const venues = perVenue.venues.map((v: any) => venuesDict[v]);
    const data = perVenue.perVenue.map((value: number, i: number) => {
      return {
        name: venues[i].name,
        value
      };
    });

    const selected: any = {};
    venues.forEach((v: any, i: number) => {
      selected[v.name] = i < 10;
    });

    const option: echarts.EChartOption = {
      tooltip : {
        trigger: 'item',
        formatter: '{a} <br/>{b} : {c} ({d}%)'
      },
      legend: {
        type: 'scroll',
        orient: 'vertical',
        right: 10,
        top: 20,
        bottom: 20,
        data: venues.map((v: any) => v.name),
        selected
      },
      series : [
        {
          name: 'Resultados por sucursal',
          type: 'pie',
          radius : '55%',
          center: ['40%', '50%'],
          data,
          itemStyle: {
            emphasis: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    };
    this.timingPerVenueChart.setOption(option);

  }

  private onClickBar(param: any) {
    if (param.componentIndex === 0) {
      const { data } = this.props.dashboard;
      const { months } = data;
      const $perVenue = $('#per-venue');

      const period = months[param.dataIndex];
      this.props.getDashboardTimingPerVenue(period);
      if ($perVenue) {
        $([document.documentElement, document.body]).animate({
          scrollTop: ($perVenue as any).offset().top
        }, 500);
      }
    }
  }

  private resizeCharts() {
    if (this.timingPerMonthChart) {
      this.timingPerMonthChart.resize();
      setTimeout(() => {
        this.timingPerMonthChart.resize();
      }, 400);
    }

    if (this.timingPerVenueChart) {
      this.timingPerVenueChart.resize();
      setTimeout(() => {
        this.timingPerVenueChart.resize();
      }, 400);
    }
  }
}

const mapStateToProps = (state: { dashboardTiming: IDashboardTimingState }) => {
  return {
    dashboard: state.dashboardTiming
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch,
    getDashboardTiming: () => dispatch(getDashboardTiming()),
    getDashboardTimingPerVenue: (period: string) => dispatch(getDashboardTimingPerVenue(period))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(DashboardTimingView);
