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
import {getDashboardCleaning, IDashboardDercoState} from "../../actions/dashboardDerco.actions";

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<DashboardReduxAction>;
  dashboard: IDashboardDercoState;

  getDashboardCleaning(): void;
}

interface IStateType {
  error: Error | null;
}

class DashboardDercoView extends React.Component<IPropsType, IStateType> {
  cleaningPerDayChart: echarts.ECharts;

  constructor(props: IPropsType) {
    super(props);
    this.resizeCharts = this.resizeCharts.bind(this);
    this.updateCleaningPerDayChart = this.updateCleaningPerDayChart.bind(this);
  }

  public componentWillMount(): void {
    // set the title of the page
    document.title = 'OSA Andes | Reportería de daños';
    // get data
    this.props.getDashboardCleaning();
    // add listeners
    window.addEventListener('resize', this.resizeCharts, false);
  }

  public componentDidMount(): void {
    const $cleaningPerDayChart = document.getElementById('cleaning-per-day') as HTMLDivElement;
    this.cleaningPerDayChart = echarts.init($cleaningPerDayChart);
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public componentDidUpdate(prevProps: IPropsType, prevState: IStateType): void {

    const { cleaning } = this.props.dashboard;
    if (!cleaning.loading) {
      this.updateCleaningPerDayChart();
    }
  }

  public componentWillUnmount() {
    // remove listeners
    window.removeEventListener('resize', this.resizeCharts, false);
  }

  public render(): React.ReactElement<IPropsType> {
    const { cleaning } = this.props.dashboard;
    return (
      <AppContainer title="" cMenu="1" cSubMenu="1.4">
        <section className="content">
          <Row>
            <div className="col-md-12">
              <div className="box">
                <div className="box-header with-border"><h3 className="box-title"># Unidades con daños por sucursal</h3>
                  <div className="box-tools pull-right">
                  </div>
                </div>
                <div className="box-body">
                  <div id="cleaning-per-day" style={{height: '50vh', maxWidth: '100%'}} />
                </div>
                {
                  cleaning.loading &&
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

  private updateCleaningPerDayChart() {

    const { cleaning } = this.props.dashboard;

    const option: any = {
      color: ['#00aa51', '#f1392c'],
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: ['Sin daños', 'Con daños'],
        x: 'center',
        bottom: 50
      },
      xAxis: {
        data: cleaning.days,
        axisLabel: {
          rotate: 60
        }

      },
      yAxis: {
        // type: 'category',
      },
      grid: {
        top: 30,
        bottom: 100,
        // left
        x: 20,
        // right
        x2: 10,
        containLabel: true
      },
      series: [
        {
          name: 'Limpios',
          type: 'bar',
          data: cleaning.clean,
          stack: '1'
        },
        {
          name: 'Con daños',
          type: 'bar',
          data: cleaning.notClean,
          stack: '1'
        }
      ]
    };
    this.cleaningPerDayChart.setOption(option);

  }

  private resizeCharts() {
    if (this.cleaningPerDayChart) {
      this.cleaningPerDayChart.resize();
      setTimeout(() => {
        this.cleaningPerDayChart.resize();
      }, 400);
    }
  }
}

const mapStateToProps = (state: { dashboardDerco: IDashboardDercoState }) => {
  return {
    dashboard: state.dashboardDerco
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch,
    getDashboardCleaning: () => dispatch(getDashboardCleaning())
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(DashboardDercoView);
