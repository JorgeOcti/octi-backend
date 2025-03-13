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
  isUserHandler:boolean;
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
      loading: true,
      error: null,
      originalUnits: [],
      units: [],
      blFilter: '',
      unitFilter:'',
      containerFilter: '',
      containerUpdated: {},
      clientFilter: '',
      clientSelector: [],
      isUserHandler:false,
      statusFilter: '',
      selectedContainer: -1,
      isFilteringByDate: false
    };

  }



  componentDidMount() {
    super.componentDidMount();
    console.log("user", window.user)
    const {company} = window.user
    if(company?.handler){
        // En caso de ser usuario handler filtro por el primer cliente del listado
        this.setState({isUserHandler: true, clientFilter:company?.clientCompanies[0]._id, clientSelector: company?.clientCompanies}) 
        this.getUnitsByCompanyId(company.clientCompanies[0]._id)
    } else {
        const companyList = [{_id:company._id, name: company.name}]
        this.setState({isUserHandler: false, clientFilter:company?.clientCompanies._id, clientSelector: companyList}) 
        this.getUnitsByCompanyId(company._id)
    }
  }

  getUnitsByCompanyId(companyId:string){
    this.setState({loading: true})
    const api: ApiService = new ApiService();
    api.getSource()
    api.getUnitsByCompany(companyId).then((data:any) => {
        this.setState({
            units: data.data.history,
            originalUnits: data.data.history,
            loading: false
          })
    })
  }

  componentDidUpdate(prevProps: Readonly<IPropsType>, prevState: Readonly<IStateType>, snapshot?: any) {
    if (this.state.blFilter !== prevState.blFilter ||
      this.state.containerFilter !== prevState.containerFilter ||
      this.state.statusFilter !== prevState.statusFilter || 
      this.state.unitFilter !== prevState.unitFilter) {
      this.filterUnits();
    }
    if(this.state.clientFilter !== prevState.clientFilter){
        this.getUnitsByCompanyId(this.state.clientFilter)
    }
  }

  filterUnits() {
    let units = this.state.originalUnits.filter((unit: any) => {
      let bl = unit.inventoryCar.extra["N° BL"] ? unit.inventoryCar.extra["N° BL"].toLowerCase().includes(this.state.blFilter.toLowerCase()) : true;
      let containerFilter = unit.inventoryCar.extra["BIC"].toLowerCase().includes(this.state.containerFilter.toLowerCase());
      let statusFilter = this.state.statusFilter === '' ? true : unit.status === this.state.statusFilter;
      let unitFilter = this.state.unitFilter === '' ? true : unit.inventoryCar.car.vin.toLowerCase() === this.state.unitFilter.toLowerCase();
      return bl && containerFilter && statusFilter && unitFilter;
    });

    this.setState({
        units: units
    });
  }

  render() {
    const {units, loading, isUserHandler} = this.state;

    return (
      <AppContainer title="" cMenu="6" cSubMenu="6.2">
        <section className="content">
          <div className="box">
            <div className="box-header with-border flex flex-space-between">
              <h3 className="box-title">
              Unidades Desconsolidadas <span className='font-12' style={{color:"gray", fontWeight: "600"}}>{units?.length}</span>
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
                {isUserHandler? <><div className="col-md-3">
                      <div className="form-group">
                        <label className="text-black" >Filtrar por Cliente</label>
                        <select
                          className="form-control"
                          value={this.state.clientFilter}
                          onChange={(e) => {
                            this.setState({ clientFilter: e.target.value });
                          }}
                        >
                          {this.state.clientSelector.map((client: any, index: number) => {
                            return <option key={index} value={client._id}>{client.name}</option>;
                          })
                          }
                        </select>
                      </div>
                    </div></> : null}
                    

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


