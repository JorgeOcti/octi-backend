// import * as PropTypes from 'prop-types';
import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import * as moment from 'moment';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import {DashboardReduxAction} from '../../actions/dashboard.actions';
import { getDashboardTiming, IDashboardTimingState} from '../../actions/dashboardTiming.actions';
import AppContainer from '../../container/AppContainer';
import Row from '../Utils/Row';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<DashboardReduxAction>;
  dashboard: IDashboardTimingState;
  getDashboardTiming(from: string, to: string): void;
}

interface IStateType {
  error: Error | null;
  showDrilldown: boolean,
  selectedDate: string | null,
}

class DashboardTimingView extends React.Component<IPropsType, IStateType> {

  timingPerMonthChart: echarts.ECharts;
  timingPerVenueChart: echarts.ECharts;

  state = {
    showDrilldown: false,
    error: null,
    selectedDate: null
  }

  constructor(props: IPropsType) {
    super(props);
    this.resizeCharts = this.resizeCharts.bind(this);
    this.updateTimingPerMonthChart = this.updateTimingPerMonthChart.bind(this);
    this.showVenueChart = this.showVenueChart.bind(this);
    this.showDateChart = this.showDateChart.bind(this);
  }

  public componentWillMount(): void {
    // set the title of the page
    document.title = 'OSA Andes | Reportería de tiempos de traslado';
    // get data
    let from = moment().subtract(2, 'months').startOf('month');
    let to = moment().endOf('month');
    this.props.getDashboardTiming(from.format('YYYY-MM-DD'), to.format('YYYY-MM-DD'));
    // add listeners
    window.addEventListener('resize', this.resizeCharts, false);
  }

  public componentDidMount(): void {
    let $this = this;
    const $timingPerMonth = document.getElementById('damages-per-month') as HTMLDivElement;
    this.timingPerMonthChart = echarts.init($timingPerMonth);
    this.timingPerMonthChart.on('click', this.showVenueChart);
    ($('input[name="daterange"]') as any).daterangepicker({
      startDate: moment().subtract(2, 'months').startOf('month'),
      endDate: moment().endOf('month'),
      maxDate: moment(),
      locale: {
        format: 'MM/YYYY',
        customRangeLabel: "Período personalizado",
        applyLabel: "Aplicar",
        cancelLabel: "Cancelar",
      },
      ranges: {
        'Este mes': [moment().startOf('month'), moment().endOf('month')],
        'Últimos 3 meses': [moment().subtract(2, 'months').startOf('month'), moment().endOf('month')],
        'Últimos 6 meses': [moment().subtract(5, 'months').startOf('month'), moment().endOf('month')],
        'Último año': [moment().subtract(11, 'months').startOf('month'), moment().endOf('month')],
      }
    }, function (from: any, to: any, label: any) {
      $this.props.getDashboardTiming(from.format('YYYY-MM-DD'), to.format('YYYY-MM-DD'));
    });
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public componentDidUpdate(prevProps: IPropsType, prevState: IStateType): void {
    const {loading, loadingPerVenue, perVenue} = this.props.dashboard;
    const {showDrilldown} = this.state;
    if (!loading) {
      showDrilldown ? this.updateTimingPerVenueChart() :
        this.updateTimingPerMonthChart();
    }
  }

  public componentWillUnmount() {
    // remove listeners
    window.removeEventListener('resize', this.resizeCharts, false);

  }

  public render(): React.ReactElement<IPropsType> {
    const {loading} = this.props.dashboard;
    const {selectedDate} = this.state;
    let selectedMonth = selectedDate ?
      this.capitalizeFirstLetter(moment(selectedDate, 'MM-YYYY').format('MMMM YYYY'))  : "";

    return (
      <AppContainer title="" cMenu="1" cSubMenu="1.4">
        <section className="content">
          <Row>
            <div className="col-md-12">
              <div className="box">
                <div className="box-header with-border"><h3 className="box-title">{selectedDate ?`Traslados nacionales: ${selectedMonth}` : 'Traslados nacionales por mes'}</h3>
                  <div className="box-tools pull-right">
                  </div>
                </div>

                {selectedDate ? null : <div className="row">
                  <div className="col-md-offset-8 col-md-4">
                    <div className="input-group input-group-sm" style={{padding: '10px 5px'}}>
                      <input type="text" className="form-control input-sm" name="daterange" />
                      <div className="input-group-btn">
                        <button className="btn btn-default"><i className="fa fa-calendar"/></button>
                      </div>
                    </div>
                  </div>
                </div>}

                <div className="box-body">
                <p
                  className="text-muted text-center"
                  style={{padding: '10px 0 0 0', margin: '0'}}
                >{selectedDate ? '' : 'Haz click en el gráfico para ver detalles de no cumplimiento'}.</p>
                  <div id="damages-per-month" style={{minHeight: '350px', maxWidth: '100%'}} />
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

  private capitalizeFirstLetter(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private updateTimingPerMonthChart() {
    const {data} = this.props.dashboard;
    let months : string[] = [];
    let overdue : any[] = []
    let ontime : any[] = [];
    const createDataElement = (n: number) => n > 0 ? {
        value: n,
        label : n > 0 ? {show: true, position: 'insideRight'} : {show: false}
      } : null;

    Object.keys(data).map( k => {
      months.push(this.capitalizeFirstLetter(moment(k, "MM-YYYY").format('MMMM YYYY')));
      ontime.push(data[k].filter( (d: { atTime: boolean; }) => d.atTime).length);
      overdue.push(data[k].filter( (d: { atTime: boolean; }) => !d.atTime).length);
    });

    ontime = ontime.map(createDataElement)
    overdue = overdue.map(createDataElement)

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
        // x: 'center',
        bottom: 5
      },
      xAxis: {
        type: 'value',
        position: 'top'
      },
      yAxis: {
        type: 'category',
        data: months
      },
      grid: {
        top: 30,
        bottom: 100,
        left: 10,
        right: 10,
        containLabel: true,
        height: 290
      },
      series: [
        {
          name: 'No cumple',
          type: 'bar',
          stack: '1',
          data: overdue,
          barMinHeight: 15,
        },
        {
          name: 'Cumple',
          type: 'bar',
          stack: '1',
          data: ontime,
          barMinHeight: 15,
        }
      ],
      toolbox: [],
    };

    this.timingPerMonthChart.setOption(option, true);
  }

  private updateTimingPerVenueChart() {
    const { selectedDate } = this.state;
    const { data } = this.props.dashboard;
    let values = data[selectedDate!];
    let routes : any = {};
    let names : string[] = [];

    const createDataElement = (n: number) =>  n > 0 ? {
        value: n,
        label : n > 0 ? {show: true, position: 'insideRight'} : {show: false}
      } : null;

    values.map( (d : any) => {
      let routeName = d.from + " - " + d.to;
      if (routes[routeName] === undefined) {
        routes[routeName] = {overdue: 0, ontime: 0, limitTime: d.daysLimit};
        names.push(routeName);
      }
      d.atTime ?  routes[routeName].ontime++ : routes[routeName].overdue++;
    });

    names.sort();
    let ontime : any[] = [];
    let overdue : any[] = [];

    names.map((n : string) => {
      let data = routes[n];
      ontime.push({...createDataElement(data.ontime as number), limitTime: data.limitTime });
      overdue.push({...createDataElement(data.overdue as number), limitTime: data.limitTime });
    });

    const option: echarts.EChartOption = {
      color: ['#f1392c', '#00aa51'],
      tooltip: {
        trigger: 'axis',
        formatter: function(params : any) {
          let timeLimit = 0;
          let output = '<b>' + params[0].name + '</b><br/>'

          params.map((p: any) => {
            output += p.marker + p.seriesName + ': ' + (p.value ? p.value : '-')  + '<br/>'; // : every 2nth
            if (timeLimit === 0)
              timeLimit = p.data.limitTime
          });

          output += `Tiempo límite de entrega: ${timeLimit} días`
          return output
        },
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: ['No cumple', 'Cumple'],
        // x: 'center',
        bottom: 5
      },
      xAxis: {
        type: 'value',
        position: 'top'
      },
      yAxis: {
        type: 'category',
        data: names
      },
      grid: {
        top: 30,
        bottom: 100,
        left: 10,
        right: 10,
        containLabel: true,
        height: 290
      },
      series: [
        {
          name: 'No cumple',
          type: 'bar',
          stack: '1',
          data: overdue,
          barMinHeight: 15,
          barMinWidth: 25,
        },
        {
          name: 'Cumple',
          type: 'bar',
          stack: '1',
          data: ontime,
          barMinHeight: 15,
          barMinWidth: 25,
        }
      ],
      toolbox: {
        left: 20,
        top: 0,
        feature: {
          myBackBtn: {
            show: true,
            icon: 'path://M16.6666667 9.16666667 6.525 9.16666667 11.1833333 4.50833333 10 3.33333333 3.33333333 10 10 16.6666667 11.175 15.4916667 6.525 10.8333333 16.6666667 10.8333333z',
            title: ' ',
            onclick: this.showDateChart
          }
        },
        iconStyle: {
          color: 'rgba(0, 0, 0, 0.8)',
          fontWeight: 'bolder',
          borderColor: 'rgba(0, 0, 0, 0)',
          shadowColor: 'rgba(0, 0, 0, 0)',
          emphasis: {
            color: '#a94442',
            borderColor: 'rgba(0, 0, 0, 0)',
            shadowColor: 'rgba(0, 0, 0, 0)',
          }
        }
      },
    };

    this.timingPerMonthChart.setOption(option, true);

  }

  private showVenueChart(param: any) {
    const { data } = this.props.dashboard;
    const month = moment(param.name.toLowerCase(), 'MMMM YYYY').format('MM-YYYY');
    this.setState({
      showDrilldown: true,
      selectedDate: month
    }, () => {
      setTimeout(() => {
        this.timingPerMonthChart.off('click');
      }, 200)
    });
  }

  private showDateChart(){
    this.setState({
      showDrilldown: false,
      selectedDate: null,
    }, () => {
      setTimeout(()=> {
        this.timingPerMonthChart.on('click', this.showVenueChart);
      }, 500);
      const $timingPerMonth = document.getElementById('damages-per-month') as HTMLDivElement;
      this.timingPerMonthChart = echarts.init($timingPerMonth);
    })
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
    getDashboardTiming: (from: string, to: string) => dispatch(getDashboardTiming(from, to)),
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(DashboardTimingView);
