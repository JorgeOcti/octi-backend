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
import { Dispatch } from 'redux';
import {
  DashboardReduxAction,
  getParticipant,
  IDashboardState
} from '../../actions/dashboard.actions';
import ShowIf from '../Utils/ShowIf';
import ModalView from '../Modal/ModalView';
import Checkbox from '../Utils/CheckBox';

declare let window: IWindow;

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<DashboardReduxAction>;
  getParticipant(id: string): void;
  dashboard: IDashboardState;
}

interface IStateType {
  error: Error | null;
  originalUnits: any[];
  units: any[];
  paginationPage: number;
  paginationPageSize: number;
  totalRows: number;

  sortColumn: string;
  sortDirection: 'asc' | 'desc';

  sort:Record<string, string>;
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
  filterHasDamage:boolean;
  isFilteringByDate: boolean;
  loading: boolean;
  multiCompany:boolean;
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
  selectAllRowsItem: false,
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
      paginationPage: 1,
      paginationPageSize: 10,
      totalRows: 0,
      sortColumn: 'Descarga',
      sortDirection: 'asc',
      sort:{},
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
      multiCompany:false,
      filterHasDamage:false,
      endDate: moment().toDate(),
      startDate: moment().subtract(1, 'month').startOf('month').toDate(),
      statusFilter: '',
      isFilteringByDate:true,
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
      filterHasDamage: false,
    });
  }

  componentDidMount() {
    super.componentDidMount();
    const { company } = window.user
    if (company?.handler) {
      // En caso de ser usuario handler filtro por el primer cliente del listado
      this.setState({
        multiCompany: true,
        clientFilter: company?.clientCompanies[0]._id,
        clientSelector: company?.clientCompanies
      },() => {
        this.getUnitsByCompanyId(1);
      });
    } else {
      if (company && company._id) {
        const companyList = window.user.companiesAccess.length > 1 ? window.user.companiesAccess : [{ _id: company._id, name: company.name }]
        this.setState({
          multiCompany: companyList.length > 1,
          clientFilter: companyList[0]._id,
          clientSelector: companyList
        }, () => {
          this.getUnitsByCompanyId(1)
        })
      }
    }
  }

  handleSort = (column: any, sortDirection: any) => {

    let keyName = '';

    switch (column.name) {
      case 'Descarga':
         keyName = 'readyToClientHistories.executedAt';
        break;
      case 'F. Despacho':
         keyName = 'inTransitHistories.executedAt';
        break;
      case 'Estado':
        keyName = 'status';
        break;
    }

    this.setState(prevState => {
      const newSort = { ...prevState.sort };
      if (newSort[keyName]) {
        if (newSort[keyName] === 'asc') {
          newSort[keyName] = 'desc';
        } else {
          delete newSort[keyName];
        }
      } else {
        newSort[keyName] = 'asc';
      }
      return { sort: newSort };
    });

    const {paginationPage, paginationPageSize} = this.state;
    this.getUnitsByCompanyId(paginationPage, paginationPageSize);
	};


  formatSortQuery(sortObject: Record<string, string>): string {
    const sortParts: string[] = [];
    for (const field in sortObject) {
      if (Object.prototype.hasOwnProperty.call(sortObject, field)) {
        const direction = sortObject[field];
        const prefix = direction === 'asc' ? '+' : '-'; // '+' asc, '-' desc
        sortParts.push(`${prefix}${field}`);
      }
    }
    return sortParts.length > 0 ? `sort=${sortParts.join('&sort=')}` : '';
  }


  getUnitsByCompanyId(page: number = 1, pageSize: number = 10) {

    this.setState({ loading: true })
    const api: ApiService = new ApiService();
    api.getSource()

    const companyId = this.state.clientFilter || window.user.company._id;
    const sortQuery = this.formatSortQuery(this.state.sort)

    api.getUnitsByCompany(companyId, page, pageSize, sortQuery).then((data: any) => {
      let venueOptions: any[] = []
      let shipOptions: any[] = []
      let tripOptions: any[] = []
      let units = data.data.cars.map((datum: any) => {
        let histories = datum.histories.filter((h?: any) => h).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        let inventoryCar = histories.find((history: any) => history.status === "readyToClient")?.inventoryCar;
        // Sorting histories by createdAt in descending order
        let status = histories[0].status;
        let car = { ...datum };
        let venue = histories[0].inventoryCar.venue ?? histories[0].participant.venue ?? null;
        car.venue = venue.name ?? ""
        car.lastDate = histories[0].createdAt;

        console.log("car", car)

        if (car.venue && !venueOptions.includes(car.venue)) {
          venueOptions.push(car.venue)
        }

        if (!tripOptions.includes(inventoryCar?.extra["N° Viaje"].toString().toLowerCase())) tripOptions.push(inventoryCar?.extra["N° Viaje"].toString().toLowerCase())
        if (!shipOptions.includes(inventoryCar?.extra["Nave"].toString().toLowerCase())) shipOptions.push(inventoryCar?.extra["Nave"].toString().toLowerCase())

        return {
          inventoryCar,
          car,
          histories,
          status
        }
      });

      console.log("units", units)

      this.setState({
        totalRows: data.data.count,
        units: units,
        originalUnits: units,
        loading: false,
        venueSelector: venueOptions,
        shipSelector: shipOptions,
        tripSelector: tripOptions
      });

      this.cleanFilters();
    });
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
      this.state.filterHasDamage !== prevState.filterHasDamage ||
      this.state.endDate !== prevState.endDate) {
      this.filterUnits();
    }
    if(!prevState.loading && this.state.clientFilter !== prevState.clientFilter){
       this.getUnitsByCompanyId(1);
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
      let venueFilter = this.state.venueFilter === '' ? true : unit.car.venue.toLowerCase().includes(this.state.venueFilter.toLowerCase());

      const historyReadyToClient = unit.histories.find((history:any) => history.status === "readyToClient")
      const historyInTransit = unit.histories.find((history:any) => history.status === "inTransit")

      let damageFilter = true
      if(this.state.filterHasDamage){
        //const damageReadyToClient = unit.content?.filter((e:any) => e.participant?.hasDamages).length === 0 ? false : true
        const damageReadyToClient = historyReadyToClient?.inventoryCar.participant?.hasDamages? true : false;
        const damageinTransit = historyInTransit?.participant?.hasDamages? true : false;
        if(!damageReadyToClient && !damageinTransit) damageFilter = false
      }

      let dateFilter = true;
      if (this.state.isFilteringByDate) {
        dateFilter = moment(unit.car.lastDate).isBetween(this.state.startDate, this.state.endDate, 'day', '[]');
      }
      console.log(
        bl,
        containerFilter,
        statusFilter,
        unitFilter,
        trip,
        venueFilter,
        dateFilter,
        ship,
        damageFilter
      )
      return bl && containerFilter && statusFilter && unitFilter && trip && venueFilter && dateFilter && ship && damageFilter;
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
    const {units, loading, multiCompany, totalRows} = this.state;
    const { getParticipant } = this.props;

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
      },
      {
        name: 'Viaje',
        selector: (row: any) => row.inventoryCar.extra["N° Viaje"],
      },{
        name: 'Cliente',
        selector: (row: any) => row.inventoryCar.extra["Cliente Razón Social"],
      },{
        name: 'Sucursal',
        selector: (row: any) => row.inventoryCar.venue.name,
      },{
        id: "date",
        name: 'Descarga',
        selector: (row: any) => {
          return row.histories.find((history:any) => history.status === "readyToClient")?.createdAt ? formaDate(row.histories.find((history:any) => history.status === "readyToClient")?.createdAt) : "-";
        },
        cell: (row: any) => {
          const data = row.histories.find((history:any) => history.status === "readyToClient")?.createdAt ? row.histories.find((history:any) => history.status === "readyToClient") : "-";
          return <div
                    key={row._id}
                    className={data.inventoryCar.participant ? "div-date date-checklist" : "div-date"}
                    onClick={data.inventoryCar.participant ? () => getParticipant(data.inventoryCar.participant._id) : () => {}}
                    >
                      <span className='text-center center text-date' style={{ display: data.inventoryCar.participant ? 'none' : ''}}>{data.createdAt ? formaDate(data.createdAt) : "-"}</span>
                      <div
                        className="btn btn-xs btn-transparent text-date"
                        style={{ display: data.inventoryCar.participant ? '' : 'none' }}

                      >
                        {data.createdAt ? formaDate(data.createdAt) : "-"}
                          <ShowIf condition={data.inventoryCar.participant?.hasDamages}>
                            <React.Fragment>
                              {' '}
                              <i
                                className="fa fa-warning text-red pointer"
                                data-toggle="tooltip"
                                data-placement="top"
                                title="Daños encontrados en esta revisión."
                              />
                            </React.Fragment>
                          </ShowIf>
                          <ShowIf condition={!data.inventoryCar.participant?.hasDamages}>
                            <React.Fragment>
                              {' '}
                              <i className="fa fw fa-checklist-blue" style={{marginLeft: "5px"}}/>
                            </React.Fragment>
                          </ShowIf>
                      </div>
                  </div>
        },
        sortable: true,
        sortField: 'descarga',
        'min-width': '140px'
      },{
        name: 'F. Despacho',
        selector: (row: any) => {
          return row.histories.find((history:any) => history.status === "inTransit")?.createdAt ? formaDate(row.histories.find((history:any) => history.status === "inTransit")?.createdAt) : "-";
        },
        cell: (row: any) => {
          const data = row.histories.find((history:any) => history.status === "inTransit")?.createdAt ? row.histories.find((history:any) => history.status === "inTransit") : "-";
          return <div
                    key={row._id}
                    className={data.participant ? "div-date date-checklist" : "div-date"}
                    onClick={data.participant ? () => getParticipant(data.participant._id) : () => {}}
                    >
                      <span className='text-center center text-date' style={{ display: data.participant ? 'none' : '' }}>{data.createdAt ? formaDate(data.createdAt) : "-"}</span>
                      <div
                        className="btn btn-xs btn-transparent text-date"
                        style={{ display: data.participant ? '' : 'none'}}

                      >
                        {data.createdAt ? formaDate(data.createdAt) : "-"}
                        <ShowIf condition={data.participant?.hasDamages}>
                          <React.Fragment>
                            {' '}
                            <i
                              className="fa fa-warning text-red pointer"
                              data-toggle="tooltip"
                              data-placement="top"
                              title="Daños encontrados en esta revisión."
                            />
                          </React.Fragment>
                        </ShowIf>
                        <ShowIf condition={!data.participant?.hasDamages}>
                          <React.Fragment>
                            {' '}
                            <i className="fa fw fa-checklist-blue" style={{marginLeft: "5px"}}/>
                          </React.Fragment>
                        </ShowIf>
                      </div>
                  </div>
        },
        sortable: true,
        sortField: 'f. despacho',
        'min-width': '140px'
      }, {
        name: 'Estado',
        sortField: 'estado',
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

    return (
      <AppContainer title={
        <div style={{ width: '180px' }}>
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
      }
          cMenu="6" cSubMenu="6.2">
        <section className="content">
          <div className="box">
            <div className="box-header with-border flex flex-space-between">
              <h3 className="box-title">
                Unidades Desconsolidadas <span className="font-12"
                                               style={{ color: 'gray', fontWeight: '700' }}>{totalRows}</span>
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
                          <option value="">Todas</option>
                          {this.state.venueSelector.map((venue: any, index: number) => {
                            return <option key={index} value={venue}>{venue}</option>;
                          })
                          }
                        </select>
                      </div>
                    </div>

                    {multiCompany?
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
                  <div className='col-md-3'>
                      <div className="checkbox">
                        <label
                          style={{ paddingLeft: '0', fontWeight: 600 }}
                          onClick={() => {}}>
                          <Checkbox
                            active={this.state.filterHasDamage}
                            action={() => {this.setState({filterHasDamage: !this.state.filterHasDamage})}}
                            classes="icheck-in-checkbox"
                            style={{ marginTop: '-4px', marginRight: '5px' }}
                          />
                          Mostrar solo unidades con daño
                        </label>
                      </div>
                    </div>
                    <div className="col-md-9">
                      <div className='form-group'>
                        <div className="row pull-right box-tools" style={{ paddingTop: "20px", paddingRight: "16px" }}>
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
                        
                        paginationServer={true}
                        paginationTotalRows={this.state.totalRows}
                        sortServer={true}
                        onSort={this.handleSort}

                        // paginationComponentOptions={paginationComponentOptions}
                        //sortColumn={this.state.sortColumn} // Pasa la columna actualmente ordenada
                        //sortDirection={this.state.sortDirection} // Pasa la dirección del ordenamiento
                        //sortActive={this.state.sortColumn} // Para asegurar que el icono se muestre en la columna correcta
                        // defaultSortAsc={true}
                        //persistTableHead={true}
                        //noHeader={false}
                        //noContextMenu={true}

                        onChangePage={(page: number) => {
                          this.getUnitsByCompanyId(page);
                        }}
                        onChangeRowsPerPage={(newPerPage: number, page: number) => {
                          this.setState({
                            paginationPage: page,
                            paginationPageSize: newPerPage
                          }, () => {
                            this.getUnitsByCompanyId(page, newPerPage)
                          });
                        }}
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


