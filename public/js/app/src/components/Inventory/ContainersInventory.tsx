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
  selectedContainer: number;
  inventorySettings: any;
}

class ContainersInventory extends TrackingBasePage<IPropsType, IStateType> {
  title = "Revisión Containers";

  constructor(props: IPropsType) {
    super(props);
    this.state = {
      error: null,
      containers: [],
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
          containers: containers
        })
      })
      .catch((error: any) => {
        console.log(error);
      })
  }

  columns = [
    {
      name: 'Contenedor',
      selector: (row: any) => row.car.vin,
    },
    {
      name: 'Imagenes',
      selector: (row: any) => {
        console.log(row.images);
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
  return <div className='box-body table-responsive request-list'>
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
         <strong>{car.car.denomination}</strong>
       </div>
       <div className='col-sm-2 col-xs-2 col-md-2 col-lg-2 center'>
         <strong>{car.car.color}</strong>
       </div>
       <div className='col-sm-3 col-xs-3 col-md-3 col-lg-3 center'>
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
