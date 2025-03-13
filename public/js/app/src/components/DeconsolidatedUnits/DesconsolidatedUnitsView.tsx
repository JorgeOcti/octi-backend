import AppContainer from '../../container/AppContainer';
import TrackingBasePage from "../Utils/TrackingBasePage";
import {RouteComponentProps} from "react-router";
import {connect} from "react-redux";
import * as React from "react";
import ApiService from "../../utils/axios";
import {IInventory} from "../../../../../../src/inventory/interfaces/inventory.interface";
import { ContainerStatus } from "../../../../../../src/utils/enums/containerStatus.enum";
import CopyText from '../Utils/CopyText';

import DataTable from 'react-data-table-component';
import * as moment from "moment-timezone";
import {hasPermission} from "../../utils/common";
import {IWindow} from "../../interfaces/window";

declare let window: IWindow;

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
}

interface IStateType {
  error: Error | null;
  originalUnits: any[];
  units: any[];
  blFilter: string;
  containerFilter: string;
  containerUpdated: any;
  clientFilter: string;
  unitFilter:string;
  clientSelector: any[];
  statusFilter: string;
  selectedContainer: number;
  loading: boolean;
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
    name: 'Código de unidad',
    selector: (row: any) => {
      return <CopyText value={row.inventoryCar.car.vin}>
      <strong
        className="text-primary text-underline">
        {row.inventoryCar.car.vin}
      </strong>
    </CopyText>;
    }
  },
  {
    name: 'Marca',
    selector: (row: any) => {
      return row.inventoryCar.car.brand;
    }
  },
  {
    name: 'Modelo',
    selector: (row: any) => row.inventoryCar.car.brand,
  },
  {
    name: 'Color',
    selector: (row: any) => row.inventoryCar.car.color,
  },{
    name: 'F. Descarga',
    selector: (row: any) => {
      return row.date;
    }
  },
  {
    name: 'N Container',
    selector: (row: any) => {
          return row.inventoryCar.extra["BIC"];
    }
  },
  {
    name: 'BL',
    selector: (row: any) => row.inventoryCar.extra["N° BL"],
  },
  {
    name: 'Estado',
    selector: (row: any) => {
      return row.containerStatus || row.status;
    },
    cell: (row: any) => {
      const status = row.status
      let className = `${status}ClassContainer`;
      return <span
         className={`label-container label-container-${
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
   
    },
    sortable: true
  },
  {
    name: 'Tarja',
    selector: (row: any) => {
      return row.car.bl;
    },
    cell: (row: any) => {
      return row.status === ContainerStatus.EMPTY && <button className="btn btn-m btn-default" onClick={() => {
        window.open(`/api/inventory/${row.inventory}/container/tarja/${row.car._id}`, '_blank')
      }}>
      <i className="fa fa-fw fa-print" /> Tarja
    </button>
    }
  },
];

class DesconsolidatedUnits extends TrackingBasePage<IPropsType, IStateType> {
  title = "Unidades Desconsolidadas";



  constructor(props: IPropsType) {
    super(props);
    this.state = {
      loading: false,
      error: null,
      originalUnits: [],
      units: [],
      blFilter: '',
      unitFilter:'',
      containerFilter: '',
      containerUpdated: {},
      clientFilter: '',
      clientSelector: [],
      statusFilter: '',
      selectedContainer: -1,
      isFilteringByDate: false
    };

  }



  componentDidMount() {
    super.componentDidMount();
    const api: ApiService = new ApiService();
    api.getSource()
    console.log("Llegaste nene", window.user )
    const dumy2 = {
        "history": [
          {
            "_id": "67cb32e58a86fc3916dd2d3c",
            "team": "679943369a2aca8814cb604b",
            "company": "679943607d645cc1955932ac",
            "clientCompany": "67cb2ee6ccea1f31031606f2",
            "car": "67cb2ee6ccea1f31031606f7",
            "status": "readyToClient",
            "module": "inventory",
            "inventory": "67cb2ee5ccea1f31031606bb",
            "inventoryCar": {
              "_id": "67cb2ee6ccea1f3103160731",
              "inventory": "67cb2ee5ccea1f31031606bb",
              "car": {
                "_id": "67cb2ee6ccea1f31031606f7",
                "vin": "LVUDB21B7SF014902",
                "vin2": "014902",
                "entry": "",
                "team": "679943369a2aca8814cb604b",
                "company": "679943607d645cc1955932ac",
                "clientCompany": "67cb2ee6ccea1f31031606f2",
                "internalNumber": "",
                "patent": "",
                "engineNumber": "",
                "engineSize": "",
                "driveType": "",
                "brand": "JETOUR",
                "denomination": "X70 1.5T+8AT  Ⅲ",
                "color": "SIN INFO",
                "firstColorOption": "",
                "secondColorOption": "",
                "thirdColorOption": "",
                "isContainer": false,
                "meta": {
                  "_id": "67cb2ee6ccea1f31031606f6"
                },
                "invoice": "",
                "client": "",
                "bl": "",
                "shippingDate": null,
                "isExhibition": false,
                "imported": true,
                "lastForm": null,
                "status": "active",
                "event": "67cb32e58a86fc3916dd2d3c",
                "createdBy": "679943c34c128e65ba1ddeb8",
                "createdAt": "2025-03-07T17:37:42.657Z",
                "updatedAt": "2025-03-07T17:54:45.579Z",
                "__v": 0
              },
              "venue": "6799438bc325e3e448d1392f",
              "images": [],
              "files": [],
              "comments": [],
              "labelText": "",
              "customizedStatusText": "",
              "status": "found",
              "containerStatus": "pending",
              "container": "67cb2ee6ccea1f31031606da",
              "extra": {
                "BIC": "CAAU6245078",
                "VIN": "LVUDB21B7SF014902",
                "Marca": "JETOUR",
                "Modelo": "X70 1.5T+8AT  Ⅲ",
                "Color": "SIN INFO",
                "Cliente Razón Social": "YAMAHA ANDES SPA",
                "RUT Cliente": "46005909-9",
                "Manifiesto": "SIN INFO",
                "N° BL": "MEDUYP426230",
                "Emplazamiento": "A92",
                "Ubicación": "San Antonio",
                "Nave": "MSC CASSANDRE",
                "N° Viaje": "QM452A ",
                "Sello IN": "FX38055822",
                "Puerto Origen": "China",
                "Peso": 100
              },
              "virtualInventory": "67cb2ee6ccea1f31031606ca",
              "evidenceStatus": [],
              "__v": 0,
              "createdAt": "2025-03-07T17:37:42.765Z",
              "updatedAt": "2025-03-07T17:54:45.523Z",
              "inventoriedBy": "679943c34c128e65ba1ddeb8",
              "venueFound": "6799438bc325e3e448d1392f"
            },
            "changeLocation": false,
            "current": true,
            "createdBy": "679943c34c128e65ba1ddeb8",
            "executedAt": "2025-03-07T17:37:42.657Z",
            "alerts": [],
            "createdAt": "2025-03-07T17:54:45.563Z",
            "updatedAt": "2025-03-07T17:54:45.563Z",
            "__v": 0
          },
          {
            "_id": "67cb32f48a86fc3916dd2d50",
            "team": "679943369a2aca8814cb604b",
            "company": "679943607d645cc1955932ac",
            "clientCompany": "67cb2ee6ccea1f31031606fb",
            "car": "67cb2ee6ccea1f3103160700",
            "status": "readyToClient",
            "module": "inventory",
            "inventory": "67cb2ee5ccea1f31031606bb",
            "inventoryCar": {
              "_id": "67cb2ee6ccea1f3103160732",
              "inventory": "67cb2ee5ccea1f31031606bb",
              "car": {
                "_id": "67cb2ee6ccea1f3103160700",
                "vin": "HJRPBGGB2SF014776",
                "vin2": "014776",
                "entry": "",
                "team": "679943369a2aca8814cb604b",
                "company": "679943607d645cc1955932ac",
                "clientCompany": "67cb2ee6ccea1f31031606fb",
                "internalNumber": "",
                "patent": "",
                "engineNumber": "",
                "engineSize": "",
                "driveType": "",
                "brand": "JETOUR",
                "denomination": "X70PLUS 1.6T 7DCT",
                "color": "SIN INFO",
                "firstColorOption": "",
                "secondColorOption": "",
                "thirdColorOption": "",
                "isContainer": false,
                "meta": {
                  "_id": "67cb2ee6ccea1f31031606ff"
                },
                "invoice": "",
                "client": "",
                "bl": "",
                "shippingDate": null,
                "isExhibition": false,
                "imported": true,
                "lastForm": null,
                "status": "active",
                "event": "67cb32f48a86fc3916dd2d50",
                "createdBy": "679943c34c128e65ba1ddeb8",
                "createdAt": "2025-03-07T17:37:42.676Z",
                "updatedAt": "2025-03-07T17:55:00.862Z",
                "__v": 0
              },
              "venue": "6799438bc325e3e448d1392f",
              "images": [],
              "files": [],
              "comments": [],
              "labelText": "",
              "customizedStatusText": "",
              "status": "found",
              "containerStatus": "pending",
              "container": "67cb2ee6ccea1f31031606db",
              "extra": {
                "BIC": "CAAU7359521",
                "VIN": "HJRPBGGB2SF014776",
                "Marca": "JETOUR",
                "Modelo": " X70PLUS 1.6T 7DCT",
                "Color": "SIN INFO",
                "Cliente Razón Social": "BLACK MAIND ANDES SPA",
                "RUT Cliente": "56005909-9",
                "Manifiesto": "SIN INFO",
                "N° BL": "MEDUYP426276",
                "Emplazamiento": "A92",
                "Ubicación": "San Antonio",
                "Nave": "MSC CASSANDRE",
                "N° Viaje": "QM452A ",
                "Sello IN": "FX38055644",
                "Puerto Origen": "China",
                "Peso": 100
              },
              "virtualInventory": "67cb2ee6ccea1f31031606d1",
              "evidenceStatus": [],
              "__v": 0,
              "createdAt": "2025-03-07T17:37:42.765Z",
              "updatedAt": "2025-03-07T17:55:00.810Z",
              "inventoriedBy": "679943c34c128e65ba1ddeb8",
              "venueFound": "6799438bc325e3e448d1392f"
            },
            "changeLocation": false,
            "current": true,
            "createdBy": "679943c34c128e65ba1ddeb8",
            "executedAt": "2025-03-07T17:37:42.676Z",
            "alerts": [],
            "createdAt": "2025-03-07T17:55:00.850Z",
            "updatedAt": "2025-03-07T17:55:00.850Z",
            "__v": 0
          }
        ]
      }
    const dumy = [
        {
          "car": {
            "marca": "Toyota",
            "color": "Rojo",
            "modelo": "Corolla"
          },
          "bl": "BL123456789",
          "date": "2023-03-05T16:10:00Z",
          "numeroContainer": 1234567,
          "unitCode": "ABC1234"
        },
        {
          "car": {
            "marca": "Honda",
            "color": "Azul",
            "modelo": "Civic"
          },
          "bl": "BL987654321",
          "date": "2023-03-05T16:10:00Z",
          "numeroContainer": 9876543,
          "unitCode": "DEF5678"
        },
        {
          "car": {
            "marca": "Ford",
            "color": "Negro",
            "modelo": "Focus"
          },
          "bl": "BL102938475",
          "date": "2023-03-05T16:10:00Z",
          "numeroContainer": 1029384,
          "unitCode": "GHI9012"
        },
        {
          "car": {
            "marca": "Chevrolet",
            "color": "Blanco",
            "modelo": "Cruze"
          },
          "bl": "BL756453829",
          "date": "2023-03-05T16:10:00Z",
          "numeroContainer": 7564538,
          "unitCode": "JKL3456"
        },
        {
          "car": {
            "marca": "Nissan",
            "color": "Gris",
            "modelo": "Sentra"
          },
          "bl": "BL918273645",
          "date": "2023-03-05T16:10:00Z",
          "numeroContainer": 9182736,
          "unitCode": "MNO7890"
        }
      ]
    this.setState({
        units: dumy2.history,
        originalUnits: dumy2.history,
        loading: false
      })
  }

  componentDidUpdate(prevProps: Readonly<IPropsType>, prevState: Readonly<IStateType>, snapshot?: any) {
    if (this.state.blFilter !== prevState.blFilter ||
      this.state.containerFilter !== prevState.containerFilter ||
      this.state.clientFilter !== prevState.clientFilter ||
      this.state.statusFilter !== prevState.statusFilter || 
      this.state.unitFilter !== prevState.unitFilter) {
      this.filterUnits();
    }
  }

  filterUnits() {
    let units = this.state.originalUnits.filter((unit: any) => {
        console.log(unit)
      let bl = unit.inventoryCar.extra["N° BL"] ? unit.inventoryCar.extra["N° BL"].toLowerCase().includes(this.state.blFilter.toLowerCase()) : true;
      let containerFilter = unit.inventoryCar.extra["BIC"].toLowerCase().includes(this.state.containerFilter.toLowerCase());
      let clientFilter = this.state.clientFilter === '' ? true : (unit.inventoryCar.extra["Cliente Razón Social"] ? unit.inventoryCar.extra["Cliente Razón Social"].toLowerCase().includes(this.state.clientFilter.toLowerCase()) : false);
      let statusFilter = this.state.statusFilter === '' ? true : unit.status === this.state.statusFilter;
      let unitFilter = this.state.unitFilter === '' ? true : unit.inventoryCar.car.vin.toLowerCase() === this.state.unitFilter.toLowerCase();
     

      return bl && containerFilter && clientFilter && statusFilter && unitFilter;
    });

    this.setState({
        units: units
    });
  }

  render() {
    const {units, loading} = this.state;

    return (
      <AppContainer title="" cMenu="6" cSubMenu="6.2">
        <section className="content">
          <div className="box">
            <div className="box-header with-border flex flex-space-between">
              <h3 className="box-title">
              Unidades Desconsolidadas <span className='font-12' style={{color:"gray", fontWeight: "600"}}>{units.length}</span>
              </h3>
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
                        <label className="text-black">Filtrar por unidad</label>
                        <input
                          type="text"
                          className="form-control"
                          value={this.state.unitFilter}
                          onChange={(e) => {
                            this.setState({ unitFilter: e.target.value });
                          }}
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                    <div className="form-group">
                    <label className="text-black" >Filtrar por Estado</label>
                    <select
                        className="form-control"
                        value={this.state.statusFilter}
                        onChange={(e) => {
                        this.setState({ statusFilter: e.target.value });
                        }}
                    >
                        <option value="">Todos</option>
                        <option value="readyToClient">Disponible</option>
                        <option value="transito">En Transito</option>
                    </select>
                    </div>
                </div>
                    <div className="col-md-3">
                      <div className="form-group">
                        <label className="text-black" >Filtrar por Cliente</label>
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

                  </div>
                  <div className="row">
                    <div className="col-md-12">
                        <DataTable
                          columns={columns}
                          data={units}
                          customStyles={dataTableStyle}
                          pagination
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
)(DesconsolidatedUnits);

const inventorySettings: { [key: string]: any } = {
   
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
    "readyToClient": "Disponible",
    "readyToClientClassContainer": "pending",
    "emptyClassContainer": "empty",
    "emptyColor": "#00AA51",
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


