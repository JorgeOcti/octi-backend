// import * as PropTypes from 'prop-types';
import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import {DashboardReduxAction} from '../../actions/dashboard.actions';
import {getDashboardDamages, IDashboardDamagesState} from '../../actions/dashboardDamages.actions';
import AppContainer from '../../container/AppContainer';
import Row from '../Utils/Row';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<DashboardReduxAction>;
  dashboard: IDashboardDamagesState;

  getDashboardDamages(): void;
}

interface IStateType {
  error: Error | null;
}

class DashboardDamagesView extends React.Component<IPropsType, IStateType> {
  damagesPerVenueChart: echarts.ECharts;

  constructor(props: IPropsType) {
    super(props);
    this.resizeCharts = this.resizeCharts.bind(this);
    this.updateDamagesPerVenueChart = this.updateDamagesPerVenueChart.bind(this);
  }

  public componentWillMount(): void {
    // set the title of the page
    document.title = 'OSA Andes | Reportería de daños';
    // get data
    this.props.getDashboardDamages();
    // add listeners
    window.addEventListener('resize', this.resizeCharts, false);
  }

  public componentDidMount(): void {
    const $damagesPerVenue = document.getElementById('damages-per-venue') as HTMLDivElement;
    this.damagesPerVenueChart = echarts.init($damagesPerVenue);
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
      this.updateDamagesPerVenueChart();
    }
  }

  public componentWillUnmount() {
    // remove listeners
    window.removeEventListener('resize', this.resizeCharts, false);
  }

  public render(): React.ReactElement<IPropsType> {
    const {loading} = this.props.dashboard;
    return (
      <AppContainer title="" cMenu="1" cSubMenu="1.3">
        <section className="content">
          <Row>
            <div className="col-md-12">
              <div className="box">
                <div className="box-header with-border"><h3 className="box-title"># Unidades con daños por sucursal</h3>
                  <div className="box-tools pull-right">
                  </div>
                </div>
                <div className="box-body">
                  <div id="damages-per-venue" style={{height: '50vh', maxWidth: '100%'}} />
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

  private updateDamagesPerVenueChart() {

    const {data, venues} = this.props.dashboard;

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
        data: data.venues.map((v: string) => venues.find((v2: any) => v2._id === v).name),
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
          name: 'Sin daños',
          type: 'bar',
          data: data.undamaged,
          stack: '1'
        },
        {
          name: 'Con daños',
          type: 'bar',
          data: data.damaged,
          stack: '1'
        }
      ]
    };
    this.damagesPerVenueChart.setOption(option);

  }

  private resizeCharts() {
    if (this.damagesPerVenueChart) {
      this.damagesPerVenueChart.resize();
      setTimeout(() => {
        this.damagesPerVenueChart.resize();
      }, 400);
    }
  }
}

const mapStateToProps = (state: { dashboardDamages: IDashboardDamagesState }) => {
  return {
    dashboard: state.dashboardDamages
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch,
    getDashboardDamages: () => dispatch(getDashboardDamages())
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(DashboardDamagesView);
