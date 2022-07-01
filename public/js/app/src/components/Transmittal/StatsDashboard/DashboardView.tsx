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
import {sum} from "lodash";

declare let window: IWindow;

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  router: any;
  dispatch: Dispatch<ITransmittalActionTypes>;
  transmittalActions: TransmittalActions;
  transmittal: ITransmittalState
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
    this.proccessDataForChart = this.proccessDataForChart.bind(this);
    this.processDataForTimeline = this.processDataForTimeline.bind(this);
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
    const {from, to} =  this.state;
    this.props.transmittalActions.loadTransmittalResume(moment(from).unix().toString(), moment(to).unix().toString())

  }

  componentDidUpdate(prevProps: Readonly<IPropsType>, prevState: Readonly<IStateType>, snapshot?: any) {
    if (this.histogramChartRef.current)
      this.histogramChart = echarts.init(this.histogramChartRef.current!!);
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
    }, () => {
      this.props.transmittalActions.loadTransmittalResume(moment(from).unix().toString(), moment(to).unix().toString())
    });
  }

  private calculateTimeDiff(transmittalResume: any){
    let datum = {
      shipping_pending: -1,
      pending_loading: -1,
      loading_evidence: -1,
      evidence_arrival: -1,
      arrival_check: -1,
    }

    if (transmittalResume.shippingDate && transmittalResume.pendingDate)
      datum.shipping_pending = moment(transmittalResume.pendingDate).diff(moment(transmittalResume.shippingDate), 'hours');

    if (transmittalResume.pendingDate && transmittalResume.loadingDate)
      datum.pending_loading = moment(transmittalResume.loadingDate).diff(moment(transmittalResume.pendingDate), 'hours');

    if (transmittalResume.loadingDate && transmittalResume.evidenceDate)
      datum.loading_evidence = moment(transmittalResume.evidenceDate).diff(moment(transmittalResume.loadingDate), 'hours');

    if (transmittalResume.evidenceDate && transmittalResume.arrivalDate)
      datum.evidence_arrival = moment(transmittalResume.arrivalDate).diff(moment(transmittalResume.evidenceDate), 'hours');

    if (transmittalResume.arrivalDate && transmittalResume.checkDate)
      datum.arrival_check = moment(transmittalResume.checkDate).diff(moment(transmittalResume.arrivalDate), 'hours');

    return datum;
  }

  private calculateCarOTQuantity(transmittalResumes: any){
    let shipping = transmittalResumes.filter((t: { shippingDate: string; }) =>  t.shippingDate != null)
    let pending = transmittalResumes.filter((t: { status: string; }) =>  t.status === 'pending' )
    let loading = transmittalResumes.filter((t: { status: string; loadingDate: string|null; }) =>  t.status === 'pending' && t.loadingDate != null)
    let evidence  = transmittalResumes.filter((t: { status: string; evidenceDate: string|null; }) =>  t.status === 'inTransit' && t.evidenceDate != null)
    let arrival = transmittalResumes.filter((t: { status: string; checkDate: string|null;}) =>  t.status === 'completed'&& t.checkDate == null)

    return {
      shipping_car: shipping.reduce((a:number, b:any) => a + b.cars, 0),
      pending_car: pending.reduce((a:number, b:any) => a + b.cars, 0),
      pending_ot: pending.length,
      loading_car: loading.reduce((a:number, b:any) => a + b.cars, 0),
      loading_ot: loading.length,
      evidence_car: evidence.reduce((a:number, b:any) => a + b.cars, 0),
      evidence_ot: evidence.length,
      arrival_car: arrival.reduce((a:number, b:any) => a + b.cars, 0),
      arrival_ot: arrival.length,
    };
  }

  private humanizeHours(hours: number){
    if (hours === 0)
      return '-'
    let days = Math.floor(hours/24);
    let left_hours = Math.floor(hours%24);

    if (days > 0)
      if (hours > 0)
        return `${days}d ${left_hours}h`
      else
        return `${days}d`
    else
      return `${left_hours}d`
  }

  private processDataForTimeline() {
    let {resume} = this.props.transmittal;

    if (resume.length === 0)
      return {circles: []}

    resume = resume.filter(r => r.type === "Internacional")


    let quanty_datum = this.calculateCarOTQuantity(resume);
    let time_datum_resume = resume.map(transmittal =>
      this.calculateTimeDiff(transmittal)
    )

    let filtered_shipping = time_datum_resume.filter(datum => datum.shipping_pending >= 0).map(d => d.shipping_pending)
    let filtered_pending = time_datum_resume.filter(datum => datum.pending_loading >= 0).map(d => d.pending_loading)
    let filtered_loaded = time_datum_resume.filter(datum => datum.loading_evidence >= 0).map(d => d.loading_evidence)
    let filtered_evidence = time_datum_resume.filter(datum => datum.evidence_arrival >= 0).map(d => d.evidence_arrival)
    let filtered_checked = time_datum_resume.filter(datum => datum.arrival_check >= 0).map(d => d.arrival_check)


    let shipping_time_hours = filtered_shipping.length === 0 ? 0 : sum(filtered_shipping)/filtered_shipping.length;
    let pending_time_hours = filtered_pending.length === 0 ? 0 : sum(filtered_pending)/filtered_pending.length;
    let loaded_time_hours = filtered_loaded.length === 0 ? 0 : sum(filtered_loaded)/filtered_loaded.length;
    let evidence_time_hours = filtered_evidence.length === 0 ? 0 : sum(filtered_evidence)/filtered_evidence.length;
    let checked_time_hours = filtered_checked.length === 0 ? 0 : sum(filtered_checked)/filtered_checked.length;

    let shipping_time = this.humanizeHours(shipping_time_hours);
    let pending_time = this.humanizeHours(pending_time_hours);
    let loaded_time = this.humanizeHours(loaded_time_hours);
    let evidence_time = this.humanizeHours(evidence_time_hours);
    let checked_time = this.humanizeHours(checked_time_hours);


    let total_time = shipping_time_hours + pending_time_hours + loaded_time_hours + evidence_time_hours + checked_time_hours;
    let total_ot = resume.length;
    let total_car = sum(resume.map(d => d.cars));


    return {
      circles: [{
        value: quanty_datum.shipping_car,
        upperValues: [shipping_time],
        lowerValues: [quanty_datum.shipping_car, '-'],
        title: 'Embarque',
        color: '#808080'
      }, {
        value: quanty_datum.pending_car,
        upperValues: [pending_time],
        lowerValues: [quanty_datum.pending_car, quanty_datum.pending_ot],
        title: 'Pendiente',
        color: '#bc4da0'
      }, {
        value: quanty_datum.loading_car,
        upperValues: [loaded_time],
        lowerValues: [quanty_datum.loading_car, quanty_datum.loading_ot],
        title: 'Cargado',
        color: '#00c1f7'
      }, {
        value: quanty_datum.evidence_car,
        upperValues: [evidence_time],
        lowerValues: [quanty_datum.evidence_car, quanty_datum.evidence_ot],
        title: 'Documentación',
        color: '#00c1f7'
      }, {
        value: quanty_datum.arrival_car,
        upperValues: [checked_time],
        lowerValues: [quanty_datum.arrival_car, quanty_datum.arrival_ot],
        title: 'Descargado',
        color: '#00c1f7'
      }, {
        value: quanty_datum.arrival_car,
        upperValues: ['-'],
        lowerValues: ['-','-'],
        title: 'Recepción PDI',
        color: '#f23d8b'
      }],
      total_time: this.humanizeHours(total_time),
      total_ot,
      total_car
    }

  }

  render() {
    const {from, to } = this.state;
    const {loading} = this.props.transmittal;

    let international_data : any  = this.processDataForTimeline();

    return <AppContainer title='OT por etapa' cMenu='3' cSubMenu='3.6'>
      <div className="row no-margin">
        <div className='col-xs-12 col-md-3 no-padding' style={{marginLeft: '15px', marginTop: '10px'}}>
          <DateRangeInput
            options={this.getDateRangeOptions()}
            onChange={this.onDateRangeChange}
            startDate={from}
            endDate={to}
          />
        </div>
      </div>

      {
        loading ?
          <div className='box'>
            <div className='box-body text-center'>
              <p>&nbsp;</p>
            </div>
            <div className='overlay'>
              <i className='fa fa-spinner fa-spin text-purple' />
            </div>
          </div> :
          <section  className='content'>
            <div className="box">

              <div className="row no-margin" style={{maxWidth: '100%', marginBottom: '20px'}}>
                <div className='box-header with-border'><h3 className='box-title'>Vista general de la cadena</h3></div>
                <div className="box-title" style={{marginTop: '20px', marginBottom: '20px'}}>
                  <span style={{fontSize: '19px', marginLeft: '20px', fontWeight:'bold'}}>Ruta Internacional | <i className="fa fa-fw fa-car" /> {international_data.total_car} | <i className="fa fa-fw fa-truck" /> {international_data.total_ot} | <i className="fa fa-fw fa-clock-o" /> {international_data.total_time}</span>
                </div>
                <TransmittalLineChartComponent  circleSize={50} circles={international_data.circles} lineColor='#7bd7eb' />
              </div>

            </div>
            <div className="box">
              <div className="row no-margin">
                <div className='box-header with-border'><h3 className='box-title'>OT totales completadas por semana</h3></div>
                <div ref={this.histogramChartRef}  style={{height: '30vh', maxWidth: '100%'}} > </div>
              </div>

            </div>
          </section>
      }

    </AppContainer>;
  }

  private proccessDataForChart() {
    const {resume} = this.props.transmittal;
    const {from, to} = this.state;

    let start_date = moment(from).startOf('week');
    let end_date = moment(to).endOf('week');

    let data = []
    let completed_transmittals = resume.filter(t => t.status === "completed").map(t => moment(t.arrivalDate))

    while(start_date < end_date) {
      let tmp = start_date.clone().endOf('week')
      data.push({
        name: `${start_date.format("MMM DD")} ${tmp.format("MMM DD")}`.replace('.', '').toUpperCase(),
        value: completed_transmittals.filter(date => date >= start_date && date <= tmp).length,
        label: {
          fontWeight: 'bold',
          fontSize: 12,
          color: start_date.clone().add(1, 'week') > end_date ? '#52c1e9' : '#000'
        }
      })
      start_date = start_date.add(1, 'week')
    }

    return data;
  }

  private updateDashboardChart() {
    if (this.histogramChart == undefined)
      return

    let data = this.proccessDataForChart()

    const option: any = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'none'
        }
      },
      legend: {
        show: false,
      },
      calculable: true,
      xAxis: [
        {
          type: 'category',
          axisTick: {show: false},
          data: data.map(datum => {
            return {value: datum.name, textStyle: datum.label}
          })
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
          data: data.map(datum => {return {name: datum.name, value: datum.value}}),
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
  const transmittalActions = new TransmittalActions(dispatch);
  return {
    dispatch,
    transmittalActions
  };
};


export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(DashboardView);
