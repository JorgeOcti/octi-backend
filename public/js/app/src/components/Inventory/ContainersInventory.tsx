import AppContainer from '../../container/AppContainer';
import TrackingBasePage from "../Utils/TrackingBasePage";
import {RouteComponentProps} from "react-router";
import {connect} from "react-redux";
import * as React from "react";
import ApiService from "../../utils/axios";
import {IInventory} from "../../../../../../src/inventory/interfaces/inventory.interface";

import DataTable from 'react-data-table-component';
import * as moment from "moment-timezone";
import {hasPermission} from "../../utils/common";
import {IWindow} from "../../interfaces/window";

declare let window: IWindow;

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
}

interface IStateType {
  error: Error | null;
  containers: any[];
  originalContainers: any[];
  blFilter: string;
  containerFilter: string;
  clientFilter: string;
  clientSelector: any[];
  statusFilter: string;
  selectedContainer: number;
  inventorySettings: any;
}

const dataTableStyle = {
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

const columns = [
  {
    name: 'Fecha',
    selector: (row: any) => {
      return row.createdAt ? new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false, // Asegura formato 24h
    }).format(new Date(row.createdAt)).replace(',', ''): '';
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
    name: 'Puerto origen',
    selector: (row: any) => row.extra["Emplazamiento"],
  },
  {
    name: 'Nave',
    selector: (row: any) => row.extra["Nave"],
  },
  {
    name: 'Imagenes',
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
      return row.status;
    },
    cell: (row: any) => {
      let className = `${row.status}Class`;
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
         {inventorySettings.hasOwnProperty(row.status)
           ? inventorySettings[row.status]
           : row.state}
       </span>
     </div>
    }
  },
  {
    name: 'Tarja',
    selector: (row: any) => {
      return row.car.bl;
    },
    cell: (row: any) => {
      return row.status !== "pending" && <button className="btn btn-primary" onClick={() => {
        window.open(`/api/inventory/${row.inventory}/container/tarja/${row.car._id}`, '_blank')
      }}>Tarja</button>
    }
  }
];

const foundStatusContainer = (container: any) => {
  let status = container.status;
  if(container.evidenceStatus && container.evidenceStatus.length > 0) {
    const statusList = container.evidenceStatus.map((evidence: any) => evidence.status);
    if(statusList.includes('empty')) {
      status = 'empty';
    } else if(statusList.includes('check')) {
      status = 'check';
    } else if(statusList.includes('open')) {
      status = 'open';
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

class ContainersInventory extends TrackingBasePage<IPropsType, IStateType> {
  title = "Revisión Containers";

  constructor(props: IPropsType) {
    super(props);
    this.state = {
      error: null,
      originalContainers: [],
      containers: [],
      blFilter: '',
      containerFilter: '',
      clientFilter: '',
      clientSelector: [],
      statusFilter: '',
      selectedContainer: -1,
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
  }

  componentDidMount() {
    super.componentDidMount();
    const api: ApiService = new ApiService();
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

        cars.map((car: any) => {
          let container = containers.findIndex((container: any) => {
            return container._id === (car.containerFound || car.container);
          });

          if (container >= 0) {
            if (containers[container].content === undefined) {
              containers[container].content = [];
            }
            containers[container].content.push(car);
          }
        })

        this.setState({
          containers: containers,
          originalContainers: containers
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

  componentDidUpdate(prevProps: Readonly<IPropsType>, prevState: Readonly<IStateType>, snapshot?: any) {
    if (this.state.blFilter !== prevState.blFilter ||
      this.state.containerFilter !== prevState.containerFilter ||
      this.state.clientFilter !== prevState.clientFilter ||
      this.state.statusFilter !== prevState.statusFilter) {
      this.filterContainers();
    }
  }

  filterContainers() {
    let containers = this.state.originalContainers.filter((container: any) => {
      let bl = container.extra["N° BL"] ? container.extra["N° BL"].toLowerCase().includes(this.state.blFilter.toLowerCase()) : true;
      let containerFilter = container.car.vin.toLowerCase().includes(this.state.containerFilter.toLowerCase());
      let clientFilter = this.state.clientFilter === '' ? true : (container.extra["Cliente Razón Social"] ? container.extra["Cliente Razón Social"].toLowerCase().includes(this.state.clientFilter.toLowerCase()) : false);
      let statusFilter = this.state.statusFilter === '' ? true : container.status === this.state.statusFilter;

      return bl && containerFilter && clientFilter && statusFilter;
    });

    this.setState({
      containers: containers
    });
  }

  create = () => {
    this.props.history.push('/inventory/container/create/');
  }

  render() {
    return (
      <AppContainer title="Revisión Containers" cMenu="2" cSubMenu="2.6">
        <section className="content">
          <div className="box">
            <div className="box-header with-border flex flex-space-between">
              <h3 className="box-title">
                Revisión Containers
              </h3>
              <div className="pull-right box-tools">
                {hasPermission(window.user, 'createInventory') ? (
                  <button
                  className="btn btn-sm btn-success"
                  onClick={this.create}>
                    <i className="fa fa-plus"/> Crear inventario
                  </button>
                ) : null}
              </div>
            </div>
            <div className="box-body">
              <div className="row">
                <div className="col-md-3">
                  <div className="form-group">
                    <label>¿Qué Bill of Lading (BL) buscas?</label>
                    <input
                      type="text"
                      className="form-control"
                      value={this.state.blFilter}
                      onChange={(e) => {
                        this.setState({blFilter: e.target.value});
                      }}
                    />
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="form-group">
                    <label>¿Qué container buscas?</label>
                    <input
                      type="text"
                      className="form-control"
                      value={this.state.containerFilter}
                      onChange={(e) => {
                        this.setState({containerFilter: e.target.value});
                      }}
                    />
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="form-group">
                    <label>Cliente</label>
                    <select
                      className="form-control"
                      value={this.state.clientFilter}
                      onChange={(e) => {
                        this.setState({clientFilter: e.target.value});
                      }}
                    >
                      <option value="">Todos</option>
                      {this.state.clientSelector.map((client: any, index: number) => {
                        return <option key={index} value={client}>{client}</option>
                      })
                      }
                    </select>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="form-group">
                    <label>Filtrar por Estado</label>
                    <select
                      className="form-control"
                      value={this.state.statusFilter}
                      onChange={(e) => {
                        this.setState({statusFilter: e.target.value});
                      }}
                    >
                      <option value="">Todos</option>
                      <option value="pending">Pendientes</option>
                      <option value="found">Encontrados</option>
                      <option value="oepn">Abierto</option>
                      <option value="check">Descarga</option>
                      <option value="empty">Vacio</option>
                    </select>
                  </div>
                </div>
                </div>
            </div>
            <DataTable
              columns={columns}
              data={this.state.containers}
              customStyles={dataTableStyle}
              expandableRows
              expandableRowsComponent={ExpandedRowElement}
              expandOnRowClicked={true}
              pagination
              paginationComponentOptions={paginationComponentOptions}
            />
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
  "emptyClass": "yellow",
  "check": "Descarga",
  "checkClass": "green",
  "open": "Abierto",
  "openClass": "gray-dark",
  "report": {
    "atLeastOne": true,
    "primaryRequired": false,
    "secondaryRequired": false
  }
}


const ExpandedRowElement = ({ data }: {data: any}) => {
  return <div className='container-fluid box-body table-responsive request-list'>
     <div className="row request bg-primary">
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
    { data.content.map((car: any, index: number) => {
    let className = `${car.status}Class`;
    return (
      <div key={index} className='row request bg-request-title background-transition'>
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
