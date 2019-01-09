///<reference path="../../../node_modules/sweetalert/typings/sweetalert.d.ts"/>
///<reference path="../../../src/types/react-bootstrap-table-next.d.ts"/>
///<reference path="../../../src/types/react-bootstrap-table2-filter.d.ts"/>
///<reference path="../../../src/types/react-bootstrap-table2-paginator.d.ts"/>
import * as moment from 'moment';
import * as Raven from 'raven-js';
import {ErrorInfo} from 'react';
import * as React from 'react';
import BootstrapTable from 'react-bootstrap-table-next';
import filterFactory, { selectFilter, textFilter } from 'react-bootstrap-table2-filter';
import paginationFactory from 'react-bootstrap-table2-paginator';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import * as io from 'socket.io-client';
import * as XLSX from 'xlsx';
import {
  IInventoryCar
} from '../../../../../../src/interfaces/inventory.interface';
import {
  addCommentAction,
  getInventoryDetailAction,
  IDetailByBrand,
  IDetailByVenue,
  IInventoryState,
  IInventorySummaryResult,
  InventoryReduxAction,
  sendCommentAction,
  updateInventoryCarAction
} from '../../actions/inventory.actions';
import {loadDataAction, ModalReduxAction} from '../../actions/modal.actions';
import AppContainer from '../../container/AppContainer';
import {IWindow} from '../../interfaces/window';
import {maxText} from '../../utils/common';
import ImageLazyLoad from '../ImageLazyLoad';
import ModalView from '../Modal/ModalView';
import Row from '../Row';
import InventoryCarComments from './InventoryCarComments';

declare let window: IWindow;

interface IPropsType extends RouteComponentProps<{ id: string }> {
  inventories: IInventoryState;
  dispatch: Dispatch<InventoryReduxAction>;

  updateCommentsAction(inventoryCar: IInventoryCar): InventoryReduxAction;
  getInventoryDetailAction(id: string, update: boolean): InventoryReduxAction;
  loadDataAction(title: string, body: JSX.Element, footer?: JSX.Element): ModalReduxAction;
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
      position: 'inside',
      // distance: 5,
      align: 'center',
      verticalAlign: 'middle',
      rotate: 90,
      // formatter: '{c} {name|{a}}',
      formatter: '{c}',
      fontSize: 12,
      rich: {
        name: {
          textBorderColor: '#fff'
        }
      }
    }
    // show: true,
    // position: 'insideBottom',
    // fontStyle: 'bold',
    // distance: 15,
    // rotate: 90,
    // verticalAlign: 'middle',
    // fontSize: 12,
    // color: '#fff'
  };

  private statusText: any = {
    pending: 'Pendiente',
    found: 'Encontrado',
    leftover: 'Sobrante',
    missing: 'Faltante',
    reported: 'Reportado'
  };

  private classStatus: any = {
    pending: 'bg-aqua',
    found: 'bg-green',
    missing: 'bg-red',
    leftover: 'bg-yellow',
    reported: 'bg-gray'
  };

  private selectOptions: any = {
    pending: 'Pendiente',
    found: 'Encontrado',
    leftover: 'Sobrante'
  };

  private paginationOption: any = {
    // paginationSize: 4,
    showTotal: true,
    paginationTotalRenderer: this.customTotal,
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
    }]
  };

  private defaultSorted = [{
    dataField: 'status',
    order: 'asc'
  }];

  private defaultColumns: any[] = [];
  private columns: any[] = [];
  private columnsReported: any[] = [];

  private socket: SocketIOClient.Socket;

  constructor(props: IPropsType) {
    super(props);
    this.resizeCharts = this.resizeCharts.bind(this);
    this.xlsExport = this.xlsExport.bind(this);
    this.carComments = this.carComments.bind(this);
    this.vinFormatter = this.vinFormatter.bind(this);
    this.brandFormatter = this.brandFormatter.bind(this);
    this.commentFormatter = this.commentFormatter.bind(this);
    this.calculateDetails = this.calculateDetails.bind(this);
    this.imagesFormatter = this.imagesFormatter.bind(this);
    this.defaultColumns = [{
    dataField: 'vin',
    text: 'VIN / Patente',
    formatter: this.vinFormatter,
    filter: textFilter({
      className: 'input-sm',
      placeholder: ' Buscar'
    }),
    filterValue: (cell: any, row: any) => `${cell}${row.patent}`,
    classes: 'middle text-ellipsis',
    headerClasses: 'pointer',
    sort: true
  }, {
    dataField: 'brand',
    text: 'Marca / Denominación',
    formatter: this.brandFormatter,
    filter: textFilter({
      className: 'input-sm',
      placeholder: ' Buscar'
    }),
    filterValue: (cell: any, row: any) => `${cell}${row.denomination}`,
    classes: 'middle hidden-xs',
    headerClasses: 'hidden-xs pointer',
    sort: true
  }, {
    dataField: 'venue',
    text: 'Sucursal',
    filter: textFilter({
      className: 'input-sm',
      placeholder: ' Buscar'
    }),
    classes: 'middle hidden-xs hidden-sm',
    headerClasses: 'hidden-xs hidden-sm pointer',
    sort: true
  }, {
    dataField: 'venueFound',
    text: 'Encontrado en',
    filter: textFilter({
      className: 'input-sm',
      placeholder: ' Buscar'
    }),
    classes: 'middle hidden-xs hidden-sm hidden-md',
    headerClasses: 'hidden-xs hidden-sm hidden-md pointer',
    sort: true
    }, /* {
      dataField: 'inventoriedBy',
      text: 'Encontrado por',
      filter: textFilter({
        className: 'input-sm',
        placeholder: ' Buscar'
      }),
      classes: 'middle hidden-xs hidden-sm hidden-md',
      headerClasses: 'hidden-xs hidden-sm hidden-md pointer',
      sort: true
    },*/ {
      dataField: 'images',
      text: 'Imágenes',
      classes: 'middle hidden-xs',
      headerClasses: 'hidden-xs',
      formatter: this.imagesFormatter,
      headerStyle: {
        verticalAlign: 'top'
      }
    }, {
      dataField: 'countComments',
      text: 'Comentarios',
      classes: 'middle hidden-xs text-ellipsis',
      formatter: this.commentFormatter,
      headerClasses: 'hidden-xs',
      headerStyle: {
        verticalAlign: 'top'
      },
      style: {
        maxWidth: '150px'
      }
    }];
    this.columns = [...this.defaultColumns, {
      dataField: 'status',
      text: 'Status',
      sort: true,
      formatter: (cell: string) => (this.selectOptions[cell]),
      filter: selectFilter({
        options: this.selectOptions,
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
      classes: (cell: any) => {
        return `middle-center ${this.classStatus.hasOwnProperty(cell) ? this.classStatus[cell] : ''}`;
      }
    }];
    this.columnsReported = [...this.defaultColumns, {
      dataField: 'status',
      text: 'Status',
      headerClasses: 'pointer',
      formatter: () => ('Reportado'),
      headerStyle: {
        verticalAlign: 'top',
        maxWidth: '100px',
        minWidth: '100px'
      },
      classes: (cell: any) => {
        return `middle-center text-center ${this.classStatus.hasOwnProperty(cell) ? this.classStatus[cell] : ''}`;
      }
    }];
  }

  public componentWillMount() {
    // get data
    const {id} = this.props.match.params;
    this.props.getInventoryDetailAction(id, false);
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
        if (data.title) {
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
        }
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

  public componentDidMount(): void {
    const $venuesDetail = document.getElementById('chart-venues-detail') as HTMLDivElement;
    const $brandDetail = document.getElementById('chart-brand-detail') as HTMLDivElement;
    this.venuesDetailChart = echarts.init($venuesDetail);
    this.brandDetailChart = echarts.init($brandDetail);
    window.scrollTo(0, 0);
  }

  public componentDidUpdate(prevProps: IPropsType): void {
    const {loadingDetail, detailByVenue, detailByBrand} = this.props.inventories;
    // style react boostrap table
    $('.react-bootstrap-table-pagination div').removeClass('col-xs-6').addClass('col-xs-12').css({padding: '3px 15px'});
    $('.react-bootstrap-table-pagination div:last-child').removeClass('text-right').addClass('text-right');
    $('#pageDropDown').removeClass('btn-sm').addClass('btn-sm');
    $('.pagination').removeClass('pagination-sm').addClass('pagination-sm').css({margin: 0});
    const {setCharts} = this.state;
    if (!loadingDetail && !setCharts) {
      this.updateVenueChart(detailByVenue, false);
      this.updateBrandChart(detailByBrand, false);
      this.setState({
        setCharts: true
      });
    } else {
      this.updateVenueChart(detailByVenue, true);
      this.updateBrandChart(detailByBrand, true);
    }
    if (this.props.location !== prevProps.location) {
      window.scrollTo(0, 0);
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

  public brandFormatter(cell: any, row: any) {
    return (
      <React.Fragment>
        {cell}<br/>{row.denomination}
      </React.Fragment>
    );
  }

  public vinFormatter(cell: any, row: any) {
    return (
      <React.Fragment>
        {row.patent && row.patent.length ? <React.Fragment>{row.patent}<br /></React.Fragment> : null}
        {cell}
      </React.Fragment>
    );
  }

  public commentFormatter(cell: any, row: any) {
    if (row.comments && row.comments.length) {
      return (
        <React.Fragment>
          {maxText(row.comments[row.comments.length - 1].comment, 60)}<br />
          <button className={'btn btn-default btn-xs'} onClick={() => this.carComments(row)}>
            {row.comments.length} <i className={'fa fa-comments'}/>
          </button>
        </React.Fragment>
      );
    } else {
      return (
        <button className={'btn btn-default btn-xs'} onClick={() => this.carComments(row)}>
          Agregar <i className={'fa fa-comments'}/>
        </button>
      );
    }
  }

  public render(): React.ReactElement<IPropsType> {
    const {
      loadingDetail,
      summary,
      detail
    } = this.props.inventories;
    const {
      percentagePending,
      percentageFound,
      percentageLeftover,
      percentageReported,
      percentageMissing
    } = this.calculateDetails(summary.results);

    // order cars in products and reported
    const {products, reported} = this.processCars(detail.cars);

    return (
      <AppContainer title={summary.name} cMenu="2" cSubMenu="2.1" cAction="Detalle">
        <section className="content">
          <Row>
            <div className="col-md-6 col-lg-5th-1">
              <div className="info-box bg-green">
                <span className="info-box-icon"><i className="fa fa-check" /></span>
                <div className="info-box-content">
                  <span className="info-box-text">Encontrados</span>
                  <span className="info-box-number count">
                    {!loadingDetail && summary.results && summary.results.found ? summary.results.found : 0}
                  </span>
                  <div className="progress">
                    <div className="progress-bar" style={{
                      width: `${!loadingDetail ? percentageFound : 0}%`,
                      transition: loadingDetail ? 'none' : 'width .6s ease'
                    }} />
                  </div>
                  <span className="progress-description">
                    {`${percentageFound.toFixed(1)}% encontrados.`}
                  </span>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-5th-1">
              <div className="info-box bg-aqua">
                <span className="info-box-icon"><i className="fa fa-clock-o" /></span>
                <div className="info-box-content">
                  <span className="info-box-text">Pendientes</span>
                  <span className="info-box-number count">
                    {!loadingDetail && summary.results && summary.results.pending ? summary.results.pending : 0}
                  </span>
                  <div className="progress">
                    <div className="progress-bar" style={{
                      width: `${!loadingDetail ? percentagePending : 0}%`,
                      transition: loadingDetail ? 'none' : 'width .6s ease'
                    }} />
                  </div>
                  <span className="progress-description">
                    {`${percentagePending.toFixed(1)}% pendientes.`}
                  </span>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-5th-1">
              <div className="info-box bg-yellow">
                <span className="info-box-icon"><i className="fa fa-arrow-up" /></span>
                <div className="info-box-content">
                  <span className="info-box-text">Sobrantes</span>
                  <span className="info-box-number count">
                    {!loadingDetail && summary.results && summary.results.leftover ? summary.results.leftover : 0}
                  </span>
                  <div className="progress">
                    <div className="progress-bar" style={{
                      width: `${!loadingDetail ? percentageLeftover : 0}%`,
                      transition: loadingDetail ? 'none' : 'width .6s ease'
                    }} />
                  </div>
                  <span className="progress-description">
                    {`${percentageLeftover.toFixed(1)}% sobrantes.`}
                  </span>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-5th-1">
              <div className="info-box bg-red">
                <span className="info-box-icon"><i className="fa fa-arrow-down" /></span>
                <div className="info-box-content">
                  <span className="info-box-text">Faltantes</span>
                  <span className="info-box-number count">
                    {!loadingDetail && summary.results && summary.results.missing ? summary.results.missing : 0}
                  </span>
                  <div className="progress">
                    <div className="progress-bar" style={{
                      width: `${!loadingDetail ? percentageMissing : 0}%`,
                      transition: loadingDetail ? 'none' : 'width .6s ease'
                    }} />
                  </div>
                  <span className="progress-description">
                    {`${percentageMissing.toFixed(1)}% faltantes.`}
                  </span>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-5th-1">
              <div className="info-box bg-gray-dark">
                <span className="info-box-icon"><i className="fa fa-cogs" /></span>
                <div className="info-box-content">
                  <span className="info-box-text">Reportados</span>
                  <span className="info-box-number count">
                    {!loadingDetail && summary.results && summary.results.reported ? summary.results.reported : 0}
                  </span>
                  <div className="progress">
                    <div className="progress-bar" style={{
                      width: `${!loadingDetail ? percentageReported : 0}%`,
                      transition: loadingDetail ? 'none' : 'width .6s ease'
                    }} />
                  </div>
                  <span className="progress-description">
                    {`${percentageReported.toFixed(1)}% reportados.`}
                  </span>
                </div>
              </div>
            </div>
          </Row>
          <Row>
            <div className="col-md-6 col-lg-3">
              <div className="box box-primary">
                <div className="box-header with-border">
                  <h3 className="box-title">Resumen General</h3>
                </div>
                <div className="box-body">
                  <ul className="list-group list-group-unbordered">
                    <li className="list-group-item" style={{borderTop: 0}}>
                      <strong><i className="fa fa-fw fa-user margin-r-5"/> Creado por</strong>
                      <p className="pull-right">
                        {!loadingDetail && summary && summary.createdBy ? summary.createdBy.fullName : null}
                      </p>
                    </li>
                    <li className="list-group-item">
                      <strong><i className="fa fa-fw fa-clock-o  margin-r-5"/> Fecha creación</strong>
                      <p className="pull-right">
                         {!loadingDetail && summary && summary.createdAt ? moment(summary.createdAt).format('LLL') : null}
                      </p>
                    </li>
                    <li className="list-group-item">
                      <strong><i className="fa fa-fw fa-caret-right margin-r-5"/> Estado</strong>
                      <p className="pull-right">
                        {!loadingDetail ? this.labelStatus(detail.status) : null}
                      </p>
                    </li>
                    <li className="list-group-item">
                      <strong><i className="fa fa-fw fa-car margin-r-5" /> Vehículos del inventario</strong>
                    </li>
                    <li className="list-group-item">
                      <strong>Encontrados</strong>
                      <span className="pull-right label label-success count" style={{padding: '5px 10px', fontSize: '12px'}}>
                        {
                          !loadingDetail && summary.results ?
                            summary.results.found + summary.results.leftover
                            : 0
                        }
                      </span>
                    </li>
                    <li className="list-group-item">
                      <strong>Faltantes</strong>
                      <span className="pull-right label label-danger count" style={{padding: '5px 10px', fontSize: '12px'}}>
                        {
                          !loadingDetail && summary.results ?
                            summary.results.pending - summary.results.leftover
                            : 0
                        }
                      </span>
                    </li>
                    <li className="list-group-item">
                      <strong>Total</strong>
                      <span className="pull-right label label-primary count" style={{padding: '5px 10px', fontSize: '12px'}}>
                        {
                          !loadingDetail && summary.results ?
                            (summary.results.found + summary.results.leftover) + (summary.results.pending - summary.results.leftover)
                            : 0
                        }
                      </span>
                    </li>
                    <li className="list-group-item text-muted"  style={{borderBottom: 0}}>
                      <strong>Reportados</strong>
                      <span className="pull-right label label-default count" style={{padding: '5px 10px', fontSize: '12px'}}>
                        {
                          !loadingDetail && summary.results ?
                            summary.results.reported
                            : 0
                        }
                      </span>
                    </li>
                  </ul>
                  {/*<a href="#" className="btn btn-primary btn-block"><b>Follow</b></a>*/}
                  <button
                      className="btn btn-sm btn-block btn-primary hidden-xs hidden-sm"
                      onClick={() => this.xlsExport(['pending', 'found', 'leftover', 'missing', 'reported'])}
                    >
                      <i className="fa fa-fw fa-download"/> Exportar excel General
                    </button>
                </div>
                {
                  loadingDetail &&
                  <div className="overlay">
                    <i className="fa fa-spinner fa-spin text-purple"/>
                  </div>
                }
              </div>
            </div>
            <div className="col-md-6 col-lg-9">
              <div className="box box-primary">
                <div className="box-header with-border">
                  <h3 className="box-title">Detalle de inventario por sucursal</h3>
                  {/*<div className="box-tools pull-right">*/}
                  {/*</div>*/}
                </div>
                <div className="box-body">
                  <div id="chart-venues-detail" style={{height: '600px', maxWidth: '100%'}}/>
                </div>
                {
                  loadingDetail &&
                  <div className="overlay">
                    <i className="fa fa-spinner fa-spin text-purple"/>
                  </div>
                }
              </div>
            </div>
          </Row>
          <Row>
            <div className="col-md-12">
              <div className="box box-success">
                <div className="box-header with-border">
                  <h3 className="box-title">Detalle de inventario por Marca</h3>
                  {/*<div className="box-tools pull-right">*/}
                  {/*</div>*/}
                </div>
                <div className="box-body">
                  <div id="chart-brand-detail" style={{height: '600px', maxWidth: '100%'}}/>
                </div>
                {
                  loadingDetail &&
                  <div className="overlay">
                    <i className="fa fa-spinner fa-spin text-purple"/>
                  </div>
                }
              </div>
            </div>
          </Row>
          <Row>
            <div className="col-md-12">
              <div className="box box-info">
                <div className="box-header with-border">
                  <h3 className="box-title">Detalle de inventario</h3>
                  <div className="box-tools pull-right">
                    <button
                      className="btn btn-sm btn-primary hidden-xs hidden-sm"
                      onClick={() => this.xlsExport(['pending', 'found', 'leftover', 'missing'])}
                    >
                      <i className="fa fa-fw fa-download"/> Exportar en Excel
                    </button>
                  </div>
                </div>
                <div className="box-body">
                  <div className="row">
                    <div className="col-md-12">
                      <BootstrapTable
                        keyField="_id"
                        data={products}
                        columns={this.columns}
                        filter={filterFactory()}
                        pagination={paginationFactory(this.paginationOption)}
                        defaultSorted={this.defaultSorted}
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
          </Row>
          <Row>
            <div className="col-md-12">
              <div className="box box-info">
                <div className="box-header with-border">
                  <h3 className="box-title">Detalle Reportados</h3>
                  <div className="box-tools pull-right">
                    <button className="btn btn-sm btn-primary hidden-xs hidden-sm" onClick={() => this.xlsExport(['reported'])}>
                      <i className="fa fa-fw fa-download" /> Exportar en Excel
                    </button>
                  </div>
                </div>
                <div className="box-body">
                  <div className="row">
                    <div className="col-md-12">
                      <BootstrapTable
                        keyField="_id"
                        data={reported}
                        columns={this.columnsReported}
                        filter={filterFactory()}
                        pagination={paginationFactory(this.paginationOption)}
                        defaultSorted={this.defaultSorted}
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
          </Row>
          <ModalView />
        </section>
      </AppContainer>
    );
  }

  private calculateDetails(results: IInventorySummaryResult | undefined) {
    const {loadingDetail} = this.props.inventories;
    if (!loadingDetail) {
      const totalCars = results ? results.missing + results.found + results.pending + results.leftover + results.reported : 0;
      return {
        totalCars,
        percentagePending: results && results.pending ? (100 / totalCars) * results.pending : 0,
        percentageFound: results && results.found ? (100 / totalCars) * results.found : 0,
        percentageLeftover: results && results.leftover ? (100 / totalCars) * results.leftover : 0,
        percentageMissing: results && results.missing ? (100 / totalCars) * results.missing : 0,
        percentageReported: results && results.reported ? (100 / totalCars) * results.reported : 0
      };
    }
    return {
      totalCars: 0,
      percentagePending: 0,
      percentageFound: 0,
      percentageLeftover: 0,
      percentageMissing: 0,
      percentageReported: 0
    };
  }

  private processCars(cars: IInventoryCar[]) {
    const products: any[] = [];
    const reported: any[] = [];
    for (const car of cars) {
      if (car.status === 'reported') {
        reported.push({
          _id: (car as any)._id,
          vin: car.car.vin,
          brand: car.car.brand,
          denomination: car.car.denomination,
          venue: car.venue ? car.venue.name : '-',
          images: car.images && car.images.length ? car.images : [],
          comments: car.comments && car.comments.length ? car.comments : [],
          countComments: car.comments && car.comments.length ? car.comments.length : 0,
          venueFound: car.venueFound ? car.venueFound.name : '-',
          patent: car.car.patent ? car.car.patent : '',
          inventoriedBy: car.inventoriedBy ? `${car.inventoriedBy.firstName} ${car.inventoriedBy.lastName}` : '-',
          status: car.status
        });
      } else {
        products.push({
          _id: (car as any)._id,
          vin: car.car.vin,
          brand: car.car.brand,
          denomination: car.car.denomination,
          venue: car.venue ? car.venue.name : '-',
          images: car.images && car.images.length ? car.images : [],
          comments: car.comments && car.comments.length ? car.comments : [],
          countComments: car.comments && car.comments.length ? car.comments.length : 0,
          venueFound: car.venueFound ? car.venueFound.name : '-',
          patent: car.car.patent ? car.car.patent : '',
          inventoriedBy: car.inventoriedBy ? `${car.inventoriedBy.firstName} ${car.inventoriedBy.lastName}` : '-',
          status: car.status
        });
      }
    }
    return {
      products,
      reported
    };
  }

  private carComments(inventoryCar: IInventoryCar) {
    const { inventories} = this.props;
    this.props.updateCommentsAction(inventoryCar);
    setTimeout(() => {
      this.props.loadDataAction(
        `Comentarios`,
        <InventoryCarComments
          inventories={inventories}
          socket={this.socket}
          addCommentAction={addCommentAction}
          sendCommentAction={sendCommentAction}
        />
      );
    }, 400);
  }

  private xlsExport(status: string[]) {
    const {detail} = this.props.inventories;
    const data: any = [];
    // Order data
    if (detail && detail.cars && detail.cars.length) {
      for (const car of detail.cars) {
        if (status.includes(car.status)) {
          data.push({
            VIN: car.car.vin,
            Patente: car.car.patent && car.car.patent.length ? car.car.patent : '-',
            Marca: car.car.brand && car.car.brand.length ? car.car.brand : '-',
            ['Denominación']: car.car.denomination && car.car.denomination.length ? car.car.denomination : '-',
            Color: car.car.color && car.car.color.length ? car.car.color : '-',
            Sucursal: car.venue && car.venue.hasOwnProperty('name') ? car.venue.name : '-',
            ['Sucursal encontrado']: car.venueFound && car.venueFound.hasOwnProperty('name') ? car.venueFound.name : '-',
            ['Encontrado por']: car.inventoriedBy ? `${car.inventoriedBy.firstName} ${car.inventoriedBy.lastName}` : '-',
            ['Comentario']: car.comments && car.comments.length ? `${car.comments[car.comments.length - 1].comment}` : '-',
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
    const {loadingDetail} = this.props.inventories;
    const venuesNames: string[] = [];
    const venuesFound: any[] = [];
    const venuesPending: any[] = [];
    const venuesLeftover: any[] = [];
    const venuesReported: any[] = [];
    const venuesMissing: any[] = [];
    // detailByVenue.sort((a, b) => {
    //   return a.name.localeCompare(b.name);
    // });
    detailByVenue.sort((a: any, b: any) => {
      const suma = a.results.leftover + a.results.missing + a.results.reported;
      const sumb = b.results.leftover + b.results.missing + b.results.reported;
      return sumb - suma;
    });

    for (const venue of detailByVenue) {
      venuesNames.push(venue.name);
      venuesFound.push(venue.results && venue.results.found > 0 ? venue.results.found : null);
      venuesPending.push(venue.results && venue.results.pending > 0 ? venue.results.pending : null);
      venuesLeftover.push(venue.results && venue.results.leftover > 0 ? venue.results.leftover : null);
      venuesReported.push(venue.results && venue.results.reported > 0 ? venue.results.reported : null);
      venuesMissing.push(venue.results && venue.results.missing > 0 ? venue.results.missing : null);
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
        data: ['Encontrados', 'Pendientes', 'Sobrantes', 'Faltantes', 'Reportados']
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
      color: ['#00aa51', '#00c2f4', '#ff9600', '#f1392c', '#96a4b3'],
      series: [{
        data: venuesFound,
        name: 'Encontrados',
        type: 'bar',
        stack: 'cars',
        // barMinHeight: 20,
        label: {
          normal: {
            ...this.labelOption.normal
            // rich: {
            //   name: {
            //     textBorderColor: '#fff'
            //   }
            // }
          }
        },
        barGap: 0
        // areaStyle: {}
        // smooth: true
      }, {
        data: venuesPending,
        name: 'Pendientes',
        type: 'bar',
        stack: 'cars',
        // barMinHeight: 20,
        label: {
          normal: {
            ...this.labelOption.normal
            // rich: {
            //   name: {
            //     textBorderColor: '#fff',
            //     // textBorderWidth: 0
            //   }
            // }
          }
        },
        barGap: 0
        // areaStyle: {}
        // smooth: true
      }, {
        data: venuesLeftover,
        name: 'Sobrantes',
        type: 'bar',
        stack: 'cars',
        // color: '#ff9600',
        // barMinHeight: 20,
        label: {
          normal: {
            ...this.labelOption.normal
            // rich: {
            //   name: {
            //     textBorderColor: '#fff'
            //   }
            // }
          }
        },
        barGap: 0
        // areaStyle: {}
        // smooth: true
      }, {
        data: venuesMissing,
        name: 'Faltantes',
        type: 'bar',
        stack: 'cars',
        // barMinHeight: 20,
        label: {
          normal: {
            ...this.labelOption.normal
          }
        },
        barGap: 0
        // areaStyle: {}
        // smooth: true
      }, {
        data: venuesReported,
        name: 'Reportados',
        type: 'bar',
        stack: 'cars',
        // color: '#96a4b3',
        // barMinHeight: 20,
        label: {
          normal: {
            ...this.labelOption.normal
          }
        },
        barGap: 0
        // areaStyle: {}
        // smooth: true
      }]
    };
    if (!update) {
      optionVenues.legend = {
        ...optionVenues,
        selected: {
          Encontrados: false,
          Pendientes: false
        }
      };
      optionVenues.dataZoom = [
        {
          show: venuesNames.length > 12,
          realtime: true,
          start: 0,
          end: venuesNames.length > 12 ? 80 : 100
        }
      ];
    }
    if (!loadingDetail) {
      this.venuesDetailChart.setOption(optionVenues);
    }
  }

  private updateBrandChart(detailByBrand: IDetailByBrand[], update?: boolean) {
    const {loadingDetail} = this.props.inventories;
    const brandNames: string[] = [];
    const brandFound: any[] = [];
    const brandPending: any[] = [];
    const brandLeftover: any[] = [];
    const brandReported: any[] = [];
    const brandMissing: any[] = [];
    // detailByBrand.sort((a, b) => {
    //   return a.name.localeCompare(b.name);
    // });
    detailByBrand.sort((a: any, b: any) => {
      const suma = a.results.leftover + a.results.missing + a.results.reported;
      const sumb = b.results.leftover + b.results.missing + b.results.reported;
      return sumb - suma;
    });
    for (const brand of detailByBrand) {
      brandNames.push(brand.name);
      brandFound.push(brand.results && brand.results.found > 0 ? brand.results.found : null);
      brandPending.push(brand.results && brand.results.pending > 0 ? brand.results.pending : null);
      brandLeftover.push(brand.results && brand.results.leftover > 0 ? brand.results.leftover : null);
      brandReported.push(brand.results && brand.results.reported > 0 ? brand.results.reported : null);
      brandMissing.push(brand.results && brand.results.missing > 0 ? brand.results.missing : null);
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
        data: ['Encontrados', 'Pendientes', 'Sobrantes', 'Faltantes', 'Reportados']
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
      color: ['#00aa51', '#00c2f4', '#ff9600', '#f1392c', '#96a4b3'],
      series: [{
        data: brandFound,
        name: 'Encontrados',
        // label: labelOption,
        type: 'bar',
        stack: 'cars',
        // areaStyle: {},
        barGap: 0
        // smooth: true
      }, {
        data: brandPending,
        name: 'Pendientes',
        type: 'bar',
        stack: 'cars',
        // areaStyle: {},
        barGap: 0
        // smooth: true
      }, {
        data: brandLeftover,
        name: 'Sobrantes',
        type: 'bar',
        stack: 'cars',
        // areaStyle: {},
        barGap: 0
        // smooth: true
      }, {
        data: brandMissing,
        name: 'Faltantes',
        type: 'bar',
        stack: 'cars',
        // areaStyle: {},
        barGap: 0
        // smooth: true
      }, {
        data: brandReported,
        name: 'Reportados',
        type: 'bar',
        stack: 'cars',
        // areaStyle: {},
        barGap: 0
        // smooth: true
      }]
    };
    if (!update) {
      optionBrands.legend = {
        ...optionBrands,
        selected: {
          Encontrados: false,
          Pendientes: false
        }
      };
      optionBrands.dataZoom = [
        {
          show: brandNames.length > 12,
          realtime: true,
          start: 0,
          end: brandNames.length > 12 ? 80 : 100
        }
      ];
    }
    if (!loadingDetail) {
      this.brandDetailChart.setOption(optionBrands);
    }
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

  private customTotal(from: any, to: any, size: any) {
    return(
      <span className="react-bootstrap-table-pagination-total text-ellipsis" style={{fontSize: '75%'}}>
        &nbsp;&nbsp;Mostrando registros del {from} al {to} de {size} registros.
      </span>
    );
  }

  private labelStatus(option: string): React.ReactElement<IPropsType> | null {
    if (option === 'finalized') {
      return <span className="label label-success" style={{padding: '5px 10px', fontSize: '11px'}}><i className="fa fa-fw fa-check"/> Finalizado</span>;
    } else if (option === 'inProcess') {
      return <span className="label label-primary" style={{padding: '5px 10px', fontSize: '11px'}}><i className="fa fa-fw fa-spin fa-spinner"/> En progreso</span>;
    } else {
      return null;
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
    loadDataAction: (title: string, body: JSX.Element, footer: JSX.Element) => dispatch(loadDataAction(title, body, footer)),
    updateCommentsAction: (inventoryCar: IInventoryCar) => dispatch(updateInventoryCarAction(inventoryCar)),
    getInventoryDetailAction: (id: string, update: boolean) => dispatch(getInventoryDetailAction(id, update))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(InventoryDetailView);
