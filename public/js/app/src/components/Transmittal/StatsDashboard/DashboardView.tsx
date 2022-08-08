import { RouteComponentProps } from 'react-router';
import { Dispatch } from 'redux';
import { ITransmittalActionTypes, ITransmittalState } from '../../../actions/transmittal.types';
import TrackingBasePage from '../../Utils/TrackingBasePage';
import * as moment from 'moment-timezone';
import * as React from 'react';
import AppContainer from '../../../container/AppContainer';
import TransmittalActions from '../../../actions/transmittal.actions';
import { connect } from 'react-redux';
import DateRangeInput from '../../Utils/DateRangeInput';
import { IWindow } from '../../../interfaces/window';
import TransmittalLineChartComponent from './TransmittalLineChartComponent';
import { sum } from 'lodash';
import {
  ChoicesStatusTransmittal
} from '../../../../../../../src/distribution/models/transmitall.types';
import * as daterangepicker from 'daterangepicker';
import { ChoicesStatusTransmittalItem } from '../../../../../../../src/distribution/models/transmittalItem.types';
import ModalView from '../../Modal/ModalView';
import { loadDataAction, ModalReduxAction } from '../../../actions/modal.actions';

declare let window: IWindow;

interface ITransmittalResume {
  _id: string;
  status: ChoicesStatusTransmittal;
  shippingDate: string;
  checkDate: string | null;
  loadingDate: string | null;
  evidenceDate: string | null;
  cars: number;
  OT: string;
  type: string;
}

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  router: any;
  dispatch: Dispatch<ITransmittalActionTypes>;

  loadDataAction(title: string, body: JSX.Element, footer: JSX.Element): ModalReduxAction;

  transmittalActions: TransmittalActions;
  transmittal: ITransmittalState;
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
    to: moment().toDate()
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
    const { from, to } = this.state;
    this.props.transmittalActions.loadTransmittalResume(moment(from).unix().toString(), moment(to).unix().toString());

  }

  componentDidUpdate(prevProps: Readonly<IPropsType>, prevState: Readonly<IStateType>, snapshot?: any) {
    if (this.histogramChartRef.current)
      this.histogramChart = echarts.init(this.histogramChartRef.current!!);
    this.updateDashboardChart();
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
      this.props.transmittalActions.loadTransmittalResume(moment(from).unix().toString(), moment(to).unix().toString());
    });
  }

  private calculateTimeDiff(transmittalResume: any) {
    let datum = {
      shipping_pending: 0,
      pending_loading: -1,
      loading_evidence: -1,
      evidence_arrival: -1,
      arrival_check: -1
    };

    // console.log('transmittalResume', transmittalResume);
    if (transmittalResume.pendingDate && !transmittalResume.loadingDate) {
      datum.pending_loading = moment().diff(moment(transmittalResume.createdAt), 'hours');
    }

    if (transmittalResume.shippingDate && transmittalResume.pendingDate) {
      datum.shipping_pending = moment().diff(moment(transmittalResume.shippingDate), 'hours');
    }

    if (transmittalResume.loadingDate && !transmittalResume.evidenceDate) {
      datum.loading_evidence = moment().diff(moment(transmittalResume.loadingDate), 'hours');
    }

    if (transmittalResume.evidenceDate && !transmittalResume.arrivalDate) {
      datum.evidence_arrival = moment().diff(moment(transmittalResume.checkDate), 'hours');
    }

    if (transmittalResume.evidenceDate && !transmittalResume.checkDate) {
      datum.arrival_check = moment().diff(moment(transmittalResume.evidenceDate), 'hours');
    }
    console.log('datum.evidence_arrival', datum?.evidence_arrival);

    return datum;
  }

  private calculateCarOTQuantity(transmittalResumes: ITransmittalResume[]) {

    let shipping = transmittalResumes
      .filter(
        (transmittalResume) =>
          transmittalResume.status === 'pending' && moment(transmittalResume.shippingDate).isValid()
      );
    let pending = transmittalResumes
      .filter(
        (transmittalResume) =>
          transmittalResume.status === 'pending' && !moment(transmittalResume.loadingDate).isValid()
      );
    // console.log('pending', pending);
    let loading = transmittalResumes
      .filter(
        (transmittalResume) =>
          (transmittalResume.status === 'pending' && moment(transmittalResume.loadingDate).isValid()) ||
          (transmittalResume.status === 'inTransit' && !moment(transmittalResume.evidenceDate).isValid())
      );
    // console.log('loading', loading);
    let evidence = transmittalResumes
      .filter(
        (transmittalResume) =>
          transmittalResume.status === 'inTransit' && moment(transmittalResume.evidenceDate).isValid()
      );
    console.log('evidence', evidence);
    let arrival = transmittalResumes
      .filter(
        (transmittalResume) =>
          transmittalResume.status === 'completed' && !moment(transmittalResume.checkDate).isValid()
      );
    let receptions = transmittalResumes
      .filter(
        (transmittalResume) =>
          ['completed', 'completed_by_reception'].includes(transmittalResume.status) &&
          moment(transmittalResume.checkDate).isValid()
      );

    return {
      shipping_car: shipping.reduce((a: number, b: ITransmittalResume) => a + b.cars, 0),
      shipping,
      pending_car: pending.reduce((a: number, b: ITransmittalResume) => a + b.cars, 0),
      pending_ot: pending.length,
      pending,
      loading_car: loading.reduce((a: number, b: ITransmittalResume) => a + b.cars, 0),
      loading_ot: loading.length,
      loading,
      evidence_car: evidence.reduce((a: number, b: ITransmittalResume) => a + b.cars, 0),
      evidence_ot: evidence.length,
      evidence,
      arrival_car: arrival.reduce((a: number, b: ITransmittalResume) => a + b.cars, 0),
      arrival_ot: arrival.length,
      arrival,
      receptions_car: receptions.reduce((a: number, b: ITransmittalResume) => a + b.cars, 0),
      receptions_ot: receptions.length,
      receptions
    };
  }

  private humanizeHours(hours: number) {
    if (hours === 0) {
      return '-';
    }
    let days = Math.floor(hours / 24);
    let left_hours = Math.floor(hours % 24);

    if (days > 0)
      if (hours > 0) {
        return `${days}d ${left_hours}h`;
      } else {
        return `${days}d`;
      }
    else {
      return `${left_hours}h`;
    }
  }

  private processDataForTimeline() {
    let { resume } = this.props.transmittal;

    if (resume.length === 0) {
      return { circles: [] };
    }

    resume = resume.filter(transmittalResume =>
      transmittalResume.type === 'Internacional'
    );

    let quanty_datum = this.calculateCarOTQuantity(resume);

    let active_OT = resume.filter(transmittalResume =>
      !quanty_datum.receptions.find((datum: ITransmittalResume) => datum.OT === transmittalResume.OT)
    );

    let time_datum_resume = active_OT.map(transmittal =>
      this.calculateTimeDiff(transmittal)
    );

    let filtered_shipping = time_datum_resume.filter(datum => datum.shipping_pending !== 0).map(d => d.shipping_pending > 0 ? d.shipping_pending : d.pending_loading + d.shipping_pending);
    let filtered_pending = time_datum_resume.filter(datum => datum.pending_loading >= 0).map(d => d.pending_loading);
    let filtered_loaded = time_datum_resume.filter(datum => datum.loading_evidence >= 0).map(d => d.loading_evidence);
    let filtered_evidence = time_datum_resume.filter(datum => datum.evidence_arrival >= 0).map(d => d.evidence_arrival);
    let filtered_checked = time_datum_resume.filter(datum => datum.arrival_check >= 0).map(d => d.arrival_check);
    console.log('filtered_pending', filtered_pending);


    let shipping_time_hours = filtered_shipping.length === 0 ? 0 : sum(filtered_shipping) / filtered_shipping.length;
    let pending_time_hours = filtered_pending.length === 0 ? 0 : sum(filtered_pending) / filtered_pending.length;
    let loaded_time_hours = filtered_loaded.length === 0 ? 0 : sum(filtered_loaded) / filtered_loaded.length;
    let evidence_time_hours = filtered_evidence.length === 0 ? 0 : sum(filtered_evidence) / filtered_evidence.length;
    let checked_time_hours = filtered_checked.length === 0 ? 0 : sum(filtered_checked) / filtered_checked.length;
    console.log('pending_time_hours', pending_time_hours);

    let shipping_time = this.humanizeHours(shipping_time_hours);
    let pending_time = this.humanizeHours(pending_time_hours);
    let loaded_time = this.humanizeHours(loaded_time_hours);
    let evidence_time = this.humanizeHours(evidence_time_hours);
    let checked_time = this.humanizeHours(checked_time_hours);


    let total_time = shipping_time_hours + pending_time_hours + loaded_time_hours + evidence_time_hours + checked_time_hours;
    let total_ot = resume.length - quanty_datum.receptions_ot;
    let total_car = sum(resume.map(d => d.cars)) - quanty_datum.receptions_car;

    return {
      circles: [{
        value: quanty_datum.shipping_car,
        upperValues: [shipping_time],
        lowerValues: [quanty_datum.shipping_car, '-'],
        type: ChoicesStatusTransmittalItem.shipped,
        title: 'Embarque',
        color: '#808080'
      }, {
        value: quanty_datum.pending_car,
        upperValues: [pending_time],
        lowerValues: [quanty_datum.pending_car, quanty_datum.pending_ot],
        type: ChoicesStatusTransmittalItem.pending,
        title: 'Pendiente',
        color: '#bc4da0'
      }, {
        value: quanty_datum.loading_car,
        upperValues: [loaded_time],
        lowerValues: [quanty_datum.loading_car, quanty_datum.loading_ot],
        type: ChoicesStatusTransmittalItem.loaded,
        title: 'Cargado',
        color: '#00c1f7'
      }, {
        value: quanty_datum.evidence_car,
        upperValues: [evidence_time],
        lowerValues: [quanty_datum.evidence_car, quanty_datum.evidence_ot],
        type: ChoicesStatusTransmittalItem.documented,
        title: 'Documentación',
        color: '#00c1f7'
      }, {
        value: quanty_datum.arrival_car,
        upperValues: [checked_time],
        lowerValues: [quanty_datum.arrival_car, quanty_datum.arrival_ot],
        type: ChoicesStatusTransmittalItem.arrived,
        title: 'Descargado',
        color: '#00c1f7'
      }, {
        value: quanty_datum.arrival_car,
        type: ChoicesStatusTransmittalItem.received,
        upperValues: ['-'],
        lowerValues: ['-', '-'],
        title: 'Recepción PDI',
        color: '#f23d8b'
      }],
      total_time: this.humanizeHours(total_time),
      total_ot,
      total_car
    };

  }

  render() {
    const { from, to } = this.state;
    const { loading, resume } = this.props.transmittal;

    let end_date = moment(to).endOf('week').endOf('d');

    let completedTransmittals = resume.filter(t =>
      [ChoicesStatusTransmittal.completed, ChoicesStatusTransmittal.completed_by_reception].includes(t.status) &&
      moment(t.arrivalDate).isSameOrBefore(end_date));

    let international_data: any = this.processDataForTimeline();

    return <AppContainer
      cMenu='3'
      cSubMenu='3.6'
      title={
        <div
          style={{ width: '180px' }}
        >
          <DateRangeInput
            options={this.getDateRangeOptions()}
            onChange={this.onDateRangeChange}
            startDate={from}
            endDate={to}
          />
        </div>
      }
    >
      <section className='content'>
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
            <>
              <div className='box'>

                <div className='row no-margin' style={{ maxWidth: '100%', marginBottom: '20px' }}>
                  <div className='box-header with-border'>
                    <h3 className='box-title'>Vista general de la cadena</h3>
                  </div>
                  <div className='box-title' style={{ marginTop: '20px', marginBottom: '20px' }}>
                    <span style={{ fontSize: '16px', marginLeft: '20px', fontWeight: 'bold' }}>Ruta Internacional | <i
                      className='fa fa-fw fa-car' /> {international_data.total_car} | <i
                      className='fa fa-fw fa-truck' /> {international_data.total_ot} | <i
                      className='fa fa-fw fa-clock-o' /> {international_data.total_time}</span>
                  </div>
                  <TransmittalLineChartComponent
                    circleSize={50}
                    loadDataAction={this.props.loadDataAction}
                    circles={international_data.circles}
                    lineColor='#7bd7eb'
                    from={moment(from).unix().toString()}
                    to={moment(to).unix().toString()}
                  />
                </div>

              </div>
              <div className='box'>
                <div className='row no-margin'>
                  <div className='box-header with-border'>
                    <h3 className='box-title'>
                      OT totales completadas por semana <small>({completedTransmittals.length})</small>
                    </h3>
                  </div>
                  <div ref={this.histogramChartRef} style={{ height: '40vh', maxWidth: '100%' }}></div>
                </div>
              </div>
            </>
        }
        <ModalView noPadding={true} modalLarge={true} />
      </section>
    </AppContainer>;
  }

  private proccessDataForChart() {
    const { resume } = this.props.transmittal;
    const { from, to } = this.state;

    let startDate = moment(from).startOf('week').startOf('d');
    let endDate = moment(to).endOf('week').endOf('d');

    let completed = [];
    let completed_reception = [];

    let completedTransmittals = resume.filter(t =>
      [ChoicesStatusTransmittal.completed, ChoicesStatusTransmittal.completed_by_reception].includes(t.status) &&
      moment(t.arrivalDate).isSameOrBefore(endDate)
    ).map(t => {
      return { date: moment(t.arrivalDate), status: t.status };
    });

    while (startDate < endDate) {
      let endWeek = startDate.clone().endOf('week');
      completed.push({
        name: `${startDate.format('MMM DD')} ${endWeek.format('MMM DD')}`.replace('.', '').toUpperCase(),
        value: completedTransmittals.filter(t => t.date.isSameOrAfter(startDate) && t.date.isBefore(endWeek) && t.status === ChoicesStatusTransmittal.completed).length,
        label: {
          fontWeight: 'bold',
          fontSize: 12,
          color: startDate.clone().add(1, 'week') > endDate ? '#52c1e9' : '#000'
        }
      });

      completed_reception.push({
        name: `${startDate.format('MMM DD')} ${endWeek.format('MMM DD')}`.replace('.', '').toUpperCase(),
        value: completedTransmittals.filter(t => t.date.isSameOrAfter(startDate) && t.date.isBefore(endWeek) && t.status === ChoicesStatusTransmittal.completed_by_reception).length,
        label: {
          fontWeight: 'bold',
          fontSize: 12,
          color: startDate.clone().add(1, 'week') > endDate ? '#52c1e9' : '#000'
        }
      });
      startDate = startDate.add(1, 'week');
    }

    return { completed, completed_reception };

  }

  private updateDashboardChart() {
    if (this.histogramChart === undefined) {
      return;
    }

    let { completed, completed_reception } = this.proccessDataForChart();

    const option: any = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'none'
        }
      },
      legend: {
        show: true,
        bottom: 20,
        selectedMode: false
      },
      calculable: true,
      xAxis: [
        {
          type: 'category',
          axisTick: { show: false },
          data: completed.map(datum => {
            return { value: datum.name, textStyle: datum.label };
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
          cursor: 'default',
          stack: 'total',
          color: '#3b8dbc',
          barMaxWidth: 50,
          label: {
            position: 'top',
            show: false,
            fontSize: 12,
            color: '#000'
          },
          data: completed.map(datum => {
            return { name: datum.name, value: datum.value };
          })
        }, {
          name: 'OT cerradas por recepción',
          type: 'bar',
          stack: 'total',
          cursor: 'default',
          color: '#f39c12',
          barMaxWidth: 50,
          label: {
            position: 'top',
            show: true,
            fontSize: 12,
            color: '#000',
            formatter: (object: any) => {
              return completed[object.dataIndex].value + completed_reception[object.dataIndex].value;
            }
          },
          data: completed_reception.map(datum => {
            return { name: datum.name, value: datum.value };
          })
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
    loadDataAction: (title: string, body: JSX.Element, footer: JSX.Element) => dispatch(loadDataAction(title, body, footer)),
    transmittalActions
  };
};


export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(DashboardView);
