///<reference path="../../../node_modules/sweetalert/typings/sweetalert.d.ts"/>
///<reference path="../../../src/types/react-bootstrap-table-next.d.ts"/>
///<reference path="../../../src/types/react-bootstrap-table2-filter.d.ts"/>
///<reference path="../../../src/types/react-bootstrap-table2-paginator.d.ts"/>
import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import BootstrapTable from 'react-bootstrap-table-next';
import filterFactory, { selectFilter, textFilter } from 'react-bootstrap-table2-filter';
import paginationFactory from 'react-bootstrap-table2-paginator';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import * as io from 'socket.io-client';
import * as XLSX from 'xlsx';
import {getInventoryDetailAction, IDetailByBrand, IDetailByVenue, IInventoryState, InventoryReduxAction} from '../../actions/inventory.actions';
import AppContainer from '../../container/AppContainer';
import {IWindow} from '../../interfaces/window';
import ImageLazyLoad from '../ImageLazyLoad';

declare let window: IWindow;

interface IPropsType extends RouteComponentProps<{ id: string }> {
  inventories: IInventoryState;
  dispatch: Dispatch<InventoryReduxAction>;
  getInventoryDetailAction(id: string, update: boolean): InventoryReduxAction;
}

interface IStateType {
  error: Error | null;
  setCharts: boolean;
}

class InventoryDetailView extends React.Component<IPropsType, IStateType> {

  // static propTypes = {
  //   dispatch: PropTypes.func.isRequired
  // };

  state = {
    error: null,
    setCharts: false
  };

  venuesDetailChart: echarts.ECharts;
  brandDetailChart: echarts.ECharts;

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

  private statusText: any = {
    pending: 'Pendiente',
    found: 'Encontrado',
    leftover: 'Sobrante',
    reported: 'Reportado'
  };

  private socket: SocketIOClient.Socket;

  constructor(props: IPropsType) {
    super(props);
    this.resizeCharts = this.resizeCharts.bind(this);
    this.export = this.export.bind(this);
    this.imagesFormatter = this.imagesFormatter.bind(this);
  }

  public componentWillMount() {
    // get data
    const {id} = this.props.match.params;
    this.props.getInventoryDetailAction(id, false);
    // setTimeout(() => {
    //   this.props.getInventoryDetailAction(id, true);
    // }, 10000);
    // set the title of the page
    document.title = 'OSA Andes | Detalle Inventario';
    // add listeners
    window.addEventListener('resize', this.resizeCharts, false);
    // socket
    this.socket = io.connect(`${location.protocol}//${location.host}`, {
      secure: location.protocol === 'https:',
      reconnection: true,
      query: {token: (window.user as any).token}
    });
    this.socket.on('connect', () => {
      this.socket.emit('join', {room: `inventory-detail-${id}`});
    });
    this.socket.on('REFRESH', (data: any): void => {
      if (data.update) {
        const status: any = {
          found: 'success',
          leftover: 'warning',
          reported: 'grey'
        };
        ($ as any).toast({
          heading: data.title,
          text: data.text,
          position: 'top-right',
          loaderBg: '#e2e2e2',
          icon: status[data.status],
          hideAfter: 5000,
          stack: 6
        });
        this.props.getInventoryDetailAction(id, true);
      }
    });
  }

  public componentWillUnmount() {
    // remove listeners
    window.removeEventListener('resize', this.resizeCharts, false);
    // cancel request if component is inmounted
    if (this.props.inventories.source) {
      this.props.inventories.source.cancel('Operation canceled by the user.');
    }
    this.socket.disconnect();
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  // public componentDidUpdate(prevProps: IPropsType, prevState: IStateType): void {
  public componentDidMount(): void {
    const $venuesDetail = document.getElementById('chart-venues-detail') as HTMLDivElement;
    const $brandDetail = document.getElementById('chart-brand-detail') as HTMLDivElement;
    this.venuesDetailChart = echarts.init($venuesDetail);
    this.brandDetailChart = echarts.init($brandDetail);
    // ($('#custom-filter') as any).chosen().change((e: React.ChangeEvent<HTMLSelectElement>) => {
    //   console.log('e.target.value', e.target.value);
    //   // this.addForm(e.target.value);
    // });;
  }

  public componentDidUpdate() {
    const {loadingDetail, detailByVenue, detailByBrand} = this.props.inventories;
    // style react boostrap table
    $('.react-bootstrap-table-pagination div').removeClass('col-xs-6').addClass('col-xs-12').css({padding: '3px 15px'});
    $('.react-bootstrap-table-pagination div:last-child').removeClass('text-right').addClass('text-right');
    $('#pageDropDown').removeClass('btn-sm').addClass('btn-sm');
    $('.pagination').removeClass('pagination-sm').addClass('pagination-sm').css({margin: 0});
    // $('#custom-filter').trigger('chosen:updated');
    const {setCharts} = this.state;
    if (!loadingDetail && !setCharts) {
      this.updateVenueChart(detailByVenue);
      this.updateBrandChart(detailByBrand);
      this.setState({
        setCharts: true
      });
    } else {
      this.updateVenueChart(detailByVenue, true);
      this.updateBrandChart(detailByBrand, true);
    }
  }

  public imagesFormatter(cell: string, row: any) {
    if (row.images && row.images.length) {
      return (
        <div className="row">{
          row.images.map((image: any) => (
            <div key={image._id} className={'col-md-3 images-25 text-center'}>
              <a href={decodeURI(image.file.url)} data-toggle="lightbox" data-gallery={row._id}>
                <ImageLazyLoad url={decodeURI(image.file.url)} height={'10px'} maxHeight={'35px'} maxWidth={'35px'} small={true}/>
              </a>
            </div>
          ))
        }</div>
      );
    } else {
      return (
        '-'
      );
    }
  }

  public render(): React.ReactElement<IPropsType> {
    const {loadingDetail, summary, detail} = this.props.inventories;
    const totalCars = summary.results ? summary.results.found + summary.results.pending + summary.results.leftover + summary.results.reported : 0;
    const percentagePending = summary.results ? (100 / totalCars) * summary.results.pending : 0;
    const percentageFound = summary.results ? (100 / totalCars) * summary.results.found : 0;
    const percentageLeftover = summary.results ? (100 / totalCars) * summary.results.leftover : 0;
    const percentageReported = summary.results ? (100 / totalCars) * summary.results.reported : 0;

    const selectOptions: any = {
      pending: 'Pendiente',
      found: 'Encontrado',
      leftover: 'Sobrante'
    };
    const selectOptionsReported: any = {
      reported: 'Reportado'
    };
    const classStatus: any = {
      pending: 'bg-red',
      found: 'bg-green',
      leftover: 'bg-yellow',
      reported: 'bg-gray'
    };
    const defaultSorted = [{
      dataField: 'status',
      order: 'asc'
    }];

    const defaultColumns = [{
      dataField: 'vin',
      text: 'VIN',
      filter: textFilter({
        className: 'input-sm',
        placeholder: ' Buscar'
      }),
      classes: 'text-ellipsis',
      headerClasses: 'pointer',
      sort: true
    }, {
      dataField: 'brand',
      text: 'Marca',
      filter: textFilter({
        className: 'input-sm',
        placeholder: ' Buscar'
      }),
      classes: 'hidden-xs',
      headerClasses: 'hidden-xs pointer',
      sort: true
    }, {
      dataField: 'denomination',
      text: 'Denominación',
      filter: textFilter({
        className: 'input-sm',
        placeholder: ' Buscar'
      }),
      classes: 'hidden-xs hidden-sm',
      headerClasses: 'hidden-xs hidden-sm pointer',
      sort: true
    }, {
      dataField: 'venue',
      text: 'Sucursal',
      filter: textFilter({
        className: 'input-sm',
        placeholder: ' Buscar'
      }),
      classes: 'hidden-xs hidden-sm',
      headerClasses: 'hidden-xs hidden-sm pointer',
      sort: true
    }, {
      dataField: 'venueFound',
      text: 'Encontrado en',
      filter: textFilter({
        className: 'input-sm',
        placeholder: ' Buscar'
      }),
      classes: 'hidden-xs hidden-sm hidden-md',
      headerClasses: 'hidden-xs hidden-sm hidden-md pointer',
      sort: true
    },
    {
      dataField: 'inventoriedBy',
      text: 'Encontrado por',
      filter: textFilter({
        className: 'input-sm',
        placeholder: ' Buscar'
      }),
      classes: 'hidden-xs hidden-sm hidden-md',
      headerClasses: 'hidden-xs hidden-sm hidden-md pointer',
      sort: true
    },
    {
      dataField: 'images',
      text: 'Imágenes',
      classes: 'hidden-xs',
      headerClasses: 'hidden-xs',
      formatter: this.imagesFormatter,
      headerStyle: {
        verticalAlign: 'top'
      }
    }];
    const columns = [...defaultColumns, {
      dataField: 'status',
      text: 'Status',
      sort: true,
      formatter: (cell: string) => (selectOptions[cell]),
      filter: selectFilter({
        options: selectOptions,
        // withoutEmptyOption: true,
        className: 'input-sm',
        placeholder: 'Seleccione tipo',
        id: 'custom-filter'
      }),
      headerClasses: 'pointer',
      headerStyle: {
        maxWidth: '100px',
        minWidth: '100px'
      },
      classes: (cell: any, row: any, rowIndex: any, colIndex: any) => {
        return `text-center ${classStatus.hasOwnProperty(cell) ? classStatus[cell] : ''}`;
      }
    }];
    const columnsReported = [...defaultColumns, {
      dataField: 'status',
      text: 'Status',
      sort: true,
      formatter: (cell: string) => (selectOptionsReported[cell]),
      filter: selectFilter({
        options: selectOptionsReported,
        // withoutEmptyOption: true,
        className: 'input-sm',
        placeholder: 'Seleccione tipo',
        id: 'custom-filter'
      }),
      headerClasses: 'pointer',
      headerStyle: {
        maxWidth: '100px',
        minWidth: '100px'
      },
      classes: (cell: any, row: any, rowIndex: any, colIndex: any) => {
        return `text-center ${classStatus.hasOwnProperty(cell) ? classStatus[cell] : ''}`;
      }
    }];

    const products: any[] = [];
    const reported: any[] = [];
    if (detail && detail.cars && detail.cars.length) {
      for (const car of detail.cars) {
        if (car.status === 'reported') {
          reported.push({
            _id: car._id,
            vin: car.car.vin,
            brand: car.car.brand,
            denomination: car.car.denomination,
            venue: car.venue ? car.venue.name : '-',
            images: car.images && car.images.length ? car.images : [],
            venueFound: car.venueFound ? car.venueFound.name : '-',
            inventoriedBy: car.inventoriedBy ? `${car.inventoriedBy.firstName} ${car.inventoriedBy.lastName}` : '-',
            status: car.status
          });
        } else {
          products.push({
            _id: car._id,
            vin: car.car.vin,
            brand: car.car.brand,
            denomination: car.car.denomination,
            venue: car.venue ? car.venue.name : '-',
            images: car.images && car.images.length ? car.images : [],
            venueFound: car.venueFound ? car.venueFound.name : '-',
            inventoriedBy: car.inventoriedBy ? `${car.inventoriedBy.firstName} ${car.inventoriedBy.lastName}` : '-',
            status: car.status
          });
        }
      }
    }

    const customTotal = (from: any, to: any, size: any) => (
      <span className="react-bootstrap-table-pagination-total text-ellipsis" style={{fontSize: '75%'}}>
        &nbsp;&nbsp;Mostrando registros del {from} al {to} de un total de {size} registros.
      </span>
    );
    const paginationOption: any = {
      // paginationSize: 4,
      showTotal: true,
      paginationTotalRenderer: customTotal,
      sizePerPageList: [{
        text: '15', value: 15
      }, {
        text: '20', value: 20
      }, {
        text: '30', value: 30
      }, {
        text: '50', value: 50
      }, {
        text: '100', value: 100
      }/*, {
        text: 'All', value: products.length
      }*/]
    };

    return (
      <AppContainer title={summary.name} cMenu="2" cSubMenu="2.1" cAction="Detalle">
        <section className="content">
          <div className="row">
            <div className="col-md-6 col-lg-3">
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
            <div className="col-md-6 col-lg-3">
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
            <div className="col-md-6 col-lg-3">
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
            <div className="col-md-6 col-lg-3">
              <div className="info-box bg-gray-dark">
                <span className="info-box-icon"><i className="fa fa-bookmark" /></span>
                <div className="info-box-content">
                  <span className="info-box-text">Reportados</span>
                  <span className="info-box-number">{summary.results ? summary.results.reported : 0}</span>
                  <div className="progress">
                    <div className="progress-bar" style={{
                      width: `${percentageReported}%`
                    }} />
                  </div>
                  <span className="progress-description">
                    {`${percentageReported.toFixed(3)}% sobrantes.`}
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
            <div className="col-md-12">
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
            <div className="col-md-12">
              <div className="box box-info">
                <div className="box-header with-border">
                  <h3 className="box-title">Detalle de inventario</h3>
                  {/*<div className="box-tools pull-right">*/}
                  {/*</div>*/}
                </div>
                <div className="box-body">
                  <div className="row">
                    <div className="col-md-12 text-right hidden-xs hidden-sm ">
                      <p><button className="btn btn-sm btn-primary" onClick={() => this.export(['pending', 'found', 'leftover'])}>
                        <i className="fa fa-fw fa-download" /> Exportart excel
                      </button></p>
                    </div>
                    <div className="col-md-12">
                      <BootstrapTable
                        keyField="_id"
                        data={products}
                        columns={columns}
                        filter={filterFactory()}
                        pagination={paginationFactory(paginationOption)}
                        defaultSorted={defaultSorted}
                      />
                    </div>
                  </div>
                </div>
                {
                  loadingDetail &&
                  <div className="overlay">
                    <i className="fa fa-spinner fa-spin text-purple"/>
                  </div>
                }
              </div>
            </div>
            <div className="col-md-12">
              <div className="box box-info">
                <div className="box-header with-border">
                  <h3 className="box-title">Detalle Reportados</h3>
                  {/*<div className="box-tools pull-right">*/}
                  {/*</div>*/}
                </div>
                <div className="box-body">
                  <div className="row">
                    <div className="col-md-12 text-right hidden-xs hidden-sm ">
                      <p><button className="btn btn-sm btn-primary" onClick={() => this.export(['reported'])}>
                        <i className="fa fa-fw fa-download" /> Exportart excel
                      </button></p>
                    </div>
                    <div className="col-md-12">
                      <BootstrapTable
                        keyField="_id"
                        data={reported}
                        columns={columnsReported}
                        filter={filterFactory()}
                        pagination={paginationFactory(paginationOption)}
                        defaultSorted={defaultSorted}
                        noDataIndication={'No hay vehiculos reportados aún.'}
                      />
                    </div>
                  </div>
                </div>
                {
                  loadingDetail &&
                  <div className="overlay">
                    <i className="fa fa-spinner fa-spin text-purple"/>
                  </div>
                }
              </div>
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

  private export(status: string[]) {
    const {detail} = this.props.inventories;
    const data: any = [];
    // Order data
    if (detail && detail.cars && detail.cars.length) {
      for (const car of detail.cars) {
        if (status.includes(car.status)) {
          data.push({
            VIN: car.car.vin,
            Marca: car.car.brand ? car.car.brand : '-',
            ['Denominación']: car.car.denomination ? car.car.denomination : '-',
            Color: car.car.color ? car.car.color : '-',
            Sucursal: car.venue ? car.venue.name : '-',
            ['Sucursal encontrado']: car.venueFound ? car.venueFound.name : '-',
            ['Encontrado por']: car.inventoriedBy ? `${car.inventoriedBy.firstName} ${car.inventoriedBy.lastName}` : '-',
            Status: this.statusText.hasOwnProperty(car.status) ? this.statusText[car.status] : '-'
          });
        }
      }
    }
    /* make the worksheet */
    const ws = XLSX.utils.json_to_sheet(data);
    /* add to workbook */
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Detalle');
    /* generate an XLSX file */
    XLSX.writeFile(wb, `Detalle ${detail.name}.xlsx`);
  }

  private updateVenueChart(detailByVenue: IDetailByVenue[], update?: boolean) {
    const venuesNames: string[] = [];
    const venuesFound: number[] = [];
    const venuesPending: number[] = [];
    const venuesLeftover: number[] = [];
    const venuesReported: number[] = [];
    detailByVenue.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
    for (const venue of detailByVenue) {
      venuesNames.push(venue.name);
      venuesFound.push(venue.results ? venue.results.found : 0);
      venuesPending.push(venue.results ? venue.results.pending : 0);
      venuesLeftover.push(venue.results ? venue.results.leftover : 0);
      venuesReported.push(venue.results ? venue.results.reported : 0);
    }
    const optionVenues: echarts.EChartOption = {
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
        data: ['Encontrados', 'Faltantes', 'Sobrantes', 'Reportados']
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
      }, {
        data: venuesReported,
        name: 'Reportados',
        type: 'bar',
        color: '#96a4b3',
        // label: labelOption,
        barGap: 0
        // areaStyle: {}
        // smooth: true
      }]
    };
    if (!update) {
      optionVenues.dataZoom = [
        {
          show: venuesNames.length > 10,
          realtime: true,
          start: 50,
          end: 100
        }, {
          type: 'inside',
          realtime: true,
          start: 50,
          end: 100
        }
      ];
    }
    this.venuesDetailChart.setOption(optionVenues);
  }

  private updateBrandChart(detailByBrand: IDetailByBrand[], update?: boolean) {
    const brandNames: string[] = [];
    const brandFound: number[] = [];
    const brandPending: number[] = [];
    const brandLeftover: number[] = [];
    const brandReported: number[] = [];
    detailByBrand.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
    for (const brand of detailByBrand) {
      brandNames.push(brand.name);
      brandFound.push(brand.results ? brand.results.found : 0);
      brandPending.push(brand.results ? brand.results.pending : 0);
      brandLeftover.push(brand.results ? brand.results.leftover : 0);
      brandReported.push(brand.results ? brand.results.reported : 0);
    }
    const optionBrands: echarts.EChartOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        x: 'center',
        bottom: 50,
        data: ['Encontrados', 'Faltantes', 'Sobrantes', 'Reportados']
      },
      xAxis: {
        type: 'category',
        // boundaryGap: false,
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
        type: 'bar',
        color: '#00aa51',
        areaStyle: {}
        // smooth: true
      }, {
        data: brandPending,
        name: 'Faltantes',
        type: 'bar',
        color: '#f1392c',
        areaStyle: {}
        // smooth: true
      }, {
        data: brandLeftover,
        name: 'Sobrantes',
        type: 'bar',
        color: '#ff9600',
        areaStyle: {}
        // smooth: true
      }, {
        data: brandReported,
        name: 'Reportados',
        type: 'bar',
        color: '#96a4b3',
        areaStyle: {}
        // smooth: true
      }]
    };
    if (!update) {
      optionBrands.dataZoom = [
        {
          show: brandNames.length > 10,
          realtime: true,
          start: 50,
          end: 100
        }, {
          type: 'inside',
          realtime: true,
          start: 50,
          end: 100
        }
      ];
    }
    this.brandDetailChart.setOption(optionBrands);
  }

  private resizeCharts(): void {
    if (this.venuesDetailChart) {
      this.venuesDetailChart.resize();
      setTimeout(() => {
        this.venuesDetailChart.resize();
      }, 400);
    }
    if (this.brandDetailChart) {
      this.brandDetailChart.resize();
      setTimeout(() => {
        this.brandDetailChart.resize();
      }, 400);
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
    getInventoryDetailAction: (id: string, update: boolean) => dispatch(getInventoryDetailAction(id, update))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(InventoryDetailView);
