///<reference path="../../../node_modules/sweetalert/typings/sweetalert.d.ts"/>
///<reference path="../../../src/types/react-bootstrap-table-next.d.ts"/>
///<reference path="../../../src/types/react-bootstrap-table2-filter.d.ts"/>
///<reference path="../../../src/types/react-bootstrap-table2-paginator.d.ts"/>
import * as moment from 'moment';
import * as Raven from 'raven-js';
import {ErrorInfo} from 'react';
import * as React from 'react';
import BootstrapTable from 'react-bootstrap-table-next';
import filterFactory from 'react-bootstrap-table2-filter';
import paginationFactory from 'react-bootstrap-table2-paginator';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import * as io from 'socket.io-client';
import * as XLSX from 'xlsx';
import {IInventoryCar} from '../../../../../../src/interfaces/inventory.interface';
import {IInventoryLabel} from '../../../../../../src/interfaces/inventoryLabel.interface';
import {
  actionSetLabel,
  addCommentAction,
  getInventoryDetailAction,
  IDetailByBrand,
  IDetailByVenue,
  IInventoryState,
  IInventorySummaryResult,
  inventoryDetailChangeFilter,
  inventoryDetailChangeFilterText,
  inventoryDetailChangeSelected,
  InventoryReduxAction,
  sendCommentAction,
  updateInventoryCarAction
} from '../../actions/inventory.actions';
import {loadDataAction, ModalReduxAction} from '../../actions/modal.actions';
import AppContainer from '../../container/AppContainer';
import {IWindow} from '../../interfaces/window';
import {goToSection, maxText} from '../../utils/common';
import ModalView from '../Modal/ModalView';
import BootstrapSelect from '../Utils/BootstrapSelect';
import Checkbox from '../Utils/CheckBox';
import CopyText from '../Utils/CopyText';
import ImageLazyLoad from '../Utils/ImageLazyLoad';
import Row from '../Utils/Row';
import InventoryCarComments from './InventoryCarComments';

declare let window: IWindow;

interface IPropsType extends RouteComponentProps<{ id: string, tab?: string }> {
  inventories: IInventoryState;
  dispatch: Dispatch<InventoryReduxAction>;

  inventoryDetailChangeSelected(item: string): InventoryReduxAction;
  updateCommentsAction(inventoryCar: IInventoryCar): InventoryReduxAction;
  inventoryDetailChangeFilter(filter: { text: string; venues: string[]; states: string[]; }): InventoryReduxAction;
  inventoryDetailChangeFilterText(filter: { text: string; venues: string[]; states: string[]; }): InventoryReduxAction;
  getInventoryDetailAction(id: string, update: boolean): InventoryReduxAction;
  loadDataAction(title: string, body: JSX.Element, footer?: JSX.Element): ModalReduxAction;
  actionSetLabel(inventory: string, car: string, carID: string, label: IInventoryLabel): ModalReduxAction;
}

interface IStateType {
  error: Error | null;
  setCharts: boolean;
  tab: string;
}

class InventoryDetailView extends React.Component<IPropsType, IStateType> {

  state = {
    error: null,
    setCharts: false,
    tab: 'summary'
  };

  venuesDetailChart: echarts.ECharts;
  brandDetailChart: echarts.ECharts;

  private labelOption: any = {
    normal: {
      show: true,
      position: 'inside',
      align: 'center',
      verticalAlign: 'middle',
      rotate: 90,
      formatter: '{c}',
      fontSize: 12,
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
    missing: 'Faltante',
    reported: 'Reportado'
  };

  private iconStatus: any = {
    pending: 'fa-clock-o',
    found: 'fa-check',
    leftover: 'fa-arrow-up',
    missing: 'fa-arrow-down',
    reported: 'fa-exclamation'
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
    }],
    onPageChange: () => {
      setTimeout(() => {
        $('[data-toggle="tooltip"]').tooltip();

      }, 200);
    }
  };

  private defaultSorted = [{
    dataField: 'status',
    order: 'asc'
  }];

  private columns: any[] = [];

  private socket: SocketIOClient.Socket;

  constructor(props: IPropsType) {
    super(props);
    this.resizeCharts = this.resizeCharts.bind(this);
    this.xlsExport = this.xlsExport.bind(this);
    this.carComments = this.carComments.bind(this);
    this.selectedFormatter = this.selectedFormatter.bind(this);
    this.filterVenues = this.filterVenues.bind(this);
    this.filterStatus = this.filterStatus.bind(this);
    this.selectedHeaderFormatter = this.selectedHeaderFormatter.bind(this);
    this.statusFormatter = this.statusFormatter.bind(this);
    this.brandFormatter = this.brandFormatter.bind(this);
    this.commentFormatter = this.commentFormatter.bind(this);
    this.labelFormatter = this.labelFormatter.bind(this);
    this.optionsFormatter = this.optionsFormatter.bind(this);
    this.calculateDetails = this.calculateDetails.bind(this);
    this.imagesFormatter = this.imagesFormatter.bind(this);
    this.handleChangeSearchText = this.handleChangeSearchText.bind(this);
    this.clearFilter = this.clearFilter.bind(this);
    this.sendToDetailFilteredByState = this.sendToDetailFilteredByState.bind(this);
    this.sendToDetailFilteredByVenue = this.sendToDetailFilteredByVenue.bind(this);
    this.changeTab = this.changeTab.bind(this);
    const {tab} = this.props.match.params;
    if (tab && tab === 'detail') {
      this.state.tab = 'detail';
    }
    this.columns = [ /* {
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
        maxWidth: '60px',
        minWidth: '60px',
        width: '60px'
      }
    }, */ {
      dataField: 'brand',
      text: 'Vehículo',
      formatter: this.brandFormatter,
      filterValue: (cell: any, row: any) => `${cell}${row.denomination}${row.vin}${row.patent}`,
      classes: 'middle',
      headerClasses: 'middle pointer',
      sort: true
    }, {
      dataField: 'venue',
      text: 'Sucursal',
      classes: 'middle hidden-xs hidden-sm',
      headerClasses: 'middle hidden-xs hidden-sm pointer',
      style: {
        width: '15%'
      },
      sort: true
    }, {
      dataField: 'venueFound',
      text: 'Encontrado en',
      classes: 'middle hidden-xs hidden-sm hidden-md',
      headerClasses: 'middle hidden-xs hidden-sm hidden-md pointer',
      style: {
        width: '15%'
      },
      sort: true
    }, {
      dataField: 'images',
      text: 'Imágenes',
      classes: 'middle hidden-xs hidden-sm hidden-md',
      headerClasses: 'middle hidden-xs hidden-sm hidden-md',
      formatter: this.imagesFormatter,
      headerStyle: {
        maxWidth: '80px',
        minWidth: '80px',
        width: '80px'
      },
      style: {
        maxWidth: '80px',
        minWidth: '80px',
        width: '80px'
      }
    }, /* {
      dataField: 'countComments',
      text: 'Comentarios',
      classes: 'middle hidden-xs text-ellipsis',
      formatter: this.commentFormatter,
      headerClasses: 'middle hidden-xs',
      style: {
        width: '15%'
      },
      headerStyle: {
        verticalAlign: 'top'
      }
    } */{
      dataField: 'labelName',
      text: 'Etiqueta',
      sort: true,
      classes: 'middle hidden-xs text-ellipsis',
      filterValue: (cell: any, row: any) => `${cell ? cell.name : ''}`,
      formatter: this.labelFormatter,
      headerClasses: 'middle hidden-xs',
      style: {
        width: '18%'
      },
      headerStyle: {
        verticalAlign: 'top'
      }
    }, {
      dataField: 'status',
      text: 'Status',
      sort: true,
      formatter: this.statusFormatter,
      // formatter: (cell: string) => (this.statusText[cell]),
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
      classes: 'middle-center'
      // classes: (cell: any) => {
      //   return `middle-center ${this.classStatus.hasOwnProperty(cell) ? this.classStatus[cell] : ''}`;
      // }
    }, {
      dataField: 'option',
      text: '',
      formatter: this.optionsFormatter,
      headerClasses: 'middle hidden-xs hidden-sm hidden-md',
      classes: () => {
        return `middle-center hidden-xs hidden-sm hidden-md`;
      },
      headerStyle: {
        maxWidth: '150px',
        minWidth: '150px',
        width: '150px'
      },
      style: {
        maxWidth: '150px',
        minWidth: '150px',
        width: '150px'
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
    $('[data-toggle="tooltip"]').tooltip();
    if (this.props.location.pathname !== prevProps.location.pathname) {
      window.scrollTo(0, 0);
    }
  }

  public imagesFormatter(cell: string, row: any) {
    if (row.images && row.images.length) {
      return (
        <div className="row">{
          row.images.map((image: any, index: number) => (
            <div key={image._id} className={'col-md-3 images-25 text-center'} style={{display: index === 0 ? '' : 'none'}}>
              <a href={decodeURI(image.file.url)} data-toggle="lightbox" data-gallery={row._id}>
                <button className="btn btn-xs btn-default">
                  <i className="fa fa-fw fa-image" /> {row.images.length}
                </button>
                {/*<ImageLazyLoad url={decodeURI(image.file.url)} height={'10px'} maxHeight={'35px'} maxWidth={'35px'} small={true}/>*/}
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
          row.venue && row.venueFound && row.venueFound !== '-' && row.venue !== row.venueFound ?
            <React.Fragment>
              <i
                data-toggle="tooltip"
                data-placement="top"
                title="Este vehículo no fue encontrado en la sucursal esperada."
                className="fa fa-warning text-red pointer"
              /> {` `}
            </React.Fragment>
            : null
        }
        {
          row.patent && row.patent.length ?
            <React.Fragment>
              <CopyText value={row.patent}><strong>{row.patent}</strong></CopyText> <CopyText value={row.vin} className="text-muted text-sm">{row.vin}</CopyText>
            </React.Fragment>
            : <CopyText value={row.vin}><strong>{row.vin}</strong></CopyText>
        }<br/>
        <span className="text-muted text-sm">{cell} / {row.denomination}</span>
        <div className="visible-xs">
          {this.labelFormatter(cell, row)}
        </div>
      </React.Fragment>
    );
  }

  public selectedFormatter(cell: any, row: any) {
    return (
      <Checkbox
        active={cell}
        action={() => this.props.inventoryDetailChangeSelected(row._id)}
        classes="icheck-in-checkbox"
        style={{margin: '5px', marginTop: '5px'}}
      />
    );
  }

  public statusFormatter(cell: any, row: any) {
    return (
      <span
        className={`label ${this.classLabelStatus.hasOwnProperty(cell) ? this.classLabelStatus[cell] : ''}`}
        style={{
          padding: '5px 10px'
        }}
      >
        {this.statusText.hasOwnProperty(cell) ? this.statusText[cell] : cell}
        </span>
    );
  }

  public optionsFormatter(cell: any, row: any) {
    const {labels} = this.props.inventories;
    const {id} = this.props.match.params;
    const options = labels.filter((label) => {
      return label.affected.includes(row.status);
    });
    if (options.length) {
      return (
        <div className="btn-group btn-group-sm" style={{
          marginLeft: '5px'
        }}>
          <button type="button" className="btn btn-default">
            <i className="fa fa-fw fa-cogs"/> Opciones
          </button>
          <button type="button" className="btn btn-default dropdown-toggle" data-toggle="dropdown">
            <span className="caret"/>
            <span className="sr-only">Toggle Dropdown</span>
          </button>
          <ul className="dropdown-menu dropdown-menu-right" role="menu">
            {
              options.map((option) => {
                return (
                  <li key={option._id} onClick={() => {
                    this.props.actionSetLabel(id, row._id, row.carID, option);
                  }}>
                    <a href="javascript:void(0)">
                      <i className={`fa ${this.iconStatus[option.sendTo]}`} />{option.name}
                    </a>
                  </li>
                );
              })
            }
          </ul>
        </div>
      );
    }
    return null;
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

  public labelFormatter(cell: any, row: any) {
    if (row.label) {
      const {sendTo} = row.label;
      return (
        <span
          className={
            `label ${this.classLabelStatus.hasOwnProperty(sendTo) ? this.classLabelStatus[sendTo] : ''}`
          }
        >
          <i className={`fa fa-fw ${this.iconStatus[sendTo]}`} />
          {row.label.name} {row.label.requireCustomText ? <span
                data-toggle="tooltip"
                data-placement="top"
                title={row.labelText}>Ver más</span> : ''}
        </span>
      );
    } else {
      return null;
    }
  }

  public render(): React.ReactElement<IPropsType> {
    const {
      loadingDetail,
      summary,
      detail,
      carsTable,
      filter,
      selectedItems
    } = this.props.inventories;
    const { tab } = this.state;
    const selected = Object.keys(selectedItems);
    const {
      percentagePending,
      percentageFound,
      percentageLeftover,
      percentageReported,
      percentageMissing
    } = this.calculateDetails(summary.results);

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
                      className={tab === 'summary' ? 'background-transition' : ''}
                      style={{borderTop: '0', marginBottom: '0'}}
                      onClick={() => this.changeTab('summary')}
                    >Consolidado</a>
                  </li>
                  <li className={tab === 'detail' ? 'active' : ''}>
                    <a
                      className={tab === 'detail' ? 'background-transition' : ''}
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
                    <div className="col-md-4 col-lg-3">
                      <i className="fa fa-fw fa-user text-primary"/>
                      <strong>
                        {
                          !loadingDetail && summary && summary.createdBy ?
                            summary.createdBy.fullName
                            : '-'
                        }
                      </strong>

                    </div>
                    <div className="col-md-4 col-lg-3">
                      <i className="fa fa-fw fa-clock-o text-green"/>
                      <strong>{!loadingDetail && summary && summary.createdAt ? moment(summary.createdAt).format('LLL') : '-'}</strong>
                    </div>
                    <div className="col-md-4 col-lg-3">
                      <i className="fa fa-fw fa-clock-o text-red"/>
                      <strong>{!loadingDetail && summary && summary.finalizedAt ? moment(summary.finalizedAt).format('LLL') : '-'}</strong>
                    </div>
                    <div className="col-md-12 col-lg-3 text-right">
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
          {/*<Row>*/}
          <Row style={{display: tab === 'summary' ? 'block' : 'none'}}>
            <div className="col-md-4 col-lg-4 pointer" onClick={() => this.sendToDetailFilteredByState('found')}>
              <div className="info-box bg-green">
                <span className="info-box-icon"><i className="fa fa-check" /></span>
                <div className="info-box-content">
                  <span className="info-box-text">Encontrados</span>
                  <span className="info-box-number count">
                    {!loadingDetail && summary.results ? summary.results.found : <i className="fa fa-spinner fa-spin"/>}
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
            <div className="col-md-4 col-lg-4 pointer" onClick={() => this.sendToDetailFilteredByState('leftover')}>
              <div className="info-box bg-yellow">
                <span className="info-box-icon"><i className="fa fa-arrow-up" /></span>
                <div className="info-box-content">
                  <span className="info-box-text">Sobrantes</span>
                  <span className="info-box-number count">
                    {!loadingDetail && summary.results ? summary.results.leftover : <i className="fa fa-spinner fa-spin"/>}
                  </span>
                  <div className="progress">
                    <div className="progress-bar" style={{
                      width: `${!loadingDetail ? percentageLeftover : 0}%`,
                      transition: loadingDetail ? 'none' : 'width .6s ease'
                    }}/>
                  </div>
                  <span className="progress-description">
                    {!loadingDetail ? `${percentageLeftover.toFixed(1)}% sobrantes.` : null}
                  </span>
                </div>
              </div>
            </div>
            <div className="col-md-4 col-lg-4 pointer" onClick={() => this.sendToDetailFilteredByState('missing')}>
              <div className="info-box bg-red">
                <span className="info-box-icon"><i className="fa fa-arrow-down"/></span>
                <div className="info-box-content">
                  <span className="info-box-text">Faltantes</span>
                  <span className="info-box-number count">
                    {!loadingDetail && summary.results ? summary.results.missing : <i className="fa fa-spinner fa-spin"/>}
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
            <div className="col-md-6 col-lg-6 pointer" onClick={() => this.sendToDetailFilteredByState('pending')}>
              <div className="info-box bg-aqua">
                <span className="info-box-icon"><i className="fa fa-clock-o" /></span>
                <div className="info-box-content">
                  <span className="info-box-text">Pendientes</span>
                  <span className="info-box-number count">
                    {!loadingDetail && summary.results ? summary.results.pending : <i className="fa fa-spinner fa-spin"/>}
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
            <div className="col-md-6 col-lg-6 pointer" onClick={() => this.sendToDetailFilteredByState('reported')}>
              <div className="info-box bg-gray-dark">
                <span className="info-box-icon"><i className="fa fa-exclamation" /></span>
                <div className="info-box-content">
                  <span className="info-box-text">Reportados</span>
                  <span className="info-box-number count">
                    {!loadingDetail && summary.results ? summary.results.reported : <i className="fa fa-spinner fa-spin"/>}
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
                    Detalle de inventario {selected.length ? <small className="hidden-sm hidden-xs text-primary">{selected.length} {selected.length > 1 ? 'seleccionados' : 'seleccionado'}.</small> : <small>{carsTable.length}</small>}
                  </h3>
                  <div className="box-tools pull-right">
                    <button
                      className="btn btn-sm btn-primary hidden-xs hidden-sm"
                      onClick={() => this.xlsExport(['pending', 'found', 'leftover', 'missing', 'reported'])}
                    >
                      <i className="fa fa-fw fa-download"/> Exportar Excel
                    </button>
                    { /* <div className="btn-group btn-group-sm" style={{marginLeft: '5px'}}>
                      <button type="button" className="btn btn-success"><i className="fa fa-fw fa-cogs"/> Acciones</button>
                      <button type="button" className="btn btn-success dropdown-toggle" data-toggle="dropdown">
                        <span className="caret"/>
                        <span className="sr-only">Toggle Dropdown</span>
                      </button>
                      <ul className="dropdown-menu" role="menu">
                        <li><a href="javascript:void(0)"><i className="fa fa-fw fa-copy"/> Copiar</a></li>
                        <li><a href="javascript:void(0)"><i className="fa fa-fw fa-paste"/> Pegar</a></li>
                        <li><a href="javascript:void(0)"><i className="fa fa-fw fa-close"/> Eliminar</a></li>
                      </ul>
                    </div> */}
                  </div>
                </div>
                <div className="box-body no-padding" id="table-detail-inventory" style={{
                  display: loadingDetail ? 'none' : ''
                }}>
                  <Row style={{margin: '5px 0'}}>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="cars" className="control-label">Vehículos</label>
                        <input
                          type="text"
                          className="form-control"
                          id="cars"
                          placeholder="Busca por VIN, patente, marca o modelo."
                          // value={filter.text}
                          onChange={this.handleChangeSearchText}
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="form-group">
                        <label htmlFor="venues" className="control-label">Sucursales</label>
                        <BootstrapSelect
                          noneSelectedText="Todas"
                          displayItems={2}
                          selectedText="sucursales seleccionadas."
                          selected={filter.venues}
                          options={detail.venues.map((venue: any) => ({
                            value: venue._id,
                            text: venue.name
                          }))}
                          onClick={this.filterVenues}
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="form-group">
                        <label htmlFor="states" className="control-label">Estados</label>
                        <BootstrapSelect
                          noneSelectedText="Todos"
                          displayItems={4}
                          selectedText="estados seleccionados."
                          separator=" - "
                          options={Object
                            .keys(this.statusText)
                            .map((status) => ({
                              value: status,
                              text: this.statusText[status],
                              className: `label ${this.classLabelStatus[status]}`
                            }))}
                          selected={filter.states}
                          onClick={this.filterStatus}
                        />
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="form-group">
                        <label className="control-label hidden-xs">&nbsp;</label>
                        <button
                          className="btn btn-default btn-sm form-control"
                          onClick={this.clearFilter}
                          style={{paddingLeft: '5px'}}
                          disabled={
                            filter.states.length || filter.text.length || filter.venues.length ? false : true}
                        >
                          <i className="fa fa-fw fa-eraser"/> Limpiar
                        </button>
                      </div>
                    </div>
                  </Row>
                  <Row>
                    <div className="col-md-12">
                      {
                        !loadingDetail && carsTable.length ?
                          <BootstrapTable
                            keyField="_id"
                            data={carsTable}
                            columns={this.columns}
                            filter={filterFactory()}
                            pagination={paginationFactory(this.paginationOption)}
                            defaultSorted={this.defaultSorted}
                          /> : !loadingDetail ? <p className="text-center text-muted">
                            <ImageLazyLoad
                              url="/images/not_found.png"
                              height={'200px'}
                              style={{
                                opacity: 0.5,
                                maxHeight: '200px',
                                marginBottom: '10px'
                              }}
                              replaceLoading={<i
                                className={'fa fa-2x fa-circle-o-notch text-primary fa-spin'}
                                style={{padding: '30px'}}
                              /> }
                            /><br/>
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

  private filterVenues(value: any) {
    const {filter} = this.props.inventories;
    this.props.inventoryDetailChangeFilter({
      ...filter,
      venues: filter.venues.includes(value)
        ? filter.venues.filter((venue) => venue !== value)
        : [value, ...filter.venues]
    });
  }

  private filterStatus(value: any) {
    const {filter} = this.props.inventories;
    this.props.inventoryDetailChangeFilter({
      ...filter,
      states: filter.states.includes(value)
        ? filter.states.filter((state) => state !== value)
        : [value, ...filter.states]
    });
  }

  private sendToDetailFilteredByState(state: string) {
    this.props.inventoryDetailChangeFilter({
      text: '',
      venues: [],
      states: [state]
    });
    $('#cars').val('');
    this.changeTab('detail');
    setTimeout(() => {
      goToSection('#table-detail-inventory');
    }, 100);
  }

  private sendToDetailFilteredByVenue(venue: string) {
    this.props.inventoryDetailChangeFilter({
      text: '',
      venues: [venue],
      states: []
    });
    $('#cars').val('');
    this.changeTab('detail');
    setTimeout(() => {
      goToSection('#table-detail-inventory');
    }, 100);
  }

  private clearFilter() {
    this.props.inventoryDetailChangeFilter({
      venues: [],
      states: [],
      text: ''
    });
    $('#cars').val('');
  }

  private handleChangeSearchText(e: React.ChangeEvent<HTMLInputElement>) {
    e.preventDefault();
    const value = e.target.value.trim();
    const {filter} = this.props.inventories;
    this.props.inventoryDetailChangeFilterText({
      ...filter,
      text: value ? e.target.value : ''
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
    }, 200);
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
            ['Etiqueta']: car.label ? `${car.label.name}${car.label.requireCustomText ? `: ${car.labelText}` : ''}` : '-',
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
        bottom: 50,
        data: ['Encontrados', 'Sobrantes', 'Faltantes', 'Pendientes', 'Reportados']
      },
      xAxis: {
        type: 'category',
        data: venuesNames,
        axisLine: {
          lineStyle: {
            color: 'rgba(0, 0, 0, 0.5)'
          }
        },
        axisLabel: {
          rotate: 60
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
        bottom: 100,
        // left
        x: 0,
        // right
        x2: 10,
        containLabel: true
      },
      color: ['#00aa51', '#ff9600', '#f1392c', '#00c2f4', '#96a4b3'],
      series: [{
        data: venuesFound,
        name: 'Encontrados',
        type: 'bar',
        stack: 'cars',
        barMaxWidth: 100,
        label: {
          normal: {
            ...this.labelOption.normal
          }
        },
        barGap: 0
      }, {
        data: venuesLeftover,
        name: 'Sobrantes',
        type: 'bar',
        stack: 'cars',
        barMaxWidth: 100,
        label: {
          normal: {
            ...this.labelOption.normal

          }
        },
        barGap: 0
      }, {
        data: venuesMissing,
        name: 'Faltantes',
        type: 'bar',
        stack: 'cars',
        barMaxWidth: 100,
        label: {
          normal: {
            ...this.labelOption.normal
          }
        },
        barGap: 0
      }, {
        data: venuesPending,
        name: 'Pendientes',
        type: 'bar',
        stack: 'cars',
        barMaxWidth: 100,
        // barMinHeight: 20,
        label: {
          normal: {
            ...this.labelOption.normal
          }
        },
        barGap: 0
      }, {
        data: venuesReported,
        name: 'Reportados',
        type: 'bar',
        stack: 'cars',
        barMaxWidth: 100,
        label: {
          normal: {
            ...this.labelOption.normal
          }
        },
        barGap: 0
      }]
    };
    if (!update) {
      optionVenues.legend = {
        ...optionVenues,
        selected: {
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
      (this.venuesDetailChart as any).off();
      this.venuesDetailChart.on('click', (params: any) => {
        const venue = detailByVenue[params.dataIndex];
        this.sendToDetailFilteredByVenue(venue._id);
      });
    }
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
        data: brandNames,
        axisLine: {
          lineStyle: {
            color: 'rgba(0, 0, 0, 0.5)'
          }
        },
        axisLabel: {
          rotate: 90
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
      },
      color: ['#00aa51', '#ff9600', '#f1392c', '#00c2f4', '#96a4b3'],
      series: [{
        data: brandFound,
        name: 'Encontrados',
        type: 'bar',
        stack: 'cars',
        barMaxWidth: 100,
        barGap: 0
      }, {
        data: brandLeftover,
        name: 'Sobrantes',
        type: 'bar',
        stack: 'cars',
        barMaxWidth: 100,
        barGap: 0
      }, {
        data: brandMissing,
        name: 'Faltantes',
        type: 'bar',
        stack: 'cars',
        barMaxWidth: 100,
        barGap: 0
      }, {
        data: brandPending,
        name: 'Pendientes',
        type: 'bar',
        stack: 'cars',
        barMaxWidth: 100,
        barGap: 0
      }, {
        data: brandReported,
        name: 'Reportados',
        type: 'bar',
        stack: 'cars',
        barMaxWidth: 100,
        barGap: 0
      }]
    };
    if (!update) {
      optionBrands.legend = {
        ...optionBrands,
        selected: {
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
    inventoryDetailChangeSelected: (item: string) => dispatch(inventoryDetailChangeSelected(item)),
    getInventoryDetailAction: (id: string, update: boolean) => dispatch(getInventoryDetailAction(id, update)),
    inventoryDetailChangeFilter: (filter: { text: string; venues: string[]; states: string[]; }) => dispatch(inventoryDetailChangeFilter(filter)),
    inventoryDetailChangeFilterText: (filter: { text: string; venues: string[]; states: string[]; }) => dispatch(inventoryDetailChangeFilterText(filter)),
    actionSetLabel: (inventory: string, car: string, carID: string, label: IInventoryLabel) => dispatch(actionSetLabel(inventory, car, carID, label))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(InventoryDetailView);
