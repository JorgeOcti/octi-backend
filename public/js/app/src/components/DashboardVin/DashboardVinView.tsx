import * as moment from 'moment-timezone';
import * as Raven from 'raven-js';
import * as React from 'react';
import { ErrorInfo } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { Dispatch } from 'redux';
import { io } from 'socket.io-client';
import { Socket } from 'socket.io-client/build/esm/socket';
import { debounce } from 'throttle-debounce';
import * as swal from 'sweetalert';
import { IParticipant } from '../../../../../../src/form/interfaces/participant.interface';
import {
  DashboardReduxAction,
  IDashboardState,
  IDashboardFilter,
  getRevisionsThunkAction,
  changeFilterDashboardAction,
  getRevisionsAction,
  getParticipant,
  changingParticipantAnswer
} from '../../actions/dashboard.actions';
import AppContainer from '../../container/AppContainer';
import { IWindow } from '../../interfaces/window';
import Paginator from '../Utils/Paginator';
import TrackingBasePage from '../Utils/TrackingBasePage';
import DateRangeInput from '../Utils/DateRangeInput';
import BootstrapSelect from '../Utils/BootstrapSelect';
import { IForm } from '../../../../../../src/form/interfaces/form.interface';
import { IBrand } from '../../../../../../src/app/interfaces/brand.interface';
import ShowIf from '../Utils/ShowIf';
import CopyText from '../Utils/CopyText';
import { parseReplicableURL } from '../../utils/common';
import * as daterangepicker from 'daterangepicker';
import ModalView from '../Modal/ModalView';

declare let window: IWindow;

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<DashboardReduxAction>;
  dashboard: IDashboardState;

  getRevisionsThunkAction(
    page: number,
    loading: boolean,
    search?: string
  ): void;

  getParticipant(id: string): void;

  getRevisionsAction(page: number, loading: boolean, search?: string): void;

  changeFilterDashboardAction(filter: IDashboardFilter): void;

  changingParticipantAnswer(revisionId: string, answer: string): void;
}

interface WebQuestion {
  question: string;
  type: string;
  answer: string;
}

interface IStateType {
  error: Error | null;
  highlight: string[];
  searchText: string;
  revisionAnswers: Record<string, WebQuestion>;
  carLoading: string;
  downloading: boolean;
}

class DashboardVinView extends TrackingBasePage<IPropsType, IStateType> {

  public title: string;

  readonly state: IStateType = {
    error: null,
    highlight: [],
    searchText: '',
    revisionAnswers: {},
    carLoading: '',
    downloading: false
  };

  protected printIframe: any;

  protected isMount: boolean = false;
  private socket: Socket;

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Buscador de revisiones';
    this.state.searchText = this.props.dashboard.filter.searchText;
    this.changePage = this.changePage.bind(this);
    this.onChangeSearch = this.onChangeSearch.bind(this);
    this.printPdf = this.printPdf.bind(this);
    this.debounceOnChangeSearch = debounce(1000, this.debounceOnChangeSearch);
    this.debounceOnChangeParticipantAnswer = debounce(1000, this.debounceOnChangeParticipantAnswer);
    this.downloadReport = this.downloadReport.bind(this);
    this.downloadEvidence = this.downloadEvidence.bind(this);
    this.onDateRangeChange = this.onDateRangeChange.bind(this);
    this.filterForms = this.filterForms.bind(this);
    this.filterAllForms = this.filterAllForms.bind(this);
    this.filterBrands = this.filterBrands.bind(this);
    this.filterAllBrands = this.filterAllBrands.bind(this);
    this.onChangeQuestion = this.onChangeQuestion.bind(this);
  }

  public printPdf(url: string, carLoading: string) {
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

  public componentWillMount(): void {
    // set the title of the page
    const { page } = this.props.dashboard.pagination;
    this.props.getRevisionsThunkAction(page, true);

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
        room: `dashboard-vin-view-${window.user.team._id}`
      });
    });

    this.socket.on('REFRESH', (data: any): void => {
      const { page } = this.props.dashboard.pagination;
      const { forms } = this.props.dashboard;
      if (
        data.update &&
        window.user.venuesAccess.includes(data.venueId) &&
        forms.map((form: IForm) => form._id).includes(data.formId)
      ) {
        this.props.getRevisionsAction(page, false);
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

  public componentDidMount(): void {
    super.componentDidMount();
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error });
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

  public componentDidUpdate(
    prevProps: Readonly<IPropsType>,
    prevState: Readonly<IStateType>,
    snapshot?: any
  ): void {
    $('[data-toggle="tooltip"]').tooltip();
  }

  public downloadReport() {
    const { searchFrom, searchTo, searchForms, searchText } = this.props.dashboard.filter;
    const monthsDiff = moment(searchTo).diff(moment(searchFrom), 'months');
    this.trackClick('Descargar reporte', {
      searchFrom,
      searchTo
    });

    if (monthsDiff > 3) {
      swal!(
        'Revisiones',
        'Selecciona un rango menor que 3 meses para descargar la información',
        'error'
      );
    } else {
      let query = `?deliveries=0&from=${moment(searchFrom).unix()}&to=${moment(
        searchTo
      ).unix()}`;

      if (searchText) query += `&search=${searchText}`;

      if (searchForms) query += `&forms=${searchForms.join(',')}`;

      window.open(`/api/participant/export/${query}`, '_blank');
    }
  }

  public downloadEvidence() {
    const { searchFrom, searchTo, searchForms, searchText } = this.props.dashboard.filter;
    const monthsDiff = moment(searchTo).diff(moment(searchFrom), 'months');
    this.trackClick('Descargar evidencia', {
      searchFrom,
      searchTo
    });
    if (monthsDiff > 3) {
      swal!(
        'Revisiones',
        'Selecciona un rango menor que 3 meses para descargar la información',
        'error'
      );
    } else {
      let query = `?deliveries=0&from=${moment(searchFrom).unix()}&to=${moment(
        searchTo
      ).unix()}`;

      if (searchText) query += `&search=${searchText}`;

      if (searchForms) query += `&forms=${searchForms.join(',')}`;

      window.open(`/api/participant/export/evidence/${query}`, '_blank');
    }
  }

  public render(): React.ReactElement<IPropsType> {
    const {
      loading,
      participants,
      pagination,
      filter,
      forms,
      brands,
      loadingParticipant
    } = this.props.dashboard;
    const { highlight, carLoading, downloading, searchText } = this.state;
    const { getParticipant } = this.props;
    return (
      <AppContainer
        title={
          <div style={{ width: '180px' }}>
            <DateRangeInput
              options={this.getDateRangeOptions()}
              onChange={this.onDateRangeChange}
              startDate={filter.searchFrom}
              endDate={filter.searchTo}
            />
          </div>
        }
        cMenu="1"
        cSubMenu="1.2">
        <section className="content">
          <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">
                {this.title}&nbsp;
                <small>
                  {new Intl.NumberFormat('de-DE').format(pagination.count)}
                </small>
              </h3>
              <div className="box-tools pull-right">
                <button
                  className="btn btn-sm btn-primary hidden-xs hidden-sm hidden-sm"
                  onClick={this.downloadReport}
                  disabled={downloading}>
                  <i className="fa fa-fw fa-download"/> Exportar
                </button>
              </div>
            </div>
            <div className={`box-body no-padding`}>
              <div className="row no-margin">
                <div className="col-md-12 no-padding">
                  <div
                    className="input-group input-group"
                    style={{ padding: '10px' }}>
                    <input
                      type="text"
                      className="form-control pull-right"
                      onChange={this.onChangeSearch}
                      value={searchText}
                      placeholder="Buscar por VIN, descripción unidad, supervisor y/o sucursal"
                    />
                    <div className="input-group-btn">
                      <button className="btn btn-primary">
                        <i className="fa fa-search" />
                      </button>
                    </div>
                  </div>
                </div>
                {/* <div className="col-md-4 col-md-offset-8 no-padding"> */}
                <div className="col-md-6 no-padding">
                  <div style={{ padding: '10px' }}>
                    <BootstrapSelect
                      noneSelectedText="Todos los controles"
                      displayItems={4}
                      autoClouse={true}
                      selectedText="formularios seleccionadas."
                      selected={filter.searchForms}
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
                    <BootstrapSelect
                      noneSelectedText="Todas las marcas"
                      displayItems={4}
                      autoClouse={false}
                      search={true}
                      selectedText="marcas seleccionadas."
                      allOption={true}
                      separator=" - "
                      options={brands.map((brand) => ({value: brand._id, text: brand.name}))}
                      notHideOnClickOutside={false}
                      selected={filter.searchBrands}
                      onClick={this.filterBrands}
                      selectAll={this.filterAllBrands}
                    />
                  </div>
                </div>
                {/* <div className="col-md-6 no-padding">
                  <div style={{ padding: '10px' }}>
                    <DateRangeInput
                      options={this.getDateRangeOptions()}
                      onChange={this.onDateRangeChange}
                      startDate={from}
                      endDate={to}
                    />
                  </div>
                </div> */}
              </div>
              {participants.length ? (
                <div className="table-responsive" style={{ border: 0 }}>
                  <table className="table table-andes table-striped table-hover">
                    <thead>
                      <tr>
                        <th style={{ width: '18%' }} className="middle">
                          Detalle
                        </th>
                        {/*<th style={{width: '18%'}} className="middle hidden-xs hidden-sm">Unidad</th>*/}
                        {/*<th style={{width: '13%'}} className="middle hidden-xs hidden-sm">Supervisor</th>*/}
                        <th
                          style={{ width: '15%' }}
                          className="middle hidden-xs hidden-sm">
                          Control
                        </th>
                        <th
                          style={{ width: '20%' }}
                          className="middle hidden-xs hidden-sm">
                          Supervisor
                        </th>
                        <th
                          style={{ width: '20%' }}
                          className="middle hidden-xs hidden-sm"></th>
                        <th
                          style={{ width: '10%' }}
                          className="middle hidden-xs hidden-sm"></th>
                        <th
                          style={{ width: '1%' }}
                          className="middle-center hidden-xs hidden-sm"></th>
                        {/*<th style={{width: '15%'}} className="hidden-xs hidden-sm">Fecha</th>*/}
                        <th style={{ width: '1%' }} />
                      </tr>
                    </thead>
                    <tbody>
                      {participants.map((participant: IParticipant) => {
                        return (
                          <tr
                            key={participant._id}
                            id={`car-${participant._id}`}
                            className={
                              highlight.length &&
                              highlight.includes(participant._id as never)
                                ? 'highlight-info'
                                : ''
                            }>
                            <td
                              className="middle"
                              style={{
                                paddingTop: '10px',
                                paddingBottom: '10px'
                              }}>
                              <div className="visible-xs visible-sm">
                                <strong className="text-primary">
                                  {participant.car?.vin}
                                </strong>{' '}
                                <strong className="text-muted">
                                  #{participant.number}
                                </strong>
                                <br />
                                <strong className={'text-muted'}>
                                  {participant.name}
                                </strong>
                              </div>
                              <div className="hidden-xs hidden-sm">
                                <CopyText value={participant.car?.vin}>
                                  <strong
                                    className="text-primary pointer text-underline"
                                    onClick={() =>
                                      this.props.history.push(
                                        parseReplicableURL(
                                          `/cars/${participant.car?._id}`
                                        )
                                      )
                                    }>
                                    {participant.car?.vin}
                                  </strong>
                                </CopyText>{' '}
                                <strong className="text-sm text-muted">
                                  #{participant.number}
                                </strong>
                              </div>
                              <span className="visible-xs visible-sm">
                                <strong className={'text-muted'}>
                                  {participant.car?.brand}
                                </strong>
                                <br /> {participant.car?.denomination}
                                <br />
                                {participant.car?.color}
                                <br />
                              </span>
                              <span className="text-muted text-sm hidden-xs hidden-sm">
                                <strong>{participant.car?.brand}</strong>
                                <br />
                                {participant.car?.denomination}
                                <br /> {participant.car?.color}
                                <ShowIf
                                  condition={!!participant.car?.patent?.length}>
                                  <div>
                                    <i className="fa fa-fw fa-id-card-o" />{' '}
                                    {participant.car?.patent &&
                                    participant.car?.patent.length
                                      ? participant.car?.patent
                                      : '-'}
                                  </div>
                                </ShowIf>
                              </span>
                              <div className="visible-xs visible-sm text-muted text-sm">
                                <span>
                                  <i className="fa fa-fw fa-user-o" />{' '}
                                  {`${
                                    participant.user
                                      ? `${participant.user.firstName?.toLocaleUpperCase()} ${participant.user.lastName?.toLocaleUpperCase()}`
                                      : ''
                                  }`}
                                </span>
                                <br />
                                <span>
                                  <i className="fa fa-fw fa-flag-o" />{' '}
                                  {`${
                                    participant.venue
                                      ? `${participant.venue.name}`
                                      : '-'
                                  }`}{' '}
                                  <ShowIf condition={participant.hasDamages}>
                                    <React.Fragment>
                                      {' '}
                                      <i
                                        className="fa fa-warning text-red"
                                        data-toggle="tooltip"
                                        data-placement="top"
                                        title="Daños encontrados en esta revisión."
                                      />
                                    </React.Fragment>
                                  </ShowIf>
                                </span>
                                <br />
                                <div>
                                  <i className="fa fa-clock-o fa-fw" />{' '}
                                  {moment(participant.createdAt).fromNow()} (
                                  {moment(participant.createdAt).format('LLL')})
                                </div>
                                <ShowIf
                                  condition={!!participant.car?.patent?.length}>
                                  <span>
                                    <i className="fa fa-fw fa-id-card-o" />{' '}
                                    {participant.car?.patent &&
                                    participant.car?.patent.length
                                      ? participant.car?.patent
                                      : '-'}
                                  </span>
                                </ShowIf>
                              </div>
                            </td>
                            <td className="middle hidden-xs hidden-sm">
                              <strong className="text-muted text-sm">
                                {participant.name}
                              </strong>
                            </td>

                            <td
                              className="middle hidden-xs hidden-sm  text-ellipsis"
                              style={{
                                paddingTop: '15px',
                                paddingBottom: '15px'
                              }}>
                              <div className="text-muted">
                                <strong>
                                  <i className="fa fa-fw fa-user-o" />{' '}
                                  {`${
                                    participant.user
                                      ? `${participant.user.firstName?.toLocaleUpperCase()} ${participant.user.lastName?.toLocaleUpperCase()}`
                                      : ''
                                  }`}
                                </strong>
                                <br />
                              </div>
                              <div className="text-muted text-sm">
                                <i className="fa fa-fw fa-flag-o" />{' '}
                                {`${
                                  participant.venue
                                    ? `${participant.venue.name}`
                                    : '-'
                                }`}{' '}
                                <ShowIf condition={participant.hasDamages}>
                                  <React.Fragment>
                                    {' '}
                                    <i
                                      className="fa fa-warning text-red"
                                      data-toggle="tooltip"
                                      data-placement="top"
                                      title="Daños encontrados en esta revisión."
                                    />
                                  </React.Fragment>
                                </ShowIf>
                              </div>
                              <div className="text-muted text-sm">
                                {`${
                                  participant.company
                                    ? `${participant.company.name}`
                                    : '-'
                                }`}
                              </div>
                            </td>
                            <td className="middle-left hidden-xs hidden-sm">
                              {
                                (participant.hasOwnProperty("webQuestion") && participant.webQuestion && participant.webQuestion!.hasOwnProperty("answer") && participant.webQuestion!.hasOwnProperty("question")) ?
                                  <div className="input-group revision-input-group-answer">
                                    <input type="text"
                                      className="form-control revision-input-field-answer"
                                      placeholder={"Agregar " + participant.webQuestion!.question}
                                      value={participant.webQuestion!.answer.length > 0 ? participant.webQuestion!.answer : ''}
                                      onChange={(e) => this.onChangeQuestion(e, participant._id)}
                                    />
                                    <span className={` input-group-addon  revision-icon-wrapper-answer ${participant.webQuestion!.answer.length > 0 ? '' : 'label-success'} `}
                                      id="basic-addon1">
                                      <i className="fa fa-fw fa-floppy-o" />
                                    </span>
                                  </div> : <></>
                              }
                            </td>
                            <td className="middle-center hidden-xs hidden-sm">
                              <div
                                className="text-muted text-sm"
                                data-toggle="tooltip"
                                data-placement="top"
                                title={moment(participant.createdAt).format(
                                  'LLL'
                                )}>
                                <i className="fa fa-fw fa-clock-o" />{' '}
                                {moment(participant.createdAt).fromNow()}
                              </div>
                            </td>
                            <td className="middle-center hidden-xs hidden-sm text-muted text-sm">
                              {`${
                                participant.hasOwnProperty('qualification')
                                  ? participant.qualification
                                    ? `${Math.round(
                                        participant.qualification
                                      )}%`
                                    : !participant.hasDamages
                                    ? ''
                                    : ''
                                  : ''
                              }`}
                            </td>
                            <td className="text-primary middle-center text-ellipsis">
                              <div className="hidden-xs hidden-sm">
                                <div
                                  className="btn-group"
                                  style={{ width: '100px' }}>
                                  <button
                                    className="btn btn-sm btn-default"
                                    onClick={() =>
                                      this.props.history.push(
                                        `/cars/${participant.car?._id}`
                                      )
                                    }>
                                    <i className="fa fw fa-bars" />
                                  </button>

                                  <button
                                    className="btn btn-sm btn-default hidden-xs hidden-sm"
                                    disabled={carLoading === participant._id}
                                    onClick={() =>
                                      participant.name === "Aforo" ?
                                        this.printPdf(
                                          `/report/aforo/pdf/${participant._id}.pdf`,
                                          participant._id
                                        ) :
                                      this.printPdf(
                                        `/report/forms/pdf/${participant._id}.pdf`,
                                        participant._id
                                      )
                                    }>
                                    <i
                                      className={
                                        carLoading === participant._id
                                          ? 'fa fw fa-spinner fa-spin'
                                          : 'fa fw fa-print'
                                      }
                                    />
                                  </button>

                                  <button
                                    className="btn btn-primary btn-sm"
                                    disabled={
                                      !!(
                                        loadingParticipant &&
                                        loadingParticipant === participant._id
                                      )
                                    }
                                    onClick={
                                      loadingParticipant
                                        ? undefined
                                        : () => getParticipant(participant._id)
                                    }>
                                    <ShowIf
                                      condition={
                                        !!(
                                          loadingParticipant &&
                                          loadingParticipant === participant._id
                                        )
                                      }
                                      alternative={
                                        <i className="fa fw fa-check-square-o" />
                                      }>
                                      <i className="fa fw fa-spin fa-spinner" />
                                    </ShowIf>
                                  </button>
                                </div>
                              </div>
                              <div className="visible-xs visible-sm">
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() =>
                                    this.props.history.push(
                                      `/cars/${participant.car?._id}`
                                    )
                                  }>
                                  <i className="fa fw fa-bars" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : !loading ? (
                <p style={{ padding: '10px' }}>
                  <strong>No se han encontrado revisiones.</strong>
                </p>
              ) : null}
            </div>
            {pagination.pages > 1 && (
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
            )}
            {!participants.length && loading && (
              <div className="overlay">
                <i className="fa fa-spinner fa-spin text-purple" />
              </div>
            )}
          </div>
          <ModalView />
        </section>
      </AppContainer>
    );
  }

  private filterForms(value: any) {
    let { searchForms } = this.props.dashboard.filter;

    this.props.changeFilterDashboardAction({
      ...this.props.dashboard.filter,
      searchForms: searchForms.includes(value) ? searchForms.filter((form) => form !== value) : [value, ...searchForms]
    });
  }

  private filterAllForms(value: boolean) {
    let { forms, filter } = this.props.dashboard;

    this.props.changeFilterDashboardAction({
      ...filter,
      searchForms: value ? forms.map((form: IForm) => form._id) : []
    });
  }

  private filterBrands(value: any) {
    let { searchBrands } = this.props.dashboard.filter;

    this.props.changeFilterDashboardAction({
      ...this.props.dashboard.filter,
      searchBrands: searchBrands.includes(value) ? searchBrands.filter((brand) => brand !== value) : [value, ...searchBrands]
    });
  }

  private filterAllBrands(value: boolean) {
    let { brands, filter } = this.props.dashboard;

    this.props.changeFilterDashboardAction({
      ...filter,
      searchBrands: value ? brands.map((brand: IBrand) => brand._id) : []
    });
  }

  private onChangeSearch(e: React.ChangeEvent<HTMLInputElement>): void {
    e.preventDefault();
    const value = e.target.value;
    this.setState({
      searchText: value
    });
    this.debounceOnChangeSearch();
  }

  private getWebQuestionParticipantByID(revisionId: string): any {
    const  participants  = this.props.dashboard.participants;
    const participantFiltered = participants.filter(participant => participant._id == revisionId);
    return participantFiltered.length > 0 ? participantFiltered[0].webQuestion : undefined;
  }

  private onChangeQuestion(e: React.ChangeEvent<HTMLInputElement>, revisionId: string): void {
      e.preventDefault();
      const value = e.target.value;
      const webQuestion = this.getWebQuestionParticipantByID(revisionId);
      webQuestion.answer = value;
      this.setState({
        revisionAnswers: { [revisionId]: webQuestion }
      });
      this.debounceOnChangeParticipantAnswer();
  }

private debounceOnChangeParticipantAnswer(): void {
    const { revisionAnswers } = this.state;
    if (revisionAnswers && Object.keys(revisionAnswers).length) {
      const revisionId = Object.keys(revisionAnswers)[0];
      const answer = revisionAnswers[revisionId]?.answer || '';
      this.props.changingParticipantAnswer(revisionId, answer);
    } else {
      this.props.changingParticipantAnswer('', '');
    }
  }

  private debounceOnChangeSearch(): void {
    const { searchText } = this.state;
    const { filter } = this.props.dashboard;
    if (searchText && searchText.length) {
      this.props.changeFilterDashboardAction({
        ...filter,
        searchText: searchText
      });
    } else {
      this.props.changeFilterDashboardAction({
        ...filter,
        searchText: ""
      });
    }
  }

  private changePage(page: number): void {
    // change the page
    this.props.getRevisionsAction(page, false);
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
        'Hoy': [moment().startOf('days').toDate(), moment().endOf('days').toDate()],
        'Este mes': [moment().startOf('month').toDate(), moment().toDate()],
        'Últimos 3 meses': [
          moment().subtract(3, 'months').startOf('month').toDate(),
          moment().toDate()
        ],
        'Últimos 6 meses': [
          moment().subtract(6, 'months').startOf('month').toDate(),
          moment().toDate()
        ],
        'Último año': [
          moment().subtract(12, 'months').startOf('month').toDate(),
          moment().toDate()
        ]
      },
      opens: 'left'
    };
  }

  private onDateRangeChange(from: Date, to: Date) {
    const { filter } = this.props.dashboard;
    this.props.changeFilterDashboardAction({
      ...filter,
      searchFrom: moment(from).toDate(),
      searchTo: moment(to).toDate()
    });
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
    getParticipant: (id: string) => dispatch(getParticipant(id)),
    getRevisionsThunkAction: ( page: number, loading: boolean, search?: string ) => dispatch(
        getRevisionsThunkAction(
          page,
          loading,
          search,
          undefined,
          undefined,
          undefined
        )
    ),
    changeFilterDashboardAction: (filter:IDashboardFilter) => dispatch(changeFilterDashboardAction(filter)),
    getRevisionsAction: (page: number, loading: boolean, search?: string) => dispatch(getRevisionsAction(page, loading, search)),
    changingParticipantAnswer: (revisionId: string, answer: string) => dispatch(changingParticipantAnswer(revisionId, answer)),
  };
};

export default connect<{}, {}, IPropsType>(
  mapStateToProps,
  mapDispatchToProps
)(DashboardVinView);
