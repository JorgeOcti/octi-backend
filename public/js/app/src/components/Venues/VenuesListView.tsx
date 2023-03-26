import { default as Axios } from 'axios';
import * as moment from 'moment';
import * as Raven from 'raven-js';
import * as React from 'react';
import { ErrorInfo } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { Dispatch } from 'redux';
import * as swal from 'sweetalert';
import * as mapboxgl from 'mapbox-gl';
import ApiService from '../../utils/axios';
import {
  IBaseVenue,
  IVenue
} from '../../../../../../src/app/interfaces/venue.interface';
import { loadDataAction, ModalReduxAction } from '../../actions/modal.actions';
import {
  changeFilterAction,
  changeSearchAction,
  changeTempVenueAction,
  createVenueAction,
  deleteVenueAction,
  getVenuesAction,
  IVenuesState,
  updateVenueAction,
  VenueReduxAction
} from '../../actions/venues.actions';
import AppContainer from '../../container/AppContainer';
import { IWindow } from '../../interfaces/window';
import { hasPermission } from '../../utils/common';
import ModalView from '../Modal/ModalView';
import Paginator from '../Utils/Paginator';
import VenueFormView from './VenueFormView';
import TrackingBasePage from '../Utils/TrackingBasePage';
import { debounce } from 'throttle-debounce';
import { io } from 'socket.io-client';
import { Socket } from 'socket.io-client/build/esm/socket';
import CopyText from '../Utils/CopyText';
import Row from '../Utils/Row';
import BootstrapSelect from '../Utils/BootstrapSelect';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<VenueReduxAction>;
  venues: IVenuesState;

  getVenuesAction(page: number): VenueReduxAction;

  createVenueAction(): VenueReduxAction;

  updateVenueAction(): VenueReduxAction;

  deleteVenueAction(id?: string): VenueReduxAction;

  changeTempVenueAction(venue: IBaseVenue): VenueReduxAction;

  changeFilterAction(filter: string, value: string): VenueReduxAction;

  changeSearchAction(searchText: string): VenueReduxAction;

  loadDataAction(
    title: string,
    body: JSX.Element,
    footer: JSX.Element
  ): ModalReduxAction;
}

interface IStateType {
  error: Error | null;
  exporting: boolean;
  tab: string;
}

declare let window: IWindow;

class VenuesListView extends TrackingBasePage<IPropsType, IStateType> {
  title: string;

  private socket: Socket;
  private map: any;
  readonly state: IStateType = {
    error: null,
    exporting: false,
    tab: 'list'
  };

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Listado de sucursales';
    this.changePage = this.changePage.bind(this);
    this.createVenue = this.createVenue.bind(this);
    this.processCreateVenue = this.processCreateVenue.bind(this);
    this.updateVenue = this.updateVenue.bind(this);
    this.processUpdateVenue = this.processUpdateVenue.bind(this);
    this.deleteVenue = this.deleteVenue.bind(this);
    this.onChangeTab = this.onChangeTab.bind(this);
    this.exportExcel = this.exportExcel.bind(this);
    this.changeTab = this.changeTab.bind(this);
    this.onChangeSearch = this.onChangeSearch.bind(this);
    this.filterCompany = this.filterCompany.bind(this);
    this.debounceOnChangeSearch = debounce(300, this.debounceOnChangeSearch);
  }

  private changeTab(name: string): void {
    // const { id } = this.props.match.params;
    // if (name === 'detail') {
    //   this.props.history.replace(`/inventory/${id}/detail/`);
    // } else {
    //   this.props.history.replace(`/inventory/${id}/`);
    // }
    this.setState(
      {
        tab: name
      },
      this.onChangeTab
    );
  }

  public componentWillMount(): void {
    const { pagination } = this.props.venues;
    this.props.getVenuesAction(pagination.page);

    // socket
    this.socket = io(`${location.protocol}//${location.host}`, {
      secure: location.protocol === 'https:',
      transports: ['websocket'],
      reconnection: true,
      query: { token: (window.user as any).token }
    });
    this.socket.on('connect', () => {
      this.socket.emit('join', { room: `venue-list-${window.user.team._id}` });
    });
    this.socket.on('REFRESH', (data: any): void => {
      if (data.update && data.updatedBy !== window.user._id) {
        const { pagination } = this.props.venues;
        this.props.getVenuesAction(pagination.page);
      }
    });
  }

  public exportExcel() {
    this.setState({
      exporting: true
    });
    this.trackClick('Exportar');
    const api: ApiService = new ApiService();
    const instance = api.getInstance();
    instance.defaults.responseType = 'blob';
    instance
      .get(`/settings/venues/export-access/`)
      .then((response) => {
        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const fileName = `${moment().format(
          'YYYYMMDD'
        )}-acceso-sucursales.xlsx`;
        // if (typeof window.navigator.msSaveBlob !== 'undefined') {
        //   // IE workaround for "HTML7007: One or more blob URLs were
        //   // revoked by closing the blob for which they were created.
        //   // These URLs will no longer resolve as the data backing
        //   // the URL has been freed."
        //   window.navigator.msSaveBlob(blob, fileName);
        // } else {
        const blobURL = URL.createObjectURL(blob);
        const tempLink = document.createElement('a');
        tempLink.style.display = 'none';
        tempLink.href = blobURL;
        tempLink.setAttribute('download', fileName);
        // Safari thinks _blank anchor are pop ups. We only want to set _blank
        // target if the browser does not support the HTML5 download attribute.
        // This allows you to download files in desktop safari if pop up blocking
        // is enabled.
        if (typeof tempLink.download === 'undefined') {
          tempLink.setAttribute('target', '_blank');
        }
        this.setState({
          exporting: false
        });
        document.body.appendChild(tempLink);
        tempLink.click();
        document.body.removeChild(tempLink);
        URL.revokeObjectURL(blobURL);
        // }
      })
      .catch((err) => {
        this.setState({
          exporting: false
        });
        if (!Axios.isCancel(err)) {
          swal(
            'Exportar usuarios',
            'Ha ocurrido un error al general el excel.',
            'error'
          );
        }
      });
  }

  private onChangeTab() {
    const { allVenues: venues } = this.props.venues;

    const geojson = {
      type: 'FeatureCollection',
      features: venues
        .filter((venue) => venue.lng && venue.lat)
        .map((venue: any) => {
          return {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [venue.lng, venue.lat]
            },
            properties: {
              title: 'Sucursal',
              name: venue.name?.toUpperCase(),
              venue,
              logo: venue.company.marker?.url?.length
                ? `url("${venue.company.marker.url}")`
                : 'url("/static/images/files/pin_osa.svg")'
            }
          };
        })
    };

    const $map = this.map;
    // $('#map').css('width', $('#tab_2').width() as any);
    const bounds = new mapboxgl.LngLatBounds();
    geojson.features.forEach((marker) => {
      // create a HTML element for each feature
      const el: HTMLDivElement = document.createElement('div');
      // here set class use in the marker
      // el.className = 'marker';
      el.style.backgroundImage = marker.properties.logo;
      el.style.backgroundSize = 'cover';
      el.style.width = '50px';
      el.style.height = '50px';
      el.style.borderRadius = '50p%';
      el.style.cursor = 'pointer';

      // make a marker for each feature and add to the map
      if (Math.abs(marker.geometry.coordinates[0]) > 0.1) {
        new mapboxgl.Marker(el)
          .setLngLat(marker.geometry.coordinates as [number, number])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <strong>${marker.properties.name}</strong><br />
            ${marker.properties.venue.name}<br />
<!--            <strong >Editar</strong>-->
          `)
          )
          .addTo($map);

        bounds.extend(marker.geometry.coordinates as [number, number]);
      }
    });
    $map.resize();
    $map.fitBounds(bounds, { padding: 100 });
  }

  public componentDidMount() {
    super.componentDidMount();
    // mapboxgl.accessToken = 'pk.eyJ1IjoicmliYXJyYWNsIiwiYSI6ImNqems3dW85bTAwZmUzbnF0a2xubnl5ejUifQ.tfPmGSbHYdh2nMA6Fmxcxw';
    this.map = new mapboxgl.Map({
      accessToken:
        'pk.eyJ1IjoicmliYXJyYWNsIiwiYSI6ImNqems3dW85bTAwZmUzbnF0a2xubnl5ejUifQ.tfPmGSbHYdh2nMA6Fmxcxw',
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-70.593536, -33.509243],
      zoom: 10,
      trackResize: true
    });
    this.map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    $("a[href='#tab_2']").on('shown.bs.tab', () => {
      this.onChangeTab();
    });
  }

  public componentDidUpdate(
    prevProps: Readonly<IPropsType>,
    prevState: Readonly<IStateType>,
    snapshot?: any
  ): void {
    if (this.props.venues.pagination !== prevProps.venues.pagination) {
      window.scrollTo(0, 0);
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error });
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public componentWillUnmount(): void {
    // cancel request if component is inmounted
    if (this.props.venues.source) {
      this.props.venues.source.cancel('Operation canceled by the user.');
    }
    this.socket.disconnect();
  }

  public render(): React.ReactElement<IPropsType> {
    const { exporting, tab } = this.state;
    const { loading, venues, pagination, searchText, companies, filters } =
      this.props.venues;
    return (
      <AppContainer title="" cMenu="10" cSubMenu="10.4" cAction="Listado">
        <section className="content">
          <Row>
            <div className="col-md-12 col-lg-12">
              <div className="box box-solid">
                <ul className="nav nav-pills nav-justified no-padding">
                  <li
                    className={
                      tab === 'list' ? 'no-margin active' : 'no-margin'
                    }>
                    <a
                      href="javascript:void(0);"
                      className={tab === 'list' ? 'background-transition' : ''}
                      style={{ borderTop: '0', marginBottom: '0' }}
                      onClick={() => this.changeTab('list')}>
                      Sucursales
                    </a>
                  </li>
                  <li
                    className={
                      tab === 'map' ? 'no-margin active' : 'no-margin'
                    }>
                    <a
                      className={tab === 'map' ? 'background-transition' : ''}
                      href="javascript:void(0);"
                      style={{ borderTop: '0', marginBottom: '0' }}
                      onClick={() => this.changeTab('map')}>
                      Mapa
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </Row>

          <div className={`box ${tab === 'list' ? '' : 'hidden'}`}>
            <div className="box-header with-border">
              <h3 className="box-title">
                Sucursales <small>{pagination.count}</small>
              </h3>
              <div className="box-tools pull-right">
                {hasPermission(window.user, 'addVenue') ? (
                  <button
                    className="btn btn-sm btn-success"
                    onClick={this.createVenue}>
                    <i className="fa fa-plus" /> Crear sucursal
                  </button>
                ) : null}
                <button
                  className="btn btn-sm btn-primary  hidden-xs"
                  onClick={this.exportExcel}
                  disabled={exporting}
                  style={{ marginLeft: '5px' }}>
                  {exporting ? (
                    <React.Fragment>
                      <i className="fa fa-spin fa-spinner" /> Exportando
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <i className="fa fa-fw fa-download" /> Exportar
                    </React.Fragment>
                  )}
                </button>
              </div>
            </div>
            <div className="box-body no-padding">
              <div className="row">
                <div className="col-md-8">
                  <div
                    className="input-group input-group"
                    style={{ padding: '10px' }}>
                    <input
                      type="text"
                      value={searchText}
                      className="form-control pull-right"
                      onChange={this.onChangeSearch}
                      placeholder="Buscar"
                    />
                    <div className="input-group-btn">
                      <button className="btn btn-primary">
                        <i className="fa fa-search" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div style={{ padding: '10px' }}>
                    <BootstrapSelect
                      // sm={true}
                      noneSelectedText="Todas las empresas"
                      displayItems={2}
                      selectedText="sucursales seleccionadas."
                      selected={filters.company ? [filters.company] : []}
                      // selected={[]}
                      autoClouse={true}
                      allOption={false}
                      // selectAll={this.filterAllVenues}
                      options={companies.map((company: any) => ({
                        value: company._id,
                        text: company.name.toUpperCase()
                      }))}
                      // onClick={() => {
                      //   console.log('click');
                      // }}
                      onClick={this.filterCompany}
                    />
                  </div>
                </div>
              </div>
              <div className="box-body no-padding">
                <table className="table table-andes table-striped table-hover">
                  <thead>
                    <tr>
                      <th style={{ width: '40%' }} className="middle">
                        Nombre
                      </th>
                      <th style={{ width: '10%' }} className="middle hidden-xs">
                        Código
                      </th>
                      <th
                        style={{ width: '10%' }}
                        className="middle-center hidden-xs">
                        Distribuidor
                      </th>
                      <th style={{ width: '10%' }} className="middle hidden-xs">
                        Asignaciones
                      </th>
                      <th
                        style={{ width: '10%' }}
                        className="middle-center hidden-xs">
                        Ubicación
                      </th>
                      <th style={{ width: '15%' }} className="middle hidden-xs">
                        Modificado
                      </th>
                      {hasPermission(window.user, 'changeVenue') ? (
                        <th style={{ width: '1%' }} className="width-10" />
                      ) : null}
                      {hasPermission(window.user, 'deleteVenue') ? (
                        <th style={{ width: '1%' }} className="width-10" />
                      ) : null}
                    </tr>
                  </thead>
                  <tbody>
                    {venues.map((venue: IVenue) => {
                      const canDelete =
                        venue.users &&
                        venue.users.length === 0 &&
                        venue.participants &&
                        venue.participants.length === 0;
                      return (
                        <tr
                          key={venue._id}
                          id={`venue-${venue._id}`}
                          className={'background-transition'}>
                          <td className="middle">
                            <CopyText value={`${venue.name?.toUpperCase()}`}>
                              <strong className="text-primary">
                                {venue.name?.toUpperCase()}
                              </strong>
                            </CopyText>
                            <br />
                            {venue.company ? (
                              <span className={'text-sm text-muted'}>
                                {venue.company.name?.toUpperCase()}
                              </span>
                            ) : null}
                          </td>
                          <td className="middle text-sm text-muted  hidden-xs">
                            {venue.code}
                          </td>
                          <td className="middle-center hidden-xs">
                            {venue.type === 'distributor' ? (
                              <i className="fa fa-check-circle text-green" />
                            ) : (
                              <i className="fa fa-times-circle text-blue" />
                            )}
                          </td>
                          <td className="middle text-sm text-muted  hidden-xs">
                            Usuarios: {venue.users ? venue.users.length : 0}
                            <br />
                            Revisiones:{' '}
                            {venue.participants ? venue.participants.length : 0}
                            <br />
                          </td>
                          <td className="middle text-sm text-muted hidden-xs">
                            lat: {venue.lat}
                            <br />
                            lng: {venue.lng}
                          </td>
                          <td className="middle hidden-xs text-sm text-muted">
                            {moment(venue.updatedAt).format('LLL')}
                          </td>
                          {hasPermission(window.user, 'changeVenue') ? (
                            <td
                              className="middle text-blue pointer"
                              onClick={() => this.updateVenue(venue)}>
                              <i className="fa fa-pencil" />
                            </td>
                          ) : null}
                          {hasPermission(window.user, 'deleteVenue') ? (
                            <td
                              className={
                                canDelete
                                  ? 'middle text-red pointer'
                                  : 'middle text-muted not-allowed'
                              }
                              onClick={
                                canDelete
                                  ? () => this.deleteVenue(venue)
                                  : undefined
                              }>
                              <i className="fa fa-minus-circle" />
                            </td>
                          ) : null}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            {pagination.pages > 1 && (
              <div className="box-footer text-right">
                <Paginator
                  changePage={this.changePage}
                  page={pagination.page}
                  pages={pagination.pages}
                />
              </div>
            )}
            {loading && (
              <div className="overlay">
                <i className="fa fa-spinner fa-spin text-purple" />
              </div>
            )}
          </div>

          <div className={`box ${tab === 'map' ? '' : 'hidden'}`}>
            <div className="box-header with-border">
              <h3 className="box-title">
                Sucursales <small>{pagination.count}</small>
              </h3>
              <div className="box-tools pull-right">
                <button
                  className="btn btn-sm btn-primary  hidden-xs"
                  onClick={this.exportExcel}
                  disabled={exporting}
                  style={{ marginLeft: '5px' }}>
                  {exporting ? (
                    <React.Fragment>
                      <i className="fa fa-spin fa-spinner" /> Exportando
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <i className="fa fa-fw fa-download" /> Exportar
                    </React.Fragment>
                  )}
                </button>
              </div>
            </div>
            <div className="box-body no-padding">
              <div
                id="map"
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '70vh'
                }}
              />
            </div>
          </div>
          <ModalView />
        </section>
      </AppContainer>
    );
  }

  private filterCompany(company: string): void {
    const { filters } = this.props.venues;
    this.props.changeFilterAction('company', filters.company === company? '' : company);
    this.debounceOnChangeSearch();
  }

  private onChangeSearch(e: React.ChangeEvent<HTMLInputElement>): void {
    e.preventDefault();
    const value = e.target.value;
    this.props.changeSearchAction(value);
    this.debounceOnChangeSearch();
  }

  private debounceOnChangeSearch(): void {
    this.props.getVenuesAction(1);
  }

  private createVenue(): void {
    this.props.changeTempVenueAction({
      _id: '',
      lat: 0,
      lng: 0,
      name: '',
      code: '',
      abbreviation: '',
      type: 'receiver',
      sendTo: [],
      sendToDays: [],
      receiveFrom: [],
      shippingCarriers: [],
      responsible: [],
      shippingMaxDays: 5,
      receptionCarriers: []
    });
    this.props.loadDataAction(
      'Agregar Sucursal',
      <VenueFormView />,
      <React.Fragment>
        <button
          type="button"
          className="btn btn-sm btn-default"
          data-dismiss="modal">
          Cancelar
        </button>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={this.processCreateVenue}>
          Grabar
        </button>
      </React.Fragment>
    );
  }

  private processCreateVenue(): void {
    const { tempVenue } = this.props.venues;
    if (!tempVenue.name || !tempVenue.name.trim()) {
      swal!('Agregar sucursal', 'El nombres es requerido', 'error');
    } else if (!tempVenue.company || !tempVenue.company._id) {
      swal!('Agregar sucursal', 'La empresa es requerida', 'error');
    } else {
      this.props.createVenueAction();
    }
  }

  private updateVenue(venue: IVenue): void {
    this.props.changeTempVenueAction({
      _id: venue._id,
      name: venue.name,
      code: venue.code ?? '',
      abbreviation: venue.abbreviation ?? '',
      lat: venue.lat,
      lng: venue.lng,
      company: venue.company,
      region: venue.region,
      type: venue.type ? venue.type : 'receiver',
      sendTo: venue.sendTo ? venue.sendTo : [],
      sendToDays: venue.sendToDays ? venue.sendToDays : [],
      shippingMaxDays: venue.shippingMaxDays,
      receiveFrom: venue.receiveFrom ? venue.receiveFrom : [],
      responsible: venue.responsible ? venue.responsible : [],
      shippingCarriers: venue.shippingCarriers ? venue.shippingCarriers : [],
      receptionCarriers: venue.receptionCarriers ? venue.receptionCarriers : []
    });
    this.props.loadDataAction(
      'Editar Sucursal',
      <VenueFormView update={true} />,
      <React.Fragment>
        <button
          type="button"
          className="btn btn-sm btn-default"
          data-dismiss="modal">
          Cancelar
        </button>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={this.processUpdateVenue}>
          Editar
        </button>
      </React.Fragment>
    );
  }

  private processUpdateVenue(): void {
    const { tempVenue } = this.props.venues;
    if (!tempVenue.name || !tempVenue.name.trim()) {
      swal!('Editar sucursal', 'El nombres es requerido', 'error');
    } else if (!tempVenue.company || !tempVenue.company._id) {
      swal!('Editar sucursal', 'La empresa es requerida', 'error');
    } else {
      this.props.updateVenueAction();
    }
  }

  private deleteVenue(venue: IVenue): void {
    // ask if you are sure that you are going to delete the user?
    swal({
      title: '¿Estás seguro?',
      text: `Vas a eliminar la sucursal ${venue.name} `,
      icon: 'warning',
      dangerMode: true,
      buttons: {
        cancel: 'Cancelar' as any,
        confirm: {
          text: 'Sí'
        }
      }
    }).then((willDelete) => {
      if (willDelete) {
        this.props.deleteVenueAction(venue._id);
      }
    });
  }

  private changePage(page: number): void {
    // change the page
    this.props.getVenuesAction(page);
  }
}

const mapStateToProps = (state: { venues: IVenuesState }) => {
  return {
    venues: state.venues
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch,
    getVenuesAction: (page: number) => dispatch(getVenuesAction(page)),
    changeFilterAction: (filter: string, value: string) => dispatch(changeFilterAction(filter, value)),
    createVenueAction: () => dispatch(createVenueAction()),
    updateVenueAction: () => dispatch(updateVenueAction()),
    deleteVenueAction: (id: string) => dispatch(deleteVenueAction(id)),
    changeSearchAction: (searchText: string) =>
      dispatch(changeSearchAction(searchText)),
    changeTempVenueAction: (venue: IBaseVenue) =>
      dispatch(changeTempVenueAction(venue)),
    loadDataAction: (title: string, body: JSX.Element, footer: JSX.Element) =>
      dispatch(loadDataAction(title, body, footer))
  };
};

export default connect<{ venues: IVenuesState }, { dispatch: any }, IPropsType>(
  mapStateToProps,
  mapDispatchToProps
)(VenuesListView);
