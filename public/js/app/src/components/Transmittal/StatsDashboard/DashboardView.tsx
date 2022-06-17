import {RouteComponentProps} from "react-router";
import {Dispatch} from "redux";
import {ITransmittalActionTypes, ITransmittalState} from "../../../actions/transmittal.types";
import TrackingBasePage from "../../Utils/TrackingBasePage";
import * as moment from "moment-timezone";
import * as React from "react";
import AppContainer from "../../../container/AppContainer";
import TransmittalActions from "../../../actions/transmittal.actions";
import {connect} from "react-redux";
import DateRangeInput from "../../Utils/DateRangeInput";
import {IWindow} from "../../../interfaces/window";
import TransmittalLineChartComponent from "./TransmittalLineChartComponent";

declare let window: IWindow;

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  router: any;
  dispatch: Dispatch<ITransmittalActionTypes>;
}

interface IStateType {
  error: Error | null;
  loading: boolean;
  from: Date;
  to: Date;
}

class DashboardView extends TrackingBasePage<IPropsType, IStateType> {
  title: string;
  histogramChartRef: React.RefObject<HTMLDivElement>;
  histogramChart: echarts.ECharts;

  readonly state: IStateType = {
    error: null,
    loading: true,
    from: moment().startOf('month').subtract(1, 'months').toDate(),
    to: moment().toDate(),
  };

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Transporte análisis';
    this.histogramChartRef = React.createRef<HTMLDivElement>();
    this.onDateRangeChange = this.onDateRangeChange.bind(this);
    this.resizeCharts = this.resizeCharts.bind(this);
    this.updateDashboardChart = this.updateDashboardChart.bind(this);
  }

  public componentWillUnmount(): void {
    // remove listeners
    window.removeEventListener('resize', this.resizeCharts, false);
  }

  componentWillMount() {
    window.addEventListener('resize', this.resizeCharts, false);
  }

  componentDidMount() {
    super.componentDidMount();
    this.histogramChart = echarts.init(this.histogramChartRef.current!!)
    this.updateDashboardChart()
  }

  private resizeCharts(): void {
    if (this.histogramChart) {
      this.histogramChart.resize();
      setTimeout(() => {
        this.histogramChart.resize();
      }, 400);
    }
  }

  getDateRangeOptions(): daterangepicker.Options {
    return {
      startDate: this.state.from,
      endDate: this.state.to,
      maxDate: moment().toDate(),
      minYear: 2021,
      locale: {
        format: 'DD/MM/YYYY',
        applyLabel: 'Aplicar',
        cancelLabel: 'Cancelar'
      },
      opens: 'left'
    };
  }

  onDateRangeChange(from: Date, to: Date) {
    this.setState({
      from,
      to
    });
    // this.props.changeRangeDashboardAction(
    //   moment(from).toDate(), moment(to).toDate()
    // );
    // this.debounceOnChangeSearch();
  }

  render() {
    const {from, to } = this.state;

    return <AppContainer title='' cMenu='3' cSubMenu='3.6'>
      <div className="box-title">
        <span>OT por etapa</span>
      </div>
      <div className="row no-margin">
        <div className='col-xs-12 col-md-3 no-padding'>
          <DateRangeInput
            options={this.getDateRangeOptions()}
            onChange={this.onDateRangeChange}
            startDate={from}
            endDate={to}
          />
        </div>
      </div>
      <section  className='content'>
        <div className="box">

          <div className="row no-margin" style={{maxWidth: '100%', marginBottom: '20px'}}>
            <div className="box-title">
              <span>Vista general de la cadena</span>
            </div>
            <TransmittalLineChartComponent  circleSize={10} circles={[]}/>
          </div>

          <div className="row no-margin">
            <div className="box-title">
              <span>OT totales completadas por semana</span>
            </div>
            <div ref={this.histogramChartRef}  style={{height: '20vh', maxWidth: '100%'}} > </div>
          </div>

        </div>
      </section>
    </AppContainer>;
  }

  private updateDashboardChart() {
    // const { monthlyReport, inventorySettings } = this.props.;


    const option: any = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'none'
        }
      },
      legend: {
        x: 'center',
        bottom: 50,
        data: ['2', '2', '2', '2', '2', '2', '2']
      },
      calculable: true,
      xAxis: [
        {
          type: 'category',
          axisTick: {show: false},
          data: ['1', '1', '1', '1', '1', '1', '1']
        }
      ],
      yAxis: [
        {
          show: false,
          type: 'value'
        }
      ],
      grid: {
        top: 30,
        bottom: 100,
        // left
        x: 0,
        // right
        x2: 10,
        containLabel: true
      },
      series: [
        {
          name: 'OT completadas',
          type: 'bar',
          color: '#3b8dbc',
          barMaxWidth: 50,
          label: {
            position: 'top',
            show: true,
            fontSize: 12,
            color: '#000'
          },
          data: [120, 200, 150, 80, 70, 110, 130],
        }
      ]
    };

    this.histogramChart.setOption(option);

  }

}

const mapStateToProps = (state: { transmittal: ITransmittalState, router: any }) => {
  return {
    transmittal: state.transmittal,
    router: state.router
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch,
  };
};


export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(DashboardView);
