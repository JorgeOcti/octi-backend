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
  dataLoading: boolean;
  sort: {
    sortColumn: string;
    sortDirection: 'asc' | 'desc';
  };
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
  filters: any;
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
  timer: any = null;
  constructor(props: IPropsType) {
    super(props);
    this.state = {
      loading: true,
      filters: {},
      dataLoading: true,
      error: null,
      originalUnits: [],
      units: [],
      paginationPage: 1,
      paginationPageSize: 50,
      totalRows: 0,
      sort:{
        sortColumn: 'createdAt',
        sortDirection: 'desc'
      },
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
    this.changeFilter = this.changeFilter.bind(this);
    this.getFilterDate = this.getFilterDate.bind(this);
  }

    cleanFilters = (update = false) => {
    this.setState({
      filters: {},
      dataLoading: update,
    }, () => {
      if (update) {
        this.getUnitsByCompanyId();
      }
    });
  }

  componentDidMount() {
    super.componentDidMount();
    this.setState({ loading: true })
    const { company } = window.user
    if (company?.handler) {
      // En caso de ser usuario handler filtro por el primer cliente del listado
      this.setState({
        multiCompany: true,
        clientFilter: company?.clientCompanies[0]._id,
        clientSelector: company?.clientCompanies,
      },() => {
        this.getUnitsByCompanyId();
      });
    } else {
      if (company && company._id) {
        const companyList = window.user.companiesAccess.length > 1 ? window.user.companiesAccess : [{ _id: company._id, name: company.name }]
        this.setState({
          multiCompany: companyList.length > 1,
          clientFilter: companyList[0]._id,
          clientSelector: companyList,
          dataLoading: true,
        }, () => {
          this.getUnitsByCompanyId();
        })
      }
    }
    this.setState({ loading: false })
  }

  handleSort = (column: any, sortDirection: any) => {
    this.setState({
      dataLoading: true,
      sort: {
        ...this.state.sort,
        sortColumn: column.name,
        sortDirection: sortDirection
      }
    }, () => {
      this.getUnitsByCompanyId();
    });
	}


  getUnitsByCompanyId() {

    const api: ApiService = new ApiService();
    api.getSource()

    const companyId = this.state.clientFilter || window.user.company._id;
    const page = this.state.paginationPage || 1;
    const pageSize = this.state.paginationPageSize || 50;
    const sortField = this.state.sort.sortColumn || '';
    const sortDirection : 'asc' | 'desc' = this.state.sort.sortDirection || 'desc';

    api.getUnitsByCompany(companyId, page, pageSize, {...this.state.filters,...this.getFilterDate()}, sortField, sortDirection ).then((data: any) => {
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

      this.setState({
        totalRows: data.data.count,
        units: units,
        originalUnits: units,
        dataLoading: false,
        venueSelector: venueOptions,
        shipSelector: shipOptions,
        tripSelector: tripOptions
      });
    });
  }

  private getFilterDate(): any {
    return {
      startDate: this.state.startDate ? moment(this.state.startDate).format('YYYY-MM-DD') : '',
      endDate: this.state.endDate ? moment(this.state.endDate).format('YYYY-MM-DD') : ''
    };
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


  private changeFilter(name: string, value: any) {
    this.setState((prevState) => ({
      dataLoading: true,
      filters: {
        ...prevState.filters,
        [name]: value
      }
    }), () => {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.getUnitsByCompanyId();
      }, 500);
    });
  }



  render() {
    const {units, loading, multiCompany, totalRows, filters} = this.state;

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
        name: 'F. Descarga',
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
        sortField: 'f. descarga',
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
                dataLoading: true,
                startDate: start,
                endDate: end,
              }, () => {
                this.getUnitsByCompanyId();
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
            { loading ?
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
                          name={'blFilter'}
                          value={filters.blFilter || ''}
                          onChange={(e) => {
                            this.changeFilter(e.target.name, e.target.value);
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
                          name={'containerFilter'}
                          value={filters.containerFilter || ''}
                          onChange={(e) => {
                            this.changeFilter(e.target.name, e.target.value);
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
                          name={'unitFilter'}
                          value={filters.unitFilter || ''}
                          onChange={(e) => {
                            this.changeFilter(e.target.name, e.target.value);
                          }}
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="form-group">
                      <label className="text-black" >Filtrar por Estado</label>
                      <select
                          className="form-control"
                          value={filters.statusFilter || ''}
                          name={'statusFilter'}
                          onChange={(e) => {
                            this.changeFilter('statusFilter', e.target.value);
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
                          selected={filters.shipFilter || []}
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
                            this.changeFilter('shipFilter', [selected]);
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
                          selected={filters.tripFilter || []}
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
                            this.changeFilter('tripFilter', [selected]);
                          }}
                         />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="form-group">
                        <label className="text-black">Filtrar por Sucursal</label>
                        <select
                          className="form-control"
                          name={'venueFilter'}
                          value={filters.venueFilter || ''}
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
                              this.setState({ clientFilter: e.target.value, dataLoading: true }, () => {
                                this.cleanFilters(true);
                              })
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
                            active={filters.filterHasDamage }
                            action={() => {
                              this.changeFilter('filterHasDamage', !filters.filterHasDamage);
                            }}
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
                            onClick={() => {
                              this.cleanFilters(true);
                            }}
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
                        progressComponent={<div className="text-center"><i className="fa fa-spinner fa-spin fa-3x"/></div>}
                        progressPending={this.state.dataLoading}
                        paginationComponentOptions={paginationComponentOptions}
                        columns={columns}
                        data={units}
                        customStyles={dataTableStyle}
                        pagination
                        paginationServer={true}
                        paginationRowsPerPageOptions={ [this.state.paginationPageSize, 100, 200]}
                        paginationTotalRows={this.state.totalRows}
                        paginationPerPage={ this.state.paginationPageSize}
                        sortServer={true}
                        onSort={this.handleSort}
                        onChangePage={(page: number) => {
                          this.setState({
                            paginationPage: page,
                            dataLoading: true
                          }, () => {
                            this.getUnitsByCompanyId();
                          });
                        }}
                        onChangeRowsPerPage={(newPerPage: number, page: number) => {
                          this.setState({
                            paginationPage: 1,
                            paginationPageSize: newPerPage
                          }, () => {
                            this.getUnitsByCompanyId()
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


