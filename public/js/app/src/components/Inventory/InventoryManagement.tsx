import AppContainer from '../../container/AppContainer';
import TrackingBasePage from "../Utils/TrackingBasePage";
import { RouteComponentProps } from "react-router";
import { connect } from "react-redux";

import * as React from "react";
import ApiService from "../../utils/axios";
import { IInventory, IInventoryCar } from "../../../../../../src/inventory/interfaces/inventory.interface";
import { ContainerStatus } from "../../../../../../src/utils/enums/containerStatus.enum";
import { IInventorySetting } from '../../../../../../src/app/interfaces/teamSetting.interface';
import { io } from 'socket.io-client';
import { Socket } from 'socket.io-client/build/esm/socket';

import DataTable from 'react-data-table-component';
import * as moment from "moment-timezone";
import { hasPermission } from "../../utils/common";
import { IWindow } from "../../interfaces/window";
import DateRangeInput from '../Utils/DateRangeInput';
import * as XLSX from 'xlsx-color';
import BootstrapSelect from '../Utils/BootstrapSelect';
import { IInventoryLabel } from '../../../../../../src/inventory/interfaces/inventoryLabel.interface';
import swal = require('sweetalert');
import { AxiosError, AxiosResponse } from 'axios';
import s = require('mongoose-crate-s3');
import { Link } from 'react-router-dom';


declare let window: IWindow;

export type CarStatusType = Extract<keyof IInventorySetting, string>;

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
}

interface IStateType {
  error: Error | null;

  summaryInventory: any[];
  originalSummary: any[];

  containers: any[];
  labels: any[],
  unitLabels: any[],
  activeIndex: number,
  activeUnitIndex: number,
  inventorySelected: string,
  carSelected: string,
  cardIDSelected: string,
  labelSelected: any,
  unitLabelSelected: any,
  originalContainers: any[];
  blFilter: string;
  containerFilter: string;
  containerUpdated: any;
  clientFilter: string;
  clientSelector: any[];
  statusFilterSelected: string[],
  selectedContainer: number;
  shipFilter: string[];
  shipSelector: any[];
  tripSelector: any[];
  tripFilter: string[];
  inventorySettings: any;
  loading: boolean;
  endDate: Date;
  startDate: Date;
  isFilteringByDate: boolean;
}

const dataTableStyle = {
  headRow: {
    style: {
      display: 'none',
    }
  },
  rows: {
    style: {
      backgroundColor: "#ffffff",
      border: "1px solid #DADADA",
      marginTop: "10px",
      borderRadius: '5px',
      padding: '0px',
      marginBottom: "10px"
    }
  },
  cells: {
    style: {
      padding: '0px',
    },
  }
};

const paginationComponentOptions = {
  rowsPerPageText: 'Filas por página',
  rangeSeparatorText: 'de',
  selectAllRowsItem: true,
  selectAllRowsItemText: 'Todos',
};


const excelHeaders = [
  'F. Apertura',
  'F. Finalización',
  'Contenedor',
  "Carga",
  "Descripción carga",
  'BL',
  'Puerto',
  'Nave',
  'Cliente',
  'Viaje',
  'Estado',
];

const formaDate = (date: any) => {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(date)).replace(',', '');
}

const foundStatusContainer = (container: any) => {
  let status = container.status;
  if (container.evidenceStatus && container.evidenceStatus.length > 0) {
    const statusList = container.evidenceStatus.map((evidence: any) => evidence.status);
    if (statusList.includes(ContainerStatus.EMPTY)) {
      status = ContainerStatus.EMPTY;
    } else if (statusList.includes(ContainerStatus.CHECK)) {
      status = ContainerStatus.CHECK;
    } else if (statusList.includes(ContainerStatus.OPEN)) {
      status = ContainerStatus.OPEN;
    } else {
      status = container.status;
    }
  }
  return status;
}

const imagesFormatter = (row: any) => {
  if (row.images && row.images.length) {
    return (
      <div className="row">
        {row.images.map((image: any, index: number) => (
          <div
            key={image._id}
            className={'col-md-12 images-25 text-center'}
            style={{ display: index === 0 ? '' : 'none' }}>
            <a
              href={decodeURI(image.file.url)}
              data-toggle="lightbox"
              data-gallery={row._id}>
              <button className="btn btn-xs btn-default">
                <i className="fa fa-fw fa-image" /> {row.images.length}
              </button>
              {/*<ImageLazyLoad url={decodeURI(image.file.url)} height={'10px'} maxHeight={'35px'} maxWidth={'35px'} small={true}/>*/}
            </a>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

const getDateRangeOptions = (): daterangepicker.Options => {
  return {
    maxDate: moment().toDate(),
    locale: {
      format: 'DD/MM/YYYY',
      customRangeLabel: 'Período personalizado',
      applyLabel: 'Aplicar',
      cancelLabel: 'Cancelar'
    },
  };
}

class InventoryManagement extends TrackingBasePage<IPropsType, IStateType> {

  title = "Revisión Containers";

  private socket: Socket;
  private statusText: any = {
    'pending': 'Pendientes',
    'found': 'Encontrado',
    'open': 'Abierto',
    'check': 'Descarga',
    'empty': 'Vacío',
    'empty(*)': 'Vacío(*)',
  };
  private readonly columns: any[] = [];

  constructor(props: IPropsType) {
    super(props);
    this.state = {

      summaryInventory: [],
      originalSummary: [],


      originalContainers: [],
      containers: [],
      labels: [],
      unitLabels: [],

      loading: true,
      error: null,
      activeIndex: -1,
      activeUnitIndex: -1,
      inventorySelected: '',
      carSelected: '',
      cardIDSelected: '',
      labelSelected: null,
      unitLabelSelected: null,
      blFilter: '',
      containerFilter: '',
      containerUpdated: {},
      clientFilter: '',
      clientSelector: [],
      statusFilterSelected: [],
      shipFilter: [],
      shipSelector: [],
      tripSelector: [],
      tripFilter: [],
      selectedContainer: -1,
      endDate: moment().toDate(),
      startDate: moment().subtract(1, 'month').startOf('month').toDate(),
      isFilteringByDate: true,
      inventorySettings: {
        "leftoverDifferentVenue": true,
        "_id": "5e68fb3e0f7cfc00245e4954",
        "pending": "Pendientes",
        "pendingClass": "aqua",
        "pendingColor": "#00c2f4",
        "found": "Encontrados",
        "foundClass": "green",
        "foundColor": "#00aa51",
        "missing": "Faltantes",
        "missingClass": "red",
        "missingColor": "#f1392c",
        "leftover": "Encontrados*",
        "leftoverClass": "yellow",
        "leftoverColor": "#ff9600",
        "reported": "Reportados",
        "reportedClass": "gray-dark",
        "reportedColor": "#96a4b3",
        "report": {
          "atLeastOne": true,
          "primaryRequired": false,
          "secondaryRequired": false
        }
      }
    };

    this.downloadData = this.downloadData.bind(this);
    this.columns = [
      {
        name: 'data',
        cell: (row: any) => {
          style: { }
          return this.formatData(row);
        }
      }
    ];

  }

  handleClick = (index: any) => {
    this.setState({
      activeIndex: index,
      labelSelected: this.state.labels[index]
    });
  };

  handleUnitClick = (index: any) => {
    this.setState({
      activeUnitIndex: index,
      unitLabelSelected: this.state.unitLabels[index]
    });
  };



  private formatData(row: {
    unit: any;
    container: any;
    results: any;
    file: boolean;
    createdBy: any;
    createdAt: moment.MomentInput;
    finalizedAt: moment.MomentInput;
    finalizedBy: any;
    name: string; containerStatus: any; status: any; inventory: string; _id: string; car: { _id: string; }; labelText: {} | null | undefined;
  }) {

    const { labels } = this.state;
    const status = row.containerStatus || row.status
    let className = `${status}ClassContainer`;

    let getLabel = (container: any) => {
      const status = row.containerStatus || row.status
      let label = inventorySettings.hasOwnProperty(status) ?
        inventorySettings[status]
        : status
      if (status === ContainerStatus.EMPTY && container.pendingUnits) {
        label = `${label}(*)`
      }
      return label;
    }


    return <div className="container-fluid" style={{ width: '100%' }}>

      <div className="row" style={{ padding: '0px' }}>
        <div className="col-md-10">
          <h4 className='text-left text-primary pointer'>{row.name}</h4>
        </div>
        <div className="col-md-2">
          <div className='text-right' style={{ paddingTop: '12px' }}>
            {this.labelStatus(row.status)}
          </div>
        </div>
      </div>


      <div className="row" style={{ padding: '6px', background: '#ecf0f5' }}>
        <div className="col-md-3 text-left">
          <div className={'detail-info  text-muted'}>
            <i className="fa fa-fw fa-clock-o text-primary" />
            Creado el{' '}
            {moment(row.createdAt).format('LLL')}
          </div>
        </div>
        <div className="col-md-2 text-left">
          <div className={'detail-info  text-muted'}>
            {row.createdBy ? (
              <React.Fragment>
                <i className="fa fa-fw fa-user" />
                Por {row.createdBy.fullName?.toLocaleUpperCase()}
                <br />
              </React.Fragment>
            ) : null}
          </div>
        </div>

        <div className="col-md-3 text-left" style={{ marginLeft: '-21px' }}>
          <div className={'detail-info  text-muted'}>
            <i className="fa fa-fw fa-clock-o text-success" />
            {row.finalizedAt ? (
              <React.Fragment>
                Finalizado el{' '}
                {moment(row.finalizedAt).format(
                  'LLL'
                )}
              </React.Fragment>
            ) : ' - '}
          </div>
        </div>
      </div>

      <div className="row" style={{ padding: '5px', paddingTop: '10px' }}>

        <div className="col-md-5">

          <div className='row' style={{ paddingBottom: '10px' }}>
            <div className='col-md-12'>
              <i className="fa fa-container-red" />
              <strong>
                Contenedores
              </strong>
            </div>
          </div>

          <div className='row'>
            <div className='col-md-12 text-center'>

              <div className='row'>

                <div className='col-md-2'>
                  <strong className='text-primary h4'>
                    Pendientes
                  </strong>
                  <br />
                  <strong className='text-primary h2'>
                    {row.container.pending}
                  </strong>
                </div>

                <div className='col-md-2'>
                  <strong className='text-orange h4'>
                    Abierto
                  </strong>
                  <br />
                  <strong className='text-orange h2'>
                    {row.container.open}
                  </strong>
                </div>

                <div className='col-md-2'>
                  <strong className='text-yellow h4'>
                    Descarga
                  </strong>
                  <br />
                  <strong className='text-yellow h2'>
                    {row.container.check}
                  </strong>
                </div>

                <div className='col-md-2'>
                  <strong className='text-green h4'>
                    Vacios
                  </strong>
                  <br />
                  <strong className='text-green h2'>
                    {row.container.empty}
                  </strong>
                </div>

                <div className='col-md-2'>
                  <strong className='text-green h4'>
                    Vacios*
                  </strong>
                  <br />
                  <strong className='text-green h2'>
                    {row.container['empty(*)']}
                  </strong>
                </div>


              </div>
            </div>
          </div>
        </div>


        <div className="col-md-5" style={{ borderLeft: '2px solid rgba(204,204,204,.3019607843)' }}>

          <div className='row' style={{ paddingBottom: '10px', paddingLeft: '28px' }}>
            <div className='col-md-12'>
              <i className="fa fa-cube" style={{ marginRight: '3px' }} />
              <strong>
                Unidades
              </strong>
            </div>
          </div>

          <div className='row' >
            <div className='col-md-12'>

              <div className='row text-center'>

                <div className='col-md-3'>
                  <strong className='text-primary h4'>
                    Pendientes
                  </strong>
                  <br />
                  <strong className='text-primary h2'>
                    {row.unit.pending}
                  </strong>
                </div>
                <div className='col-md-3'>
                  <strong className='text-green h4'>
                    Encontrados
                  </strong>
                  <br />
                  <strong className='text-green h2'>
                    {row.unit.found}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className='row'>
            <div className="col-md-12 text-right">
              <div className="btn-group btn-group-sm">
                {row.status === 'inProcess' ? (
                  <button
                    type="button"
                    className="btn btn-default"
                    onClick={() => {

                    }
                    }>
                    <i className="fa fa-fw fa-area-chart" /> Ver
                    Progreso
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-default"
                    onClick={() => { }
                    }>
                    <i className="fa fa-fw fa-area-chart" /> Ver
                    Reporte
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-default dropdown-toggle"
                  data-toggle="dropdown">
                  <span className="caret" />
                  <span className="sr-only">Toggle Dropdown</span>
                </button>
                <ul
                  className="dropdown-menu pull-right"
                  role="menu">
                  <li>
                    <Link
                      to={`/inventory/${row._id}/detail/`}>
                      {/* <a href="javascript:void(0);" onClick={() => this.goToDetail(inventory._id, true)}> */}
                      <i className="fa fa-fw fa-table" />
                      Ver Detalle
                      {/* </a> */}
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  }
  finishInventoryAction(inventory: any): void {
    throw new Error('Method not implemented.');
  }
  deleteInventoryAction(inventory: any): void {
    throw new Error('Method not implemented.');
  }


  private labelStatus(option: string): React.ReactElement<IPropsType> {

    let spanClass = 'label label-default';
    let iconClass = 'fa fa-fw fa-circle';
    let statusName = ' Sin estado';

    if (option === 'finalized') {
      spanClass = 'label label-success';
      iconClass = 'fa fa-fw fa-check';
      statusName = ' Finalizado';
    } else if (option === 'inProcess') {
      spanClass = 'label label-primary';
      iconClass = 'fa fa-fw fa-spin fa-spinner';
      statusName = ' En progreso';
    } else {
      spanClass = 'label label-warning"';
      iconClass = 'fa fa-fw fa-spin fa-spinner';
      statusName = ' Creando inventario...';
    }


    return (
      <span className={`${spanClass} `} style={{ padding: '5px', borderRadius: '100px' }}>
        <i className={`${iconClass}`} /> {statusName}
      </span>
    );


  }

  private setLabelCallback(isUnit: boolean) {
    setTimeout(() => {
      (swal as any).close();
      this.componentDidMount(); // reload data after set label
      if (isUnit) {
        $('#modalForAddLabelUnit').modal('toggle');
      } else {
        $('#modalForAddLabel').modal('toggle');
      }
    }, 1000);
  }

  private actionSetLabel(inventory: string, car: string, cardID: string, label: IInventoryLabel, isUnit: boolean) {
    const api: ApiService = new ApiService();
    if (label.requireCustomText) {
      (swal as any)('Agregar datos adicionales:', {
        content: 'input'
      }).then((custom: string) => {
        if (custom && custom.trim().length) {
          api.setLabel(inventory, car, cardID, label._id, custom)
            .then((response: AxiosResponse) => {
              swal(response.data.message, {
                icon: 'success'
              });
              this.setLabelCallback(isUnit);
            }).catch((err: AxiosError) => {
              api.errorHandler(err);
            });
        } else {
          swal('Operación cancelada', {
            icon: 'error'
          });
        }
      });
    } else {
      api.setLabel(inventory, car, cardID, label._id)
        .then((response: AxiosResponse) => {
          swal(response.data.message, {
            icon: 'success'
          });
          this.setLabelCallback(isUnit);
        })
        .catch((err: AxiosError) => {
          api.errorHandler(err);
        });
    }
  }

  public componentWillUnmount(): void {
    // cancel request if component is inmounted
    this.socket.disconnect();
  }

  componentDidMount() {
    super.componentDidMount();
    const api: ApiService = new ApiService();
    this.startSocket();
    api.getSource()

    api.getInventories(1)
      .then(async (response: any) => {

        let inventories: IInventory[] = response.data.inventories;
        let filters = new Set();

        const summary = inventories.map(async (inventory: IInventory) => {

          const inventoryResponse = await api.getSummaryInventory((inventory as any)._id);
          const { metadata, summary } = inventoryResponse.data;
          const { containers, units , nave, client} = summary[`${inventory._id}`];

          metadata.filters.clients.forEach((cli: any)=>{
            filters.add(cli)
          })
          metadata.filters.ships.forEach((ship: any)=>{
            filters.add(ship)
          })

          return {
            name: inventory.name,
            createdAt: inventory.createdAt,
            createdBy: inventory.createdBy,
            finalizedAt: inventory.finalizedAt,
            container: containers,
            unit: units,
            nave: nave,
            client: client,
          };

        });

        const resolvedSummary =  await Promise.all(summary);

        this.setState({
          summaryInventory: resolvedSummary,
          originalSummary: resolvedSummary,
          shipSelector: [...await Promise.all(filters)],
          loading: false
        });


      })
      .catch((error: any) => {
        console.log(error);
      })

  }
  startSocket() {
    this.socket = io(`${location.protocol}//${location.host}`, {
      secure: location.protocol === 'https:',
      transports: ['websocket'],
      reconnection: true,
      query: {
        token: (window.user as any).token
      }
    });
    this.socket.on('connect', () => {
      this.socket.emit('join', {
        room: `dashboard-container-vin-view-${window.user.team._id}`
      });
    });
    this.socket.on('REFRESH', (data: any): void => {
      this.updateDataContainersRealTime(data);
    });

  }
  updateDataContainersRealTime(data: any) {
    const containerUpdated = data.metadata.inventory;
    let containers = this.state.containers.map((container: any) => {
      if (containerUpdated.car.isContainer) {
        // Metodo para modificar la data del contenedor
        return this.updateDataContainer(container, containerUpdated, data)
      } else {
        if (container._id !== containerUpdated.container) return container
        let contents = container.content.map((e: any) => {
          // Metodo para modificar el array de contents del contenedor
          return this.updateContentContainer(e, containerUpdated, data)
        })
        container.content = contents;
        return container
      }
    });
    this.setState({
      containers,
      originalContainers: containers,
      containerUpdated
    });
  }
  updateDataContainer(container: any, containerUpdated: any, data: any): any {
    let containerTemp = { ...container }
    if (container.car.vin === containerUpdated.car.vin && container.inventory === containerUpdated.inventory) {
      containerTemp.evidenceStatus = containerUpdated.evidenceStatus
      containerTemp.status = containerUpdated.status;
      containerTemp.containerStatus = containerUpdated.containerStatus;
      containerTemp.images = containerUpdated.images;
      let openEvidences = containerTemp.evidenceStatus.filter((evidence: any) => evidence.status === ContainerStatus.OPEN);
      if (openEvidences.length > 0) {
        //sort by date and get the last one
        containerTemp.openDate = openEvidences.sort((a: any, b: any) => {
          return moment(a.date).isAfter(b.date) ? -1 : 1;
        })[0].date;
      }
      this.showAlert(data)
      return containerTemp
    } else return container
  }
  updateContentContainer(content: any, containerUpdated: any, data: any) {
    if (content.car.vin === containerUpdated.car.vin) {
      let contentTemp = { ...content }
      contentTemp.status = containerUpdated.status;
      contentTemp.images = containerUpdated.images;
      this.showAlert(data);
      return contentTemp
    }
    return content
  }

  showAlert(data: any) {
    ($ as any).toast({
      heading: data.title,
      text: data.text,
      position: 'top-right',
      loaderBg: '#e2e2e2',
      icon: 'success',
      hideAfter: 5000,
      stack: 6,
      beforeShow: () => {
        const $toastEl = $('.jq-toast-heading');
        $toastEl.css({
          'fontSize': '13px',
          'padding-top': '2px',
          'padding-right': '2px'
        });
      },
    } as any);
  }

  componentDidUpdate(prevProps: Readonly<IPropsType>, prevState: Readonly<IStateType>, snapshot?: any) {
    if (this.state.blFilter !== prevState.blFilter ||
      this.state.containerFilter !== prevState.containerFilter ||
      this.state.clientFilter !== prevState.clientFilter ||
      this.state.statusFilterSelected !== prevState.statusFilterSelected ||
      this.state.isFilteringByDate !== prevState.isFilteringByDate ||
      this.state.startDate !== prevState.startDate ||
      this.state.endDate !== prevState.endDate ||
      this.state.shipFilter !== prevState.shipFilter ||
      this.state.tripFilter !== prevState.tripFilter) {
      this.filterContainers();
    }
  }

  cleanFilters = () => {
    this.setState({
      blFilter: '',
      containerFilter: '',
      clientFilter: '',
      shipFilter: [],
      tripFilter: [],
      statusFilterSelected: [],
      isFilteringByDate: false,
    });
  }



  filterContainers() {

    let summary = this.state.originalSummary.filter((summary: any) =>{

      const { nave, client } = summary;

      let shipFilter = this.state.shipFilter.length == 0 ? true : ( this.state.shipFilter.includes(nave) || this.state.shipFilter.includes(client) );

      console.log('summary ', summary, 'this.state.shipFilter', this.state.shipFilter, 'shipFilter ', shipFilter);

      let countStatusFilter = 0;

      this.state.statusFilterSelected.forEach((state)=>{
        const coountContainer = (summary.container[`${state}`]) !== undefined ? summary.container[`${state}`]: 0;
        const coountUnit = (summary.unit[`${state}`]) !== undefined ? summary.unit[`${state}`]: 0;
        if(coountContainer != undefined && coountUnit != undefined){
          countStatusFilter += (coountContainer + coountUnit);
        }
      });

      const statusFilter = this.state.statusFilterSelected.length === 0 ? true :  ( countStatusFilter > 0 );

      let dateFilter = true;
      if (this.state.isFilteringByDate) {
        if (summary.createdAt) {
          let openDate = new Date(summary.createdAt);
          let startDate = this.state.startDate ? new Date(this.state.startDate) : null;
          let endDate = this.state.endDate ? new Date(this.state.endDate) : null;


          dateFilter = ((!startDate || openDate >= startDate) && (!endDate || openDate <= endDate));
        } else {
          dateFilter = true;
        }
      }

      return shipFilter && statusFilter &&  dateFilter;
      
    });


    this.setState({
      summaryInventory: summary
    });

  }

  create = () => {
    this.props.history.push('/inventory/container/create/');
  }

  private downloadData(): void {
    const { containers } = this.state
    let rows = [
      [...excelHeaders]
    ];

    containers.map((container: any) => {
      container.content.map((car: any) => {
        let carRow = [
          container.openDate ? moment(container.openDate).format('DD/MM/YYYY HH:mm') : "",
          container.emptyDate ? moment(container.emptyDate).format('DD/MM/YYYY HH:mm') : "",
          container.car.vin,
          car.car.vin,
          `${car.car.brand ?? ""} ${car.car.model ?? ""}`,
          car.extra ? car.extra["N° BL"] ?? "" : "",
          car.extra ? car.extra["Emplazamiento"] ?? "" : "",
          car.extra ? car.extra["Nave"] ?? "" : "",
          car.extra ? car.extra["Cliente Razón Social"] ?? "" : "",
          car.extra ? car.extra["N° Viaje"] ?? "" : "",
          inventorySettings[car.containerStatus || car.status] ?? "",
        ]
        rows.push(carRow);
      })
    });

    /* make the worksheet */
    const ws = XLSX.utils.aoa_to_sheet(rows);

    /* add to workbook */
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resumen Contenedores');
    /* generate an XLSX file */
    XLSX.writeFile(wb, 'container_inventory.xlsx');
  }

  render(): React.ReactElement<IPropsType> {
    const { containers, loading } = this.state;
    let statusCount = containers.reduce((acc: any, container: any) => {
      if (container && container.containerStatus) {
        let key = container.containerStatus;
        if (acc[key]) {
          acc[key] += 1;
        } else {
          acc[key] = 1;
        }
      }
      return acc;
    }, {});

    let details = Object.keys(statusCount).map((status: any) => {
      let className = `${status}Color`;
      let color = inventorySettings.hasOwnProperty(className) ? inventorySettings[className] : ''
      let label = inventorySettings.hasOwnProperty(status) ? inventorySettings[status] : ''
      return <> - <span
        key={status}
        style={{ color: `${color}`, fontWeight: "600" }}>
        {label}: {statusCount[status]}
      </span> </>
    });

    const conditionalRowStyles = [
      {
        when: (row: any) => {
          const { containerUpdated } = this.state;

          if (containerUpdated?.car?.isContainer) {
            return row.car.vin === containerUpdated.car?.vin && row.inventory === containerUpdated?.inventory
          } else {
            return row._id === containerUpdated.container && row.inventory === containerUpdated?.inventory
          }
        },
        classNames: ["highlight-info"],
      },
    ];

    return (
      <AppContainer title="" cMenu="6" cSubMenu="6.1">
        <section className="content">
          <div className="box">
            <div className="box-header with-border flex flex-space-between">
              <h4 className="box-title">
                Gesti&oacute;n de Anuncios <span className="font-12 font-bold"> <span style={{ color: "gray", fontWeight: "600" }}>{containers.length}</span> {details.length > 0 ? details : ''}</span>
              </h4>
              <div className="pull-right box-tools">
                {hasPermission(window.user, 'createInventory') ? (<>
                  <button
                    className="btn btn-sm btn-success"
                    onClick={this.create}>
                    <i className="fa fa-plus" /> Cargar Anuncio
                  </button>
                </>
                ) : null}
              </div>
            </div>
            {loading ?
              <div className="overlay">
                <i className="fa fa-refresh fa-spin" />
              </div>
              : <>
                <div className="box-body">

                  <div className="row" style={{ marginTop: "10px" }}>

                    <div className="col-md-3">
                      <div className="form-group">
                        <label className="text-black">Filtrar por Cliente o Nave</label>
                        <BootstrapSelect
                          noneSelectedText="Todas las naves"
                          displayItems={2}
                          selectedText="Naves Seleccionadas."
                          selected={this.state.shipFilter}
                          autoClouse={true}
                          search={true}
                          allOption={false}
                          options={this.state.shipSelector.map((ship: any) => ({
                            value: ship,
                            rend: (
                              <>
                                <strong>{ship.toUpperCase()}</strong>
                              </>
                            ),
                            text: `${ship.toUpperCase()}`
                          }))}
                          onClick={(selected: any) => {
                            this.setState({ shipFilter: new Array(selected) });
                          }}
                        />
                      </div>
                    </div>


                    <div className="col-md-3">
                      <div className="form-group">
                        <label className="text-black">Filtrar por rango de fecha</label>
                        <DateRangeInput
                          options={getDateRangeOptions()}
                          onChange={(start: Date, end: Date) => {
                            this.setState({
                              startDate: start,
                              endDate: end,
                              isFilteringByDate: true
                            });
                          }}
                          startDate={this.state.startDate}
                          endDate={this.state.endDate}
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="form-group">
                        <label className="text-black">Estados</label>
                        <BootstrapSelect
                          noneSelectedText="Todos"
                          displayItems={4}
                          sm={true}
                          selectedText="estados seleccionados."
                          separator=" - "
                          options={Object.keys(this.statusText).map(
                            (status: CarStatusType) => ({
                              value: status,
                              text: inventorySettings[status],
                              className: `label label-${inventorySettings[
                                `${status}Class` as CarStatusType
                              ]
                                }`
                            })
                          )}
                          selected={this.state.statusFilterSelected}
                          onClick={(e: any) => {
                            const { statusFilterSelected } = this.state;
                            let filters = statusFilterSelected.includes(e)
                              ? statusFilterSelected.filter((state) => state !== e)
                              : [e, ...statusFilterSelected];
                            this.setState({ statusFilterSelected: filters });
                          }}
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className='form-group'>
                        <div className="row pull-left box-tools clean-filter-wrapper">
                          <button
                            className="btn btn-sm btn-outline-default text-dark btn-block"
                            onClick={this.cleanFilters}>
                            Limpiar filtros
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>


                  <div className="row">
                    <div className="col-md-12">
                      <DataTable

                        columns={this.columns}
                        data={this.state.summaryInventory}
                        customStyles={dataTableStyle}
                        // expandableRows
                        // expandableRowsComponent={this.ExpandedRowElement}
                        // expandOnRowClicked={true}
                        pagination
                        conditionalRowStyles={conditionalRowStyles}
                        paginationComponentOptions={paginationComponentOptions}
                        noDataComponent={
                          <div className="text-center">
                            <h4>No hay datos</h4>
                          </div>
                        }
                      />
                    </div>
                  </div>

                  

                  
                </div>
              </>
            }
          </div>
        </section>
      </AppContainer>
    );
  }
}

const mapStateToProps = (state: any) => {
  return {};
};

const mapDispatchToProps = (dispatch: any) => {
  return {};
};

export default connect<{}, {}, IPropsType>(
  mapStateToProps,
  mapDispatchToProps
)(InventoryManagement);

const inventorySettings: { [key: string]: any } = {
  "leftoverDifferentVenue": true,
  "_id": "5e68fb3e0f7cfc00245e4954",
  "pending": "Pendiente",
  "pendingClass": "aqua",
  "pendingClassContainer": "pending",
  "pendingColor": "#2DBDFD",
  "found": "Encontrados",
  "foundClass": "green",
  "foundColor": "#00aa51",
  "missing": "Faltantes",
  "missingClass": "red",
  "missingColor": "#f1392c",
  "leftover": "Encontrados*",
  "leftoverClass": "yellow",
  "leftoverColor": "#ff9600",
  "reported": "Reportados",
  "reportedClass": "gray-dark",
  "reportedColor": "#96a4b3",
  "empty": "Vacío",
  "emptyClass": "green",
  "emptyClassContainer": "empty",
  "emptyColor": "#00AA51",
  "empty(*)": "Vacío(*)",
  "empty(*)Class": "green",
  "empty(*)ClassContainer": "empty(*)",
  "empty(*)Color": "#00AA51",
  "check": "Descarga",
  "checkColor": "#C1BB21",
  "checkClass": "yellow",
  "checkClassContainer": "check",
  "open": "Abierto",
  "openClass": "gray-dark",
  "openClassContainer": "open",
  "openColor": "#E08406",
  "report": {
    "atLeastOne": true,
    "primaryRequired": false,
    "secondaryRequired": false
  }
}
