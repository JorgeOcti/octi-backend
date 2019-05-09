// import * as PropTypes from 'prop-types';
import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import {DashboardReduxAction} from '../../actions/dashboard.actions';
import AppContainer from '../../container/AppContainer';
import Row from '../Utils/Row';
import { getDashboardTiming, IDashboardTimingState} from "../../actions/dashboardTiming.actions";

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<DashboardReduxAction>;
  dashboard: IDashboardTimingState

  getDashboardTiming(): void;
}

interface IStateType {
  error: Error | null;
}

class DashboardTimingView extends React.Component<IPropsType, IStateType> {

  // static propTypes = {
  //   dashboard: PropTypes.object.isRequired,
  //   dispatch: PropTypes.func.isRequired,
  //   getParticipantsPerDateAction: PropTypes.func.isRequired
  // };

  timingPerMonthChart: echarts.ECharts;

  // chartsColors: string[] = ['#3085c1', '#5c4b55', '#55b188', '#4d5c99', '#c53e5a', '#f8d991'];

  constructor(props: IPropsType) {
    super(props);
    this.resizeCharts = this.resizeCharts.bind(this);
    this.updateTimingPerMonthChart = this.updateTimingPerMonthChart.bind(this);
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

    const $timingPerMonth = document.getElementById('damages-per-venue') as HTMLDivElement
    this.timingPerMonthChart = echarts.init($timingPerMonth);
    //this.timingPerMonthChart.on('click', this.onClickBar);
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public componentDidUpdate(prevProps: IPropsType, prevState: IStateType): void {
    const {loading} = this.props.dashboard;
    if (!loading) {
      this.updateTimingPerMonthChart()
    }
  }

  public componentWillUnmount() {
    // remove listeners
    window.removeEventListener('resize', this.resizeCharts, false);

  }

  public render(): React.ReactElement<IPropsType> {
    const {loading} = this.props.dashboard;
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
                  <div id="damages-per-venue" style={{height: '500px', maxWidth: '100%'}}/>
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
        </section>
      </AppContainer>
    );
  }

  private updateTimingPerMonthChart() {

    const {data, venues} = this.props.dashboard;

    const option: any = {
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
        bottom: 50,
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
          data: data.overdue,

        },
        {
          name: 'Cumple',
          type: 'bar',
          stack: '1',
          itemStyle : { normal: {label : {show: true, position: 'insideRight'}}},
          data: data.ontime,
        }
      ]
    };
    this.timingPerMonthChart.setOption(option);

  }

  private onClickBar(param: any)
  {
    console.log(param);
  }

  private resizeCharts() {
    if (this.timingPerMonthChart && this.timingPerMonthChart !== undefined) {
      this.timingPerMonthChart.resize();
      setTimeout(() => {
        this.timingPerMonthChart.resize();
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
    getDashboardTiming: () => dispatch(getDashboardTiming())
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(DashboardTimingView);
