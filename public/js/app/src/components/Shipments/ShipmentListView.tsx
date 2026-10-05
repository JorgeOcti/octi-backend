import * as React from 'react';
import * as moment from 'moment-timezone';

import AppContainer from '../../container/AppContainer';
import ApiService from '../../utils/axios';
import DataTable from 'react-data-table-component';
import { IWindow } from '../../interfaces/window';
import { RouteComponentProps } from 'react-router';
import ShowIf from '../Utils/ShowIf';
import TrackingBasePage from '../Utils/TrackingBasePage';

declare let window: IWindow;

/**
 * Envío de unidades — listado web.
 *
 * Mismo diseño que Revisión Contenedores: la fila es la patente y las unidades
 * del camión se ven desplegándola. Las unidades se piden al desplegar, no al
 * listar, porque un listado de 200 camiones con todas sus unidades adentro no
 * lo aguanta ni la consulta ni la pantalla.
 *
 * El scope lo resuelve el backend: el handler ve lo que despachó, el cliente
 * ve lo suyo. Acá no se manda ninguna company.
 *
 * Ver docs/envio-de-unidades/02-technical-plan.md §5.
 */

const dataTableStyle = {
  headRow: {
    style: {
      color: 'white',
      backgroundColor: '#3279B7',
      whiteSpace: 'normal !important'
    }
  },
  rows: {
    style: {
      backgroundColor: '#F5F5F5',
      border: '1px solid #DADADA',
      marginTop: '10px'
    }
  },
  cells: {
    style: {
      '& > div': {
        whiteSpace: 'normal !important'
      }
    }
  },
  expanderCell: {
    style: {
      order: 1
    }
  }
};

const paginationComponentOptions = {
  rowsPerPageText: 'Filas por página',
  rangeSeparatorText: 'de',
  selectAllRowsItem: true,
  selectAllRowsItemText: 'Todos'
};

const STATUS_TEXT: { [key: string]: string } = {
  open: 'Cargando',
  shipped: 'Despachado',
  cancelled: 'Cancelado'
};

const STATUS_CLASS: { [key: string]: string } = {
  open: 'label label-warning',
  shipped: 'label label-success',
  cancelled: 'label label-default'
};

const fullName = (user: any): string =>
  user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || '' : '';

/**
 * Unidades del camión. Se cargan al desplegar la fila y quedan cacheadas en el
 * componente: volver a abrir la misma fila no vuelve a pegarle al servidor.
 */
class ExpandedRowElement extends React.Component<{ data: any }, { items: any[]; loading: boolean; error: string | null }> {
  constructor(props: { data: any }) {
    super(props);
    this.state = { items: [], loading: true, error: null };
  }

  public async componentDidMount(): Promise<void> {
    const api: ApiService = new ApiService();
    try {
      const response = await api.getShipmentItems(this.props.data._id);
      this.setState({ items: response.data.results || [], loading: false });
    } catch (e) {
      this.setState({ loading: false, error: 'No se pudieron cargar las unidades.' });
    }
  }

  public render(): React.ReactNode {
    const { items, loading, error } = this.state;

    if (loading) {
      return (
        <div className="text-center" style={{ padding: '15px' }}>
          <i className="fa fa-spinner fa-spin fa-2x" />
        </div>
      );
    }
    if (error) {
      return <div className="text-center text-red" style={{ padding: '15px' }}>{error}</div>;
    }
    if (!items.length) {
      return <div className="text-center" style={{ padding: '15px' }}>Este camión no tiene unidades.</div>;
    }

    return (
      <div style={{ padding: '10px 40px' }}>
        <table className="table table-condensed">
          <thead>
            <tr>
              <th>#</th>
              <th>VIN</th>
              <th>Marca</th>
              <th>Modelo</th>
              <th>Cargada por</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any, index: number) => (
              <tr key={item._id} style={item.status === 'removed' ? { color: '#999' } : {}}>
                <td>{index + 1}.</td>
                <td>
                  {item.car ? item.car.vin : ''}
                  <ShowIf condition={!!item.participant && !!item.participant.hasDamages}>
                    <i
                      className="fa fa-warning text-red"
                      style={{ marginLeft: '6px' }}
                      title="Daños registrados en esta unidad."
                    />
                  </ShowIf>
                </td>
                <td>{item.car ? item.car.brand : ''}</td>
                <td>{item.car ? item.car.denomination : ''}</td>
                <td>{fullName(item.loadedBy)}</td>
                <td>
                  <ShowIf
                    condition={item.status === 'removed'}
                    alternative={<span>{item.status === 'shipped' ? 'Despachada' : 'Cargada'}</span>}
                  >
                    {/* Queda el registro de quién la bajó: una unidad nunca se borra. */}
                    <span title={`Bajada por ${fullName(item.removedBy)}`}>
                      Bajada por {fullName(item.removedBy)}
                      {item.removedAt ? ` el ${moment(item.removedAt).format('DD/MM/YYYY HH:mm')}` : ''}
                    </span>
                  </ShowIf>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}

interface IStateType {
  shipments: any[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  plateFilter: string;
  statusFilter: string;
  error: string | null;
}

class ShipmentListView extends TrackingBasePage<RouteComponentProps<{}>, IStateType> {
  public title = 'Envío de unidades';

  constructor(props: RouteComponentProps<{}>) {
    super(props);
    this.state = {
      shipments: [],
      total: 0,
      page: 1,
      pageSize: 10,
      loading: true,
      plateFilter: '',
      statusFilter: '',
      error: null
    };
    this.load = this.load.bind(this);
    this.changePage = this.changePage.bind(this);
    this.changePageSize = this.changePageSize.bind(this);
    this.applyFilters = this.applyFilters.bind(this);
    this.cleanFilters = this.cleanFilters.bind(this);
  }

  public async componentDidMount(): Promise<void> {
    super.componentDidMount();
    await this.load();
  }

  private async load(): Promise<void> {
    const { page, pageSize, plateFilter, statusFilter } = this.state;
    this.setState({ loading: true, error: null });
    const api: ApiService = new ApiService();
    // getSource() es obligatorio antes de cualquier método que use cancelToken:
    // ApiService no inicializa `source` en el constructor y la llamada revienta
    // antes de salir a la red.
    api.getSource();
    try {
      const response = await api.getShipments(page, pageSize, {
        plate: plateFilter,
        status: statusFilter
      });
      this.setState({
        shipments: response.data.results || [],
        total: response.data.total || 0,
        loading: false
      });
    } catch (e) {
      // Un fallo acá no puede verse igual que "no hay envíos".
      console.error('ShipmentListView.load:', e);
      this.setState({ loading: false, error: 'No se pudieron cargar los envíos.' });
    }
  }

  private changePage(page: number): void {
    this.setState({ page }, this.load);
  }

  private changePageSize(pageSize: number, page: number): void {
    this.setState({ pageSize, page }, this.load);
  }

  private applyFilters(): void {
    this.setState({ page: 1 }, this.load);
  }

  private cleanFilters(): void {
    this.setState({ plateFilter: '', statusFilter: '', page: 1 }, this.load);
  }

  private get columns(): any[] {
    return [
      {
        name: 'Patente',
        selector: (row: any) => row.plate,
        cell: (row: any) => <strong>{row.plate}</strong>
      },
      {
        name: 'Cliente',
        selector: (row: any) => (row.clientCompany ? row.clientCompany.name : '')
      },
      {
        name: 'Sucursal',
        selector: (row: any) => (row.venue ? row.venue.name : '')
      },
      {
        name: 'Unidades',
        cell: (row: any) => (
          <span>
            {row.units}
            {row.unitsRemoved ? <span className="text-muted"> ({row.unitsRemoved} bajadas)</span> : null}
          </span>
        )
      },
      {
        name: 'Estado',
        cell: (row: any) => (
          <span className={STATUS_CLASS[row.status] || 'label label-default'}>
            {STATUS_TEXT[row.status] || row.status}
          </span>
        )
      },
      {
        name: 'Salida',
        selector: (row: any) =>
          row.shippedAt ? moment(row.shippedAt).format('DD/MM/YYYY HH:mm') : '—'
      },
      {
        name: 'Tarja',
        cell: (row: any) =>
          row.tarjaReady ? (
            <a
              className="btn btn-sm btn-primary"
              href={`/api/shipments/${row._id}/tarja.pdf`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fa fa-fw fa-file-pdf-o" /> Tarja
            </a>
          ) : (
            // El formulario de salida viaja encolado: hay una ventana en que el
            // camión ya salió y la Tarja todavía no se puede emitir. Se muestra
            // el motivo, no un PDF incompleto.
            <button className="btn btn-sm btn-default" disabled title={row.tarjaReason || ''}>
              <i className="fa fa-fw fa-clock-o" /> Tarja
            </button>
          )
      }
    ];
  }

  public render(): React.ReactNode {
    const { shipments, total, loading, plateFilter, statusFilter, error } = this.state;

    return (
      <AppContainer title="Envío de unidades" cMenu="6" cSubMenu="6.6">
        <section className="content">
          <div className="box">
            <div className="box-header with-border flex flex-space-between">
              {loading ? (
                <span>Cargando...</span>
              ) : (
                <h3 className="box-title">
                  Envío de unidades{' '}
                  <span className="font-12 font-bold" style={{ color: 'gray' }}>
                    {total}
                  </span>
                </h3>
              )}
            </div>

            <div className="box-body">
              <div className="row" style={{ marginBottom: '10px' }}>
                <div className="col-md-3">
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Patente"
                    value={plateFilter}
                    onChange={(e) => this.setState({ plateFilter: e.target.value })}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        this.applyFilters();
                      }
                    }}
                  />
                </div>
                <div className="col-md-3">
                  <select
                    className="form-control"
                    value={statusFilter}
                    onChange={(e) => this.setState({ statusFilter: e.target.value }, this.applyFilters)}
                  >
                    <option value="">Todos los estados</option>
                    <option value="open">Cargando</option>
                    <option value="shipped">Despachado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <button className="btn btn-primary" onClick={this.applyFilters}>
                    <i className="fa fa-fw fa-search" /> Buscar
                  </button>{' '}
                  <button className="btn btn-default" onClick={this.cleanFilters}>
                    Limpiar
                  </button>
                </div>
              </div>

              <DataTable
                columns={this.columns}
                data={shipments}
                customStyles={dataTableStyle}
                expandableRows
                expandableRowsComponent={ExpandedRowElement}
                expandOnRowClicked={true}
                pagination
                paginationServer
                paginationComponentOptions={paginationComponentOptions}
                paginationRowsPerPageOptions={[10, 25, 50, 100]}
                paginationTotalRows={total}
                progressPending={loading}
                progressComponent={
                  <div className="text-center">
                    <i className="fa fa-spinner fa-spin fa-3x" />
                  </div>
                }
                onChangeRowsPerPage={this.changePageSize}
                onChangePage={this.changePage}
                noDataComponent={
                  <div className="text-center">
                    <h4>{error || 'No hay envíos'}</h4>
                  </div>
                }
              />
            </div>
          </div>
        </section>
      </AppContainer>
    );
  }
}

export default ShipmentListView;
