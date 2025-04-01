import AppContainer from '../../container/AppContainer';
import TrackingBasePage from "../Utils/TrackingBasePage";
import {RouteComponentProps} from "react-router";
import {connect} from "react-redux";
import * as React from "react";
import ApiService from "../../utils/axios";
import CopyText from '../Utils/CopyText';
import DataTable from 'react-data-table-component';
import * as moment from "moment-timezone";
import {IWindow} from "../../interfaces/window";
import DateRangeInput from '../Utils/DateRangeInput';
import BootstrapSelect from '../Utils/BootstrapSelect';
import { hasPermission } from '../../utils/common';
import * as XLSX from 'xlsx-color';

declare let window: IWindow;

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
}

interface IStateType {
  error: Error | null;
  originalUnits: any[];
  units: any[];
  blFilter: string;
  containerFilter: string;
  shipFilter: string[];
  tripFilter:string[];
  venueFilter:string;
  containerUpdated: any;
  clientFilter: string;
  unitFilter:string;
  clientSelector: any[];
  venueSelector: any[];
  tripSelector: any[];
  shipSelector: any[];
  statusFilter: string;
  endDate: Date;
  startDate: Date;
  selectedContainer: number;
  isFilteringByDate: boolean;
  loading: boolean;
  isUserHandler:boolean;
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

const excelHeaders = [
  "Código de unidad",
  "Marca",
  "Modelo",
  "Contenedor",
  "BL",
  "Sucursal",
  "F. Descarga",
  "F. Despacho",
  "Estado"
];

const columns = [
  {
    name: 'Código de unidad',
    selector: (row: any) => {
      return <CopyText value={row.car.vin}>
      <strong
        className="text-primary text-underline">
        {row.car.vin}
      </strong>
    </CopyText>;
    }
  },
  {
    name: 'Marca',
    selector: (row: any) => {
      return row.car.brand;
    }
  },
  {
    name: 'Modelo',
    selector: (row: any) => row.car.denomination,
  },
  {
    name: 'Contendor',
    selector: (row: any) => row.inventoryCar.extra["BIC"],
  }, {
    name: 'BL',
    selector: (row: any) => row.inventoryCar.extra["N° BL"],
  }, 
  {
    name: 'Nave',
    selector: (row: any) => row.inventoryCar.extra["Nave"],
  }, {
    name: 'Cliente',
    selector: (row: any) => row.inventoryCar.extra["Cliente Razón Social"],
  },{
    name: 'Sucursal',
    selector: (row: any) => row.inventoryCar.venue.name,
  }, {
    name: 'F. Descarga',
    selector: (row: any) => {
      return row.histories.find((history:any) => history.status === "readyToClient")?.createdAt ? formaDate(row.histories.find((history:any) => history.status === "readyToClient")?.createdAt) : "-";
    },
    sortable: true,
    sortFunction: (a: any, b: any) => {
      const dateA = a.histories.find((history:any) => history.status === "readyToClient")?.createdAt
      const dateB = b.histories.find((history:any) => history.status === "readyToClient")?.createdAt
      return moment(dateA).isAfter(dateB) ? 1 : -1;
    }
  },{
    name: 'F. Despacho',
    selector: (row: any) => {
      return row.histories.find((history:any) => history.status === "inTransit")?.createdAt ? formaDate(row.histories.find((history:any) => history.status === "inTransit")?.createdAt) : "-";
    },
    sortable: true,
    sortFunction: (a: any, b: any) => {
      const dateA = a.histories.find((history:any) => history.status === "inTransit")?.createdAt
      const dateB = b.histories.find((history:any) => history.status === "inTransit")?.createdAt
      return moment(dateA).isAfter(dateB) ? 1 : -1;
    }
  }, {
    name: 'Estado',
    selector: (row: any) => {
      return row.status;
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
      return row.inventoryCar.containerFound;
    },
    cell: (row: any) => {
      return row.histories.filter((history: any) => history.status === "readyToClient" ) && <button className="btn btn-m btn-default" onClick={() => {
        window.open(`/api/inventory/${row.inventoryCar.inventory}/container/tarja/${row.inventoryCar.containerFound.car}`, '_blank')
      }}>
      <i className="fa fa-fw fa-print" /> Tarja
    </button>
    }
  },
];

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
      shipFilter: [],
      venueFilter: '',
      tripFilter: [],
      containerUpdated: {},
      clientFilter: '',
      clientSelector: [],
      shipSelector: [],
      tripSelector: [],
      venueSelector: [],
      isUserHandler:false,
      endDate: moment().toDate(),
      startDate: moment().toDate(),
      statusFilter: '',
      isFilteringByDate:false,
      selectedContainer: -1,
    };
    this.downloadData = this.downloadData.bind(this);
  }

    cleanFilters = () => {
    this.setState({
      blFilter: '',
      containerFilter: '',
      statusFilter: '',
      unitFilter: '',
      shipFilter: [],
      tripFilter: [],
      venueFilter: '',
      startDate: moment().toDate(),
      endDate: moment().toDate(),
      isFilteringByDate: false
    });
  }

  componentDidMount() {
    super.componentDidMount();
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
      let venueOptions:any[] = []
      let shipOptions:any[] = []
      let tripOptions:any[] = []
      let units = data.data.cars.map((datum:any) => {
        let inventoryCar = datum.histories.find((history:any) => history.status === "readyToClient")?.inventoryCar;
        let status = datum.histories.sort((a:any, b:any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].status;
        let car = datum.car;
        let histories = datum.histories;
       
        if(!venueOptions.includes(inventoryCar.venue?.name)) venueOptions.push(inventoryCar.venue?.name)
        if(!tripOptions.includes(inventoryCar.extra["N° Viaje"].toString().toLowerCase())) tripOptions.push(inventoryCar.extra["N° Viaje"].toString().toLowerCase())
        if(!shipOptions.includes(inventoryCar.extra["Nave"].toString().toLowerCase())) shipOptions.push(inventoryCar.extra["Nave"].toString().toLowerCase())

        return {
          inventoryCar,
          car,
          histories,
          status
        }
      })

      
        this.setState({
            units: units,
            originalUnits: units,
            loading: false,
            venueSelector:venueOptions,
            shipSelector:shipOptions,
            tripSelector:tripOptions
          })
        this.cleanFilters()
    })
  }

  componentDidUpdate(prevProps: Readonly<IPropsType>, prevState: Readonly<IStateType>, snapshot?: any) {
    if (this.state.blFilter !== prevState.blFilter ||
      this.state.containerFilter !== prevState.containerFilter ||
      this.state.statusFilter !== prevState.statusFilter ||
      this.state.unitFilter !== prevState.unitFilter ||
      this.state.tripFilter !== prevState.tripFilter ||
      this.state.shipFilter !== prevState.shipFilter ||
      this.state.startDate !== prevState.startDate ||
      this.state.venueFilter !== prevState.venueFilter ||
      this.state.endDate !== prevState.endDate) {
      this.filterUnits();
    }
    if(this.state.clientFilter !== prevState.clientFilter){
        this.getUnitsByCompanyId(this.state.clientFilter)
    }
  }

  filterUnits() {
    let units = this.state.originalUnits.filter((unit: any) => {
      let bl = unit.inventoryCar.extra["N° BL"] ? unit.inventoryCar.extra["N° BL"].toLowerCase().includes(this.state.blFilter.toLowerCase()) : true;
      let ship = this.state.shipFilter.length == 0 ? true : (unit.inventoryCar.extra["Nave"] ? unit.inventoryCar.extra["Nave"].toLowerCase().includes(this.state.shipFilter[0].toLowerCase()) : false);
      let trip = this.state.tripFilter.length === 0 ? true  : (unit.inventoryCar.extra["N° Viaje"] ? unit.inventoryCar.extra["N° Viaje"].toLowerCase().includes(this.state.tripFilter[0].toLowerCase()) : false);
      let containerFilter = unit.inventoryCar.extra["BIC"].toLowerCase().includes(this.state.containerFilter.toLowerCase());
      let statusFilter = this.state.statusFilter === '' ? true : unit.status === this.state.statusFilter;
      let unitFilter = this.state.unitFilter === '' ? true : unit.car.vin.toLowerCase().includes(this.state.unitFilter.toLowerCase());
      let venueFilter = this.state.venueFilter === '' ? true : unit.inventoryCar.venue.name.toLowerCase().includes(this.state.venueFilter.toLowerCase());
      let dateFilter = true;
      if (this.state.isFilteringByDate) {
        const dwonloadDate = unit.histories.find((history:any) => history.status === "readyToClient")?.createdAt
        const shippingDate = unit.histories.find((history:any) => history.status === "inTransit")?.createdAt
        if (dwonloadDate || shippingDate) {
          let startDate = this.state.startDate? new Date(this.state.startDate) : null;
          let endDate = this.state.endDate ? new Date(this.state.endDate) : null;
          dateFilter = ((!startDate || new Date(dwonloadDate) >= startDate) && (!endDate || new Date(dwonloadDate) <= endDate) || (!startDate || new Date(shippingDate) >= startDate) && (!endDate || new Date(shippingDate) <= endDate));
        } else {
          dateFilter = false;
        }
      }
      return bl && containerFilter && statusFilter && unitFilter && trip && venueFilter && dateFilter && ship;
    });

    this.setState({
        units: units
    });
  }

  private downloadData(): void {
    const { units, clientFilter, clientSelector } = this.state
    let rows = [
      [...excelHeaders]
    ];


    let client = window.user.company.handler ?
      clientSelector.find((client:any) => client._id === clientFilter) :
      clientSelector[0]

    units.map((container: any) => {
      let row = [
        container.car.vin,
        container.car.brand,
        container.car.denomination,
        container.inventoryCar.extra["BIC"],
        container.inventoryCar.extra["N° BL"],
        container.inventoryCar.venue.name,
        container.histories.find((history:any) => history.status === "readyToClient")?.createdAt ? formaDate(container.histories.find((history:any) => history.status === "readyToClient")?.createdAt) : "-",
        container.histories.find((history:any) => history.status === "inTransit")?.createdAt ? formaDate(container.histories.find((history:any) => history.status === "inTransit")?.createdAt) : "-",
        inventorySettings.hasOwnProperty(container.status)
          ? inventorySettings[container.status]
          : container.status
      ];
      rows.push(row);
    });

    /* make the worksheet */
    const ws = XLSX.utils.aoa_to_sheet(rows);

    /* add to workbook */
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resumen Contenedores');
    /* generate an XLSX file */
    XLSX.writeFile(wb, `${client.name}_units.xlsx`);
  }



  render() {
    const {units, loading, isUserHandler} = this.state;

    return (
      <AppContainer title="" cMenu="6" cSubMenu="6.2">
        <section className="content">
          <div className="box">
            <div className="box-header with-border flex flex-space-between">
              <h3 className="box-title">
                Unidades Desconsolidadas <span className="font-12"
                                               style={{ color: 'gray', fontWeight: '600' }}>{units?.length}</span>
              </h3>
              <div className="pull-right box-tools">
                    < button
                      style={{ marginRight: '10px' }}
                      className="btn btn-sm btn-primary"
                      onClick={this.downloadData}>
                      <i className="fa fa-fw fa-download" /> Descargar Excel
                    </button>
              </div>
            </div>
            {loading ?
              <div className="overlay">
                <i className="fa fa-refresh fa-spin" />
              </div>
              : <>
                <div className="box-body">
                  <div className="row" style={{ margin: '10px 0' }}>
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
                          <option value="inTransit">En Transito</option>
                      </select>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="form-group">
                        <label className="text-black">Filtrar por nave</label>
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
                        <label className="text-black">Filtrar por viaje</label>
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
                        <label className="text-black">Filtrar por Sucursal</label>
                        <select
                            className="form-control"
                            value={this.state.venueFilter}
                            onChange={(e) => {
                              this.setState({ venueFilter: e.target.value });
                            }}
                          >
                            {this.state.venueSelector.map((venue: any, index: number) => {
                              return <option key={index} value={venue}>{venue}</option>;
                            })
                            }
                          </select>
                      </div>
                    </div>
                    {isUserHandler?
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
                            {this.state.clientSelector.map((client: any, index: number) => {
                              return <option key={index} value={client._id}>{client.name}</option>;
                            })
                            }
                          </select>
                        </div>
                      </div>

                 : null}
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
                        <div className="row pull-right box-tools" style={{ paddingRight: "16px" }}>
                          <button
                            className="btn btn-sm btn-primary btn-block"
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
    "inTransit": "En Tránsito",
    "inTransitClassContainer": "empty",
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


