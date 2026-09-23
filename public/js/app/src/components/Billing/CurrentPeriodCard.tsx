import * as moment from 'moment';
import * as React from 'react';
import ApiService from '../../utils/axios';

/**
 * Estimación del período EN CURSO para la pantalla de billing.
 *
 * Corre el mismo cálculo que el billing real en modo dry-run: no cierra el
 * período ni escribe el invoice. Se dispara a pedido (botón) y no al montar,
 * porque recorre todos los inventoryCars del mes de la company.
 */

interface IBreakdownLine {
  count: number;
  price: number;
}

interface ICurrentPeriodRow {
  company: string;
  companyId: string;
  containers: number;
  inventoryCars: number;
  valueDolar: number;
  totalDolar: number;
  totalPeso: number;
  invoiceAlreadyExists: boolean;
  breakdown: {
    containers: IBreakdownLine;
    units: IBreakdownLine;
    aforo: IBreakdownLine;
  };
}

interface ICurrentPeriodResponse {
  period: string;
  periodLabel: string;
  dayOfMonth: number;
  daysInMonth: number;
  generatedAt: string;
  results: ICurrentPeriodRow[];
}

interface IPropsType {
  api?: ApiService;
}

interface IStateType {
  loading: boolean;
  error: string | null;
  data: ICurrentPeriodResponse | null;
}

// Desde este período rige el cálculo actual (contenedores por `updatedAt` y la
// regla de CIS que no cobra los contenedores que todavía no se abrieron). Los
// invoices anteriores se generaron con la lógica vieja, así que no son
// comparables contra esta estimación.
const NEW_LOGIC_FROM = '202608';

export default class CurrentPeriodCard extends React.Component<IPropsType, IStateType> {
  private api: ApiService;

  readonly state: IStateType = {
    loading: false,
    error: null,
    data: null
  };

  constructor(props: IPropsType) {
    super(props);
    this.api = props.api || new ApiService();
    this.load = this.load.bind(this);
  }

  public load(): void {
    this.setState({ loading: true, error: null });
    this.api
      .getBillingCurrentPeriod()
      .then((res) => {
        this.setState({ loading: false, data: res.data as ICurrentPeriodResponse });
      })
      .catch((err) => {
        this.setState({
          loading: false,
          error:
            (err && err.response && err.response.data && err.response.data.message) ||
            'No se pudo calcular el período en curso.'
        });
      });
  }

  private money(n: number): string {
    return (n || 0).toFixed(2);
  }

  private clp(n: number): string {
    return Math.round(n || 0).toLocaleString('es-CL');
  }

  private renderRow(row: ICurrentPeriodRow) {
    const b = row.breakdown;
    return (
      <div key={row.companyId} style={{ marginBottom: '18px' }}>
        <h4 style={{ marginTop: 0 }}>
          <strong className="text-primary">{row.company}</strong>
          {row.invoiceAlreadyExists ? (
            <span className="label label-warning" style={{ marginLeft: '8px' }}>
              ya existe un invoice para este período
            </span>
          ) : null}
        </h4>
        <div className="table-responsive">
          <table className="table table-condensed">
            <thead>
              <tr>
                <th>Concepto</th>
                <th className="text-right">Cantidad</th>
                <th className="text-right">Subtotal USD</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Contenedores desconsolidados</td>
                <td className="text-right">{b.containers.count}</td>
                <td className="text-right">{this.money(b.containers.price)}</td>
              </tr>
              <tr>
                <td>Unidades dentro de contenedores</td>
                <td className="text-right">{b.units.count}</td>
                <td className="text-right">{this.money(b.units.price)}</td>
              </tr>
              {b.aforo.count ? (
                <tr>
                  <td>Aforos</td>
                  <td className="text-right">{b.aforo.count}</td>
                  <td className="text-right">{this.money(b.aforo.price)}</td>
                </tr>
              ) : null}
            </tbody>
            <tfoot>
              <tr>
                <th>Total estimado</th>
                <th className="text-right" />
                <th className="text-right">
                  <span className="text-green" style={{ fontSize: '16px' }}>
                    {this.money(row.totalDolar)} USD
                  </span>
                </th>
              </tr>
              <tr>
                <td className="text-muted">
                  <small>Referencia en pesos (dólar {this.money(row.valueDolar)})</small>
                </td>
                <td />
                <td className="text-right text-muted">
                  <small>$ {this.clp(row.totalPeso)} CLP</small>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  }

  public render() {
    const { loading, error, data } = this.state;

    return (
      <div className="box box-solid">
        <div className="box-header with-border">
          <h3 className="box-title">
            <i className="fa fa-fw fa-calculator" /> Período en curso
          </h3>
          <div className="box-tools pull-right">
            <button className="btn btn-sm btn-primary" onClick={this.load} disabled={loading}>
              {loading ? (
                <>
                  <i className="fa fa-fw fa-spinner fa-spin" /> Calculando…
                </>
              ) : (
                <>
                  <i className="fa fa-fw fa-refresh" /> {data ? 'Recalcular' : 'Calcular'}
                </>
              )}
            </button>
          </div>
        </div>
        <div className="box-body">
          {!data && !loading && !error ? (
            <p className="text-muted">
              Estimación de lo que va del mes, con el mismo cálculo que el cierre.
              No cierra el período ni genera el invoice.
            </p>
          ) : null}

          {error ? (
            <div className="alert alert-danger" style={{ marginBottom: 0 }}>
              {error}
            </div>
          ) : null}

          {data ? (
            <>
              <p>
                <strong>{String(data.periodLabel).toUpperCase()}</strong>{' '}
                <span className="text-muted">
                  — parcial, al día {data.dayOfMonth} de {data.daysInMonth}.
                  Calculado {moment(data.generatedAt).format('DD/MM/YYYY HH:mm')}.
                </span>
              </p>

              {data.results.length ? (
                data.results.map((row) => this.renderRow(row))
              ) : (
                <p className="text-muted">Todavía no hay movimientos facturables este mes.</p>
              )}

              <div className="callout callout-info" style={{ marginBottom: 0 }}>
                <p style={{ marginBottom: '4px' }}>
                  <strong>Es una estimación, no la factura.</strong> El mes sigue abierto:
                  el número sube a medida que se desconsolidan contenedores. Un contenedor
                  que todavía no se abrió no se cobra acá, y va a aparecer en el período en
                  que se abra.
                </p>
                {data.period > NEW_LOGIC_FROM ? (
                  <p style={{ marginBottom: 0 }}>
                    <small>
                      El cálculo cambió a partir de {moment(NEW_LOGIC_FROM, 'YYYYMM').format('MMMM YYYY')}:
                      los invoices anteriores se generaron con la lógica vieja y no son
                      comparables contra esta estimación.
                    </small>
                  </p>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </div>
    );
  }
}
