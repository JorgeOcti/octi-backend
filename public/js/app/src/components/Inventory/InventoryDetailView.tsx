///<reference path="../../../node_modules/sweetalert/typings/sweetalert.d.ts"/>
///<reference path="../../../src/types/react-bootstrap-table-next.d.ts"/>
///<reference path="../../../src/types/react-bootstrap-table2-filter.d.ts"/>
///<reference path="../../../src/types/react-bootstrap-table2-paginator.d.ts"/>
import * as moment from 'moment';
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
import {goToSection, maxText} from '../../utils/common';
import Checkbox from '../CheckBox';
import ImageLazyLoad from '../ImageLazyLoad';
import ModalView from '../Modal/ModalView';
import Row from '../Row';
import InventoryCarComments from './InventoryCarComments';

declare let window: IWindow;

interface IPropsType extends RouteComponentProps<{ id: string, tab?: string }> {
  inventories: IInventoryState;
  dispatch: Dispatch<InventoryReduxAction>;

  updateCommentsAction(inventoryCar: IInventoryCar): InventoryReduxAction;
  getInventoryDetailAction(id: string, update: boolean): InventoryReduxAction;
  loadDataAction(title: string, body: JSX.Element, footer?: JSX.Element): ModalReduxAction;
}

interface IStateType {
  error: Error | null;
  setCharts: boolean;
  tab: string;
  selectedItems: {
    [key: string]: any
  };
  selectFilters: {
    venues: any[];
  };
  filter: {
    text: string;
    venues: string[];
    states: string[];
  };
}

class InventoryDetailView extends React.Component<IPropsType, IStateType> {

  state = {
    error: null,
    setCharts: false,
    tab: 'summary',
    venues: [],
    selectedItems: {},
    selectFilters: {
      venues: []
    },
    filter: {
      text: '',
      venues: [],
      states: []
    }
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

  private classLabelStatus: any = {
    pending: 'label-info',
    found: 'label-success',
    missing: 'label-danger',
    leftover: 'label-warning',
    reported: 'label-default'
  };

  private paginationOption: any = {
    // paginationSize: 4,
    showTotal: true,
    paginationTotalRenderer: this.customTotal,
    sizePerPageList: [{
      text: '10', value: 10
    }, {
      text: '50', value: 50
    }, {
      text: '200', value: 200
    }]
  };

  private defaultSorted = [{
    dataField: 'status',
    order: 'asc'
  }];

  private defaultColumns: any[] = [];
  private columns: any[] = [];

  private socket: SocketIOClient.Socket;

  constructor(props: IPropsType) {
    super(props);
    this.resizeCharts = this.resizeCharts.bind(this);
    this.xlsExport = this.xlsExport.bind(this);
    this.clearSelected = this.clearSelected.bind(this);
    this.carComments = this.carComments.bind(this);
    this.selectedFormatter = this.selectedFormatter.bind(this);
    this.selectedHeaderFormatter = this.selectedHeaderFormatter.bind(this);
    this.brandFormatter = this.brandFormatter.bind(this);
    this.commentFormatter = this.commentFormatter.bind(this);
    this.calculateDetails = this.calculateDetails.bind(this);
    this.imagesFormatter = this.imagesFormatter.bind(this);
    this.handleChangeSearchText = this.handleChangeSearchText.bind(this);
    this.changeSelected = this.changeSelected.bind(this);
    this.processCars = this.processCars.bind(this);
    this.sendToDetailFilteredBy = this.sendToDetailFilteredBy.bind(this);
    this.changeTab = this.changeTab.bind(this);
    const {tab} = this.props.match.params;
    if (tab && tab === 'detail') {
      this.state.tab = 'detail';
    }
    this.defaultColumns = [{
      dataField: 'selected',
      text: '',
      // headerFormatter: this.selectedHeaderFormatter,
      formatter: this.selectedFormatter,
      sort: true,
      headerClasses: 'pointer middle-center',
      classes: 'middle-center',
      headerStyle: {
        maxWidth: '60px',
        minWidth: '60px',
        width: '60px'
      },
      style: {
        maxWidth: '50px',
        minWidth: '50px',
        width: '50px'
      }
    }, {
      dataField: 'brand',
      text: 'Vehículo',
      formatter: this.brandFormatter,
      // filter: textFilter({
      //   className: 'input-sm',
      //   placeholder: ' Buscar'
      // }),
      filterValue: (cell: any, row: any) => `${cell}${row.denomination}${row.vin}${row.patent}`,
      classes: 'middle',
      headerClasses: 'middle pointer',
      style: {
        width: '20%'
      },
      sort: true
    }, {
      dataField: 'venue',
      text: 'Sucursal',
      // filter: textFilter({
      //   className: 'input-sm',
      //   placeholder: ' Buscar'
      // }),
      classes: 'middle hidden-xs hidden-sm',
      headerClasses: 'middle hidden-xs hidden-sm pointer',
      style: {
        width: '20%'
      },
      sort: true
    }, {
      dataField: 'venueFound',
      text: 'Encontrado en',
      // filter: textFilter({
      //   className: 'input-sm',
      //   placeholder: ' Buscar'
      // }),
      classes: 'middle hidden-xs hidden-sm hidden-md',
      headerClasses: 'middle hidden-xs hidden-sm hidden-md pointer',
      style: {
        width: '20%'
      },
      sort: true
    }, {
      dataField: 'images',
      text: 'Imágenes',
      classes: 'middle hidden-xs',
      headerClasses: 'middle hidden-xs',
      formatter: this.imagesFormatter,
      style: {
        width: '20%'
      },
      headerStyle: {
        verticalAlign: 'top'
      }
    }, {
      dataField: 'countComments',
      text: 'Comentarios',
      classes: 'middle hidden-xs text-ellipsis',
      formatter: this.commentFormatter,
      headerClasses: 'middle hidden-xs',
      style: {
        width: '20%'
      },
      headerStyle: {
        verticalAlign: 'top'
      }
    }];
    this.columns = [...this.defaultColumns, {
      dataField: 'status',
      text: 'Status',
      sort: true,
      formatter: (cell: string) => (this.statusText[cell]),
      // filter: selectFilter({
      //   options: this.statusText,
      //   // withoutEmptyOption: true,
      //   className: 'input-sm',
      //   placeholder: 'Seleccione tipo',
      //   id: 'custom-filter'
      // }),
      headerClasses: 'middle pointer',
      headerStyle: {
        maxWidth: '100px',
        minWidth: '100px',
        width: '100px'
      },
      style: {
        maxWidth: '100px',
        minWidth: '100px',
        width: '100px'
      },
      classes: (cell: any) => {
        return `middle-center ${this.classStatus.hasOwnProperty(cell) ? this.classStatus[cell] : ''}`;
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
    const $venues: any = $('#venues');
    $venues.on('changed.bs.select', () => {
      if ($venues) {
        this.setState({
          filter: {
            ...this.state.filter,
            venues: $venues.val() as string[]
          }
        });
      }
    });
    const $states: any = $('#states');
    $states.on('changed.bs.select', () => {
      if ($states) {
        this.setState({
          filter: {
            ...this.state.filter,
            states: $states.val() as string[]
          }
        });
      }
    });
    setTimeout(() => {
      if ($venues && $venues.length) {
        $venues.selectpicker('refresh');
      }
      if ($states && $states.length) {
        $states.selectpicker('refresh');
      }
    }, 300);
  }

  public componentDidUpdate(prevProps: IPropsType): void {
    const {loadingDetail, detailByVenue, detailByBrand} = this.props.inventories;
    // style react boostrap table
    $('.react-bootstrap-table-pagination').css({padding: '3px 15px'});
    $('.react-bootstrap-table-pagination div').removeClass('col-xs-6').addClass('col-xs-12').css({padding: '3px 15px'});
    $('.react-bootstrap-table-pagination div:last-child').removeClass('text-right').addClass('text-right');
    $('#pageDropDown').removeClass('btn-sm').addClass('btn-sm');
    $('.bs-searchbox input').removeClass('input-sm').addClass('input-sm');
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
        {
          row.patent && row.patent.length ?
            <React.Fragment>
              <strong>{row.patent}</strong> <span className="text-muted" style={{fontSize: '70%'}}>{row.vin}</span>
            </React.Fragment>
          : <strong>{row.vin}</strong>
        }<br/>
        <span className="text-muted" style={{fontSize: '80%'}}>{cell} / {row.denomination}</span>
      </React.Fragment>
    );
  }

  public selectedFormatter(cell: any, row: any) {
    return (
      <Checkbox
        active={cell}
        action={() => this.changeSelected(row._id)}
        classes="icheck-in-checkbox"
        style={{margin: '5px', marginTop: '5px'}}
      />
    );
  }

  public commentFormatter(cell: any, row: any) {
    if (row.comments && row.comments.length) {
      return (
        <React.Fragment>
          {maxText(row.comments[row.comments.length - 1].comment, 20)}<br />
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
    const { tab, selectedItems } = this.state;
    const selected = Object.keys(selectedItems);
    const {
      percentagePending,
      percentageFound,
      percentageLeftover,
      percentageReported,
      percentageMissing
    } = this.calculateDetails(summary.results);

    // order cars in products and reported
    const {products} = this.processCars(detail.cars);

    return (
      <AppContainer title={summary.name} cMenu="2" cSubMenu="2.1" cAction={tab === 'summary' ? 'Consolidado' : 'Detalle'}>
        <section className="content">
          <Row>
            <div className="col-md-12 col-lg-12">
              <div className="box box-solid">
                <ul className="nav nav-pills nav-justified">
                  <li className={tab === 'summary' ? 'active' : ''}>
                    <a
                      href="javascript:void(0);"
                      style={{borderTop: '0', marginBottom: '0'}}
                      onClick={() => this.changeTab('summary')}
                    >Consolidado</a>
                  </li>
                  <li className={tab === 'detail' ? 'active' : ''}>
                    <a
                      href="javascript:void(0);"
                      style={{borderTop: '0', marginBottom: '0'}}
                      onClick={() => this.changeTab('detail')}
                    >Detalle</a>
                  </li>
                </ul>
              </div>
            </div>
          </Row>
          <Row style={{display: tab === 'summary' ? 'block' : 'none'}}>
            <div className="col-md-12 col-lg-12">
              <div className="box box-default">
                <div className="box-header with-border">
                <Row className="vertical-line-mobile">
                  <div className="col-md-6 col-lg-3">
                    <i className="fa fa-fw fa-user text-primary"/>
                    <strong>
                      {
                      !loadingDetail && summary && summary.createdBy ?
                        summary.createdBy.fullName
                        : '-'
                    }
                    </strong>

                  </div>
                  <div className="col-md-6 col-lg-3">
                    <i className="fa fa-fw fa-clock-o text-green"/>
                    <strong>{!loadingDetail && summary && summary.createdAt ? moment(summary.createdAt).format('LLL') : '-'}</strong>
                  </div>
                  <div className="col-md-6 col-lg-3">
                    <i className="fa fa-fw fa-clock-o text-red"/>
                    <strong>{!loadingDetail && summary && summary.finalizedAt ? moment(summary.finalizedAt).format('LLL') : '-'}</strong>
                  </div>
                  <div className="col-md-6 col-lg-3 text-right">
                    {!loadingDetail ? this.labelStatus(detail.status) : null}
                  </div>
                </Row>
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
          <Row style={{display: tab === 'summary' ? 'block' : 'none'}}>
            <div className="col-md-6 col-lg-4 pointer" onClick={() => this.sendToDetailFilteredBy('found')}>
              <div className="info-box bg-green">
                <span className="info-box-icon"><i className="fa fa-check" /></span>
                <div className="info-box-content">
                  <span className="info-box-text">Encontrados</span>
                  <span className="info-box-number count">
                    {!loadingDetail && summary.results && summary.results.found ? summary.results.found : <i className="fa fa-spinner fa-spin"/>}
                  </span>
                  <div className="progress">
                    <div className="progress-bar" style={{
                      width: `${!loadingDetail ? percentageFound : 0}%`,
                      transition: loadingDetail ? 'none' : 'width .6s ease'
                    }} />
                  </div>
                  <span className="progress-description">
                    {!loadingDetail ? `${percentageFound.toFixed(1)}% encontrados.` : null}
                  </span>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-4 pointer" onClick={() => this.sendToDetailFilteredBy('leftover')}>
              <div className="info-box bg-yellow">
                <span className="info-box-icon"><i className="fa fa-arrow-up" /></span>
                <div className="info-box-content">
                  <span className="info-box-text">Sobrantes</span>
                  <span className="info-box-number count">
                    {!loadingDetail && summary.results && summary.results.leftover ? summary.results.leftover : <i className="fa fa-spinner fa-spin"/>}
                  </span>
                  <div className="progress">
                    <div className="progress-bar" style={{
                      width: `${!loadingDetail ? percentageLeftover : 0}%`,
                      transition: loadingDetail ? 'none' : 'width .6s ease'
                    }} />
                  </div>
                  <span className="progress-description">
                    {!loadingDetail ? `${percentageLeftover.toFixed(1)}% sobrantes.` : null}
                  </span>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-4 pointer" onClick={() => this.sendToDetailFilteredBy('missing')}>
              <div className="info-box bg-red">
                <span className="info-box-icon"><i className="fa fa-arrow-down" /></span>
                <div className="info-box-content">
                  <span className="info-box-text">Faltantes</span>
                  <span className="info-box-number count">
                    {!loadingDetail && summary.results && summary.results.missing ? summary.results.missing : <i className="fa fa-spinner fa-spin"/>}
                  </span>
                  <div className="progress">
                    <div className="progress-bar" style={{
                      width: `${!loadingDetail ? percentageMissing : 0}%`,
                      transition: loadingDetail ? 'none' : 'width .6s ease'
                    }} />
                  </div>
                  <span className="progress-description">
                    {!loadingDetail ? `${percentageMissing.toFixed(1)}% faltantes.` : null}
                  </span>
                </div>
              </div>
            </div>
          </Row>
          <Row style={{display: tab === 'summary' ? 'block' : 'none'}}>
            <div className="col-md-12 col-lg-12">
              <div className="box box-primary">
                <div className="box-header with-border">
                  <h3 className="box-title">Detalle de inventario por sucursal</h3>
                  <div className="box-tools pull-right">
                    <button
                      className="btn btn-sm btn-primary hidden-xs hidden-sm"
                      onClick={() => this.xlsExport(['pending', 'found', 'leftover', 'missing', 'reported'])}
                    >
                      <i className="fa fa-fw fa-download"/> Exportar Excel
                    </button>
                  </div>
                </div>
                <div className="box-body">
                  <div id="chart-venues-detail" style={{height: '550px', maxWidth: '100%'}}/>
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
          <Row style={{display: tab === 'summary' ? 'block' : 'none'}}>
            <div className="col-md-12">
              <div className="box box-success">
                <div className="box-header with-border">
                  <h3 className="box-title">Detalle de inventario por Marca</h3>
                  {/*<div className="box-tools pull-right">*/}
                  {/*</div>*/}
                </div>
                <div className="box-body">
                  <div id="chart-brand-detail" style={{height: '550px', maxWidth: '100%'}}/>
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
          <Row style={{display: tab === 'detail' ? 'block' : 'none'}}>
            <div className="col-md-6 col-lg-6 pointer" onClick={() => this.sendToDetailFilteredBy('pending')}>
              <div className="info-box bg-aqua">
                <span className="info-box-icon"><i className="fa fa-clock-o" /></span>
                <div className="info-box-content">
                  <span className="info-box-text">Pendientes</span>
                  <span className="info-box-number count">
                    {!loadingDetail && summary.results && summary.results.pending ? summary.results.pending : <i className="fa fa-spinner fa-spin"/>}
                  </span>
                  <div className="progress">
                    <div className="progress-bar" style={{
                      width: `${!loadingDetail ? percentagePending : 0}%`,
                      transition: loadingDetail ? 'none' : 'width .6s ease'
                    }} />
                  </div>
                  <span className="progress-description">
                    {!loadingDetail ? `${percentagePending.toFixed(1)}% pendientes.` : null}
                  </span>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-6 pointer" onClick={() => this.sendToDetailFilteredBy('reported')}>
              <div className="info-box bg-gray-dark">
                <span className="info-box-icon"><i className="fa fa-exclamation" /></span>
                <div className="info-box-content">
                  <span className="info-box-text">Reportados</span>
                  <span className="info-box-number count">
                    {!loadingDetail && summary.results && summary.results.reported ? summary.results.reported : <i className="fa fa-spinner fa-spin"/>}
                  </span>
                  <div className="progress">
                    <div className="progress-bar" style={{
                      width: `${!loadingDetail ? percentageReported : 0}%`,
                      transition: loadingDetail ? 'none' : 'width .6s ease'
                    }} />
                  </div>
                  <span className="progress-description">
                    {!loadingDetail ? `${percentageReported.toFixed(1)}% reportados.` : null}
                  </span>
                </div>
              </div>
            </div>
          </Row>
          <Row style={{display: tab === 'detail' ? 'block' : 'none'}}>
            <div className="col-md-12">
              <div className="box box-info">
                <div className="box-header with-border">
                  <h3 className="box-title">
                    Detalle de inventario {selected.length ? <small className="hidden-sm hidden-xs text-primary">{selected.length} {selected.length > 1 ? 'seleccionados' : 'seleccionado'}.</small> : <small>{products.length}</small>}
                  </h3>
                  <div className="box-tools pull-right">
                    <button
                      className="btn btn-sm btn-primary hidden-xs hidden-sm"
                      onClick={() => this.xlsExport(['pending', 'found', 'leftover', 'missing', 'reported'])}
                    >
                      <i className="fa fa-fw fa-download"/> Exportar Excel
                    </button>
                    <div className="btn-group btn-group-sm" style={{marginLeft: '5px'}}>
                      <button type="button" className="btn btn-success"><i className="fa fa-fw fa-cogs"/> Acciones</button>
                      <button type="button" className="btn btn-success dropdown-toggle" data-toggle="dropdown">
                        <span className="caret"/>
                        <span className="sr-only">Toggle Dropdown</span>
                      </button>
                      <ul className="dropdown-menu" role="menu">
                        <li><a href="javascript:void(0)"><i className="fa fa-fw fa-copy"/> Copiar</a></li>
                        <li><a href="javascript:void(0)"><i className="fa fa-fw fa-paste"/> Pegar</a></li>
                        <li><a href="javascript:void(0)"><i className="fa fa-fw fa-close"/> Eliminar</a></li>
                        {/*<li className="divider"/>*/}
                        {/*<li><a href="javascript:void(0)" onClick={this.clearSelected}><i className="fa fa-fw fa-certificate"/> Limpiar seleccionados.</a></li>*/}
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="box-body no-padding" id="table-detail-inventory">
                  <Row style={{margin: '5px 0'}}>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="cars" className="control-label">Vehículos</label>
                        <input
                          type="text"
                          className="form-control"
                          id="cars"
                          placeholder="Busca por VIN, patente, marca o modelo."
                          value={this.state.filter.text}
                          onChange={this.handleChangeSearchText}
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="form-group">
                        <label htmlFor="venues" className="control-label">Sucursales</label>
                        <select
                          className="form-control"
                          id="venues"
                          multiple
                          data-style="btn-filter btn-default"
                          data-none-selected-text="Todos"
                          data-live-search="true"
                          data-dropup-auto="false"
                          data-actions-box="true"
                          // data-header="&nbsp;"
                          data-select-all-text="Seleccionar todo"
                          data-none-results-text="No hay resultados para {0}"
                          data-deselect-all-text="Deseleccionar todo"
                          data-count-selected-text="{0} sucursales seleccionadas."
                          data-selected-text-format="count > 2"
                        >
                          {
                            !loadingDetail?detail.venues.map((venue: any) => (
                              <option
                                value={venue._id}
                                key={venue._id}
                              >
                                {venue.name}
                              </option>
                            )): <option value="">Cargando...</option>
                          }
                        </select>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="form-group">
                        <label htmlFor="states" className="control-label">Estados</label>
                        <select
                          className="form-control"
                          id="states"
                          multiple
                          data-style="btn-filter btn-default"
                          data-dropup-auto="false"
                          // data-header="&nbsp;"
                          data-none-selected-text="Todos"
                          data-multiple-separator=" - "
                          data-count-selected-text="{0} estados seleccionados."
                          data-selected-text-format="count > 4"
                          value={this.state.filter.states}
                          onChange={() => undefined}
                        >
                          {
                            Object
                              .keys(this.statusText)
                              .map((status) => (
                                <option
                                  value={status}
                                  key={status}
                                  data-content={
                                    `<span class='label ${this.classLabelStatus[status]}'>${this.statusText[status]}</span>`
                                  }
                                >
                                  {this.statusText[status]}
                                </option>
                              ))
                          }
                        </select>
                      </div>
                    </div>
                  </Row>
                  <Row>
                    <div className="col-md-12">
                      {
                        products.length ?
                          <BootstrapTable
                            keyField="_id"
                            data={products}
                            columns={this.columns}
                            filter={filterFactory()}
                            pagination={paginationFactory(this.paginationOption)}
                            defaultSorted={this.defaultSorted}
                          /> : !loadingDetail ? <p className="text-center text-muted">
                            <img
                              src="/images/not_found.png"
                              style={{
                                opacity: 0.5,
                                maxHeight: '200px',
                                marginBottom: '10px'
                              }}
                            /><br />
                            <strong>No hay información para mostrar</strong>
                          </p> : null
                      }
                    </div>
                  </Row>
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

  private sendToDetailFilteredBy(state: string) {
    this.changeTab('detail');
    this.setState({
      filter: {
        // text: '',
        // venues: [],
        ...this.state.filter,
        states: [state]
      }
    }, () => {
      goToSection('#table-detail-inventory');
      const $states: any = $('#states');
      setTimeout(() => {
        if ($states && $states.length) {
          $states.selectpicker('refresh');
        }
      }, 200);
    });
  }

  private handleChangeSearchText(e: React.ChangeEvent<HTMLInputElement>) {
    e.preventDefault();
    const value = e.target.value.trim();
    this.setState({
      filter: {
        ...this.state.filter,
        text: value ? e.target.value : ''
      }
    });
  }

  private changeTab(name: string): void {
    const {id} = this.props.match.params;
    if (name === 'detail') {
      this.props.history.replace(`/inventory/${id}/detail/`);
    } else {
      this.props.history.replace(`/inventory/${id}/`);
    }
    this.setState({
      tab: name
    }, () => {
      this.resizeCharts();
    });
  }

  private selectedHeaderFormatter() {
    return (
      <React.Fragment>
        <Checkbox
          active={false}
          action={undefined}
          classes="icheck-in-checkbox"
          style={{margin: '5px', marginTop: '5px'}}
        />
        <i className="fa fa-order" />
      </React.Fragment>
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
    const {selectedItems, filter} = this.state;
    const products: any[] = [];
    const reported: any[] = [];
    for (const car of cars) {
      let add = true;
      if (filter.venues && filter.venues.length && car.venue) {
        add = (filter.venues as any).includes(car.venue._id);
      }
      if (add && filter.states && filter.states.length && car.status) {
        add = (filter.states as any).includes(car.status);
      }
      if (add && filter.text && filter.text.length) {
        const result: boolean[] = filter.text.toLowerCase().split(' ').map((text) => (
          `${car.car.vin}${car.car.brand}${car.car.denomination}${car.car.patent}`.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .includes(text.toLowerCase())
        ));
        add = result.every((element: boolean) => element === true) === true;
        /*add = `${car.car.vin}${car.car.brand}${car.car.denomination}${car.car.patent}`.normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .includes(filter.text.toLowerCase());*/
      }
      if (add) {
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
          selected: selectedItems.hasOwnProperty((car as any)._id),
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
            ['Imágenes']: car.images.length ? car.images.length : '-',
            // ['Imágenes']: car.images.length ? car.images.map((image: any) => `${image.file.url}`).join('\n') : '-',
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
    const {loadingDetail, detail} = this.props.inventories;
    const venuesNames: string[] = [];
    const venuesFound: any[] = [];
    const venuesPending: any[] = [];
    const venuesLeftover: any[] = [];
    const venuesReported: any[] = [];
    const venuesMissing: any[] = [];
    // detailByVenue.sort((a, b) => {
    //   return a.name.localeCompare(b.name);
    // });
    if (detail.status === 'inProcess') {
      detailByVenue.sort((a: any, b: any) => {
        return b.results.pending - a.results.pending;
      });
    } else {
      detailByVenue.sort((a: any, b: any) => {
        return b.results.pending - a.results.pending;
      });
      detailByVenue.sort((a: any, b: any) => {
        const suma = a.results.leftover + a.results.missing + a.results.reported;
        const sumb = b.results.leftover + b.results.missing + b.results.reported;
        return sumb - suma;
      });
    }

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
        data: ['Encontrados', 'Sobrantes', 'Faltantes', 'Pendientes', 'Reportados']
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
      color: ['#00aa51', '#ff9600', '#f1392c', '#00c2f4', '#96a4b3'],
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
          Reportados: false
        }
      };
      if (detail.status === 'finalized') {
        (optionVenues.legend as any).selected = {
          ...(optionVenues.legend as any).selected,
          Pendientes: false
        };
      }
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

  private changeSelected(item: string) {
    let {selectedItems} = this.state;
    if (selectedItems.hasOwnProperty(item)) {
      delete (selectedItems as any)[item];
    } else {
      selectedItems = {
        ...selectedItems,
        [item]: true
      };
    }
    this.setState({
      selectedItems
    });
  }

  private clearSelected() {
    this.setState({
      selectedItems: {}
    });
  }

  private updateBrandChart(detailByBrand: IDetailByBrand[], update?: boolean) {
    const {loadingDetail, detail} = this.props.inventories;
    const brandNames: string[] = [];
    const brandFound: any[] = [];
    const brandPending: any[] = [];
    const brandLeftover: any[] = [];
    const brandReported: any[] = [];
    const brandMissing: any[] = [];
    // detailByBrand.sort((a, b) => {
    //   return a.name.localeCompare(b.name);
    // });
    if (detail.status === 'inProcess') {
      detailByBrand.sort((a: any, b: any) => {
        return b.results.pending - a.results.pending;
      });
    } else {
      detailByBrand.sort((a: any, b: any) => {
        return b.results.pending - a.results.pending;
      });
      detailByBrand.sort((a: any, b: any) => {
        const suma = a.results.leftover + a.results.missing + a.results.reported;
        const sumb = b.results.leftover + b.results.missing + b.results.reported;
        return sumb - suma;
      });
    }

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
        data: ['Encontrados', 'Sobrantes', 'Faltantes', 'Pendientes', 'Reportados']
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
      color: ['#00aa51', '#ff9600', '#f1392c', '#00c2f4', '#96a4b3'],
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
        data: brandPending,
        name: 'Pendientes',
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
          Reportados: false
        }
      };
      if (detail.status === 'finalized') {
        (optionBrands.legend as any).selected = {
          ...(optionBrands.legend as any).selected,
          Pendientes: false
        };
      }
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
