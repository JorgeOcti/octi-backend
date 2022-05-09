// import * as PropTypes from 'prop-types';
import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import {DashboardReduxAction, getParticipantsPerDateAction, IDashboardState} from '../../actions/dashboard.actions';
import AppContainer from '../../container/AppContainer';
import Row from '../Utils/Row';
import BootstrapSelect from '../Utils/BootstrapSelect';
import TrackingBasePage from '../Utils/TrackingBasePage';
import { hasPermission } from '../../utils/common';
import { IWindow } from '../../interfaces/window';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<DashboardReduxAction>;
  dashboard: IDashboardState;

  getParticipantsPerDateAction(companies?:string): void;
}

interface IStateType {
  selectedCompanies: any[];
  error: Error | null;
}

declare let window: IWindow;

class DashboardGeneralView extends TrackingBasePage<IPropsType, IStateType> {
  title : string;

  // static propTypes = {
  //   dashboard: PropTypes.object.isRequired,
  //   dispatch: PropTypes.func.isRequired,
  //   getParticipantsPerDateAction: PropTypes.func.isRequired
  // };
  readonly state = {
    error: null,
    selectedCompanies: ['']
  };

  participantsPerDayChart: echarts.ECharts;
  participantsRangeChart: echarts.ECharts;
  carsByVenueChart: echarts.ECharts;

  // chartsColors: string[] = ['#3085c1', '#5c4b55', '#55b188', '#4d5c99', '#c53e5a', '#f8d991'];

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Reportes generales';
    this.resizeCharts = this.resizeCharts.bind(this);
    this.updateParticipantsChart = this.updateParticipantsChart.bind(this);
    this.updateCarsChart = this.updateCarsChart.bind(this);
    this.updateChartParticipantRange = this.updateChartParticipantRange.bind(this);
    this.filterCompanies = this.filterCompanies.bind(this);
  }

  public componentWillMount(): void {
    // get data
    this.props.getParticipantsPerDateAction();
    // add listeners
    window.addEventListener('resize', this.resizeCharts, false);
  }

  public componentDidMount(): void {
    super.componentDidMount();
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
      // this.updateCarsChart();
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
    const {
      loading, participantsReceivedPerDate, participantsSentPerDate, carsPerDate, totalCars, companies
    } = this.props.dashboard;
    const {selectedCompanies} = this.state;

    return (
      <AppContainer title="" cMenu="1" cSubMenu="1.1">
        <section className="content">
          <Row>
            <div className="col-md-3 col-sm-6 col-xs-12">
              <div className="info-box">
                <span className="info-box-icon bg-aqua"><i className="fa fa-clipboard"/></span>
                <div className="info-box-content">
                  <span className="info-box-text">Revisiones Hoy</span>
                  <span className="info-box-number">
                    {(participantsReceivedPerDate.length ? participantsReceivedPerDate[participantsReceivedPerDate.length - 1 ].total : 0) +participantsSentPerDate.length ? participantsSentPerDate[participantsSentPerDate.length - 1 ].total : 0 }
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
                  <span className="info-box-number">{new Intl.NumberFormat('es-CL').format(totalCars)}</span>
                </div>
              </div>
            </div>
          </Row>
          <Row>
            <div className="col-md-12">
              <div className="box">
                <div className="box-header with-border"><h3 className="box-title">Revisiones y cargas realizadas por día</h3>
                  <div className="box-tools pull-right">
                  </div>
                </div>
                <div className="box-body">
                  <div className="row">
                    <div className="col-md-8" />
                    <div className="col-md-4">
                      <BootstrapSelect
                        noneSelectedText="Todas las empresas"
                        displayItems={2}
                        selectedText="empresas seleccionadas."
                        selected={selectedCompanies}
                        autoClouse={true}
                        allOption={false}
                        selectAll={() => ({})}
                        options={[{value: '', text: 'Todas las empresas'},
                          ...companies.map((company: any) => ({
                          value: company._id,
                          text: company.name
                        }))]}
                        onClick={this.filterCompanies}
                      />
                    </div>
                    <div className="col-md-12">
                      <div id="participant-per-date" style={{height: '450px', maxWidth: '100%'}}/>
                    </div>
                  </div>
                </div>
                {
                  loading &&
                    <div className="overlay">
                      <i className="fa fa-spinner fa-spin text-purple"/>
                    </div>
                }
              </div>
            </div>
            <div className="col-md-12" style={{display: 'none'}}>
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
            <div className="col-md-8" style={{display: 'none'}}>
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
          </Row>
        </section>
      </AppContainer>
    );
  }

  private filterCompanies(value: any) {
    this.props.getParticipantsPerDateAction(value);
    this.setState({
      selectedCompanies: [value]
    });
  }

  private updateParticipantsChart() {
    const {
      participantsReceivedPerDate,participantsSentPerDate, carsPerDate,
      planningPerDate, planningProcessPerDate
    } = this.props.dashboard;
    const categories: any[] = [];
    const totalsReceived: any[] = [];
    const totalsSent: any[] = [];
    const totalsCars: any[] = [];
    const totalsPlanning: any[] = [];
    const totalsplanningProcess: any[] = [];

    if (participantsReceivedPerDate.length) {
      participantsReceivedPerDate.forEach((day) => {
        categories.push(day._id);
        totalsReceived.push(day.total);
      });
    }
    if (participantsSentPerDate.length) {
      participantsSentPerDate.forEach((day) => {
        totalsSent.push(day.total);
      });
    }
    if (carsPerDate.length) {
      carsPerDate.forEach((day) => {
        totalsCars.push(day.total);
      });
    }
    if (planningPerDate.length) {
      planningPerDate.forEach((day) => {
        totalsPlanning.push(day.total);
      });
    }
    if (planningProcessPerDate.length) {
      planningProcessPerDate.forEach((day) => {
        totalsplanningProcess.push(day.total);
      });
    }
    const dataLabels = ['Recepciones', 'Envíos'];
    const series = [{
      data: totalsReceived,
      name: 'Recepciones',
      type: 'line',
      color: '#337AB7',
      smooth: true
    }, {
      data: totalsSent,
      name: 'Envíos',
      type: 'line',
      color: '#2DB06B',
      smooth: true
    }, {
      data: totalsCars,
      name: 'Cargados',
      type: 'line',
        color: '#678099',
        smooth: true
      }];

    if (hasPermission(window.user, 'viewPlanning')) {
      dataLabels.push('Planificados', 'Linea de control');
      series.push({
        data: totalsPlanning,
        name: 'Planificados',
        type: 'line',
        color: '#00b5fd',
        smooth: true
      });
      series.push({
        data: totalsplanningProcess,
        name: 'Linea de control',
        type: 'line',
        color: '#7c344c',
        smooth: true
      });
    }
    dataLabels.push('Cargados');
    // const option: echarts.EChartOption = {
    const option: any = {
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
        bottom: 50,
        // y: 'bottom',
        data: dataLabels
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
          rotate: 60
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
        bottom: 80,
        // left
        x: 20,
        // right
        x2: 20,
        containLabel: true
        // borderColor: '#FF0000'
      },
      dataZoom: {
        show: true,
        realtime: true,
        start: 0,
        end: 100
      },
      series
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
    // const option: echarts.EChartOption | any = {
    const option: any = {
      tooltip: {
        trigger: 'axis'
      },
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
        x: 20,
        // right
        x2: 20,
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
        color: '#e54e76',
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
          //   col  or: this.chartsColors[0]
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
        // x: 'center',
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
    if (this.participantsPerDayChart) {
      this.participantsPerDayChart.resize();
      setTimeout(() => {
        this.participantsPerDayChart.resize();
      }, 400);
    }
    if (this.carsByVenueChart) {
      this.carsByVenueChart.resize();
      setTimeout(() => {
        this.carsByVenueChart.resize();
      }, 400);
    }
    if (this.participantsRangeChart) {
      this.participantsRangeChart.resize();
      setTimeout(() => {
        this.participantsRangeChart.resize();
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
    getParticipantsPerDateAction: (companies?:string) => dispatch(getParticipantsPerDateAction(companies))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(DashboardGeneralView);
