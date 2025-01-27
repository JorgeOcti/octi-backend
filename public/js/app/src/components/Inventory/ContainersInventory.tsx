import AppContainer from '../../container/AppContainer';
import TrackingBasePage from "../Utils/TrackingBasePage";
import {RouteComponentProps} from "react-router";
import {connect} from "react-redux";
import * as React from "react";
import ApiService from "../../utils/axios";
import {IInventory} from "../../../../../../src/inventory/interfaces/inventory.interface";

import DataTable from 'react-data-table-component';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
}

interface IStateType {
  error: Error | null;
  containers: any[];
  originalContainers: any[];
  blFilter: string;
  containerFilter: string;
  clientFilter: string;
  statusFilter: string;
  selectedContainer: number;
  inventorySettings: any;
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
          return car.car.isContainer;
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
      })
      .catch((error: any) => {
        console.log(error);
      })
  }

  //use debounce to avoid multiple calls and filter the state.containers with the filters
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
      // let bl = container.car.bl.toLowerCase().includes(this.state.blFilter.toLowerCase());
      let containerFilter = container.car.vin.toLowerCase().includes(this.state.containerFilter.toLowerCase());
      // let clientFilter = container.car.client ? container.car.client.name.toLowerCase().includes(this.state.clientFilter.toLowerCase()) : true;
      let statusFilter = this.state.statusFilter === '' ? true : container.status === this.state.statusFilter;
      return containerFilter && statusFilter;
    });


    this.setState({
      containers: containers
    });
  }

  columns = [
    {
      name: 'Contenedor',
      selector: (row: any) => row.car.vin,
      sortable: true
    },
    {
      name: 'Imagenes',
      selector: (row: any) => {
        return `${row.images.length || 0} Fotos`;
      }
    },
    {
      name: 'Cliente',
      selector: (row: any) => {
            return row.car.client ? row.car.client.name : 'N/A';
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
    }
  ];

  paginationComponentOptions = {
    rowsPerPageText: 'Filas por página',
    rangeSeparatorText: 'de',
    selectAllRowsItem: true,
    selectAllRowsItemText: 'Todos',
  };

  render() {
    return (
      <AppContainer title="Revisión Containers" cMenu="2" cSubMenu="2.6">
        <section className="content">
          <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">
                Revisión Containers
              </h3>
            </div>
            <div className="box-body">
              <div className="row">
                <div className="col-md-3">
                  <div className="form-group">
                    <label>BL</label>
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
                </div>
                <div className="col-md-3">
                  <div className="form-group">
                    <label>Contenedor</label>
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
                    <input
                      type="text"
                      className="form-control"
                      value={this.state.clientFilter}
                      onChange={(e) => {
                        this.setState({clientFilter: e.target.value});
                      }}
                    />
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="form-group">
                    <label>Estado</label>
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
                      <option value="missing">Faltantes</option>
                      <option value="leftover">Encontrados*</option>
                      <option value="reported">Reportados</option>
                    </select>
                  </div>
                </div>
            </div>
            <DataTable
              columns={this.columns}
              data={this.state.containers}
              expandableRows
              expandableRowsComponent={ExpandedRowElement}
              expandOnRowClicked={true}
              pagination
              paginationComponentOptions={this.paginationComponentOptions}
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
  "report": {
    "atLeastOne": true,
    "primaryRequired": false,
    "secondaryRequired": false
  }
}


const ExpandedRowElement = ({ data }: {data: any}) => {
  return <div className='container box-body table-responsive request-list'>
     <div className="row request bg-primary">
                  <div className='col-sm-1 col-xs-1 col-md-1 col-lg-1 center'>
                    <strong>BIC</strong>
                  </div>
                  <div className='col-sm-2 col-xs-2 col-md-2 col-lg-2 center'>
                    <strong>Cant. de elementos</strong>
                  </div>
                  <div className='col-sm-2 col-xs-2 col-md-2 col-lg-2 center'>
                    <strong>Marca</strong>
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
         <strong>{car.car.brand}</strong>
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
              padding: '5px 10px'
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
