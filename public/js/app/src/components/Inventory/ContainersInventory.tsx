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

import DataTable from 'react-data-table-component';
import * as moment from "moment-timezone";
import {hasPermission} from "../../utils/common";
import {IWindow} from "../../interfaces/window";
import DateRangeInput from '../Utils/DateRangeInput';
import * as XLSX from 'xlsx-color';
import BootstrapSelect from '../Utils/BootstrapSelect';
import { IInventoryLabel } from '../../../../../../src/inventory/interfaces/inventoryLabel.interface';
import swal = require('sweetalert');
import { AxiosError, AxiosResponse } from 'axios';


declare let window: IWindow;

export type CarStatusType = Extract<keyof IInventorySetting, string>;

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
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
  endDate: Date;
  startDate: Date;
  isFilteringByDate: boolean;
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
      endDate: moment().toDate(),
      startDate: moment().toDate(),
      isFilteringByDate: false,
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
        name: 'F. Apertura',
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
        }
      },
      {
        name: 'Contenedor',
        selector: (row: any) => row.car.vin,
        sortable: true
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
        sortable: true
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

  private getDropDownLabels(row: { containerStatus: any; status: any; inventory: string; _id: string; car: { _id: string; }; labelText: {} | null | undefined; }) {

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

    return <div className="btn-group" style={{ padding: "8px" }}>
      <div className="dropdown" style={{ padding: "5px" }}>
        <button
          data-toggle="modal"
          data-target="#modalForAddLabel"
          className={`btn custom-dropdown-toggle dropdown-toggle 
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
          style={{
            minWidth: "120px",
            color: "white",
            borderRadius: "100px",
            border: "none",
            padding: "2px 35px 2px 15px",
            position: "relative",
            textAlign: "center",
            cursor: "pointer"
          }}>
          <span className="label-text">
            {getLabel(row)}
          </span>
          <i className="fa fa-plus" style={{
            position: "absolute",
            right: "15px",
            top: "50%",
            transform: "translateY(-50%)"
          }}></i>
        </button>
      </div>
      {
        (row.labelText && row.labelText !== '') ?
        <span style={{ paddingTop: "5px", paddingLeft:"5px" }}> <i className="fa fa-tag"></i> {row.labelText}</span> :
        ''
        }
    </div>
  }

  private setActionCallback(isUnit: boolean) {
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
              this.setActionCallback(isUnit);
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
          this.setActionCallback(isUnit);
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

  componentDidMount() {
    super.componentDidMount();
    const api: ApiService = new ApiService();
    this.startSocket();
    api.getSource()
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

    api.getInventories(1, true)
      .then(async (response: any) => {

        let inventories: IInventory[] = response.data.inventories;

        let promises = inventories.map((inventory: IInventory) => {
          return api.getInventory((inventory as any)._id)
        })

        let data = (await Promise.all(promises))
          .map((response: any) => {
            return response.data.detail.cars;
          }).flat();

        let containers = data.filter((car: any) => {
          if(car.car.isContainer) {
            car.status = foundStatusContainer(car);
            return true;
          }
          return false;
        });

        let clients = new Set();
        let cars = data.filter((car: any) => {
          return !car.car.isContainer;
        })
        cars.forEach((car: any) => {
          if (car.car.company && car.car.company.name){
            clients.add(car.car.company.name);
          }
        })



        containers = containers.map((container: any) => {
          container.content = cars.filter((car: any) => (car.containerFound || car.container) === container._id);
          container.filterStatus = container.containerStatus || container.status;
          container.pendingUnits = container.content.filter((car: any) => {
            return car.status === "pending";
          }).length > 0;
          if (container.status === ContainerStatus.EMPTY && container.pendingUnits) {
            container.filterStatus = `${ContainerStatus.EMPTY}(*)`;
          }
          return container;
        })

        containers = containers.map((container: any) => {
          // if evidenceStatus is not empty, get the last status open and empty
          if(container.evidenceStatus && container.evidenceStatus.length > 0) {
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
            return container;
        });

        let ships = Array.from(new Set(containers.map((container: any) => container.extra["Nave"]).filter((nave: any) => nave !== undefined)));
        let trips = Array.from(new Set(containers.map((container: any) => container.extra["N° Viaje"]).filter((viaje: any) => viaje !== undefined)));
        this.setState({
          containers: containers,
          originalContainers: containers,
          clientSelector: Array.from(clients),
          shipSelector: ships,
          tripSelector: trips,
          loading: false
        })

      })
      .catch((error: any) => {
        console.log(error);
      })
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
              // Metodo para modificar la data del contenedor
          return this.updateDataContainer(container, containerUpdated, data)
        }else{
          if (container._id !== containerUpdated.container) return container
            let contents = container.content.map((e:any) => {
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
    if(content.car.vin === containerUpdated.car.vin){
      let contentTemp = {...content}
      contentTemp.status = containerUpdated.status;
      contentTemp.images = containerUpdated.images;
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
      startDate: moment().toDate(),
      endDate: moment().toDate(),
      isFilteringByDate: false
    });
  }



  filterContainers() {
    let containers = this.state.originalContainers.filter((container: any) => {
      let bl = container.extra["N° BL"] ? container.extra["N° BL"].toLowerCase().includes(this.state.blFilter.toLowerCase()) : true;
      let containerFilter = container.car.vin.toLowerCase().includes(this.state.containerFilter.toLowerCase());
      let statusFilter = this.state.statusFilterSelected.length === 0 ? true : this.state.statusFilterSelected.includes(container.filterStatus);
      let shipFilter = this.state.shipFilter.length == 0 ? true : (container.extra["Nave"] ? container.extra["Nave"].toLowerCase().includes(this.state.shipFilter[0].toLowerCase()) : false);
      let tripFilter = this.state.tripFilter.length === 0 ? true  : (container.extra["N° Viaje"] ? container.extra["N° Viaje"].toLowerCase().includes(this.state.tripFilter[0].toLowerCase()) : false);

      let clientFilter = true;
      if (this.state.clientFilter !== '') {
        clientFilter = container.content.filter((car: any) => {
          if (car.car.company && car.car.company.name) {
            return car.car.company.name.toLowerCase() === this.state.clientFilter.toLowerCase();
          }
          return false;
        }).length > 0;
      }

      let dateFilter = true;
      if (this.state.isFilteringByDate) {
        if (container.openDate) {
          let openDate = new Date(container.openDate);
          let startDate = this.state.startDate? new Date(this.state.startDate) : null;
          let endDate = this.state.endDate ? new Date(this.state.endDate) : null;

          dateFilter = (!startDate || openDate >= startDate) && (!endDate || openDate <= endDate);
        } else {
          dateFilter = false;
        }
      }
      return bl && clientFilter && containerFilter && statusFilter && dateFilter && tripFilter && shipFilter;
    });

    this.setState({
      containers: containers
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

  ExpandedRowElement = ({ data }: { data: any }) => {

    const { unitLabels } = this.state;

    return <div className='table-responsive request-list'>
      <div className="row request-header bg-request-title ">
        <div className='col-sm-2 col-xs-2 col-md-2 col-lg-2 center'>
          Unidad
        </div>
        <div className='col-sm-2 col-xs-2 col-md-2 col-lg-2 center'>
          Fotos
        </div>
        <div className='col-sm-2 col-xs-2 col-md-2 col-lg-2center'>
          Color
        </div>
        <div className='col-sm-3 col-xs-3 col-md-3 col-lg-3 center'>
          Estado
        </div>
      </div>
      {data.content.map((car: any, index: number) => {
        let className = `${car.status}Class`;
        let classNameEfect = car.car.vin === this.state.containerUpdated?.car?.vin ? "highlight-info" : "";
        return (
          <div key={index} className={`row request background-transition ${classNameEfect}`}>
            <div className='col-sm-2 col-xs-2 col-md-2 col-lg-2 center'>
              <strong style={{ "textDecoration": "underline" }}>{car.car.vin}</strong>
            </div>
            <div className='col-sm-2 col-xs-2 col-md-2 col-lg-2 center'>
              {imagesFormatter(car)}
            </div>
            <div className='col-sm-2 col-xs-2 col-md-2 col-lg-2 center'>
              <strong className="text-black">{car.car.color}</strong>
            </div>
            <div className='col-sm-3 col-xs-3 col-md-3 col-lg-3 center' style={{
                display:"inline"
              }}>
          

              <div style={{
                display:"inline"
              }}>


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

                className={`label-units label-${inventorySettings.hasOwnProperty(className)
                    ? inventorySettings[className]
                    : ''
                  }`}

                style={{
                  padding: '5px 10px',
                  cursor: 'pointer'
                }}>
                {inventorySettings.hasOwnProperty(car.status)
                  ? inventorySettings[car.status]
                  : car.state}
                <i className="fa fa-plus" style={{
                  position: "relative",
                  left: "7.5%",
                  top: "50%",
                  transform: "translateY(-50%)"
                }}></i>
              </span>

              </div>
                {
                  (car.labelText && car.labelText !== '') ?
                   <div style={{
                    display:"inline"
                  }}><span style={{ paddingTop: "5px", paddingLeft:"5px"  }}> <i className="fa fa-tag"></i> {car.labelText}</span></div>:
                    ''
                }
              
            </div>
          </div>
        )
      })
      }
    </div>
  }


  render() : React.ReactElement<IPropsType> {
    const {containers, loading} = this.state;
    let statusCount = containers.reduce((acc: any, container: any) => {
      if (container  && container.containerStatus) {
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
          style={{color: `${color}`, fontWeight: "600"}}>
         {label}: {statusCount[status]}
       </span> </>
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

    return (
      <AppContainer title="Revisión Containers" cMenu="6" cSubMenu="6.1">
        <section className="content">
          <div className="box">
            <div className="box-header with-border flex flex-space-between">
              <h3 className="box-title">
                Revisión Containers <span className="font-12 font-bold"> <span style={{color:"gray", fontWeight: "600"}}>{containers.length}</span> {details.length>0 ? details : ''}</span>
              </h3>
              <div className="pull-right box-tools">
                {hasPermission(window.user, 'createInventory') ? (<>
                    < button
                      style={{marginRight: '10px'}}
                    className = 'btn btn-sm btn-primary'
                    onClick={this.downloadData}>
                    <i className='fa fa-fw fa-download'/> Descargar Excel
                    </button>

                    <button
                    className="btn btn-sm btn-success"
                    onClick={this.create}>
                      <i className="fa fa-plus"/> Cargar Anuncio
                    </button>
                  </>
                ) : null}
              </div>
            </div>
            {loading ?
              <div className="overlay">
                <i className="fa fa-refresh fa-spin"/>
              </div>
              : <>
                <div className="box-body">

                  <div className="row" style={{margin: "10px 0"}}>

                    <div className="col-md-3">
                      <div className="form-group">
                        <label className="text-black">¿Qué Bill of Lading (BL) buscas?</label>
                        <input
                          type="text"
                          className="form-control"
                          value={this.state.blFilter}
                          onChange={(e) => {
                            this.setState({ blFilter: e.target.value });
                          }}
                        />
                      </div>
                    </div>

                    <div className="col-md-3">
                      <div className="form-group">
                        <label className="text-black">¿Qué contenedor buscas?</label>
                        <input
                          type="text"
                          className="form-control"
                          value={this.state.containerFilter}
                          onChange={(e) => {
                            this.setState({ containerFilter: e.target.value });
                          }}
                        />
                      </div>
                    </div>

                    <div className="col-md-3">
                      <div className="form-group">
                        <label className="text-black">Cliente</label>
                        <select
                          className="form-control"
                          value={this.state.clientFilter}
                          onChange={(e) => {
                            this.setState({ clientFilter: e.target.value });
                          }}
                        >
                          <option value="">Todos</option>
                          {this.state.clientSelector
                            .sort((a: any, b: any) => a.localeCompare(b))
                            .map((client: any, index: number) => {
                            return <option key={index} value={client}>{client}</option>;
                          })
                          }
                        </select>
                      </div>
                    </div>


                    <div className="col-md-3">
                      <div className="form-group">
                        <label className="text-black" >Filtrar por Estado</label>
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
                  </div>

                  <div className="row" style={{margin: "10px 0"}}>

                  <div className="col-md-3">
                      <div className="form-group">
                        <label className="text-black">Nave</label>
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
                            this.setState({ shipFilter: new Array(selected)});
                          }}
                         /> 
                      </div>
                    </div>

                    <div className="col-md-3">
                      <div className="form-group">
                        <label className="text-black">Viaje</label>
                        <BootstrapSelect
                          noneSelectedText="Todos los viajes"
                          displayItems={2}
                          selectedText="Naves Seleccionadas."
                          selected={this.state.tripFilter}
                          autoClouse={true}
                          search={true}
                          options={this.state.tripSelector.map((trip: any) => ({
                            value: trip,
                            rend: (
                             <>
                               <strong>{trip.toUpperCase()}</strong>
                             </>
                           ),
                           text: `${trip.toUpperCase()}`
                         }))}
                          onClick={(selected: any) => {
                            this.setState({ tripFilter: new Array(selected)});
                          }}
                         /> 
                      </div>
                    </div>

                    <div className="col-md-3">
                      <div className="form-group">
                        <label className="text-black">Filtrar por Fecha de Apertura</label>
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
                      <div className='form-group'>
                        <div className="row pull-left box-tools" style={{ paddingTop: "26px", paddingLeft: "15px" }}>
                          <button
                            className="btn btn-sm btn-outline-default text-dark btn-block"
                            onClick={this.cleanFilters}
                            >
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
                          data={this.state.containers}
                          customStyles={dataTableStyle}
                          expandableRows
                          expandableRowsComponent={this.ExpandedRowElement}
                          expandOnRowClicked={true}
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

                  <div className="modal fade" id="modalForAddLabel" role="dialog" aria-labelledby="modalForAddLabel">
                    <div className="modal-dialog " role="document">
                      <div className="modal-content">
                        <div className="modal-header">
                          <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                          <h4 className="modal-title" id="modalForAddLabel">Cambiar estado asignando etiqueta</h4>
                        </div>
                        <div className="modal-body">
                          <ul className="list-group">
                            {
                              this.state.labels.map((option, index) => {
                                return (
                                  <li key={index} onClick={() => this.handleClick(index)}
                                    className={index === this.state.activeIndex ? 'list-group-item active' : 'list-group-item'}>
                                    <div className='row' >
                                      <div className='col-md-7 col-xs-7'>
                                        {option.name}
                                      </div>
                                      <div className='col-md-2 col-xs-2'>
                                        <i className="fa fa-arrow-right" />
                                      </div>
                                      <div className='col-md-3 col-xs-3'>
                                        <span
                                          style={{
                                            color: "white",
                                            borderRadius: "100px", padding: "4px"
                                          }}
                                          className={`label label-${inventorySettings[option.sendTo + `Class`]}`}
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
                          >Aplicar</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="modal fade" id="modalForAddLabelUnit" role="dialog" aria-labelledby="modalForAddLabelUnit">
                    <div className="modal-dialog " role="document">
                      <div className="modal-content">
                        <div className="modal-header">
                          <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                          <h4 className="modal-title" id="modalForAddLabelUnit">Cambiar estado asignando etiqueta</h4>
                        </div>
                        <div className="modal-body">
                          <ul className="list-group">
                            {
                              this.state.unitLabels.map((option, index) => {
                                return (
                                  <li key={index} onClick={() => this.handleUnitClick(index)}
                                    className={index === this.state.activeUnitIndex ? 'list-group-item active' : 'list-group-item'}>
                                    <div className='row' >
                                      <div className='col-md-7 col-xs-7'>
                                        {option.name}
                                      </div>
                                      <div className='col-md-2 col-xs-2'>
                                        <i className="fa fa-arrow-right" />
                                      </div>
                                      <div className='col-md-3 col-xs-3'>
                                        <span
                                          style={{
                                            color: "white",
                                            borderRadius: "100px", padding: "4px"
                                          }}
                                          className={`label label-${inventorySettings[option.sendTo + `Class`]}`}
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
                          >Aplicar</button>
                        </div>
                      </div>
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
)(ContainersInventory);

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
