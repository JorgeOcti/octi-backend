///<reference path="../../../node_modules/sweetalert/typings/sweetalert.d.ts"/>
// import * as PropTypes from 'prop-types';
import * as Raven from 'raven-js';
import {ErrorInfo} from 'react';
import * as React from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import {getInventoryDetailAction, IDetailByBrand, IDetailByVenue, IInventoryState, InventoryReduxAction} from '../../actions/inventory.action';
import AppContainer from '../../container/AppContainer';

interface IPropsType extends RouteComponentProps<{ id: string }> {
  inventories: IInventoryState;
  dispatch: Dispatch<InventoryReduxAction>;
  getInventoryDetailAction(id: string): InventoryReduxAction;
}

interface IStateType {
  error: Error | null;
}

class InventoryDetailView extends React.Component<IPropsType, IStateType> {

  // static propTypes = {
  //   dispatch: PropTypes.func.isRequired
  // };

  state = {
    error: null
  };

  venuesDetailChart: any;
  brandDetailChart: any;

  private labelOption: any = {
    normal: {
      show: true,
      position: 'insideBottom',
      distance: 15,
      align: 'left',
      verticalAlign: 'middle',
      rotate: 90,
      formatter: '{c}  {name|{a}}',
      fontSize: 16,
      rich: {
        name: {
          textBorderColor: '#fff'
        }
      }
    }
  };

  constructor(props: IPropsType) {
    super(props);
    this.resizeCharts = this.resizeCharts.bind(this);
  }

  public componentWillMount() {
    // get data
    const {id} = this.props.match.params;
    this.props.getInventoryDetailAction(id);
    // set the title of the page
    document.title = 'OSA Andes | Detalle Inventario';
    // add listeners
    window.addEventListener('resize', this.resizeCharts, false);
  }

  public componentWillUnmount() {
    // remove listeners
    window.removeEventListener('resize', this.resizeCharts, false);
    // cancel request if component is inmounted
    // if (this.props.alerts.source) {
    //   this.props.alerts.source.cancel('Operation canceled by the user.');
    // }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  // public componentDidUpdate(prevProps: IPropsType, prevState: IStateType): void {
  public componentDidMount(): void {
    document.title = 'OSA Andes | Detalle Inventario';
    const $venuesDetail = document.getElementById('chart-venues-detail') as HTMLDivElement;
    const $brandDetail = document.getElementById('chart-brand-detail') as HTMLDivElement;
    this.venuesDetailChart = echarts.init($venuesDetail);
    this.brandDetailChart = echarts.init($brandDetail);
  }

  public updateVenueChart(detailByVenue: IDetailByVenue[]) {
    const venuesNames: string[] = [];
    const venuesFound: number[] = [];
    const venuesPending: number[] = [];
    const venuesLeftover: number[] = [];
    for (const venue of detailByVenue) {
      venuesNames.push(venue.name);
      venuesFound.push(venue.results ? venue.results.found : 0);
      venuesPending.push(venue.results ? venue.results.pending : 0);
      venuesLeftover.push(venue.results ? venue.results.leftover : 0);
    }
    const optionVenues = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        x: 'center',
        // y: 'bottom',
        bottom: 50,
        data: ['Encontrados', 'Faltantes', 'Sobrantes']
      },
      xAxis: {
        type: 'category',
        // boundaryGap: false,
        data: venuesNames,
        axisLine: {
          lineStyle: {
            color: 'rgba(0, 0, 0, 0.5)'
          }
        },
        axisLabel: {
          rotate: 45
          // fontSize: 10
        }
      },
      calculable: true,
      dataZoom: [
        {
          show: true,
          realtime: true,
          start: 50,
          end: 100
        }, {
          type: 'inside',
          realtime: true,
          start: 50,
          end: 100
        }
      ],
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
            // color: 'rgba(0, 0, 0, 0.5)'
            color: 'rgba(150, 150, 150, 0.5)'
          }
        }
      },
      grid: {
        top: 30,
        bottom: 100,
        // left
        x: 0,
        // right
        x2: 10,
        containLabel: true
        // borderColor: '#FF0000'
      },
      series: [{
        data: venuesFound,
        name: 'Encontrados',
        type: 'bar',
        color: '#00aa51',
        label: this.labelOption,
        barGap: 0
        // areaStyle: {}
        // smooth: true
      }, {
        data: venuesPending,
        name: 'Faltantes',
        type: 'bar',
        color: '#f1392c',
        // label: labelOption,
        barGap: 0
        // areaStyle: {}
        // smooth: true
      }, {
        data: venuesLeftover,
        name: 'Sobrantes',
        type: 'bar',
        color: '#ff9600',
        // label: labelOption,
        barGap: 0
        // areaStyle: {}
        // smooth: true
      }]
    };
    this.venuesDetailChart.setOption(optionVenues);
  }

  public updateBrandChart(detailByBrand: IDetailByBrand[]) {
    const brandNames: string[] = [];
    const brandFound: number[] = [];
    const brandPending: number[] = [];
    const brandLeftover: number[] = [];
    for (const brand of detailByBrand) {
      brandNames.push(brand.name);
      brandFound.push(brand.results ? brand.results.found : 0);
      brandPending.push(brand.results ? brand.results.pending : 0);
      brandLeftover.push(brand.results ? brand.results.leftover : 0);
    }
    const optionBrands = {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        x: 'center',
        bottom: 50,
        data: ['Encontrados', 'Faltantes', 'Sobrantes']
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: brandNames,
        axisLine: {
          lineStyle: {
            color: 'rgba(0, 0, 0, 0.5)'
          }
        },
        axisLabel: {
          rotate: 90
          // fontSize: 10
        }
      },
      calculable: true,
      dataZoom: [
        {
          show: true,
          realtime: true,
          start: 50,
          end: 100
        }, {
          type: 'inside',
          realtime: true,
          start: 50,
          end: 100
        }
      ],
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
            // type: 'dashed',
            color: 'rgba(150, 150, 150, 0.5)'
          }
        }
      },
      grid: {
        top: 30,
        bottom: 100,
        // left
        x: 10,
        // right
        x2: 5,
        containLabel: true
        // borderColor: '#FF0000'
      },
      series: [{
        data: brandFound,
        name: 'Encontrados',
        // label: labelOption,
        type: 'line',
        color: '#00aa51',
        areaStyle: {}
        // smooth: true
      }, {
        data: brandPending,
        name: 'Faltantes',
        type: 'line',
        color: '#f1392c',
        areaStyle: {}
        // smooth: true
      }, {
        data: brandLeftover,
        name: 'Sobrantes',
        type: 'line',
        color: '#ff9600',
        areaStyle: {}
        // smooth: true
      }]
    };
    this.brandDetailChart.setOption(optionBrands);
  }

  public componentDidUpdate() {
    const {loadingDetail, detailByVenue, detailByBrand} = this.props.inventories;
    if (!loadingDetail) {
      this.updateVenueChart(detailByVenue);
      this.updateBrandChart(detailByBrand);
    }
  }

  public render(): React.ReactElement<IPropsType> {
    const {loadingDetail, summary} = this.props.inventories;
    const percentagePending = summary.results ? (100 / (summary.results.found + summary.results.pending + summary.results.leftover)) * summary.results.pending : 0;
    const percentageFound = summary.results ? (100 / (summary.results.found + summary.results.pending + summary.results.leftover)) * summary.results.found : 0;
    const percentageLeftover = summary.results ? (100 / (summary.results.found + summary.results.pending + summary.results.leftover)) * summary.results.leftover : 0;
    return (
      <AppContainer title={summary.name} cMenu="2" cSubMenu="2.1" cAction="Detalle">
        <section className="content">
          <div className="row">
            <div className="col-md-4">
              <div className="info-box bg-green">
                <span className="info-box-icon"><i className="fa fa-check" /></span>
                <div className="info-box-content">
                  <span className="info-box-text">Encontrados</span>
                  <span className="info-box-number">{summary.results ? summary.results.found : 0}</span>
                  <div className="progress">
                    <div className="progress-bar" style={{
                      width: `${percentageFound}%`
                    }} />
                  </div>
                  <span className="progress-description">
                    {`${percentageFound.toFixed(3)}% encontrados.`}
                  </span>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="info-box bg-red">
                <span className="info-box-icon"><i className="fa fa-close" /></span>
                <div className="info-box-content">
                  <span className="info-box-text">Faltantes</span>
                  <span className="info-box-number">{summary.results ? summary.results.pending : 0}</span>
                  <div className="progress">
                    <div className="progress-bar" style={{
                      width: `${percentagePending}%`
                    }} />
                  </div>
                  <span className="progress-description">
                    {`${percentagePending.toFixed(3)}% faltantes.`}
                  </span>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="info-box bg-yellow">
                <span className="info-box-icon"><i className="fa fa-bookmark" /></span>
                <div className="info-box-content">
                  <span className="info-box-text">Sobrantes</span>
                  <span className="info-box-number">{summary.results ? summary.results.leftover : 0}</span>
                  <div className="progress">
                    <div className="progress-bar" style={{
                      width: `${percentageLeftover}%`
                    }} />
                  </div>
                  <span className="progress-description">
                    {`${percentageLeftover.toFixed(3)}% sobrantes.`}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">Detalle de inventario por sucursal</h3>
            </div>
            <div className="box-body">
              <div id="chart-venues-detail" style={{height: '500px', maxWidth: '100%'}}/>
            </div>
            {
              loadingDetail &&
              <div className="overlay">
                <i className="fa fa-spinner fa-spin text-purple"/>
              </div>
            }
          </div>
          <div className="row">
            <div className="col-md-8">
              <div className="box box-success">
                <div className="box-header with-border">
                  <h3 className="box-title">Detalle de inventario por Marca</h3>
                  {/*<div className="box-tools pull-right">*/}
                  {/*</div>*/}
                </div>
                <div className="box-body">
                  <div id="chart-brand-detail" style={{height: '400px', maxWidth: '100%'}}/>
                </div>
                {
                  loadingDetail &&
                  <div className="overlay">
                    <i className="fa fa-spinner fa-spin text-purple"/>
                  </div>
                }
              </div>
            </div>
            <div className="col-md-4">
              {/*<div className="box box-info">*/}
                {/*<div className="box-header with-border">*/}
                  {/*<h3 className="box-title">Visitors Report</h3>*/}
                  {/*/!*<div className="box-tools pull-right">*!/*/}
                  {/*/!*</div>*!/*/}
                {/*</div>*/}
                {/*<div className="box-body">*/}
                  {/*<div className="row">*/}
                    {/*<div className="col-md-12">*/}
                      {/*<div className="progress-group">*/}
                        {/*<span className="progress-text">Add Products to Cart</span>*/}
                        {/*<span className="progress-number"><b>160</b>/200</span>*/}

                        {/*<div className="progress sm">*/}
                          {/*<div className="progress-bar progress-bar-aqua" style={{width: '80%'}}/>*/}
                        {/*</div>*/}
                      {/*</div>*/}
                      {/*<div className="progress-group">*/}
                        {/*<span className="progress-text">Complete Purchase</span>*/}
                        {/*<span className="progress-number"><b>310</b>/400</span>*/}

                        {/*<div className="progress sm">*/}
                          {/*<div className="progress-bar progress-bar-red" style={{width: '80%'}}/>*/}
                        {/*</div>*/}
                      {/*</div>*/}
                      {/*<div className="progress-group">*/}
                        {/*<span className="progress-text">Visit Premium Page</span>*/}
                        {/*<span className="progress-number"><b>480</b>/800</span>*/}

                        {/*<div className="progress sm">*/}
                          {/*<div className="progress-bar progress-bar-green" style={{width: '80%'}}/>*/}
                        {/*</div>*/}
                      {/*</div>*/}
                      {/*<div className="progress-group">*/}
                        {/*<span className="progress-text">Send Inquiries</span>*/}
                        {/*<span className="progress-number"><b>250</b>/500</span>*/}

                        {/*<div className="progress sm">*/}
                          {/*<div className="progress-bar progress-bar-yellow" style={{width: '80%'}}/>*/}
                        {/*</div>*/}
                      {/*</div>*/}
                    {/*</div>*/}
                  {/*</div>*/}
                {/*</div>*/}
              {/*</div>*/}
            </div>
          </div>
          {/*<h2 className="page-header">Detalle sucursales</h2>*/}
          {/*<div className="row">*/}
            {/*<div className="col-md-6">*/}
              {/*<div className="box box-warning collapsed-box">*/}
                {/*<div className="box-header with-border">*/}
                  {/*<h3 className="box-title">Sucursal 1</h3>*/}
                  {/*<div className="box-tools pull-right">*/}
                    {/*<button type="button" className="btn btn-box-tool" data-widget="collapse"><i className="fa fa-plus" /></button>*/}
                  {/*</div>*/}
                {/*</div>*/}
                {/*<div className="box-body" style={{display: 'none'}}>*/}
                  {/*<p>&nbsp;</p>*/}
                  {/*<p>&nbsp;</p>*/}
                  {/*<p>&nbsp;</p>*/}
                  {/*<p>&nbsp;</p>*/}
                {/*</div>*/}
              {/*</div>*/}
            {/*</div>*/}
            {/*<div className="col-md-6">*/}
              {/*<div className="box box-warning collapsed-box">*/}
                {/*<div className="box-header">*/}
                  {/*<h3 className="box-title">Sucursal 2</h3>*/}
                  {/*<div className="box-tools pull-right">*/}
                    {/*<button type="button" className="btn btn-box-tool" data-widget="collapse"><i className="fa fa-plus" /></button>*/}
                  {/*</div>*/}
                {/*</div>*/}
                {/*<div className="box-body">*/}
                  {/*<p>&nbsp;</p>*/}
                  {/*<p>&nbsp;</p>*/}
                  {/*<p>&nbsp;</p>*/}
                  {/*<p>&nbsp;</p>*/}
                {/*</div>*/}
              {/*</div>*/}
            {/*</div>*/}
            {/*<div className="col-md-6">*/}
              {/*<div className="box box-warning collapsed-box">*/}
                {/*<div className="box-header">*/}
                  {/*<h3 className="box-title">Sucursal 3</h3>*/}
                  {/*<div className="box-tools pull-right">*/}
                    {/*<button type="button" className="btn btn-box-tool" data-widget="collapse"><i className="fa fa-plus" /></button>*/}
                  {/*</div>*/}
                {/*</div>*/}
                {/*<div className="box-body">*/}
                  {/*<p>&nbsp;</p>*/}
                  {/*<p>&nbsp;</p>*/}
                  {/*<p>&nbsp;</p>*/}
                  {/*<p>&nbsp;</p>*/}
                {/*</div>*/}
              {/*</div>*/}
            {/*</div>*/}
            {/*<div className="col-md-6">*/}
              {/*<div className="box box-warning collapsed-box">*/}
                {/*<div className="box-header">*/}
                  {/*<h3 className="box-title">Sucursal 4</h3>*/}
                  {/*<div className="box-tools pull-right">*/}
                    {/*<button type="button" className="btn btn-box-tool" data-widget="collapse"><i className="fa fa-plus" /></button>*/}
                  {/*</div>*/}
                {/*</div>*/}
                {/*<div className="box-body" style={{display: 'none'}}>*/}
                  {/*<p>&nbsp;</p>*/}
                  {/*<p>&nbsp;</p>*/}
                  {/*<p>&nbsp;</p>*/}
                  {/*<p>&nbsp;</p>*/}
                {/*</div>*/}
              {/*</div>*/}
            {/*</div>*/}
          {/*</div>*/}
        </section>
      </AppContainer>
    );
  }

  private resizeCharts(): void {
    if (this.venuesDetailChart && this.venuesDetailChart !== undefined) {
      this.venuesDetailChart.resize();
    }
    if (this.brandDetailChart && this.brandDetailChart !== undefined) {
      this.brandDetailChart.resize();
    }
  }
}

const mapStateToProps = (state: { inventories: IInventoryState }) => {
  return {
    inventories: state.inventories
  };
};

const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    getInventoryDetailAction: (id: string) => dispatch(getInventoryDetailAction(id))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(InventoryDetailView);
