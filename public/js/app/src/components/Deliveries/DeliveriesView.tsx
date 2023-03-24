import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { Dispatch } from 'redux';
import TrackingBasePage from '../Utils/TrackingBasePage';
import * as React from 'react';
import { ErrorInfo } from 'react';
import AppContainer from '../../container/AppContainer';
import * as Raven from 'raven-js';
import {
  IDeliveriesActionTypes,
  IDeliveriesState,
  IDeliveryDispatch
} from '../../actions/deliveries.types';
import DeliveriesActions from '../../actions/deliveries.actions';
import ShowIf from '../Utils/ShowIf';
import Paginator from '../Utils/Paginator';
import * as moment from 'moment-timezone';
import * as swal from 'sweetalert';
import DeliveriesCarDetail from './DeliveriesCarDetail';
import BootstrapSelect from '../Utils/BootstrapSelect';
import DateRangeInput from '../Utils/DateRangeInput';
import * as daterangepicker from 'daterangepicker';
import { IForm } from '../../../../../../src/form/interfaces/form.interface';
import { Socket } from 'socket.io-client/build/esm/socket';
import { io } from 'socket.io-client';
import { IWindow } from '../../interfaces/window';
import { debounce } from 'throttle-debounce';

declare let window: IWindow;

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<IDeliveriesActionTypes>;
  deliveries: IDeliveriesState;
  deliveriesActions: DeliveriesActions;
}

interface IStateType {
  error: Error | null;
  highlight: string[];
  carLoading: string;
}

class DeliveriesView extends TrackingBasePage<IPropsType, IStateType> {
  public title: string;

  protected isMount: boolean = false;
  protected printIframe: any;

  private socket: Socket;

  readonly state: IStateType = {
    error: null,
    highlight: [],
    carLoading: ''
  };

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Entregas';
    this.filterForms = this.filterForms.bind(this);
    this.filterAllForms = this.filterAllForms.bind(this);
    this.onDateRangeChange = this.onDateRangeChange.bind(this);
    this.getDateRangeOptions = this.getDateRangeOptions.bind(this);
    this.downloadReport = this.downloadReport.bind(this);
    this.printPdf = this.printPdf.bind(this);
    this.changePage = this.changePage.bind(this);
    this.onChangeSearch = this.onChangeSearch.bind(this);
    this.debounceOnChangeSearch = debounce(300, this.debounceOnChangeSearch);
    this.onChangeSearchDelivery = this.onChangeSearchDelivery.bind(this);
    this.debounceOnChangeSearchDelivery = debounce(
      300,
      this.debounceOnChangeSearchDelivery
    );
  }

  public componentDidMount(): void {
    super.componentDidMount();
  }

  public componentWillMount(): void {
    const { page } = this.props.deliveries.pagination;
    const { deliveriesActions } = this.props;
    deliveriesActions.getDeliveriesThunkAction(page, true);

    // socket
    this.socket = io(`${location.protocol}//${location.host}`, {
      secure: location.protocol === 'https:',
      transports: ['websocket'],
      reconnection: true,
      query: {
        token: (window.user as any).token
      }
    });

    this.socket.on('connect', () => {
      this.socket.emit('join', {
        room: `deliveries-view-${window.user.team._id}`
      });
    });

    this.socket.on('REFRESH', (data: any): void => {
      const { page } = this.props.deliveries.pagination;
      const { forms } = this.props.deliveries;
      if (
        data.update &&
        window.user.venuesAccess.includes(data.venueId) &&
        forms.map((form: IForm) => form._id).includes(data.formId)
      ) {
        deliveriesActions.getDeliveriesThunkAction(page, false);
        ($ as any).toast({
          heading: data.notification.title,
          text: data.notification.text,
          position: 'top-right',
          loaderBg: '#e2e2e2',
          icon: 'success',
          hideAfter: 5000,
          stack: 6
        } as any);
        if (!this.state.highlight.includes(data.car)) {
          this.setState({
            highlight: [data.car, ...this.state.highlight]
          });
        } else {
          this.setState(
            {
              highlight: this.state.highlight.filter((e) => e !== data.car)
            },
            () => {
              this.setState({
                highlight: [data.car, ...this.state.highlight]
              });
            }
          );
        }
        setTimeout(() => {
          if (this.isMount) {
            this.setState({
              highlight: this.state.highlight.filter((e) => e !== data.car)
            });
          }
        }, 3000);
      }
    });

    this.isMount = true;
  }

  public componentDidUpdate(
    prevProps: Readonly<IPropsType>,
    prevState: Readonly<IStateType>
  ): void {
    $('[data-toggle="tooltip"]').tooltip();
  }

  public componentWillUnmount(): void {
    this.isMount = false;
    if (this.props.deliveries.source) {
      this.props.deliveries.source.cancel('Operation canceled by the user.');
    }
    this.socket.disconnect();
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error });
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public render(): React.ReactElement<IPropsType> {
    const { participants, forms, pagination, loading, filters } =
      this.props.deliveries;
    const { highlight, carLoading } = this.state;
    return (
      <AppContainer title={this.title} cMenu="1" cSubMenu="1.8">
        <section className="content">
          <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">
                Controles{' '}
                <small>
                  {new Intl.NumberFormat('de-DE').format(pagination.count)}
                </small>
              </h3>
              <div className="box-tools pull-right">
                <button
                  className="btn btn-sm btn-primary hidden-xs hidden-sm hidden-sm"
                  onClick={this.downloadReport}>
                  <i className="fa fa-fw fa-download" /> Exportar
                </button>
              </div>
            </div>
            <div className={`box-body no-padding`}>
              <div className="row no-margin">
                <div className="col-md-6 no-padding">
                  <div style={{ padding: '10px' }}>
                    <BootstrapSelect
                      noneSelectedText="Todos los controles"
                      displayItems={4}
                      sm={true}
                      autoClouse={true}
                      selectedText="formularios seleccionadas."
                      selected={filters.forms}
                      allOption={true}
                      selectAll={this.filterAllForms}
                      separator=" - "
                      options={forms.map((form: IForm) => ({
                        value: form._id,
                        text: form.name
                      }))}
                      onClick={this.filterForms}
                      notHideOnClickOutside={false}
                    />
                  </div>
                </div>
                <div className="col-md-6 no-padding">
                  <div style={{ padding: '10px' }}>
                    <DateRangeInput
                      options={this.getDateRangeOptions()}
                      onChange={this.onDateRangeChange}
                      startDate={filters.from}
                      endDate={filters.to}
                    />
                  </div>
                </div>
              </div>
              <div className="row no-margin">
                <div className="col-md-6 no-padding">
                  <div
                    className="input-group input-group-sm"
                    style={{ padding: '10px' }}>
                    <input
                      type="text"
                      className="form-control pull-right"
                      onChange={this.onChangeSearch}
                      value={filters.searchText}
                      placeholder="Buscar por VIN, marca, vendedor o sucursal"
                    />
                    <div className="input-group-btn">
                      <button className="btn btn-default">
                        <i className="fa fa-search" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 no-padding">
                  <div
                    className="input-group input-group-sm"
                    style={{ padding: '10px' }}>
                    <input
                      type="text"
                      className="form-control pull-right"
                      onChange={this.onChangeSearchDelivery}
                      value={filters.searchDelivery}
                      placeholder="Buscar por nombre, rut, email u orden del cliente. "
                    />
                    <div className="input-group-btn">
                      <button className="btn btn-default">
                        <i className="fa fa-search" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <ShowIf
                condition={participants.length > 0}
                alternative={
                  <ShowIf condition={!loading}>
                    <p style={{ padding: '10px' }}>
                      <strong>No se han encontrado entregas.</strong>
                    </p>
                  </ShowIf>
                }>
                <DeliveriesCarDetail
                  participants={participants}
                  highlight={highlight}
                  carLoading={carLoading}
                  history={this.props.history}
                  printPdf={this.printPdf}
                />
              </ShowIf>
            </div>
            <ShowIf condition={pagination.pages > 1}>
              <div className="box-footer">
                <div className="row">
                  <div className="col-md-6" style={{ padding: '20px 15px' }}>
                    <span className="react-bootstrap-table-pagination-total text-ellipsis">
                      &nbsp;&nbsp;Mostrando registros del{' '}
                      {(pagination.page - 1) * 20 + 1} al {pagination.page * 20}{' '}
                      de {pagination.count} registros.
                    </span>
                  </div>
                  <div className="col-md-6">
                    <div className="text-right" style={{ marginRight: '15px' }}>
                      <Paginator
                        changePage={this.changePage}
                        page={pagination.page}
                        pages={pagination.pages}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </ShowIf>
            <ShowIf condition={loading && !participants.length}>
              <div className="overlay">
                <i className="fa fa-spinner fa-spin text-purple" />
              </div>
            </ShowIf>
          </div>
        </section>
      </AppContainer>
    );
  }

  private onChangeSearch(e: React.ChangeEvent<HTMLInputElement>): void {
    e.preventDefault();
    const { value } = e.target;
    const { deliveriesActions } = this.props;
    deliveriesActions.changeFilterAction({ searchText: value });
    this.debounceOnChangeSearch();
  }

  private debounceOnChangeSearch(): void {
    const { deliveriesActions } = this.props;
    deliveriesActions.getDeliveriesThunkAction(1, false);
  }

  private onChangeSearchDelivery(e: React.ChangeEvent<HTMLInputElement>): void {
    e.preventDefault();
    const { value } = e.target;
    const { deliveriesActions } = this.props;
    deliveriesActions.changeFilterAction({ searchDelivery: value });
    this.debounceOnChangeSearch();
  }

  private debounceOnChangeSearchDelivery(): void {
    const { deliveriesActions } = this.props;
    deliveriesActions.getDeliveriesThunkAction(1, false);
  }

  private filterForms(value: any) {
    const { deliveriesActions } = this.props;
    const { filters } = this.props.deliveries;
    let sForms = [...filters.forms];

    sForms = sForms.includes(value)
      ? sForms.filter((form: string) => form !== value)
      : [value, ...filters.forms];

    deliveriesActions.updateFiltersAction({ forms: sForms });
  }

  private filterAllForms(): void {
    const { deliveriesActions } = this.props;
    const { forms } = this.props.deliveries;
    deliveriesActions.updateFiltersAction({
      forms: forms.map((form: IForm) => form._id)
    });
  }

  private onDateRangeChange(from: Date, to: Date): void {
    const { deliveriesActions } = this.props;
    deliveriesActions.updateFiltersAction({ from, to });
  }

  public printPdf(url: string, carLoading: string): void {
    this.setState({ carLoading });
    let iframe: any = this.printIframe;
    const timezone = moment.tz.guess();
    if (!this.printIframe) {
      iframe = this.printIframe = document.createElement('iframe');
      window.document.body.appendChild(iframe);
      iframe.style.display = 'none';
      iframe.onload = () => {
        setTimeout(() => {
          iframe.focus();
          iframe.contentWindow.print();
          this.setState({ carLoading: '' });
          // document.body.removeChild(iframe)
        }, 1);
      };
    }
    iframe.src = `${url}?timezone=${timezone}`;
  }

  private downloadReport(): void {
    const { from, to, forms, searchText } = this.props.deliveries.filters;
    const monthsDiff = moment(to).diff(moment(from), 'months');
    this.trackClick('Descargar acta de entregas', {
      from,
      to
    });
    if (monthsDiff > 3) {
      swal!(
        'Revisiones',
        'Selecciona un rango que 3 meses para descargar la información',
        'error'
      );
    } else {
      let query = `?deliveries=1&from=${moment(from).unix()}&to=${moment(
        to
      ).unix()}`;
      if (searchText.trim().length) {
        query += `&search=${searchText}`;
      }
      if (forms) {
        query += `&forms=${forms.join(',')}`;
      }
      window.open(`/api/participant/export/${query}`, '_blank');
    }
  }

  private changePage(page: number): void {
    const { deliveriesActions } = this.props;
    deliveriesActions.getDeliveriesThunkAction(page, false);
    window.scrollTo(0, 0);
  }

  private getDateRangeOptions(): daterangepicker.Options {
    return {
      // startDate: moment().subtract(11, 'months').startOf('month').toDate(),
      // endDate: moment().toDate(),
      maxDate: moment().toDate(),
      locale: {
        format: 'DD/MM/YYYY',
        customRangeLabel: 'Período personalizado',
        applyLabel: 'Aplicar',
        cancelLabel: 'Cancelar'
      },
      ranges: {
        'Este mes': [
          moment().startOf('month').startOf('month'),
          moment().endOf('month')
        ],
        'Últimos 3 meses': [
          moment().startOf('month').subtract(3, 'months').startOf('month'),
          moment().endOf('month')
        ],
        'Últimos 6 meses': [
          moment().startOf('month').subtract(6, 'months').startOf('month'),
          moment().endOf('month')
        ],
        'Último año': [
          moment().startOf('month').subtract(12, 'months').startOf('month'),
          moment().endOf('month')
        ]
      },
      opens: 'left'
    };
  }
}

const mapStateToProps = (state: { deliveries: IDeliveriesState }) => {
  return {
    deliveries: state.deliveries
  };
};

const mapDispatchToProps = (dispatch: IDeliveryDispatch) => {
  const deliveriesActions = new DeliveriesActions(dispatch);
  return {
    dispatch,
    deliveriesActions
  };
};

export default connect<{}, {}, IPropsType>(
  mapStateToProps,
  mapDispatchToProps
)(DeliveriesView);
