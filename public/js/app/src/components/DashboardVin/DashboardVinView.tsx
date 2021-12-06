import * as moment from 'moment-timezone';
import * as Raven from 'raven-js';
import * as React from 'react';
import { ErrorInfo } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { Dispatch } from 'redux';
import * as io from 'socket.io-client';
import { debounce } from 'throttle-debounce';
import * as swal from 'sweetalert';
import { IParticipant } from '../../../../../../src/form/interfaces/participant.interface';
import {
  changeFormsSearchDashboardAction,
  changeRangeDashboardAction,
  changeSearchDashboardAction,
  DashboardReduxAction,
  getRevisionsAction,
  getRevisionsThunkAction,
  IDashboardState
} from '../../actions/dashboard.actions';
import AppContainer from '../../container/AppContainer';
import { IWindow } from '../../interfaces/window';
import Paginator from '../Utils/Paginator';
import TrackingBasePage from '../Utils/TrackingBasePage';
import DateRangeInput from '../Utils/DateRangeInput';
import BootstrapSelect from "../Utils/BootstrapSelect";
import {IForm} from "../../../../../../src/form/interfaces/form.interface";
import ShowIf from '../Utils/ShowIf';

declare let window: IWindow;

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<DashboardReduxAction>;
  dashboard: IDashboardState;
  getRevisionsThunkAction(page: number, loading: boolean, search?: string) : void;
  getRevisionsAction(page: number, loading: boolean, search?: string): void;
  changeSearchFormsDashboardAction(forms: string[]): DashboardReduxAction;
  changeSearchDashboardAction(searchText: string): DashboardReduxAction;
  changeRangeDashboardAction(from: string, to: string): DashboardReduxAction;
}

interface IStateType {
  error: Error | null;
  highlight: string[];
  searchText: string;
  selectedForms: string[];
  carLoading: string;
  from: Date;
  to: Date;
  downloading: boolean;
}

class DashboardVinView extends TrackingBasePage<IPropsType, IStateType> {
  title: string;

  readonly state: IStateType = {
    error: null,
    highlight: [],
    searchText: '',
    carLoading: '',
    selectedForms: [],
    from: moment().subtract(30, 'days').toDate(),
    to: moment().toDate(),
    downloading: false
  };
  protected printIframe: any;

  protected isMount: boolean = false;
  private socket: SocketIOClient.Socket;

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Revisiones';
    this.changePage = this.changePage.bind(this);
    this.onChangeSearch = this.onChangeSearch.bind(this);
    this.printPdf = this.printPdf.bind(this);
    this.debounceOnChangeSearch = debounce(300, this.debounceOnChangeSearch);
    this.downloadReport = this.downloadReport.bind(this);
    this.onDateRangeChange = this.onDateRangeChange.bind(this);
    this.filterForms = this.filterForms.bind(this);
    this.filterAllForms = this.filterAllForms.bind(this);
    this.showSelect = this.showSelect.bind(this);
  }

  public printPdf(url: string, carLoading: string) {
    this.setState({carLoading});
    let iframe: any = this.printIframe;
    const timezone = moment.tz.guess();
    if (!this.printIframe) {
      iframe = this.printIframe = document.createElement('iframe');
      document.body.appendChild(iframe);
      iframe.style.display = 'none';
      iframe.onload = () => {
        setTimeout(() => {
          iframe.focus();
          iframe.contentWindow.print();
          this.setState({carLoading: ''});
          // document.body.removeChild(iframe)
        }, 1);
      };
    }
    iframe.src = `${url}?timezone=${timezone}`;
  }

  public componentWillMount(): void {
    // set the title of the page
    const {page} = this.props.dashboard.pagination;
    this.props.getRevisionsThunkAction(page, true);

    // socket
    this.socket = io.connect(`${location.protocol}//${location.host}`, {
      secure: location.protocol === 'https:',
      transports: ['websocket'],
      reconnection: true,
      query: {
        token: (window.user as any).token
      }
    });
    this.socket.on('connect', () => {
      this.socket.emit('join', {room: `dashboard-vin-view-${window.user.team._id}`});
    });
    this.socket.on('REFRESH', (data: any): void => {
      const {page} = this.props.dashboard.pagination;
      if (data.update) {
        ($ as any).toast({
          heading: data.notification.title,
          text: data.notification.text,
          position: 'top-right',
          loaderBg: '#e2e2e2',
          icon: 'success',
          hideAfter: 5000,
          stack: 6
        });
        this.props.getRevisionsAction(page, false);
        if (!this.state.highlight.includes(data.car)) {
          this.setState({
            highlight: [data.car, ...this.state.highlight]
          });
        } else {
          this.setState({
            highlight: this.state.highlight.filter((e) => e !== data.car)
          }, () => {
            this.setState({
              highlight: [data.car, ...this.state.highlight]
            });
          });
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

  public componentDidMount(): void {
    super.componentDidMount();
  }

  getDateRangeOptions(): daterangepicker.Options {
    return {
      maxDate: moment(),
      opens: 'left'
    };
}

  onDateRangeChange(from: Date, to: Date){
    this.setState({
      from,
      to
    });
    this.props.changeRangeDashboardAction(moment(from).format('YYYY-MM-DD'), moment(to).format('YYYY-MM-DD'));
    this.debounceOnChangeSearch();
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public componentWillUnmount() {
    this.isMount = false;
    // cancel request if component is inmounted
    if (this.props.dashboard.source) {
      this.props.dashboard.source.cancel('Operation canceled by the user.');
    }
    this.socket.disconnect();
  }

  public componentDidUpdate(prevProps: Readonly<IPropsType>, prevState: Readonly<IStateType>, snapshot?: any): void {
    if(this.props.dashboard.pagination !== prevProps.dashboard.pagination){
      window.scrollTo(0, 0);
    }
    $('[data-toggle="tooltip"]').tooltip();
  }

  public downloadReport(){
    const {from, to} = this.state;
    const monthsDiff = moment(to).diff(moment(from), 'months');
    this.trackClick('Descargar reporte', {
      from,
      to
    });
    if(monthsDiff > 3){
      swal('Revisiones', 'Selecciona un rango de 3 meses para dercargar la información', 'error');
    } else {
      window.open(`/api/participant/export/?from=${moment(from).unix()}&to=${moment(to).unix()}`, '_blank');
    }

    // const api: ApiService = new ApiService();
    // const instance = api.getInstance();
    // const source = api.getSource();
    // instance.defaults.timeout = 7200000;
    // instance.get(`/api/participant/export/?from=${from}&to=${to}`, {
    //     responseType: 'arraybuffer',
    //   })
    //   .then((response) => {
    //     const blob = new Blob([response.data], {
    //       type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    //     });
    //     const fileName = `${moment().format('YYYYMMDD')}-revisiones.xlsx`;
    //     if (typeof window.navigator.msSaveBlob !== 'undefined') {
    //       // IE workaround for "HTML7007: One or more blob URLs were
    //       // revoked by closing the blob for which they were created.
    //       // These URLs will no longer resolve as the data backing
    //       // the URL has been freed."
    //       window.navigator.msSaveBlob(blob, fileName);
    //     } else {
    //       const blobURL = URL.createObjectURL(blob);
    //       const tempLink = document.createElement('a');
    //       tempLink.style.display = 'none';
    //       tempLink.href = blobURL;
    //       tempLink.setAttribute('download', fileName);
    //       // Safari thinks _blank anchor are pop ups. We only want to set _blank
    //       // target if the browser does not support the HTML5 download attribute.
    //       // This allows you to download files in desktop safari if pop up blocking
    //       // is enabled.
    //       if (typeof tempLink.download === 'undefined') {
    //         tempLink.setAttribute('target', '_blank');
    //       }
    //       document.body.appendChild(tempLink);
    //       tempLink.click();
    //       document.body.removeChild(tempLink);
    //       URL.revokeObjectURL(blobURL);

    //       this.setState({
    //         downloading: false
    //       });
    //     }
    //   })
    //   .catch((err) => {
    //     this.setState({
    //       downloading: false
    //     });
    //     if (!Axios.isCancel(err)) {
    //       swal('Exportar revisiones', 'Ha ocurrido un error al general el excel.', 'error');
    //     }
    //   });
  }

  public render(): React.ReactElement<IPropsType> {
    const {loading, participants, pagination, searchText, forms} = this.props.dashboard;
    const {highlight, carLoading, downloading, from, to, selectedForms} = this.state;
    return (
      <AppContainer title="" cMenu="1" cSubMenu="1.2">
        <section className="content">
          <div className="box">
            <div className="box-header with-border"><h3 className="box-title">Revisiones <small>{pagination.count}</small></h3>
              <div className="box-tools pull-right">
                <button
                  className="btn btn-sm btn-primary hidden-xs hidden-sm"
                  onClick={this.downloadReport}
                  disabled={downloading}
                >
                  <i className="fa fa-fw fa-download" /> Exportar Excel
                </button>
              </div>
            </div>
            <div className={`box-body no-padding`}>
              <div className="row">
                <div className="col-md-offset-2 col-md-4">
                  <DateRangeInput
                    options={this.getDateRangeOptions()}
                    onChange={this.onDateRangeChange}
                    startDate={from}
                    endDate={to} />
                </div>
                <div className="col-md-3">
                  <div
                    className='input-group input-group-sm'
                    style={{ padding: '10px' }}
                  >
                    <input
                      type="text"
                      className="form-control pull-right"
                      onChange={this.onChangeSearch}
                      value={searchText}
                      placeholder="Buscar VIN, marca, supervisor o sucursal"/>
                    <div className="input-group-btn">
                      <button className="btn btn-default"><i className="fa fa-search"/></button>
                    </div>
                  </div>
                </div>
                {/*<div className='col-md-3' style={{ paddingTop: '10px', paddingRight: '28px' }}>*/}
                <div className='col-md-3'>
                  <div style={{padding: "10px"}}>
                    <BootstrapSelect
                      noneSelectedText="Filtrar por checklist"
                      displayItems={2}
                      sm={true}
                      selectedText="Formularios seleccionadas."
                      selected={selectedForms}
                      allOption={true}
                      selectAll={this.filterAllForms}
                      options={forms.map((form: IForm) => ({
                        value: form._id,
                        text: form.name
                      }))}
                      onClick={this.filterForms}
                      displayHandler={this.showSelect}
                      notHideOnClickOutside={false}
                    />
                  </div>
                </div>
              </div>
              {
                participants.length ?
                  <div className='table-responsive'>
                    <table className="table table-andes table-striped">
                    <thead>
                      <tr>
                        <th style={{width: '5%'}} className="middle hidden-xs">Nº</th>
                        <th style={{width: '12%'}} className="middle">VIN</th>
                        <th style={{width: '8%'}} className="middle hidden-xs">Patente</th>
                        <th style={{width: '9%'}} className="middle hidden-xs">Marca</th>
                        <th style={{width: '13%'}} className="middle hidden-xs">Supervisor</th>
                        <th style={{width: '13%'}} className="middle">Sucursal</th>
                        <th style={{width: '10%'}} className="middle-center hidden-xs">Calificación</th>
                        <th style={{width: '15%'}} className="hidden-xs">Fecha</th>
                        <th style={{width: '15%'}} className="hidden-xs">Último checkeo</th>
                        <th className="width-10 hidden-xs"/>
                        <th className="width-10"/>
                      </tr>
                    </thead>
                    <tbody>
                      {
                        participants.map((participant: IParticipant) => {
                          return (
                            <tr
                              key={participant._id} id={`car-${participant._id}`}
                              className={highlight.length && highlight.includes(participant._id as never) ? 'highlight-info' : ''}
                            >
                              <td className="middle hidden-xs">{participant.number}</td>
                              <td className="middle">
                                {participant.car.vin}
                                <div className='visible-xs-*'>
                                  <ShowIf condition={!!participant.car.patent?.length}>
                                    <br />{participant.car.patent}
                                  </ShowIf>
                                </div>
                              </td>
                              <td className="middle hidden-xs">{participant.car.patent && participant.car.patent.length ? participant.car.patent : '-'}</td>
                              <td className="middle hidden-xs">{participant.car.brand}</td>
                              <td className="middle hidden-xs">
                                {`${participant.user ? `${participant.user.firstName} ${participant.user.lastName}` : ''}`}
                              </td>
                              <td className="middle">
                                {`${participant.venue ? `${participant.venue.name}` : '-'}`}
                              </td>
                              <td className="middle-center">
                                {
                                  `${participant.hasOwnProperty('qualification') ?
                                    participant.qualification ? `${Math.round(participant.qualification)}%` : !participant.hasDamages ? '-' : '' : ''}`
                                }
                                {
                                  participant.hasDamages ?
                                    <React.Fragment>
                                      {' '}<i
                                        className="fa fa-warning text-red"
                                        data-toggle="tooltip"
                                        data-placement="top"
                                        title="Daños encontrados en esta revisión."
                                      />
                                    </React.Fragment>
                                    : null
                                }
                              </td>
                              <td className="middle hidden-xs">
                                {moment(participant.createdAt).format('L HH:mm:ss')}
                              </td>
                              <td className="middle hidden-xs">
                                {participant.name}
                                {/* {participant.car.lastForm && participant.car.lastForm.createdAt ?
                                  moment(participant.car.lastForm.createdAt).format('L HH:mm:ss')
                                  :
                                  '-'
                                } */}
                              </td>
                              <td className="text-primary middle-center hidden-xs">
                                <button
                                  className="btn btn-xs btn-default"
                                  disabled={carLoading === participant._id}
                                  onClick={() => this.printPdf(`/report/forms/pdf/${participant._id}.pdf`, participant._id)}
                                ><i className={carLoading === participant._id ? 'fa fa-spinner fa-spin' : 'fa fa-print'}/></button>
                              </td>
                              <td className="text-primary middle-center">
                                <button
                                  className="btn btn-xs btn-primary"
                                  onClick={() => this.props.history.push(`/cars/${participant.car._id}`)}
                                ><i className="fa fa-bars"/></button>
                              </td>
                            </tr>
                          );
                        })
                      }
                    </tbody>
                  </table>
                  </div>
                  : !loading ? <p style={{padding: '10px'}}><strong>No se han encontrado revisiones.</strong></p> : null
              }
            </div>
            {
              pagination.pages > 1 &&
              <div className="box-footer">
                <div className="row">
                  <div className="col-md-6" style={{ padding: '20px 15px' }}>
                    <span className="react-bootstrap-table-pagination-total text-ellipsis">
                      &nbsp;&nbsp;Mostrando registros del {(pagination.page - 1) * 20 + 1} al {(pagination.page) * 20} de {pagination.count} registros.
                      </span>
                  </div>
                  <div className="col-md-6">
                    <div className="text-right" style={{ marginRight: '15px' }}>
                      <Paginator changePage={this.changePage} page={pagination.page} pages={pagination.pages} />
                    </div>
                  </div>
                </div>
              </div>
            }
            {
              loading &&
                <div className="overlay">
                  <i className="fa fa-spinner fa-spin text-purple"/>
                </div>
            }
          </div>
        </section>
      </AppContainer>
    );
  }

  private filterForms(value: any) {
    let {selectedForms} = this.state;
    let sForms = selectedForms;

    sForms = sForms.includes(value)
        ? sForms.filter((form) => form !== value)
        : [value, ...selectedForms]

    this.setState({
      selectedForms: sForms
    });
  }

  private filterAllForms(value: boolean) {
    let {forms} = this.props.dashboard;
    let sForms = value ? forms.map( (f: IForm) => f._id) : [];

    this.setState({
      selectedForms: sForms
    });
  }

  showSelect(value: boolean) : void {
    let {selectedForms} = this.state;
    if (!value) {
      this.props.changeSearchFormsDashboardAction(selectedForms);
      this.props.getRevisionsAction(1, true);
    }
  }

  private onChangeSearch(e: React.ChangeEvent<HTMLInputElement>): void {
    e.preventDefault();
    const value = e.target.value.trim();
    this.props.changeSearchDashboardAction(value);
    this.debounceOnChangeSearch();
  }

  private debounceOnChangeSearch(): void {
    const {searchText} = this.state;
    if (searchText && searchText.length) {
      this.props.getRevisionsAction(1, true, searchText);
    } else {
      this.props.getRevisionsAction(1, true);
    }
  }

  private changePage(page: number): void {
    // change the page
    this.props.getRevisionsAction(page, true);
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
    getRevisionsThunkAction: (page: number, loading: boolean, search?: string) => dispatch(getRevisionsThunkAction(page, loading, search)),
    changeSearchFormsDashboardAction : (forms : string[]) => dispatch(changeFormsSearchDashboardAction(forms)),
    changeSearchDashboardAction: (searchText: string) => dispatch(changeSearchDashboardAction(searchText)),
    changeRangeDashboardAction: (from: string, to: string) => dispatch(changeRangeDashboardAction(from, to)),
    getRevisionsAction: (page: number, loading: boolean, search?: string) => dispatch(getRevisionsAction(page, loading, search))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(DashboardVinView);
