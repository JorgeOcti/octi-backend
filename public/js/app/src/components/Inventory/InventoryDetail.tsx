import { RouteComponentProps } from "react-router";
import TrackingBasePage from "../Utils/TrackingBasePage";
import { connect } from "react-redux";
import { getParticipant, IDashboardState } from "../../actions/dashboard.actions";
import { ContainerStatus } from "../../../../../../src/utils/enums/containerStatus.enum";
import React = require("react");
import moment = require("moment");
import AppContainer from "../../container/AppContainer";
import { hasPermission } from "../../utils/common";
import { Filters } from "./FilterDetailComponent";
import { InventoryTable } from "./TableDetailComponent";
import ModalView from "../Modal/ModalView";
import { IWindow } from "../../interfaces/window";
import * as XLSX from 'xlsx-color';
import ShowIf from "../Utils/ShowIf";
import swal = require("sweetalert");
import ApiService from "../../utils/axios";
import { AxiosError, AxiosResponse } from "axios";
import { IInventoryLabel } from "../../../../../../src/inventory/interfaces/inventoryLabel.interface";
import { IInventory } from "../../../../../../src/inventory/interfaces/inventory.interface";
import { FilterSummryDetail } from "./FilterSummaryDetailComponent";

declare let window: IWindow;

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dashboard: IDashboardState;
}

interface IStateType {
  summary: any;
  inventory: IInventory | null,
  inventoryName: string,
  totalUnits: number,
  totalContainers: number,
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
  unitFilter: string;
  selectedContainer: number;
  shipFilter: string[];
  shipSelector: any[];
  tripSelector: any[];
  tripFilter: string[];
  inventorySettings: any;
  loading: boolean;
  filterHasDamage: boolean;
  endDate: Date;
  startDate: Date;
  isFilteringByDate: boolean;
}

const dataTableStyle = {
  headRow: {
    style: {
      color: "white",
      backgroundColor: "#3279B7",
      whiteSpace: 'normal !important'
    }
  },
  headCells: {
    style: {
      '& > div': { // Selecciona el div directo dentro de la celda
        '& > div': {
          overflow: 'visible'
        },
        overflow: 'visible'
      }
    }
  },
  rows: {
    style: {
      backgroundColor: "#F5F5F5",
      border: "1px solid #DADADA",
      marginTop: "10px"
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

const paginationComponentOptions = {
  rowsPerPageText: 'Filas por página',
  rangeSeparatorText: 'de',
  selectAllRowsItem: true,
  selectAllRowsItemText: 'Todos',
};


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


class InventoryDetail extends TrackingBasePage<IPropsType, IStateType> {

  title: string;

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
      unitFilter: '',
      summary: null,
      inventory: null,
      inventoryName: '',
      totalContainers: 0,
      totalUnits: 0,
      loading: true,
      error: null,
      originalContainers: [],
      containers: [],
      labels: [],
      unitLabels: [],
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
      filterHasDamage: false,
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
    }
    const { loadingParticipant } = this.props.dashboard;
    this.title = "Inventory Detail";
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
        name: 'Daños',
        selector: (row: any) => {
          {
            row.participant ? <><ShowIf condition={row.participant?.hasDamages}>
              <React.Fragment>
                {' '}
                <i
                  className="fa fa-warning text-red pointer"
                  data-toggle="tooltip"
                  data-placement="top"
                  title="Daños encontrados en esta revisión."
                  onClick={
                    () => getParticipant(row.participant._id)
                  }
                />
              </React.Fragment>
            </ShowIf>
              <ShowIf condition={!row.participant?.hasDamages}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={
                    () => getParticipant(row.participant._id)
                  }>
                  <ShowIf
                    condition={
                      !!(
                        loadingParticipant &&
                        loadingParticipant === row.participant._id
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
            : <></>
          }
        },
      },
      {
        name: 'Imágenes',
        cell: (row: any) => {
          if (row.evidenceStatus && row.evidenceStatus.length > 0) {
            row.images = row.evidenceStatus.map((evidence: any) => evidence.images).flat();
          }
          return imagesFormatter(row);
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


  private handleClick = (index: any) => {
    this.setState({
      activeIndex: index,
      labelSelected: this.state.labels[index]
    });
  };

  private handleUnitClick = (index: any) => {
    this.setState({
      activeUnitIndex: index,
      unitLabelSelected: this.state.unitLabels[index]
    });

  };

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
          api.setLabel({ isUnit: isUnit, inventory, car, carID: carID, label: label._id, custom })
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

  create = () => {
    this.props.history.push('/inventory/container/create/');
  }


  componentDidUpdate(prevProps: Readonly<IPropsType>, prevState: Readonly<IStateType>, snapshot?: any) {
    if (this.state.containerFilter !== prevState.containerFilter ||
      this.state.statusFilterSelected !== prevState.statusFilterSelected ||
      this.state.filterHasDamage !== prevState.filterHasDamage ||
      this.state.unitFilter !== prevState.unitFilter ) {
      this.filterContainers();
    }
  }

  filterContainers() {

    let containersHasDamages = false;
    let containers = this.state.originalContainers.filter((container: any) => {

      let containerFilter = container.car.vin.toLowerCase().includes(this.state.containerFilter.toLowerCase());
      let statusFilter = this.state.statusFilterSelected.length === 0 ? true : this.state.statusFilterSelected.includes(container.filterStatus);
      let damageFilter = true
      if (this.state.filterHasDamage) {
        // Verificamos que content tiene daños
        damageFilter = container.content?.filter((e: any) => e.participant?.hasDamages).length === 0 ? false : true
        if (!damageFilter) containersHasDamages = true
      }
      return  containerFilter && statusFilter && damageFilter;
    });


    if (this.state.unitFilter !== '') {
      containers = containers.map((container: any) => {
        return {
          ...container,
          content: container.content.filter((car: any) => car.car.vin.toLowerCase().includes(this.state.unitFilter.toLowerCase()))
        }
      });
    }


    if (containersHasDamages) {
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

  cleanFilters = () => {
    this.setState({
      unitFilter: '',
      containerFilter: '',
      statusFilterSelected: [],
      filterHasDamage: false,
    });
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
      <span className={`${spanClass} label-status-badge`} >
        <i className={`${iconClass}`} /> {statusName}
      </span>
    );


  }

  componentDidMount() {

    const params: any = this.props.match.params;
    super.componentDidMount();
    const api: ApiService = new ApiService();
    // this.startSocket();
    api.getSource()
    api.getSummaryInventory(params['id']).then(async (response: any) => {

      const { metadata, summary } = response.data;
      const { containers, units, nave, client } = summary[`${params['id']}`];
      const { pending, found, hasDamages } = units;
      const { pending: pendingContainers, found: foundContainers, open, check, empty, "empty(*)": emptyStar } = containers;

      let totalUnits = pending + found + hasDamages;
      let totalContainers = pendingContainers + foundContainers + open + check + empty + containers["empty(*)"];

      this.setState({
        summary: summary[`${params['id']}`],
        totalContainers: totalContainers,
        totalUnits: totalUnits,
      });

    });

    api.getLabels(1)
      .then(async (response: any) => {
        const containerLabels = response.data.results.filter((label: { isForContainer: boolean; }) => label.isForContainer);
        const unitLabels = response.data.results.filter((label: { isForContainer: boolean; }) => !label.isForContainer);
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

    api.getInventories(1, true, 50)
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
          if (car.car.isContainer) {
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
          if (car.car.company && car.car.company.name) {
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
          container.hasDamage = container.content?.some((e: any) => e.participant?.hasDamages === true);
          return container;
        });
        let ships = Array.from(new Set(containers.map((container: any) => container.extra["Nave"]).filter((nave: any) => nave !== undefined).map((nave: any) => nave.toString())));
        let trips = Array.from(new Set(containers.map((container: any) => container.extra["N° Viaje"]).filter((viaje: any) => viaje !== undefined).map((viaje: any) => viaje.toString())));


        this.setState({
          inventoryName: inventories[0].name,
          inventory: inventories[0],
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


  render() {


    const { containers, loading, summary, totalContainers, totalUnits } = this.state;
    const { loadingParticipant } = this.props.dashboard;

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

    const ExpandedRowElement = ({ data }: { data: any }) => {

      const { unitLabels } = this.state;

      return <div className='table-responsive request-list'>
        <div className="row request-header bg-request-title ">
          <div className='col-sm-1 col-xs-1 col-md-1 col-lg-1 center'>
            Unidad
          </div>
          <div className='col-sm-1 col-xs-1 col-md-1 col-lg-1 center'>
            Denominacion
          </div>
          <div className='col-sm-1 col-xs-1 col-md-1 col-lg-1 center'>
            Daños
          </div>
          <div className='col-sm-1 col-xs-1 col-md-1 col-lg-1 center'>
            Revisado por
          </div>
          <div className='col-sm-1 col-xs-1 col-md-1 col-lg-1 center'>
            Hora Revisión
          </div>
          <div className='col-sm-2 col-xs-2 col-md-2 col-lg-2 center'>
            Imagenes
          </div>
          <div className='col-sm-1 col-xs-1 col-md-1 col-lg-1 center'>
            Estado
          </div>
          <div className='col-sm-1 col-xs-1 col-md-1 col-lg-1 center'>
            Tarja
          </div>
        </div>
        {data.content.map((car: any, index: number) => {
          let className = `${car.status}Class`;
          let classNameEfect = car.car.vin === this.state.containerUpdated?.car?.vin ? "highlight-info" : "";
          return (
            <div key={index} className={`row request background-transition ${classNameEfect}`}>
              <div className='col-sm-1 col-xs-1 col-md-1 col-lg-1 center'>
                <strong style={{ "textDecoration": "underline" }}>{car.car.vin}</strong>
              </div>
              <div className='col-sm-1 col-xs-1 col-md-1 col-lg-1 center'>
                <strong className="text-black">{car.extra["Modelo"]}</strong>
              </div>
              <div className='col-sm-1 col-xs-1 col-md-1 col-lg-1 center'>
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
              <div className='col-sm-1 col-xs-1 col-md-1 col-lg-1 center'>

              </div>
              <div className='col-sm-1 col-xs-1 col-md-1 col-lg-1 center'>
                <strong className="text-black">{car.updatedAt && car.status === ContainerStatus.FOUND ? formaDate(car.updatedAt) : 'Sin registro'}</strong>
              </div>
              <div className='col-sm-2 col-xs-2 col-md-2 col-lg-2 center'>
                {imagesFormatter(car)}
              </div>
              <div className='col-sm-1 col-xs-1 col-md-1 col-lg-1 center'>
                {
                  (unitLabels.length > 0) ?
                    <div className='col-sm-3 col-xs-3 col-md-3 col-lg-3 inline-element center'>
                      <div className='inline-element'>
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
                          <div className='row'>
                            <div className='col-xs-12 label-min-with-170'>
                              <p className='text-center-xs label-m-top-16 text-left-sm'>
                                <i className='fa fa-tag' aria-hidden='true'></i> {car.labelText}
                              </p>
                            </div>
                          </div> : ''
                      }
                    </div>
                    :
                    <div className='col-sm-2 col-xs-2 col-md-2 col-lg-2 center'>
                      <span
                        className={`label-units label-${inventorySettings.hasOwnProperty(className)
                          ? inventorySettings[className]
                          : ''
                          }`}
                        style={{
                          padding: '5px 10px',
                        }}>
                        {inventorySettings.hasOwnProperty(car.status)
                          ? inventorySettings[car.status]
                          : car.state}
                      </span>
                    </div>
                }




              </div>
              <div className='col-sm-1 col-xs-1 col-md-1 col-lg-1 center'>
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
            </div>
          )
        })
        }
      </div>
    }


    let percentagePending = '';
    let percentageFound = '';
    let percentageHasDamages = '';


    let percentageContainerPending = '';
    let percentageContainerOpen = '';
    let percentageContainerCheck = '';
    let percentageContainerEmpty = '';
    let percentageContainerEmptyStar = '';

    if (!loading) {

      const { units, containers } = summary;
      const { pending, found, hasDamages } = units;
      const { pending: pendingContainers, found: foundContainers, open, check, empty, "empty(*)": emptyStar } = containers;

      percentagePending = totalUnits > 0 ? `${Math.round((pending / totalUnits) * 100)}%` : '0%';
      percentageFound = totalUnits > 0 ? `${Math.round((found / totalUnits) * 100)}%` : '0%'
      percentageHasDamages = totalUnits > 0 ? `${Math.round((hasDamages / totalUnits) * 100)}%` : '0%'

      percentageContainerPending = totalContainers > 0 ? `${Math.round((pendingContainers / totalContainers) * 100)}%` : '0%';
      percentageContainerOpen = totalContainers > 0 ? `${Math.round((open / totalContainers) * 100)}%` : '0%'
      percentageContainerCheck = totalContainers > 0 ? `${Math.round((check / totalContainers) * 100)}%` : '0%'
      percentageContainerEmpty = totalContainers > 0 ? `${Math.round((empty / totalContainers) * 100)}%` : '0%'
      percentageContainerEmptyStar = totalContainers > 0 ? `${Math.round((emptyStar / totalContainers) * 100)}%` : '0%'

    }


    return (
      <AppContainer title={
        <div style={{}}>
          <h1 className="page-header">
            {this.state.inventoryName}
          </h1>
        </div>
      } cMenu="6" cSubMenu="6.1">

        <section className="content">
          <div className="box" style={{ padding: '5px', fontSize: '12px' }}>
            <div className="box-header  flex flex-space-between">
              <div className="col-xs-12 col-sm-12 col-md-2 col-lg-2 text-primary">
                <i className="fa fa-fw fa-user" />
                <strong> {this.state.inventory?.createdBy.fullName}</strong>
              </div>
              <div className="col-xs-12 col-sm-12 col-md-2 col-lg-2">
                <i className="fa fa-fw fa-clock-o" />
                <strong> {moment(this.state.inventory?.createdAt).format('LLL')}</strong>
              </div>
              <div className="col-xs-12 col-sm-12 col-md-2 col-lg-2 text-success">
                <i className="fa fa-fw fa-clock-o" />
                <strong> {(this.state.inventory?.finalizedAt) ? moment(this.state.inventory?.finalizedAt).format('LLL') : ' - '}</strong>
              </div>
              <div className="col-xs-12 col-sm-12 col-md-2 col-lg-2">
                <i className="fa fa-fw fa-map-marker" />
                <strong> {this.state.summary?.location}</strong>
              </div>
              <div className="col-xs-12 col-sm-12 col-md-2 col-lg-2">
                <small>viaje</small>
                <strong> {this.state.summary?.trip}</strong>
              </div>
              <div className="col-xs-12 col-sm-12 col-md-2 col-lg-2 text-right">
                {this.labelStatus(this.state.inventory?.status || '')}
              </div>
            </div>
          </div>

          <div className="box" style={{ padding: '5px', paddingBottom: '15px', fontSize: '12px' }}>
            <div className="box-header flex-space-between">
              <div className="row" style={{ minWidth: '100%' }}>
                <div className="col-xs-12 col-sm-12 col-md-2 col-lg-2" style={{ paddingBottom: '15px' }}>
                  <i className="fa fa-container-red" />
                  <strong>Contenedores </strong>
                  <small> {this.state.totalContainers}</small>
                </div>

                <div className="col-xs-12 col-sm-12 col-md-12 col-lg-12" style={{ paddingBottom: '15px' }}>
                  <div className="progress">
                    <div className="progress-bar label-aqua" style={{ width: percentageContainerPending, textAlign: 'left', color: 'black' }}>
                      <div style={{ position: 'absolute', marginTop: '22px', color: 'gray', fontWeight: '500', fontSize: '14px' }}>
                        {
                          (percentageContainerPending !== '0%') ?
                            <span>Pendientes</span>
                            : ''
                        }
                      </div>
                    </div>
                    <div className="progress-bar label-orange" style={{ width: percentageContainerOpen, textAlign: 'left', color: 'black' }}>
                      <div style={{ position: 'absolute', marginTop: '22px', color: 'gray', fontWeight: '500', fontSize: '14px' }}>
                        {
                          (percentageContainerOpen !== '0%') ?
                            <span>Abierto</span>
                            : ''
                        }
                      </div>
                    </div>

                    <div className="progress-bar label-yellow" style={{ width: percentageContainerCheck, textAlign: 'left', paddingLeft: '10px', color: 'black' }}>
                      <div style={{ position: 'absolute', marginTop: '22px', color: 'gray', fontWeight: '500', fontSize: '14px' }}>
                        {
                          (percentageContainerCheck !== '0%') ?
                            <span>Descarga</span>
                            : ''
                        }
                      </div>
                    </div>

                    <div className="progress-bar label-green" style={{ width: percentageContainerEmpty, textAlign: 'left', paddingLeft: '10px', color: 'black' }}>
                      <div style={{ position: 'absolute', marginTop: '22px', color: 'gray', fontWeight: '500', fontSize: '14px' }}>
                        {
                          (percentageContainerEmpty !== '0%') ?
                            <span>Vacíos</span>
                            : ''
                        }
                      </div>
                    </div>

                    <div className="progress-bar label-green" style={{ width: percentageContainerEmptyStar, textAlign: 'left', paddingLeft: '10px', color: 'black' }}>
                      <div style={{ position: 'absolute', marginTop: '22px', color: 'gray', fontWeight: '500', fontSize: '14px' }}>
                        {
                          (percentageContainerEmptyStar !== '0%') ?
                            <span>Vacíos*</span>
                            : ''
                        }
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              <div className="row" style={{ minWidth: '100%' }}>
                <div className="col-xs-12 col-sm-12 col-md-2 col-lg-2" style={{ paddingBottom: '15px' }}>
                  <i className="fa fa-cube" />
                  <strong>Unidades </strong>
                  <small>  {this.state.totalUnits}</small>
                </div>
                <div className="col-xs-12 col-sm-12 col-md-12 col-lg-12">
                  <div className="progress">
                    <div className="progress-bar label-aqua" style={{ width: percentagePending, textAlign: 'left', color: 'black' }}>
                      <div style={{ position: 'absolute', marginTop: '22px', color: 'gray', fontWeight: '500', fontSize: '14px' }}>
                        {
                          (percentagePending !== '0%') ?
                            <span>{inventorySettings.pending}</span>
                            : ''
                        }
                      </div>
                    </div>
                    <div className="progress-bar   label-green" style={{ width: percentageFound, textAlign: 'left', color: 'black' }}>
                      <div style={{ position: 'absolute', marginTop: '22px', color: 'gray', fontWeight: '500', fontSize: '14px' }}>
                        {
                          (percentageFound !== '0%') ?
                            <span>Encontrados</span>
                            : ''
                        }
                      </div>
                    </div>
                    <div className="progress-bar label-has-damages" style={{ width: percentageHasDamages, textAlign: 'left', paddingLeft: '10px', color: 'black' }}>
                      <div style={{ position: 'absolute', marginTop: '22px', color: 'gray', fontWeight: '500', fontSize: '14px' }}>

                        {
                          (percentageHasDamages !== '0%') ?
                            <span>Con Daños</span>
                            : ''
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="box">
            <div className="box-header with-border flex flex-space-between">
              <h3 className="box-title">
                Revisión Containers <span className="font-12 font-bold"> <span style={{ color: "gray", fontWeight: "600" }}>{containers.length}</span> {details.length > 0 ? details : ''}</span>
              </h3>
            </div>
            {loading ?

              <div className="overlay">
                <i className="fa fa-refresh fa-spin" />
              </div>
              : <>
                <div className="box-body">

                  <FilterSummryDetail
                    containerFilter={this.state.containerFilter}
                    statusFilterSelected={this.state.statusFilterSelected}
                    inventorySettings={inventorySettings}
                    statusText={this.statusText}
                    onFilterChange={(filter, value) => this.setState((prevState) => ({ ...prevState, [filter]: value }))}
                    onCleanFilters={this.cleanFilters} 
                    unitFilter={this.state.unitFilter}                 
                     />

                  <InventoryTable
                    columns={this.columns}
                    containers={this.state.containers}
                    conditionalRowStyles={conditionalRowStyles}
                    paginationComponentOptions={paginationComponentOptions}
                    dataTableStyle={dataTableStyle}
                    ExpandedRowElement={ExpandedRowElement}
                  />

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
                          >Aplicar</button>
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


export default connect<{}, { getParticipant: (id: string) => Promise<any> }, IPropsType>(
  mapStateToProps,
  mapDispatchToProps
)(InventoryDetail);