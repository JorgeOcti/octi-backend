import AppContainer from '../../container/AppContainer';
import TrackingBasePage from "../Utils/TrackingBasePage";
import { RouteComponentProps } from "react-router";
import * as React from "react";
import ApiService from "../../utils/axios";
import { IInventory } from "../../../../../../src/inventory/interfaces/inventory.interface";
import { IInventorySetting } from '../../../../../../src/app/interfaces/teamSetting.interface';
import DataTable from 'react-data-table-component';
import * as moment from "moment-timezone";
import { hasPermission } from "../../utils/common";
import { IWindow } from "../../interfaces/window";
import DateRangeInput from '../Utils/DateRangeInput';
import BootstrapSelect from '../Utils/BootstrapSelect';
import swal = require('sweetalert');
import { Link } from 'react-router-dom';


declare let window: IWindow;

export type CarStatusType = Extract<keyof IInventorySetting, string>;

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
}

interface IStateType {
  error: Error | null;
  summaryInventory: any[];
  originalSummary: any[];
  containerUpdated: any;
  statusFilterSelected: string[],
  selectedContainer: number;
  shipFilter: string[];
  shipSelector: any[];
  inventorySettings: any;
  loading: boolean;
  endDate: Date;
  startDate: Date;
  isFilteringByDate: boolean;
}

const dataTableStyle = {
  headRow: {
    style: {
      display: 'none',
    }
  },
  rows: {
    style: {
      backgroundColor: "#ffffff",
      border: "1px solid #DADADA",
      marginTop: "10px",
      borderRadius: '5px',
      padding: '0px',
      marginBottom: "10px"
    }
  },
  cells: {
    style: {
      padding: '0px',
    },
  }
};

const paginationComponentOptions = {
  rowsPerPageText: 'Filas por página',
  rangeSeparatorText: 'de',
  selectAllRowsItem: true,
  selectAllRowsItemText: 'Todos',
};

const getDateRangeOptions = (): daterangepicker.Options => {
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

class InventoryManagement extends TrackingBasePage<IPropsType, IStateType> {

  title = "Revisión Containers";

  private statusText: any = {
    'pending': 'Pendientes',
    'found': 'Encontrado',
    'open': 'Abierto',
    'check': 'Descarga',
    'empty': 'Vacío',
    'empty(*)': 'Vacío(*)',
    'hasDamages': 'Con Daños',
  };
  private readonly columns: any[] = [];

  constructor(props: IPropsType) {
    super(props);
    this.state = {

      summaryInventory: [],
      originalSummary: [],
      loading: true,
      error: null,
      containerUpdated: {},
      statusFilterSelected: [],
      shipFilter: [],
      shipSelector: [],
      selectedContainer: -1,
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
    };

    this.columns = [
      {
        name: 'data',
        cell: (row: any) => {
          style: { }
          return this.formatData(row);
        }
      }
    ];

  }


  private formatData(row: {
    unit: any;
    container: any;
    results: any;
    file: boolean;
    createdBy: any;
    createdAt: moment.MomentInput;
    finalizedAt: moment.MomentInput;
    finalizedBy: any;
    name: string; containerStatus: any; status: any; inventory: string; _id: string; car: { _id: string; }; labelText: {} | null | undefined;
  }) {




    return <div className="container-fluid col-md-12">
      <div className="row">
        <div className="col-md-10">
          <Link to={`/inventory/management/${row._id}/`}>
            <h4 className='text-left text-primary pointer'>{row.name}</h4>
          </Link>
        </div>
        <div className="col-md-2">
          <div className='text-right summary-label-status-p-top'>
            {this.labelStatus(row.status)}
          </div>
        </div>
      </div>

      <div className="row summary-label-created-absolute">
        <div className="col-md-3 text-left">
          <div className={'detail-info  text-muted'}>
            <i className="fa fa-fw fa-clock-o text-primary" />
            Creado el{' '}
            {moment(row.createdAt).format('LLL')}
          </div>
        </div>
        <div className="col-md-4 text-left">
          <div className={'detail-info  text-muted'}>
            {row.createdBy ? (
              <React.Fragment>
                <i className="fa fa-fw fa-user" />
                Por {row.createdBy.fullName?.toLocaleUpperCase()}
                <br />
              </React.Fragment>
            ) : null}
          </div>
        </div>

        <div className="col-md-3 text-left summary-label-finalized">
          <div className={'detail-info  text-muted'}>
            <i className="fa fa-fw fa-clock-o text-success" />
            {row.finalizedAt ? (
              <React.Fragment>
                Finalizado el{' '}
                {moment(row.finalizedAt).format(
                  'LLL'
                )}
              </React.Fragment>
            ) : ' - '}
          </div>
        </div>
      </div>

      <div className="row container-row-wrapper">
        <div className="col-md-7">
          <div className='row container-row-b-padding'>
            <div className='col-md-12'>
              <i className="fa fa-container-red" />
              <strong>
                Contenedores
              </strong>
            </div>
          </div>
          <div className='row'>
            <div className='col-md-12 text-center'>
              <div className='row'>
                <div className='col-md-3'>
                  <div className='row'>
                    <div className='col-md-12'>
                      <strong className='text-primary h4'>
                        Pendientes
                      </strong>
                    </div>
                    <div className='col-md-12'>
                      <strong className='text-primary h2'>
                        {row.container.pending}
                      </strong>
                    </div>
                  </div>
                </div>
                <div className='col-md-2'>
                  <div className='row'>
                    <div className='col-md-12'>
                      <strong className='text-orange h4'>
                        Abierto
                      </strong>
                    </div>
                    <div className='col-md-12'>
                      <strong className='text-orange h2'>
                        {row.container.open}
                      </strong>
                    </div>
                  </div>
                </div>
                <div className='col-md-3'>
                  <div className='row'>
                    <div className='col-md-12'>
                      <strong className='text-yellow h4'>
                        Descarga
                      </strong>
                    </div>
                    <div className='col-md-12'>
                      <strong className='text-yellow h2'>
                        {row.container.check}
                      </strong>
                    </div>
                  </div>
                </div>
                <div className='col-md-2'>
                  <div className='row'>
                    <div className='col-md-12'>
                      <strong className='text-green h4'>
                        Vacíos
                      </strong>
                    </div>
                    <div className='col-md-12'>
                      <strong className='text-green h2'>
                        {row.container.empty}
                      </strong>
                    </div>
                  </div>
                </div>
                <div className='col-md-2'>
                  <div className='row'>
                    <div className='col-md-12'>
                      <strong className='text-green h4'>
                        Vacíos*
                      </strong>
                    </div>
                    <div className='col-md-12'>
                      <strong className='text-green h2'>
                        {row.container['empty(*)']}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-5 div-border-left">
          <div className='row div-row-padding'>
            <div className='col-md-12'>
              <i className="fa fa-cube unit-icon-margin" />
              <strong>
                Unidades
              </strong>
            </div>
          </div>
          <div className='row'>
            <div className='col-md-12'>
              <div className='row text-center'>
                <div className='col-md-4'>
                  <div className='row'>
                    <div className='col-md-12'>
                      <strong className='text-primary h4'>
                        Pendientes
                      </strong>
                    </div>
                    <div className='col-md-12'>
                      <strong className='text-primary h2'>
                        {row.unit.pending}
                      </strong>
                    </div>
                  </div>
                </div>
                <div className='col-md-4'>
                  <div className='row'>
                    <div className='col-md-12'>
                      <strong className='text-green h4'>
                        Encontrados
                      </strong>
                    </div>
                    <div className='col-md-12'>
                      <strong className='text-green h2'>
                        {row.unit.found}
                      </strong>
                    </div>
                  </div>
                </div>
                <div className='col-md-4'>
                  <div className='row'>
                    <div className='col-md-12'>
                      <strong className='has-damages h4'>
                        Con Daños
                      </strong>
                    </div>
                    <div className='col-md-12'>
                      <strong className='has-damages h2'>
                        {row.unit.hasDamages}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
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
    super.componentDidMount();
    const api: ApiService = new ApiService();
    api.getSource()

    api.getInventories(1, true, 50)
      .then(async (response: any) => {

        let inventories: any[] = response.data.inventories;
        let filters = new Set();

        const summary = inventories.map(async (inventory: any) => {

          const inventoryResponse = await api.getSummaryInventory((inventory as any)._id);
          const { metadata, summary } = inventoryResponse.data;
          const { containers, units , nave, client, names } = summary[`${inventory._id}`];

          metadata.filters.clients.forEach((cli: any)=>{
            filters.add(cli)
          })
          metadata.filters.ships.forEach((ship: any)=>{
            filters.add(ship)
          })

          return {
            _id: inventory._id,
            name: `${names} (${inventory.name})`,
            createdAt: inventory.createdAt,
            createdBy: inventory.createdBy,
            finalizedAt: inventory.finalizedAt,
            container: containers,
            unit: units,
            nave: nave,
            client: client,
            status: inventory.status
          };

        });

        const resolvedSummary =  await Promise.all(summary);

        this.setState({
          summaryInventory: resolvedSummary,
          originalSummary: resolvedSummary,
          shipSelector: [...await Promise.all(filters)],
          loading: false
        });


      })
      .catch((error: any) => {
        console.log(error);
      })

  }
  
  componentDidUpdate(prevProps: Readonly<IPropsType>, prevState: Readonly<IStateType>, snapshot?: any) {
    if (this.state.statusFilterSelected !== prevState.statusFilterSelected ||
      this.state.isFilteringByDate !== prevState.isFilteringByDate ||
      this.state.startDate !== prevState.startDate ||
      this.state.endDate !== prevState.endDate ||
      this.state.shipFilter !== prevState.shipFilter ) {
      this.filterSummary();
    }
  }

  cleanFilters = () => {
    this.setState({
      shipFilter: [],
      statusFilterSelected: [],
      isFilteringByDate: false,
    });
  }


  filterSummary() {

    let summary = this.state.originalSummary.filter((summary: any) =>{

      const { nave, client } = summary;

      let shipFilter = this.state.shipFilter.length == 0 ? true : ( this.state.shipFilter.includes(nave) || this.state.shipFilter.includes(client) );

      let countStatusFilter = 0;

      this.state.statusFilterSelected.forEach((state)=>{
        const coountContainer = (summary.container[`${state}`]) !== undefined ? summary.container[`${state}`]: 0;
        const coountUnit = (summary.unit[`${state}`]) !== undefined ? summary.unit[`${state}`]: 0;
        if(coountContainer != undefined && coountUnit != undefined){
          countStatusFilter += (coountContainer + coountUnit);
        }
      });

      const statusFilter = this.state.statusFilterSelected.length === 0 ? true :  ( countStatusFilter > 0 );

      let dateFilter = true;
      if (this.state.isFilteringByDate) {
        if (summary.createdAt) {
          let openDate = new Date(summary.createdAt);
          let startDate = this.state.startDate ? new Date(this.state.startDate) : null;
          let endDate = this.state.endDate ? new Date(this.state.endDate) : null;


          dateFilter = ((!startDate || openDate >= startDate) && (!endDate || openDate <= endDate));
        } else {
          dateFilter = true;
        }
      }

      return shipFilter && statusFilter &&  dateFilter;
      
    });

    this.setState({
      summaryInventory: summary
    });

  }

  create = () => {
    this.props.history.push('/inventory/container/create/');
  }

  render(): React.ReactElement<IPropsType> {

    const { loading } = this.state;

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

    return (
      <AppContainer title="" cMenu="6" cSubMenu="6.3">
        <section className="content">
          <div className="box">
            <div className="box-header with-border flex flex-space-between">
              <h4 className="box-title">
                Gesti&oacute;n de Anuncios 
              </h4>
              <div className="pull-right box-tools">
                {hasPermission(window.user, 'createInventory') ? (<>
                  <button
                    className="btn btn-sm btn-success"
                    onClick={this.create}>
                    <i className="fa fa-plus" /> Cargar Anuncio
                  </button>
                </>
                ) : null}
              </div>
            </div>
            {loading ?
              <div className="overlay">
                <i className="fa fa-refresh fa-spin" />
              </div>
              : <>
                <div className="box-body">

                  <div className="row filter-row-top-margin">

                    <div className="col-md-3">
                      <div className="form-group">
                        <label className="text-black">Filtrar por Cliente o Nave</label>
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
                            this.setState({ shipFilter: new Array(selected) });
                          }}
                        />
                      </div>
                    </div>


                    <div className="col-md-3">
                      <div className="form-group">
                        <label className="text-black">Filtrar por rango de fecha</label>
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
                      <div className="form-group">
                        <label className="text-black">Estados</label>
                        <BootstrapSelect
                          noneSelectedText="Todos"
                          displayItems={4}
                          sm={true}
                          selectedText="estados seleccionados."
                          separator=" - "
                          options={Object.keys(this.statusText).map(
                            (status: CarStatusType) => ({
                              value: status,
                              text: inventorySettings[status],
                              className: `label label-${inventorySettings[
                                `${status}Class` as CarStatusType
                              ]
                                }`
                            })
                          )}
                          selected={this.state.statusFilterSelected}
                          onClick={(e: any) => {
                            const { statusFilterSelected } = this.state;
                            let filters = statusFilterSelected.includes(e)
                              ? statusFilterSelected.filter((state) => state !== e)
                              : [e, ...statusFilterSelected];
                            this.setState({ statusFilterSelected: filters });
                          }}
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className='form-group'>
                        <div className="row pull-left box-tools clean-filter-wrapper">
                          <button
                            className="btn btn-sm btn-outline-default text-dark btn-block"
                            onClick={this.cleanFilters}>
                            Limpiar filtros
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-12">
                      <DataTable
                        columns={this.columns}
                        data={this.state.summaryInventory}
                        customStyles={dataTableStyle}
                        // expandOnRowClicked={true}
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



export default InventoryManagement;

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
  "leftover": "Encontrados*",
  "leftoverClass": "yellow",
  "leftoverColor": "#ff9600",
  "reported": "Reportados",
  "reportedClass": "gray-dark",
  "reportedColor": "#96a4b3",


  "hasDamages": "Con Daños",
  "hasDamagesClass": "has-damages",
  "hasDamagesColor": "#DD4B39",

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
  "openClass": "gray-dark",
  "openClassContainer": "open",
  "openColor": "#E08406",
  "report": {
    "atLeastOne": true,
    "primaryRequired": false,
    "secondaryRequired": false
  }
}
