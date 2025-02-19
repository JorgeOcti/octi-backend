import AppContainer from '../../container/AppContainer';
import TrackingBasePage from "../Utils/TrackingBasePage";
import {RouteComponentProps} from "react-router";
import {connect} from "react-redux";
import * as React from "react";
import ApiService from "../../utils/axios";
import {IInventory} from "../../../../../../src/inventory/interfaces/inventory.interface";
import { ContainerStatus } from "../../../../../../src/utils/enums/containerStatus.enum";

import { io } from 'socket.io-client';
import { Socket } from 'socket.io-client/build/esm/socket';

import DataTable from 'react-data-table-component';
import * as moment from "moment-timezone";
import {hasPermission} from "../../utils/common";
import {IWindow} from "../../interfaces/window";
import DateRangeInput from '../Utils/DateRangeInput';
import * as XLSX from 'xlsx-color';

declare let window: IWindow;

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
}

interface IStateType {
  error: Error | null;
  containers: any[];
  originalContainers: any[];
  blFilter: string;
  containerFilter: string;
  containerUpdated: any;
  clientFilter: string;
  clientSelector: any[];
  statusFilter: string;
  selectedContainer: number;
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
      backgroundColor: "#3279B7"
    }
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

const columns = [
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
    name: 'Imágenes',
    cell: (row: any) => {
      if(row.evidenceStatus && row.evidenceStatus.length > 0) {
        row.images = row.evidenceStatus.map((evidence: any) => evidence.images).flat();
      }
      return imagesFormatter(row);
    }
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
      const status = row.containerStatus || row.status
      let className = `${status}Class`;
      return <div className='col-sm-2 col-xs-2 col-md-2 col-lg-2 text-left'>
       <span
         className={`label label-${
          inventorySettings.hasOwnProperty(className)
          ? inventorySettings[className]
          : ''
          }`}
          style={{
            padding: '5px 10px'
          }}>
         {inventorySettings.hasOwnProperty(status)
           ? inventorySettings[status]
           : status}
       </span>
     </div>
    },
    sortable: true
  },
  {
    name: 'Tarja',
    selector: (row: any) => {
      return row.car.bl;
    },
    cell: (row: any) => {
      return row.status === ContainerStatus.EMPTY && <button className="btn btn-primary" onClick={() => {
        window.open(`/api/inventory/${row.inventory}/container/tarja/${row.car._id}`, '_blank')
      }}>Tarja</button>
    }
  }
];

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

  constructor(props: IPropsType) {
    super(props);
    this.state = {
      loading: true,
      error: null,
      originalContainers: [],
      containers: [],
      blFilter: '',
      containerFilter: '',
      containerUpdated: {},
      clientFilter: '',
      clientSelector: [],
      statusFilter: '',
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

        let cars = data.filter((car: any) => {
          return !car.car.isContainer;
        })

        containers = containers.map((container: any) => {
          container.content = cars.filter((car: any) => (car.containerFound || car.container) === container._id);
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

        console.log(containers);
        console.log(containers.filter((container: any) => container.content === undefined));

        this.setState({
          containers: containers,
          originalContainers: containers,
          loading: false
        })
        let clients = Array.from(new Set(containers.map((container: any) => container.extra["Cliente Razón Social"]).filter((client: any) => client !== undefined)));
        this.setState({
          clientSelector: clients
        });
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
      this.state.statusFilter !== prevState.statusFilter ||
      this.state.isFilteringByDate !== prevState.isFilteringByDate ||
      this.state.startDate !== prevState.startDate ||
      this.state.endDate !== prevState.endDate) {
      this.filterContainers();
    }
  }

  cleanFilters = () => {
    this.setState({
      blFilter: '',
      containerFilter: '',
      clientFilter: '',
      statusFilter: '',
      startDate: moment().toDate(),
      endDate: moment().toDate(),
      isFilteringByDate: false
    });
  }

  filterContainers() {
    let containers = this.state.originalContainers.filter((container: any) => {
      let bl = container.extra["N° BL"] ? container.extra["N° BL"].toLowerCase().includes(this.state.blFilter.toLowerCase()) : true;
      let containerFilter = container.car.vin.toLowerCase().includes(this.state.containerFilter.toLowerCase());
      let clientFilter = this.state.clientFilter === '' ? true : (container.extra["Cliente Razón Social"] ? container.extra["Cliente Razón Social"].toLowerCase().includes(this.state.clientFilter.toLowerCase()) : false);
      let statusFilter = this.state.statusFilter === '' ? true : container.status === this.state.statusFilter;
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

      return bl && containerFilter && clientFilter && statusFilter && dateFilter;
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
    return <div className='container-fluid box-body table-responsive request-list'>
      <div className="row request">
        <div className='col-sm-1 col-xs-1 col-md-1 col-lg-1 center'>
          <strong>VIN</strong>
        </div>
        <div className='col-sm-2 col-xs-2 col-md-2 col-lg-2 center'>
          <strong>Fotos</strong>
        </div>
        <div className='col-sm-2 col-xs-2 col-md-2 col-lg-2 center'>
          <strong>Color</strong>
        </div>
        <div className='col-sm-2 col-xs-2 col-md-2 col-lg-2 center'>
          <strong>Estado</strong>
        </div>
      </div>
      {data.content.map((car: any, index: number) => {
        let className = `${car.status}Class`;
        let classNameEfect = car.car.vin === this.state.containerUpdated?.car?.vin ? "highlight-info" : "";
        return (
          <div key={index} className={`row request bg-request-title background-transition ${classNameEfect}`}>
            <div className='col-sm-1 col-xs-1 col-md-1 col-lg-1 center'>
              <strong>{car.car.vin}</strong>
            </div>
            <div className='col-sm-2 col-xs-2 col-md-2 col-lg-2 center'>
              {imagesFormatter(car)}
            </div>
            <div className='col-sm-2 col-xs-2 col-md-2 col-lg-2 center'>
              <strong>{car.car.color}</strong>
            </div>
            <div className='col-sm-2 col-xs-2 col-md-2 col-lg-2 center'>
           <span
             className={`label label-${
               inventorySettings.hasOwnProperty(className)
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
          </div>
        )
      })
      }
    </div>
  }
  

  render() {
    const {containers, loading, containerUpdated} = this.state;
    let statusCount = containers.reduce((acc: any, container: any) => {
      if (container  && container.containerStatus) {
        let key = inventorySettings[container.containerStatus];
        if (acc[key]) {
          acc[key] += 1;
        } else {
          acc[key] = 1;
        }
      }
      return acc;
    }, {});

    let details = Object.keys(statusCount).map((status: any) => {
      return `${status}: ${statusCount[status]}`;
    }).join(', ');

    const conditionalRowStyles = [
      {
        when: (row: any) => {
          const {containerUpdated} = this.state;

          if(containerUpdated?.car?.isContainer){
            return row.car.vin === containerUpdated.car?.vin && row.inventory === containerUpdated?.inventory
          }else{
            return row._id === containerUpdated.container && row.inventory === containerUpdated?.inventory
          }
        } ,
        classNames: ["highlight-info"],
      },
    ];

    return (
      <AppContainer title="Revisión Containers" cMenu="2" cSubMenu="2.6">
        <section className="content">
          <div className="box">
            <div className="box-header with-border flex flex-space-between">
              <h3 className="box-title">
                Revisión Containers {containers.length} Total {details ? `(${details})` : ''}
              </h3>
              <div className="pull-right box-tools" style={{padding: "10px"}}>
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
                      <i className="fa fa-plus"/> Crear inventario
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
                  <div className="row">
                    <div className="col-md-2">
                      <div className="form-group">
                        <label>¿Qué Bill of Lading (BL) buscas?</label>
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
                    <div className="col-md-2">
                      <div className="form-group">
                        <label>¿Qué container buscas?</label>
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
                    <div className="col-md-2">
                      <div className="form-group">
                        <label>Cliente</label>
                        <select
                          className="form-control"
                          value={this.state.clientFilter}
                          onChange={(e) => {
                            this.setState({ clientFilter: e.target.value });
                          }}
                        >
                          <option value="">Todos</option>
                          {this.state.clientSelector.map((client: any, index: number) => {
                            return <option key={index} value={client}>{client}</option>;
                          })
                          }
                        </select>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="form-group">
                        <label>Filtrar por Estado</label>
                        <select
                          className="form-control"
                          value={this.state.statusFilter}
                          onChange={(e) => {
                            this.setState({ statusFilter: e.target.value });
                          }}
                        >
                          <option value="">Todos</option>
                          <option value={ContainerStatus.PENDING}>Pendientes</option>
                          <option value={ContainerStatus.FOUND}>Encontrados</option>
                          <option value={ContainerStatus.OPEN}>Abierto</option>
                          <option value={ContainerStatus.CHECK}>Descarga</option>
                          <option value={ContainerStatus.EMPTY}>Vacio</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="form-group">
                        <label>Filtrar por Fecha de Apertura</label>
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
                    <div className="col-md-2">
                      <div className="row pull-right box-tools" style={{ paddingTop: '10px', paddingRight: '25px' }}>
                        <button
                          className="btn btn-sm btn-primary btn-block"
                          onClick={this.cleanFilters}
                        >
                          Limpiar filtros
                        </button>
                      </div>
                    </div>
                  </div>

                  <DataTable
                    columns={columns}
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
  "empty": "Vacio",
  "emptyClass": "green",
  "check": "Descarga",
  "checkClass": "yellow",
  "open": "Abierto",
  "openClass": "gray-dark",
  "report": {
    "atLeastOne": true,
    "primaryRequired": false,
    "secondaryRequired": false
  }
}



