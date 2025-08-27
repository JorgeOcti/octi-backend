import AppContainer from '../../container/AppContainer';
import TrackingBasePage from "../Utils/TrackingBasePage";
import {RouteComponentProps} from "react-router";
import {connect} from "react-redux";

import * as React from "react";
import ApiService from "../../utils/axios";
import {IInventory, IInventoryCar} from "../../../../../../src/inventory/interfaces/inventory.interface";
import { ContainerStatus } from "../../../../../../src/utils/enums/containerStatus.enum";
import { IInventorySetting } from '../../../../../../src/app/interfaces/teamSetting.interface';
import { io } from 'socket.io-client';
import { Socket } from 'socket.io-client/build/esm/socket';
import * as moment from "moment-timezone";
import {hasPermission} from "../../utils/common";
import {IWindow} from "../../interfaces/window";
import DateRangeInput from '../Utils/DateRangeInput';
import * as XLSX from 'xlsx-color';
import { IInventoryLabel } from '../../../../../../src/inventory/interfaces/inventoryLabel.interface';
import swal = require('sweetalert');
import { AxiosError, AxiosResponse } from 'axios';

import { Dispatch } from 'redux';
import {
  DashboardReduxAction,
  getParticipant,
  IDashboardState
} from '../../actions/dashboard.actions';
import ShowIf from '../Utils/ShowIf';
import ModalView from '../Modal/ModalView';
import { InventoryTable } from './TableDetailComponent';
import { Filters } from './FilterDetailComponent';
import DataTable from 'react-data-table-component';

declare let window: IWindow;

export type CarStatusType = Extract<keyof IInventorySetting, string>;

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
    dispatch: Dispatch<DashboardReduxAction>;
    getParticipant(id: string): void;
    dashboard: IDashboardState;
}

interface IStateType {
  error: Error | null;
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
  loadingTable: boolean;
  loadingSummary: boolean;
  filterHasDamage:boolean;
  endDate: Date;
  startDate: Date;
  isFilteringByDate: boolean;
  pagination: {
    page: number;
    pageSize: number;
    hasNext: boolean;
    filters?: any;
    sort?: string;
    sortDirection?: 'asc' | 'desc';
  },
  summary: any;
}

const dataTableStyle = {
  headRow: {
    style:{
      color: "white",
      backgroundColor: "#3279B7",
      whiteSpace: 'normal !important'
    }
  },
  headCells:{
    style: {
      '& > div': { // Selecciona el div directo dentro de la celda
        '& > div': {
          overflow: 'visible'
        },
        overflow: 'visible'
      }
    }
  },
  rows:{
    style:{
      backgroundColor: "#F5F5F5",
      border: "1px solid #DADADA",
      marginTop:"10px"
    }
  },
  cells: {
    style: {
      '& > div': { // Selecciona el div directo dentro de la celda
        whiteSpace: 'normal !important'
      }
    },
  },
  expanderCell: {
    style: {
      // this is to put expander button at the end of the row
      order: 1,
    }
  },
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
  if(container.evidenceStatus && container.evidenceStatus.length > 0) {
    const statusList = container.evidenceStatus.map((evidence: any) => evidence.status);
    if(statusList.includes(ContainerStatus.EMPTY)) {
      status = ContainerStatus.EMPTY;
    } else if(statusList.includes(ContainerStatus.CHECK)) {
      status = ContainerStatus.CHECK;
    } else if(statusList.includes(ContainerStatus.OPEN)) {
      status = ContainerStatus.OPEN;
    } else {
      status = container.status;
    }
  }
  return status;
}

const imagesFormatter = ( row: any) => {
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

const getDateRangeOptions = ():daterangepicker.Options => {
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

class ContainersInventory extends TrackingBasePage<IPropsType, IStateType> {

  title = "Revisión Containers";

  private socket: Socket;

  private timer: any | null = null;

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
      loading: true,
      loadingTable: true,
      loadingSummary: true,
      error: null,
      originalContainers: [],
      containers: [],
      labels: [],
      unitLabels:[],
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
      filterHasDamage:false,
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
      },
      summary: {total: 0, status: []},
      pagination: {
        page: 1,
        pageSize: 50,
        hasNext: false,
        filters: {},
        sort: 'createdAt',
        sortDirection: 'desc'
      }
    };

    this.downloadData = this.downloadData.bind(this);
    this.getFilterDate = this.getFilterDate.bind(this);

    this.columns = [
      {
        name: 'F. Apertura',
        id: 'openDate',
        selector: (row: any) => {
          return row.openDate ? formaDate(row.openDate) : 'Sin apertura';
        },
        sortable: true,
        sortFunction: (a: any, b: any) => {
          return moment(a.openDate).isAfter(b.openDate) ? 1 : -1;
        }
      },
      {
        name: 'F. Finalización',
        selector: (row: any) => {
          return row.emptyDate ? formaDate(row.emptyDate) : 'Sin finalizar';
        },
        sortable: true,
        sortFunction: (a: any, b: any) => {
          return moment(a.emptyDate).isAfter(b.emptyDate) ? 1 : -1;
        },
        id: 'emptyDate',
      },
      {
        name: 'Contenedor',
        selector: (row: any) => row.car.vin,
      },
      {
        name: 'BL',
        selector: (row: any) => row.extra["N° BL"],
      },
      {
        name: 'Puerto',
        selector: (row: any) => row.extra["Emplazamiento"],
      },
      {
        name: 'Nave',
        selector: (row: any) => row.extra["Nave"],
      },
      {
        name: 'Cliente',
        selector: (row: any) => {
              return row.extra["Cliente Razón Social"];
        },
        cell: (row: any) => {
          return <div>{row.extra["Cliente Razón Social"]}</div>
        }
      },
      {
        name: 'Viaje',
        selector: (row: any) => row.extra["N° Viaje"],
      },
      {
        name: 'Imágenes',
        cell: (row: any) => {
          if(row.evidenceStatus && row.evidenceStatus.length > 0) {
            row.images = row.evidenceStatus.map((evidence: any) => evidence.images).flat();
          }
          return imagesFormatter(row);
        }
      },
      {
        name: 'Ubicación',
        selector: (row: any) => {
              return row.venue.name;
        }
      },
      {
        name: 'Estado',
        selector: (row: any) => {
          return row.containerStatus || row.status;
        },
        cell: (row: any) => {
          return this.getDropDownLabels(row);
        },
        sortable: true,
        id: 'containerStatus'
      },
      {
        name: 'Tarja',
        selector: (row: any) => {
          return row.car.bl;
        },
        cell: (row: any) => {
          return row.containerStatus === ContainerStatus.EMPTY && <button className="btn btn-m btn-default" onClick={() => {
            window.open(`/api/inventory/${row.inventory}/container/tarja/${row.car._id}`, '_blank')
          }}>
          <i className="fa fa-fw fa-print" /> Tarja
        </button>
        }
      },
    ];

    this.fetchData = this.fetchData.bind(this);
    this.changePage = this.changePage.bind(this);
    this.changePageSize = this.changePageSize.bind(this);
    this.sortTable = this.sortTable.bind(this);
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

  private getDropDownLabels(row: { isContainer: boolean, containerStatus: any; status: any; inventory: string; _id: string; car: { _id: string; }; labelText: {} | null | undefined; }) {

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


    if (labels.length === 0) {
      return <span
        className={`label-container label-container-${inventorySettings.hasOwnProperty(className)
            ? inventorySettings[className]
            : ''
          }`}
        style={{
          padding: '5px 10px'
        }}>
        {getLabel(row)}
      </span>
    }

    return <div className="btn-group default-padding-8px">
      <div className="dropdown default-padding-5px">
        <button
          data-toggle="modal"
          data-target="#modalForAddLabel"
          className={`btn custom-dropdown-toggle dropdown-toggle btn-modal-add-label
          label-container-${inventorySettings.hasOwnProperty(className) ? inventorySettings[className] : ''}`}
          type="button"
          onClick={() => {
            this.setState({
              inventorySelected: row.inventory, //inventario
              carSelected: row._id, //inventory car
              cardIDSelected: row.car._id, // car
              labelSelected: labels[this.state.activeIndex] //label
            });
          }
          }
         >
          <span className="label-text">
            {getLabel(row)}
          </span>
          <i className="fa fa-plus"></i>
        </button>
      </div>
      {
        (row.labelText && row.labelText !== '') ?
        <span className='added-label'> <i className="fa fa-tag"></i> {row.labelText}</span> :
        ''
        }
    </div>
  }

  private setLabelCallback(isUnit: boolean) {
    setTimeout(() => {
      (swal as any).close();
      this.componentDidMount(); // reload data after set label
      if (isUnit) {
        $('#modalForAddLabelUnit').modal('close');
      } else {
        $('#modalForAddLabel').modal('close');
      }
    }, 1000);
  }

  private actionSetLabel(inventory: string, car: string, carID: string, label: IInventoryLabel, isUnit: boolean) {
    const api: ApiService = new ApiService();
    if (label.requireCustomText) {
      (swal as any)('Agregar datos adicionales:', {
        content: 'input'
      }).then((custom: string) => {
        if (custom && custom.trim().length) {
          api.setLabel({isUnit: isUnit, inventory, car, carID: carID, label: label._id, custom})
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
      api.setLabel({ isUnit, inventory, car, carID, label: label._id })
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

  public componentWillUnmount():void {
    // cancel request if component is inmounted
    this.socket.disconnect();
  }

  private changePage = (page: number) => {
    this.setState((prevState) => ({
      loadingTable: true,
      pagination: {
        ...prevState.pagination,
        page: page
      }
    }), () => {
      this.fetchData();
    });
  }

  private changePageSize = (pageSize: number) => {
    this.setState((prevState) => ({
      loadingTable: true,
      pagination: {
        ...prevState.pagination,
        pageSize: pageSize
      }
    }), () => {
      this.fetchData();
    });
  }

  private sortTable = (column: any, sortDirection: 'asc' | 'desc') => {
    this.setState((prevState) => ({
      loadingTable: true,
      pagination: {
        ...prevState.pagination,
        sort: column.id,
        sortDirection: sortDirection
      }
    }), () => {
      this.fetchData();
    });
  }

  private async fetchSummary() {
    const api: ApiService = new ApiService();
    api.getSource();
    try {
      let response = await api.getContainersInventorySummary({...this.state.pagination.filters,...this.getFilterDate()});

      if (response.data.data) {
        let status = response.data.data.resume;
        let ships = response.data.data.ships;
        let trips = response.data.data.trips;
        let total: number = status.reduce((acc: number, curr: any) => {
          acc += curr.count;
          return acc;
        }, 0);
        this.setState({
          shipSelector: this.state.shipSelector.length > 0 ? this.state.shipSelector : ships.map((ship: any) => ship._id.toString()),
          tripSelector: this.state.tripSelector.length > 0 ? this.state.tripSelector : trips.map((trip: any) => trip._id.toString()),
          summary: {
            total,
            status
          },
          loadingSummary: false,
        });
      }
    } catch (error) {
      console.error(error);
    }
  }

  private async fetchData() {
    const api: ApiService = new ApiService();
    api.getSource();
    try {
      let response = await api.getContainersInventory(
        this.state.pagination.page,
        this.state.pagination.pageSize,
        {...this.state.pagination.filters, ...this.getFilterDate()},
        this.state.pagination.sort,
        this.state.pagination.sortDirection);

      let containers = response.data.data;

      containers = containers.map((c: any) => {
        // if evidenceStatus is not empty, get the last status open and empty
        let container = { ...c };

        container.status = foundStatusContainer(container);

        container.filterStatus = container.containerStatus || container.status;
        container.pendingUnits = container.cars.filter((car: any) => {
          return car.status === "pending";
        }).length > 0;
        if (container.status === ContainerStatus.EMPTY && container.pendingUnits) {
          container.filterStatus = `${ContainerStatus.EMPTY}(*)`;
        }

        if (container.evidenceStatus && container.evidenceStatus.length > 0) {
          let openEvidences = container.evidenceStatus.filter((evidence: any) => evidence.status === ContainerStatus.OPEN);
          let emptyEvidences = container.evidenceStatus.filter((evidence: any) => evidence.status === ContainerStatus.EMPTY);
          if (openEvidences.length > 0) {
            //sort by date and get the last one
            container.openDate = openEvidences.sort((a: any, b: any) => {
              return moment(a.date).isAfter(b.date) ? -1 : 1;
            })[0].date;
          }

          if (emptyEvidences.length > 0) {
            //sort by date and get the last one
            container.emptyDate = emptyEvidences.sort((a: any, b: any) => {
              return moment(a.date).isAfter(b.date) ? -1 : 1;
            })[0].date;
          }
        }
        // Verifico si el contendedor tiene alguna unidad con daños
        container.hasDamage = container.cars?.some((e: any) => e.participant?.hasDamages === true);
        return container;
      });

      this.setState({
        containers: containers,
        originalContainers: containers,
        clientSelector: Array.from(window.user.company.clientCompanies),
        loadingTable: false,
        loading: false,
      })

    } catch (error) {
      console.log(error);
    }
  }



  componentDidMount() {
    super.componentDidMount();
    const api: ApiService = new ApiService();
    this.startSocket();
    api.getSource();
    api.getLabels(1)
      .then(async (response: any) => {
        const containerLabels = response.data.results.filter((label: { isForContainer: boolean; })=>label.isForContainer);
        const unitLabels = response.data.results.filter((label: { isForContainer: boolean; })=>!label.isForContainer);
        this.setState(
          {
            labels: containerLabels,
            unitLabels: unitLabels
          }
        )
      })
      .catch((error: any) => {
        console.log(error);
      }
      );
    this.fetchData();
    this.fetchSummary();
  }

  startSocket(){
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
  updateDataContainersRealTime(data:any){
    const containerUpdated = data.metadata.inventory;
      let containers = this.state.containers.map((container: any) => {
        if(containerUpdated.car.isContainer){
            if(data.isUnitNotification) {
              return this.updateUnitsContentContainer(container, containerUpdated, data)
            }
              // Metodo para modificar la data del contenedor
          return this.updateDataContainer(container, containerUpdated, data)
        }else{
          if (container._id !== containerUpdated.container) return container
            let contents = container.cars.map((e:any) => {
              // Metodo para modificar el array de contents del contenedor
              return this.updateContentContainer(e, containerUpdated, data)
            })
            container.cars = contents;
            return container
        }
      });
      this.setState({
        containers,
        originalContainers: containers,
        containerUpdated
      });
  }
  updateDataContainer(container:any, containerUpdated:any, data:any):any{
    let containerTemp = {...container}
    if (container.car.vin === containerUpdated.car.vin && container.inventory === containerUpdated.inventory){
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
  updateContentContainer(content:any, containerUpdated:any, data:any){
    if(content.car.vin === containerUpdated.car.vin  && content.inventory === containerUpdated.inventory){
      let contentTemp = {...content}
      contentTemp.status = containerUpdated.status;
      contentTemp.images = containerUpdated.images;
      this.showAlert(data);
      return contentTemp
    }
    return content
  }

  updateUnitsContentContainer(content:any, containerUpdated:any, data:any){
    if(content.car.vin === containerUpdated.car.vin  && content.inventory === containerUpdated.inventory){
      let contentTemp = {...content}
      contentTemp.units = containerUpdated.units;
      this.showAlert(data);
      return contentTemp
    }
    return content
  }

  showAlert(data:any){
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
    if (this.state.startDate !== prevState.startDate ||
      this.state.endDate !== prevState.endDate) {
        this.setState({
          loadingTable: true,
          loadingSummary: true,
          pagination: {
            ...this.state.pagination,
          }
        });
        this.fetchData();
        this.fetchSummary();
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
      filterHasDamage: false,
      loadingTable: true,
      loadingSummary: true,
      pagination: {
        ...this.state.pagination,
        filters: {},
      }
    }, () => {
      this.fetchData();
      this.fetchSummary();
    });
  }

  filterContainers() {

    let containersHasDamages = false;
    let containers = this.state.originalContainers.filter((container: any) => {
      let bl = container.extra["N° BL"] ? container.extra["N° BL"].toLowerCase().includes(this.state.blFilter.toLowerCase()) : true;
      let containerFilter = container.car.vin.toLowerCase().includes(this.state.containerFilter.toLowerCase());
      let statusFilter = this.state.statusFilterSelected.length === 0 ? true : this.state.statusFilterSelected.includes(container.filterStatus);
      let shipFilter = this.state.shipFilter.length == 0 ? true : (container.extra["Nave"] ? container.extra["Nave"].toString().toLowerCase().includes(this.state.shipFilter[0].toLowerCase()) : false);
      let tripFilter = this.state.tripFilter.length === 0 ? true  : (container.extra["N° Viaje"] ? container.extra["N° Viaje"].toString().toLowerCase().includes(this.state.tripFilter[0].toLowerCase()) : false);

      let clientFilter = true;
      if (this.state.clientFilter !== '') {
        clientFilter = container.cars.filter((car: any) => {
          if (car.car.company && car.car.company.name) {
            return car.car.company.name.toLowerCase() === this.state.clientFilter.toLowerCase();
          }
          return false;
        }).length > 0;
      }
      let damageFilter = true
      if(this.state.filterHasDamage){
        // Verificamos que content tiene daños
        damageFilter = container.content?.filter((e:any) => e.participant?.hasDamages).length === 0 ? false : true
        if(!damageFilter) containersHasDamages = true
      }
      let dateFilter = true;
      if (this.state.isFilteringByDate) {
        if (container.openDate) {
          let openDate = new Date(container.openDate);
          let startDate = this.state.startDate? new Date(this.state.startDate) : null;
          let endDate = this.state.endDate ? new Date(this.state.endDate) : null;

          dateFilter = ((!startDate || openDate >= startDate) && (!endDate || openDate <= endDate));
        } else {
          dateFilter = true;
        }
      }

      return bl && clientFilter && containerFilter && statusFilter && dateFilter && tripFilter && shipFilter && damageFilter;
    });
    if(containersHasDamages) {
      containers = containers.map((container) => {
        return {
          ...container,
          content: container.content.filter((car: any) => car.participant?.hasDamages)
        }
      })
    }
    this.setState({
      containers: containers
    });

  }

  addfilter = (filter: string, value: string) => {
    // Agrega un filtro al estado con debounce de 500ms
    clearTimeout(this.timer);

      this.setState({
        loadingTable: true,
        loadingSummary: true,
        pagination: {
          ...this.state.pagination,
          filters: {
            ...this.state.pagination.filters,
            [filter]: value
          }
        }
      }, () => {
        this.timer = setTimeout(() => {
        this.fetchData();
        this.fetchSummary();
        }, 500);
      });


  }

  create = () => {
    this.props.history.push('/inventory/container/create/');
  }

  private getFilterDate(): any {
    return {
      startDate: this.state.startDate ? moment(this.state.startDate).format('YYYY-MM-DD') : '',
      endDate: this.state.endDate ? moment(this.state.endDate).format('YYYY-MM-DD') : ''
    };
  }

  private downloadData(): void {
    const params = new URLSearchParams({
      ...this.state.pagination.filters,
      ...this.getFilterDate(),
    }).toString();
    window.open(`/api/inventory/container/export?${params}`, '_blank');

  }

  render() : React.ReactElement<IPropsType> {
    const {containers, loading, summary, pagination, loadingTable, loadingSummary} = this.state;
    const { getParticipant } = this.props;
    const {
      loadingParticipant
    } = this.props.dashboard;

    let details = summary.status.map((status: any) => {
      let className = `${status._id}Color`;
      let color = inventorySettings.hasOwnProperty(className) ? inventorySettings[className] : ''
      let label = inventorySettings.hasOwnProperty(status._id) ? inventorySettings[status._id] : ''
      return <React.Fragment key={status._id}> - <span
          key={status._id}
          style={{color: `${color}`, fontWeight: "600"}}>
         {label}: {status.count}
       </span> </React.Fragment>
    });

    const conditionalRowStyles = [
      {
        when: (row: any) => {
          const {containerUpdated} = this.state;
          if(containerUpdated?.car?.isContainer){
            return row.car.vin === containerUpdated.car?.vin && row.inventory === containerUpdated?.inventory
          }else{
            return row._id === containerUpdated.container && row.inventory === containerUpdated?.inventory
          }
        },
        classNames: ["highlight-info"],
      },
    ];

    const ExpandedRowElement = ({ data }: { data: any }) => {

      const { unitLabels } = this.state;

      const datum : any[] = [];
      const descriptions : any[] = [];
      if(data.extra["Cantidad"] && data.extra["Descripción"] && data.extra["Tipo Carga"]){
        descriptions.push({
          qty: data.extra["Cantidad"],
          description: `${data.extra["Tipo Carga"]} ${data.extra["Descripción"]}`,
        });
      }



      data.cars.forEach((car: any) => {
        datum.push({
          _id: car._id,
          vin: car.car.vin,
          description: car.car.brand + ' ' + car.car.denomination + ' ' + car.car.color,
          images: car.images,
          updatedAt: car.updatedAt,
          status: car.status,
          participant: car.participant
        });
        descriptions.push({
          vin: car.car.vin,
          description: car.car.brand + ' ' + car.car.denomination + ' ' + car.car.color,
        });
      });

      data.units.filter((unit: any) => unit.hasOwnProperty("description")).forEach((unit: any) => {
        datum.push({
          _id: unit.participant._id,
          vin: "-",
          description: unit.description || '',
          images: unit.images,
          updatedAt: unit.participant.createdAt,
          status: ContainerStatus.FOUND,
          participant: unit.participant
        });
      })

      return <div>
        <div className='table-responsive request-list'>
          <div className="row request-header bg-request-title ">
            <div className='col-sm-1 col-xs-1 col-md-1 col-lg-1 center'>
              Unidad
            </div>
            <div className='col-sm-3 col-xs-3 col-md-3 col-lg-3 center'>
              Descripción
            </div>
            <div className='col-sm-1 col-xs-1 col-md-1 col-lg-1 center'>
              Cantidad
            </div>
            <div className='col-sm-1 col-xs-1 col-md-1 col-lg-1 center'>
              Fotos
            </div>
            <div className='col-sm-1 col-xs-1 col-md-1 col-lg-1 center'>
              Fecha desconsolidado
            </div>
            <div className='col-sm-2 col-xs-2 col-md-2 col-lg-2 center'>
              Estado
            </div>
            <div className='col-sm-1 col-xs-1 col-md-1 col-lg-1 center'>
              Revisión
            </div>
          </div>
          {datum.map((car: any, index: number) => {
            let className = `${car.status}Class`;
            let classNameEfect = car.vin === this.state.containerUpdated?.car?.vin ? "highlight-info" : "";
            return (
              <div key={index} className={`row request background-transition ${classNameEfect}`}>
                <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1 center">
                  <strong style={{ 'textDecoration': 'underline' }}>{car.vin}</strong>
                </div>
                <div className="col-sm-3 col-xs-3 col-md-3 col-lg-3 center">
                  <strong className="text-black">{car.description}</strong>
                </div>
                <div className="col-sm-3 col-xs-3 col-md-3 col-lg-3 center">
                  <strong className="text-black">-</strong>
                </div>
                <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1 center">
                  {imagesFormatter(car)}
                </div>
                <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1 center">
                  <strong
                    className="text-black">{car.updatedAt && car.status === ContainerStatus.FOUND ? formaDate(car.updatedAt) : 'Sin registro'}</strong>
                </div>
                <div className="col-sm-2 col-xs-2 col-md-2 col-lg-2 center">
                  {
                    (unitLabels.length > 0) ?
                      <div className="col-sm-3 col-xs-3 col-md-3 col-lg-3 inline-element center">
                        <div className="inline-element">
                          <span
                            data-toggle="modal"
                            data-target="#modalForAddLabelUnit"

                            onClick={() => {
                              this.setState({
                                inventorySelected: car.inventory, //inventario
                                carSelected: car._id, //inventory car
                                cardIDSelected: car.car._id, // car
                                unitLabelSelected: unitLabels[this.state.activeUnitIndex] //label
                              });
                            }}

                            className={`label-units btn-add-unit-labels label-${inventorySettings.hasOwnProperty(className)
                              ? inventorySettings[className]
                              : ''
                            }`}>
                            {inventorySettings.hasOwnProperty(car.status)
                              ? inventorySettings[car.status]
                              : car.state}
                            <i className="fa fa-plus icon-add-label-units"></i>
                          </span>
                        </div>
                        {
                          (car.labelText && car.labelText !== '') ?
                            <div className="row">
                              <div className="col-xs-12 label-min-with-170">
                                <p className="text-center-xs label-m-top-16 text-left-sm">
                                  <i className="fa fa-tag" aria-hidden="true"></i> {car.labelText}
                                </p>
                              </div>
                            </div> : ''
                        }
                      </div>
                      :
                      <div className="col-sm-2 col-xs-2 col-md-2 col-lg-2 center">
                        <span
                          className={`label-units label-${inventorySettings.hasOwnProperty(className)
                            ? inventorySettings[className]
                            : ''
                          }`}
                          style={{
                            padding: '5px 10px'
                          }}>
                          {inventorySettings.hasOwnProperty(car.status)
                            ? inventorySettings[car.status]
                            : car.state}
                        </span>
                      </div>
                  }
                </div>
                <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1 center">
                  {car.participant ? <><ShowIf condition={car.participant?.hasDamages}>
                      <React.Fragment>
                        {' '}
                        <i
                          className="fa fa-warning text-red pointer"
                          data-toggle="tooltip"
                          data-placement="top"
                          title="Daños encontrados en esta revisión."
                          onClick={
                            () => getParticipant(car.participant._id)
                          }
                        />
                      </React.Fragment>
                    </ShowIf>
                      <ShowIf condition={!car.participant?.hasDamages}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={
                            () => getParticipant(car.participant._id)
                          }>
                          <ShowIf
                            condition={
                              !!(
                                loadingParticipant &&
                                loadingParticipant === car.participant._id
                              )
                            }
                            alternative={
                              <i className="fa fw fa-check-square-o" />
                            }>
                            <i className="fa fw fa-spin fa-spinner" />
                          </ShowIf>
                        </button>
                      </ShowIf>
                    </>
                    : <></>}

                </div>
              </div>);
                })}
                <div className='tally-description'>
                <div className="col-12 tally-description-header text-gray-dark">
                  Según el anuncio debe contener:
                </div>
                {descriptions.map((desc, index) => {
                  return (
              <div key={index} className={`row request background-transition text-gray-dark`}>
                <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1 center cell">
                  <span style={{ 'textDecoration': 'underline' }}>{desc.vin || "-"}</span>
                </div>
                <div className="col-sm-3 col-xs-3 col-md-3 col-lg-3 center cell">
                  {desc.description || '-'}
                </div>
                <div className="col-sm-3 col-xs-3 col-md-3 col-lg-3 center cell">
                  {desc.qty || '-'}
                </div>
                <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1 center cell">
                  -
                </div>
                 <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1 center cell">
                  -
                </div>
                <div className="col-sm-2 col-xs-2 col-md-2 col-lg-2 center cell">
                  -
                </div>
                <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1 center cell">
                  -
                </div>
              </div>);
                })}
            </div>
            </div>
      </div>
    }

          return (
          <AppContainer title={
          <div style={{width: '180px'}}>
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
    } cMenu="6" cSubMenu="6.1">
      <section className="content">
        <div className="box">
          <div className="box-header with-border flex flex-space-between">
            {loadingTable || loadingSummary ? <span>Cargando...</span> : <h3 className="box-title">
              Revisión contenedores <span className="font-12 font-bold"> <span style={{
              color: 'gray',
              fontWeight: '600'
            }}>{summary.total}</span> {summary.total > 0 ? details : ''}</span>
            </h3>}
            <div className="pull-right box-tools">
              {hasPermission(window.user, 'createInventory') ? (<>
                  < button
                    style={{ marginRight: '10px' }}
                    className="btn btn-sm btn-primary"
                    onClick={this.downloadData}>
                    <i className="fa fa-fw fa-download" /> Descargar Excel
                  </button>

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

                <Filters
                  blFilter={pagination.filters.blFilter || ''}
                  containerFilter={pagination.filters.containerFilter || ''}
                  clientFilter={pagination.filters.clientFilter || ''}
                  clientSelector={window.user.company.clientCompanies || []}
                  statusFilterSelected={pagination.filters.statusFilterSelected || []}
                  shipFilter={pagination.filters.shipFilter || []}
                  shipSelector={this.state.shipSelector}
                  tripFilter={pagination.filters.tripFilter || []}
                  tripSelector={this.state.tripSelector}
                  filterHasDamage={pagination.filters.filterHasDamage}
                  inventorySettings={inventorySettings}
                  statusText={this.statusText}
                  onFilterChange={(filter, value) => {
                    this.addfilter(filter, value);
                  }}
                  onCleanFilters={this.cleanFilters}
                />

                <div className="row">
                  <div className="col-md-12">
                    <DataTable
                      columns={this.columns}
                      data={containers}
                      customStyles={dataTableStyle}
                      expandableRows
                      expandableRowsComponent={ExpandedRowElement}
                      expandOnRowClicked={true}
                      pagination
                      conditionalRowStyles={conditionalRowStyles}
                      paginationComponentOptions={paginationComponentOptions}
                      progressPending={this.state.loadingTable}
                      sortServer
                      onSort={this.sortTable}
                      paginationServer
                      paginationRowsPerPageOptions={[pagination.pageSize, 100, 200]}
                      paginationTotalRows={summary.total}
                      progressComponent={<div className="text-center"><i className="fa fa-spinner fa-spin fa-3x" />
                      </div>}
                      onChangeRowsPerPage={this.changePageSize}
                      onChangePage={this.changePage}
                      noDataComponent={
                        <div className="text-center">
                          <h4>No hay datos</h4>
                        </div>
                      }
                    />
                  </div>
                </div>

                <div className="modal fade" id="modalForAddLabel" role="dialog" aria-labelledby="modalForAddLabel">
                  <div className="modal-dialog " role="document">
                    <div className="modal-content">
                      <div className="modal-header">
                        <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span
                          aria-hidden="true">&times;</span></button>
                          <h4 className="modal-title" id="modalForAddLabel">Cambiar estado asignando etiqueta</h4>
                        </div>
                        <div className="modal-body">
                          <ul className="list-group">
                            {
                              this.state.labels.map((option, index) => {
                                return (
                                  <li key={index} onClick={() => this.handleClick(index)}
                                      className={index === this.state.activeIndex ? 'list-group-item active' : 'list-group-item'}>
                                    <div className="row">
                                      <div className="col-md-7 col-xs-7">
                                        {option.name}
                                      </div>
                                      <div className="col-md-2 col-xs-2">
                                        <i className="fa fa-arrow-right" />
                                      </div>
                                      <div className="col-md-3 col-xs-3">
                                        <span
                                          className={`label label-${inventorySettings[option.sendTo + `Class`]} modal-unit-labels`}
                                        >
                                          {inventorySettings[option.sendTo]}
                                        </span>
                                      </div>
                                    </div>
                                  </li>
                                );
                              })}
                          </ul>
                        </div>
                        <div className="modal-footer">
                          <button type="button" className="btn btn-primary"
                                  onClick={() => {
                                    this.actionSetLabel(
                                      this.state.inventorySelected,
                                      this.state.carSelected,
                                      this.state.cardIDSelected,
                                      this.state.labelSelected,
                                      false
                                    );
                                  }}
                          >Aplicar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="modal fade" id="modalForAddLabelUnit" role="dialog"
                       aria-labelledby="modalForAddLabelUnit">
                    <div className="modal-dialog " role="document">
                      <div className="modal-content">
                        <div className="modal-header">
                          <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span
                            aria-hidden="true">&times;</span></button>
                          <h4 className="modal-title" id="modalForAddLabelUnit">Cambiar estado asignando etiqueta</h4>
                        </div>
                        <div className="modal-body">
                          <ul className="list-group">
                            {
                              this.state.unitLabels.map((option, index) => {
                                return (
                                  <li key={index} onClick={() => this.handleUnitClick(index)}
                                      className={index === this.state.activeUnitIndex ? 'list-group-item active' : 'list-group-item'}>
                                    <div className="row">
                                      <div className="col-md-7 col-xs-7">
                                        {option.name}
                                      </div>
                                      <div className="col-md-2 col-xs-2">
                                        <i className="fa fa-arrow-right" />
                                      </div>
                                      <div className="col-md-3 col-xs-3">
                                        <span
                                          className={`label label-${inventorySettings[option.sendTo + `Class`]} modal-unit-labels`}
                                        >
                                          {inventorySettings[option.sendTo]}
                                        </span>
                                      </div>
                                    </div>
                                  </li>
                                );
                              })}
                          </ul>
                        </div>
                        <div className="modal-footer">
                          <button type="button" className="btn btn-primary"
                                  onClick={() => {
                                    this.actionSetLabel(
                                      this.state.inventorySelected,
                                      this.state.carSelected,
                                      this.state.cardIDSelected,
                                      this.state.unitLabelSelected,
                                      true
                                    );
                                  }}
                          >Aplicar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            }
          </div>
          <ModalView />
        </section>
      </AppContainer>
    );
  }
}

const mapStateToProps = (state: { dashboard: IDashboardState }) => {
  return {
    dashboard: state.dashboard
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch,
    getParticipant: (id: string) => dispatch(getParticipant(id))
  };
};

export default connect<{}, {}, IPropsType>(
  mapStateToProps,
  mapDispatchToProps
)(ContainersInventory);

const inventorySettings: { [key: string]: any } = {
  'leftoverDifferentVenue': true,
  '_id': '5e68fb3e0f7cfc00245e4954',
  'pending': 'Pendiente',
  'pendingClass': 'aqua',
  "pendingClassContainer": "pending",
  "pendingColor": "#2DBDFD",
  "found": "Encontrados",
  "foundClass": "green",
  "foundColor": "#00aa51",

  "missing": "Faltantes",
  "missingClass": "red",
  "missingColor": "#f1392c",
  "missingClassContainer": "missing",

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
  "openClass": "orange",
  "openClassContainer": "open",
  "openColor": "#E08406",
  "report": {
    "atLeastOne": true,
    "primaryRequired": false,
    "secondaryRequired": false
  }
}
