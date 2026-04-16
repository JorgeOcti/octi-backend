import AppContainer from '../../container/AppContainer';
import TrackingBasePage from "../Utils/TrackingBasePage";
import {RouteComponentProps} from "react-router";
import {connect} from "react-redux";
import { ContainerFilesModal, loadContainerFiles, deleteContainerFile } from './containerFiles.utils';

import * as React from "react";
import ApiService from "../../utils/axios";
import * as moment from "moment-timezone";
import {IWindow} from "../../interfaces/window";
import DateRangeInput from '../Utils/DateRangeInput';
import Checkbox from '../Utils/CheckBox';

import { Dispatch } from 'redux';
import {
  DashboardReduxAction,
  IDashboardState
} from '../../actions/dashboard.actions';
import DataTable from 'react-data-table-component';

declare let window: IWindow;

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
    dispatch: Dispatch<DashboardReduxAction>;
    dashboard: IDashboardState;
}

interface IStateType {
  items: any[];
  loading: boolean;
  loadingTable: boolean;
  startDate: Date;
  endDate: Date;
  pagination: {
    page: number;
    pageSize: number;
    hasNext: boolean;
    totalPages: number;
    filters?: any;
    sort?: string;
    sortDirection?: 'asc' | 'desc';
  };
  totalContainers: number;
  clientFilter: string;
  clientSelector: any[];
  multiCompany: boolean;
  filesModalId: string | null;
  containerFiles: any[];
  containerFilesLoading: boolean;
}

const dataTableStyle = {
  headRow: {
    style: {
      color: "white",
      backgroundColor: "#3279B7",
      whiteSpace: 'normal !important'
    }
  },
  rows: {
    style: {
      backgroundColor: "#F5F5F5",
      border: "1px solid #DADADA",
      marginTop: "10px"
    }
  },
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

const statusMap: Record<string, string> = {
  found: 'Encontrado',
  pending: 'Pendiente',
  open: 'Abierto',
  check: 'En descarga',
  empty: 'Vacío',
  missing: 'Faltante'
};

const mapContainersToRows = (containers: any[]): any[] => {
  return containers.map((c: any) => {
    const blParts = [
      c.extra?.['N° BL'],
      c.extra?.['Nave'],
      c.extra?.['N° Viaje'],
    ].filter(Boolean);

    return {
      _rowId: c._id,
      containerVin: c.car?.vin || '-',
      totalBultos: c.closeParticipant?.carryResume?.elements ?? c.participant?.carryResume?.elements ?? '-',
      resumenCarga: c.closeParticipant?.deliveryInfo?.comment || '',
      comentario: c.contentDetails?.[0]?.item || '-',
      blNaveViaje: blParts.length > 0 ? blParts.join(' ') : '-',
      sucursal: c.venue?.name || '-',
      fDescarga: c.openDate || null,
      fDespacho: c.emptyDate || null,
      filesCount: c.files?.length ?? 0,
      estado: c.containerStatus || '-',
      inventoryId: c.inventory,
      carId: c.car?._id,
    };
  });
};

class GeneralItemsContentView extends TrackingBasePage<IPropsType, IStateType> {

  title = "Contenido Carga General";

  private timer: any | null = null;

  private readonly columns: any[] = [
    {
      name: 'Contenedor',
      selector: (row: any) => row.containerVin,
      maxWidth: '10%',
    },
    {
      name: 'Comentario',
      selector: (row: any) => row.comentario,
      wrap: true,
      grow: 2,
    },
    {
      name: 'Total bultos',
      selector: (row: any) => row.totalBultos,
      maxWidth: '8%',
    },
    {
      name: 'Comentario usuario',
      selector: (row: any) => row.resumenCarga || '-',
      wrap: true,
      grow: 2,
    },
    {
      name: 'BL/Nave/Viaje',
      selector: (row: any) => row.blNaveViaje,
      maxWidth: '15%',
      wrap: true,
    },
    {
      name: 'Sucursal',
      selector: (row: any) => row.sucursal,
      maxWidth: '10%',
    },
    {
      name: 'F. Descarga',
      selector: (row: any) => row.fDescarga ? formaDate(row.fDescarga) : '-',
      maxWidth: '10%',
    },
    {
      name: 'F. Despacho',
      selector: (row: any) => row.fDespacho ? formaDate(row.fDespacho) : '-',
      maxWidth: '10%',
    },
    {
      name: 'Adjuntos',
      maxWidth: '8%',
      cell: (row: any) => (
        <button
          className="btn btn-sm btn-default"
          data-toggle="modal"
          data-target="#modalContainerFilesGeneral"
          onClick={() => {
            this.setState({ filesModalId: row._rowId, containerFiles: [] });
            loadContainerFiles(row._rowId, (s: any) => this.setState(s));
          }}
        >
          <i className="fa fa-fw fa-paperclip" /> {row.filesCount}
        </button>
      ),
    },
    {
      name: 'Estado',
      maxWidth: '10%',
      cell: (row: any) => (
        <span
          className={`label-container label-container-${row.estado}`}
          style={{ padding: '5px 10px' }}
        >
          {statusMap[row.estado] || row.estado}
        </span>
      ),
    },
    {
      name: 'Tarja',
      maxWidth: '8%',
      cell: (row: any) => row.estado === 'empty' && (
        <button className="btn btn-sm btn-default" onClick={() =>
          window.open(`/api/inventory/${row.inventoryId}/container/tarja/${row.carId}`, '_blank')
        }>
          <i className="fa fa-fw fa-print" /> Tarja
        </button>
      ),
    },
  ];

  constructor(props: IPropsType) {
    super(props);
    this.state = {
      loading: true,
      loadingTable: true,
      items: [],
      endDate: moment().toDate(),
      startDate: moment().subtract(1, 'month').startOf('month').toDate(),
      totalContainers: 0,
      pagination: {
        page: 1,
        pageSize: 50,
        hasNext: false,
        totalPages: 0,
        filters: { statusFilterSelected: 'empty' },
        sort: 'createdAt',
        sortDirection: 'desc'
      },
      clientFilter: '',
      clientSelector: [],
      multiCompany: false,
      filesModalId: null,
      containerFiles: [],
      containerFilesLoading: false,
    };

    this.fetchData = this.fetchData.bind(this);
    this.changePage = this.changePage.bind(this);
    this.changePageSize = this.changePageSize.bind(this);
  }

  private changePage = (page: number) => {
    this.setState((prevState) => ({
      loadingTable: true,
      pagination: { ...prevState.pagination, page }
    }), () => { this.fetchData(); });
  }

  private changePageSize = (pageSize: number) => {
    this.setState((prevState) => ({
      loadingTable: true,
      pagination: { ...prevState.pagination, pageSize }
    }), () => { this.fetchData(); });
  }

  private getFilterDate(): any {
    return {
      startDate: this.state.startDate ? moment(this.state.startDate).format('YYYY-MM-DD') : '',
      endDate: this.state.endDate ? moment(this.state.endDate).format('YYYY-MM-DD') : ''
    };
  }

  private addFilter = (filter: string, value: string) => {
    clearTimeout(this.timer);
    this.setState({
      loadingTable: true,
      pagination: {
        ...this.state.pagination,
        page: 1,
        filters: { ...this.state.pagination.filters, [filter]: value }
      }
    }, () => {
      this.timer = setTimeout(() => { this.fetchData(); }, 500);
    });
  }

  private cleanFilters = () => {
    this.setState({
      loadingTable: true,
      pagination: { ...this.state.pagination, page: 1, filters: { clientFilter: this.state.clientFilter } }
    }, () => { this.fetchData(); });
  }

  private async fetchData() {
    const api: ApiService = new ApiService();
    api.getSource();
    try {
      const response = await api.getGeneralItemsContainersInventory(
        this.state.pagination.page,
        this.state.pagination.pageSize,
        { ...this.state.pagination.filters, ...this.getFilterDate() },
        this.state.pagination.sort,
        this.state.pagination.sortDirection
      );

      const containers = (response.data.data || []).map((c: any) => {
        const container = { ...c };
        if (container.evidenceStatus && container.evidenceStatus.length > 0) {
          const openEvidences = container.evidenceStatus.filter((e: any) => e.status === 'open');
          if (openEvidences.length > 0) {
            container.openDate = openEvidences.sort((a: any, b: any) =>
              moment(a.date).isAfter(b.date) ? -1 : 1
            )[0].date;
          }
        }
        return container;
      });

      this.setState({
        items: mapContainersToRows(containers),
        totalContainers: response.data.totalDocs || containers.length,
        pagination: {
          ...this.state.pagination,
          hasNext: response.data.hasNextPage || false,
          totalPages: response.data.totalPages || 1,
        },
        loadingTable: false,
        loading: false,
      });
    } catch (error) {
      console.error(error);
      this.setState({ loadingTable: false, loading: false });
    }
  }

  componentDidMount() {
    super.componentDidMount();
    const { company } = window.user;
    if (company?.handler) {
      this.setState({
        multiCompany: true,
        clientFilter: company.clientCompanies[0]._id,
        clientSelector: company.clientCompanies,
        pagination: { ...this.state.pagination, filters: { ...this.state.pagination.filters, clientFilter: company.clientCompanies[0]._id } }
      }, () => { this.fetchData(); });
    } else {
      const companyList = window.user.companiesAccess?.length > 1
        ? window.user.companiesAccess
        : [{ _id: company._id, name: company.name }];
      this.setState({
        multiCompany: companyList.length > 1,
        clientFilter: companyList[0]._id,
        clientSelector: companyList,
        pagination: { ...this.state.pagination, filters: { ...this.state.pagination.filters, clientFilter: companyList[0]._id } }
      }, () => { this.fetchData(); });
    }
  }

  componentDidUpdate(prevProps: Readonly<IPropsType>, prevState: Readonly<IStateType>) {
    if (this.state.startDate !== prevState.startDate || this.state.endDate !== prevState.endDate) {
      this.setState({ loadingTable: true });
      this.fetchData();
    }
  }

  render(): React.ReactElement<IPropsType> {
    const { items, loading, pagination, loadingTable, totalContainers } = this.state;

    return (
      <AppContainer title={
        <div style={{ width: '180px' }}>
          <DateRangeInput
            options={getDateRangeOptions()}
            onChange={(start: Date, end: Date) => {
              this.setState({ startDate: start, endDate: end });
            }}
            startDate={this.state.startDate}
            endDate={this.state.endDate}
          />
        </div>
      } cMenu="6" cSubMenu="6.6">
        <section className="content">
          <div className="box">
            <div className="box-header with-border flex flex-space-between">
              {loadingTable
                ? <span>Cargando...</span>
                : <h3 className="box-title">
                    Contenido Carga General
                    <span className="font-12 font-bold" style={{ color: 'gray', marginLeft: '8px' }}>
                      {totalContainers} contenedores
                    </span>
                  </h3>
              }
            </div>
            {loading
              ? <div className="overlay"><i className="fa fa-refresh fa-spin" /></div>
              : <div className="box-body">
                  <div className="row" style={{ margin: '10px 0' }}>
                    {this.state.multiCompany && (
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="text-black">Filtrar por Cliente</label>
                          <select
                            className="form-control"
                            value={this.state.clientFilter}
                            onChange={(e) => {
                              const companyId = e.target.value;
                              this.setState({
                                clientFilter: companyId,
                                loadingTable: true,
                                pagination: {
                                  ...this.state.pagination,
                                  page: 1,
                                  filters: { ...this.state.pagination.filters, clientFilter: companyId }
                                }
                              }, () => { this.fetchData(); });
                            }}
                          >
                            {this.state.clientSelector.map((client: any, index: number) => (
                              <option key={index} value={client._id}>{client.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                    <div className="col-md-3">
                      <div className="form-group">
                        <label className="text-black">¿Qué contenedor buscas?</label>
                        <input
                          type="text"
                          className="form-control"
                          value={pagination.filters?.containerFilter || ''}
                          onChange={(e) => this.addFilter('containerFilter', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="form-group">
                        <label className="text-black">¿Qué Bill of Lading (BL) buscas?</label>
                        <input
                          type="text"
                          className="form-control"
                          value={pagination.filters?.blFilter || ''}
                          onChange={(e) => this.addFilter('blFilter', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="form-group">
                        <label className="text-black">Filtrar por nave</label>
                        <input
                          type="text"
                          className="form-control"
                          value={pagination.filters?.shipFilter || ''}
                          onChange={(e) => this.addFilter('shipFilter', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="form-group">
                        <label className="text-black">Filtrar por viaje</label>
                        <input
                          type="text"
                          className="form-control"
                          value={pagination.filters?.tripFilter || ''}
                          onChange={(e) => this.addFilter('tripFilter', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="form-group">
                        <label className="text-black">Filtrar por Sucursal</label>
                        <input
                          type="text"
                          className="form-control"
                          value={pagination.filters?.venueFilter || ''}
                          onChange={(e) => this.addFilter('venueFilter', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="form-group">
                        <label className="text-black">Filtrar por Estado</label>
                        <select
                          className="form-control"
                          value={pagination.filters?.statusFilterSelected || ''}
                          onChange={(e) => this.addFilter('statusFilterSelected', e.target.value)}
                        >
                          <option value="">Todos los estados</option>
                          <option value="pending">Pendiente</option>
                          <option value="open">Abierto</option>
                          <option value="check">En descarga</option>
                          <option value="empty">Vacío</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="checkbox">
                        <label style={{ paddingLeft: '0', fontWeight: 600 }} onClick={() => {}}>
                          <Checkbox
                            active={pagination.filters?.filterHasDamage === 'true'}
                            action={() => {
                              this.addFilter('filterHasDamage', pagination.filters?.filterHasDamage === 'true' ? '' : 'true');
                            }}
                            classes="icheck-in-checkbox"
                            style={{ marginTop: '-4px', marginRight: '5px' }}
                          />
                          Mostrar solo con daño
                        </label>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="form-group">
                        <div className="row pull-right box-tools" style={{ paddingTop: '20px', paddingRight: '16px' }}>
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
                        columns={this.columns}
                        data={items}
                        keyField="_rowId"
                        customStyles={dataTableStyle}
                        pagination
                        paginationComponentOptions={paginationComponentOptions}
                        progressPending={loadingTable}
                        paginationServer
                        paginationPerPage={pagination.pageSize}
                        paginationRowsPerPageOptions={[pagination.pageSize, 100, 200]}
                        paginationTotalRows={totalContainers}
                        progressComponent={<div className="text-center"><i className="fa fa-spinner fa-spin fa-3x" /></div>}
                        onChangeRowsPerPage={this.changePageSize}
                        onChangePage={this.changePage}
                        noDataComponent={
                          <div className="text-center"><h4>No hay datos</h4></div>
                        }
                      />
                    </div>
                  </div>
                </div>
            }
          </div>
        </section>
        <ContainerFilesModal
          modalId={this.state.filesModalId}
          htmlModalId="modalContainerFilesGeneral"
          files={this.state.containerFiles}
          loading={this.state.containerFilesLoading}
          readOnly={!this.state.multiCompany}
          onDelete={(id) => deleteContainerFile(id, (s: any) => this.setState(s))}
          onChange={(files) => this.setState({ containerFiles: files })}
        />
      </AppContainer>
    );
  }
}

const mapStateToProps = (state: { dashboard: IDashboardState }) => ({
  dashboard: state.dashboard
});

const mapDispatchToProps = (dispatch: any) => ({
  dispatch
});

export default connect<{}, {}, IPropsType>(
  mapStateToProps,
  mapDispatchToProps
)(GeneralItemsContentView);
