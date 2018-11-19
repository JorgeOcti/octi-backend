// import * as PropTypes from 'prop-types';
import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import {DashboardReduxAction, getParticipantsPerDateAction, IDashboardState} from '../../actions/dashboard.actions';
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

  // static propTypes = {
  //   dashboard: PropTypes.object.isRequired,
  //   dispatch: PropTypes.func.isRequired,
  //   getParticipantsPerDateAction: PropTypes.func.isRequired
  // };

  participantsPerDayChart: echarts.ECharts;
  participantsRangeChart: echarts.ECharts;
  carsByVenueChart: echarts.ECharts;

  // chartsColors: string[] = ['#3085c1', '#5c4b55', '#55b188', '#4d5c99', '#c53e5a', '#f8d991'];

  constructor(props: IPropsType) {
    super(props);
    this.resizeCharts = this.resizeCharts.bind(this);
    this.updateParticipantsChart = this.updateParticipantsChart.bind(this);
    this.updateCarsChart = this.updateCarsChart.bind(this);
    this.updateChartParticipantRange = this.updateChartParticipantRange.bind(this);
  }

  public componentWillMount(): void {
    // set the title of the page
    document.title = 'OSA Andes | Reportes generales';
    // get data
    this.props.getParticipantsPerDateAction();
    // add listeners
    window.addEventListener('resize', this.resizeCharts, false);
  }

  public componentDidMount(): void {
    const $participantPerDate = document.getElementById('participant-per-date') as HTMLDivElement;
    const $participantRange = document.getElementById('participant-range') as HTMLDivElement;
    const $carsByVenue = document.getElementById('cars-by-venue') as HTMLDivElement;
    this.participantsPerDayChart = echarts.init($participantPerDate);
    this.carsByVenueChart = echarts.init($carsByVenue);
    this.participantsRangeChart = echarts.init($participantRange);
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
      this.updateParticipantsChart();
      this.updateCarsChart();
      this.updateChartParticipantRange();
    }
  }

  public componentWillUnmount() {
    // remove listeners
    window.removeEventListener('resize', this.resizeCharts, false);
    // cancel request if component is inmounted
    if (this.props.dashboard.source) {
      this.props.dashboard.source.cancel('Operation canceled by the user.');
    }
  }

  public render(): React.ReactElement<IPropsType> {
    const {loading, participantsPerDate, carsPerDate, totalCars} = this.props.dashboard;
    return (
      <AppContainer title="" cMenu="1" cSubMenu="1.1">
        <section className="content">
          <div className="row">
            <div className="col-md-3 col-sm-6 col-xs-12">
              <div className="info-box">
                <span className="info-box-icon bg-aqua"><i className="fa fa-clipboard"/></span>
                <div className="info-box-content">
                  <span className="info-box-text">Revisiones Hoy</span>
                  <span className="info-box-number">
                    {participantsPerDate.length ? participantsPerDate[participantsPerDate.length - 1 ].total : 0}
                  </span>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6 col-xs-12">
              <div className="info-box">
                <span className="info-box-icon bg-yellow"><i className="fa fa-check-square"/></span>
                <div className="info-box-content">
                  <span className="info-box-text">Cargados Hoy</span>
                  <span className="info-box-number">{carsPerDate.length ? carsPerDate[carsPerDate.length - 1 ].total : 0}</span>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6 col-xs-12">
              <div className="info-box">
                <span className="info-box-icon bg-green"><i className="fa fa-car"/></span>
                <div className="info-box-content">
                  <span className="info-box-text">Total Cargas</span>
                  <span className="info-box-number">{totalCars}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-md-12">
              <div className="box">
                <div className="box-header with-border"><h3 className="box-title">Revisiones y cargas realizadas por día</h3>
                  <div className="box-tools pull-right">
                  </div>
                </div>
                <div className="box-body">
                  <div id="participant-per-date" style={{height: '400px', maxWidth: '100%'}}/>
                </div>
                {
                  loading &&
                    <div className="overlay">
                      <i className="fa fa-spinner fa-spin text-purple"/>
                    </div>
                }
              </div>
            </div>
            <div className="col-md-12">
              <div className="box">
                <div className="box-header with-border"><h3 className="box-title">Histograma cumplimiento de revisiones</h3>
                  <div className="box-tools pull-right">
                  </div>
                </div>
                <div className="box-body">
                  <div id="participant-range" style={{height: '400px', maxWidth: '100%'}}/>
                </div>
                {
                  loading &&
                    <div className="overlay">
                      <i className="fa fa-spinner fa-spin text-purple"/>
                    </div>
                }
              </div>
            </div>
            <div className="col-md-8">
              <div className="box">
                <div className="box-header with-border"><h3 className="box-title">Vehiculos por sucursal</h3>
                  <div className="box-tools pull-right">
                  </div>
                </div>
                <div className="box-body">
                  <div id="cars-by-venue" style={{height: '500px', maxWidth: '100%'}}/>
                </div>
                {
                  loading &&
                    <div className="overlay">
                      <i className="fa fa-spinner fa-spin text-purple"/>
                    </div>
                }
              </div>
            </div>
          </div>
        </section>
      </AppContainer>
    );
  }

  private updateParticipantsChart() {
    const {participantsPerDate, carsPerDate} = this.props.dashboard;
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
    const option: echarts.EChartOption = {
      // title: {
      //   text: 'Revisiones y cargas realizadas por día',
      //   x: 'center',
      //   textStyle: {
      //     align: 'center'
      //   }
      // },
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
        boundaryGap: false,
        data: categories,
        axisLine: {
          lineStyle: {
            color: 'rgba(0, 0, 0, 0.5)'
          }
        },
        splitLine: {
          show: false,
          lineStyle: {
            type: 'dashed',
            color: 'rgba(150, 150, 150, 0.5)'
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
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed',
            color: 'rgba(150, 150, 150, 0.5)'
          }
        }
      },
      grid: {
        top: 30,
        // left
        x: 40,
        // right
        x2: 30,
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

  private updateChartParticipantRange() {
    const {participantPerRange} = this.props.dashboard;
    const legends: any[] = [];
    const proyectionInterval = 5;
    const totals: any[] = [];
    for (let i = 0; i < 100; i += proyectionInterval) {
      const max = i + proyectionInterval;
      const key = `${i}-${max}`;
      legends.push(key);
      const value = participantPerRange.find((range) => (range._id === key));
      if (value) {
        totals.push(value.count);
      } else {
        totals.push(0);
      }
      // proyection.push({$cond: [{$and: [{$gte: ['$qualification', i]}, {$lte: ['$qualification', max]}]}, `${i}-${max}`, '']});
    }
    const option: echarts.EChartOption = {
      xAxis: {
        type: 'category',
        // boundaryGap: false,
        data: legends,
        axisLine: {
          lineStyle: {
            color: 'rgba(0, 0, 0, 0.5)'
          }
        },
        splitLine: {
          show: false,
          lineStyle: {
            type: 'dashed',
            color: 'rgba(150, 150, 150, 0.5)'
          }
        }
      },
      legend: {
        x: 'center',
        y: 'bottom',
        data: ['Revisiones']
      },
      grid: {
        top: 30,
        // left
        x: 40,
        // right
        x2: 30,
        containLabel: true
        // borderColor: '#FF0000'
      },
      yAxis: {
        minInterval: 1,
        type: 'value',
        axisLine: {
          lineStyle: {
            color: 'rgba(0, 0, 0, 0.5)'
          }
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed',
            color: 'rgba(150, 150, 150, 0.5)'
          }
        }
      },
      series: [{
        data: totals,
        type: 'line',
        name: 'Revisiones',
        areaStyle: {},
        smooth: true
      }]
    };
    this.participantsRangeChart.setOption(option);
  }

  private updateCarsChart() {
    const {carsByVenue} = this.props.dashboard;
    const legends = [];
    const series = [];
    for (const car in carsByVenue) {
      const currentCar = carsByVenue[car];
      if (car !== 'inTransit') {
        legends.push(car);
        series.push({
          name: car,
          value: currentCar.cars.length
          // itemStyle: {
          //   color: this.chartsColors[0]
          // }
        });
      } else {
        legends.push('En tránsito');
        series.push({
          name: 'En tránsito',
          value: currentCar.cars.length
          // itemStyle: {
          //   color: this.chartsColors[0]
          // }
        });
      }
    }
    const option: echarts.EChartOption = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b} : {c} ({d}%)'
      },
      legend: {
        x: 'center',
        // type: 'scroll',
        // orient: 'vertical',
        // right: 10,
        // top: 20,
        // bottom: 20,
        data: legends,
        bottom: 40,
        selected: {
          ['En tránsito']: Object.keys(carsByVenue).length === 1
        }
      },
      series: [
        {
          name: 'Sucursales',
          type: 'pie',
          radius: '70%',
          center: ['50%', '43%'],
          // label: {
          //   normal: {
          //     position: 'inner'
          //   }
          // },
          data: series,
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
    this.carsByVenueChart.setOption(option);

  }

  private resizeCharts() {
    if (this.participantsPerDayChart && this.participantsPerDayChart !== undefined) {
      this.participantsPerDayChart.resize();
      setTimeout(() => {
        this.participantsPerDayChart.resize();
      }, 400);
    }
    if (this.carsByVenueChart && this.carsByVenueChart !== undefined) {
      this.carsByVenueChart.resize();
      setTimeout(() => {
        this.carsByVenueChart.resize();
      }, 400);
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
