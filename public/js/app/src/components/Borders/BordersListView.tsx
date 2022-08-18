import {
  BorderReduxAction, changeSearchAction, changeTempBorderAction,
  createBorderAction, deleteBorderAction,
  getBorderAction,
  getBorderCompanyAction,
  IBorderState, updateBorderAction
} from "../../actions/borders.actions";
import {IBaseBorder, IBorder} from "../../../../../../src/app/interfaces/border.interface";
import {loadDataAction, ModalReduxAction} from "../../actions/modal.actions";
import {IWindow} from "../../interfaces/window";
import {RouteComponentProps} from "react-router";
import TrackingBasePage from "../Utils/TrackingBasePage";
import Row from "../Utils/Row";
import {hasPermission} from "../../utils/common";
import * as React from "react";
import * as moment from "moment";
import Paginator from "../Utils/Paginator";
import ModalView from "../Modal/ModalView";
import AppContainer from "../../container/AppContainer";
import * as mapboxgl from "mapbox-gl";
import {Dispatch} from "redux";
import TableListView, {Actions} from "../Utils/TableListView";
import * as swal from "sweetalert";;
import BorderFormView from "./BorderFormView";;
import {connect} from "react-redux";

enum IPageSelector {
  list = 'list',
  map = 'map',
}

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<BorderReduxAction>;
  border: IBorderState;
  changeTempBorder(border: IBaseBorder): BorderReduxAction;
  getCompaniesAction(): BorderReduxAction;
  getBordersAction(page: number): BorderReduxAction;
  createBorderAction(): BorderReduxAction;
  updateBorderAction(): BorderReduxAction;
  deleteBorderAction(id?: string): BorderReduxAction;
  changeSearchAction(searchText: string): BorderReduxAction;
  loadDataAction(title: string, body: JSX.Element, footer: JSX.Element): ModalReduxAction;
}


interface IStateType {
  error: Error | null;
  tab: IPageSelector;
}

declare let window: IWindow;

class BordersListView extends TrackingBasePage<IPropsType, IStateType> {
  title: string = "Administrador de pórticos";
  private map: any;
  timer: any;

  state: IStateType = {
    error: null,
    tab: IPageSelector.list
  }

  constructor(props: IPropsType) {
    super(props);
    this.changeTab = this.changeTab.bind(this);
    this.onChangeSearch = this.onChangeSearch.bind(this);
    this.changeBorder = this.changeBorder.bind(this);
    this.changePage = this.changePage.bind(this);
    this.createBorder = this.createBorder.bind(this);
    this.deleteBorder = this.deleteBorder.bind(this);
    this.processChangeBorder = this.processChangeBorder.bind(this);
    this.processCreateBorder = this.processCreateBorder.bind(this);
    this.onChangeTab = this.onChangeTab.bind(this);
  }

  public componentWillMount(): void {
    const {pagination} = this.props.border;
    this.props.getCompaniesAction();
    this.props.getBordersAction(pagination.page);
  }

  private debounce(fn: Function, delay = 300): void {
    return (() => {
      clearTimeout(this.timer)
      this.timer = setTimeout(() => fn(), delay)
    })()
  }

  private onChangeSearch(e: React.ChangeEvent<HTMLInputElement>): void {
    e.preventDefault();
    const value = e.target.value.trim();
    this.props.changeSearchAction(value);
    this.debounce(() => {
      this.props.getBordersAction(1);
    }, 300)
  }

  private createBorder() {
    this.props.changeTempBorder({
      _id: '',
      name: '',
      lng: 0,
      lat: 0,
      company: null
    });
    this.props.loadDataAction(
      'Agregar Pórtico',
      <BorderFormView />,
      <React.Fragment>
        <button type='button' className='btn btn-sm btn-default' data-dismiss='modal'>Cancelar</button>
        <button type='button' className='btn btn-sm btn-primary' onClick={this.processCreateBorder}>Grabar</button>
      </React.Fragment>
    );
  }

  private processCreateBorder() {
    const {tempBorder} = this.props.border;
    if (!tempBorder.name || !tempBorder.name.trim()) {
      swal!('Agregar pórtico', 'El nombres es requerido', 'error');
    } else if (!tempBorder.company || !tempBorder.company._id) {
      swal!('Agregar pórtico', 'La empresa es requerida', 'error');
    } else {
      this.props.createBorderAction();
    }
  }

  private changeBorder(border: IBaseBorder) {
    this.props.changeTempBorder(border);
    this.props.loadDataAction(
      'Editar Pórtico',
      <BorderFormView />,
      <React.Fragment>
        <button type='button' className='btn btn-sm btn-default' data-dismiss='modal'>Cancelar</button>
        <button type='button' className='btn btn-sm btn-primary' onClick={this.processChangeBorder}>Grabar</button>
      </React.Fragment>
    );
  }

  private processChangeBorder() {
    const {tempBorder} = this.props.border;
    if (!tempBorder.name || !tempBorder.name.trim()) {
      swal!('Agregar pórtico', 'El nombres es requerido', 'error');
    } else if (!tempBorder.company || !tempBorder.company._id) {
      swal!('Agregar pórtico', 'La empresa es requerida', 'error');
    } else {
      this.props.updateBorderAction();
    }
  }

  private deleteBorder(border: IBaseBorder) {
    // ask if you are sure that you are going to delete the user?
    swal({
      title: '¿Estás seguro?',
      text: `Vas a eliminar el pórtico ${border.name} `,
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
        this.props.deleteBorderAction(border._id);
      }
    });
  }

  private changePage(page: number): void {
    // change the page
    this.props.getBordersAction(page);
  }



  public componentDidMount() {
    super.componentDidMount();
    // mapboxgl.accessToken = 'pk.eyJ1IjoicmliYXJyYWNsIiwiYSI6ImNqems3dW85bTAwZmUzbnF0a2xubnl5ejUifQ.tfPmGSbHYdh2nMA6Fmxcxw';
    this.map = new mapboxgl.Map({
      accessToken: 'pk.eyJ1IjoicmliYXJyYWNsIiwiYSI6ImNqems3dW85bTAwZmUzbnF0a2xubnl5ejUifQ.tfPmGSbHYdh2nMA6Fmxcxw',
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-70.593536, -33.509243],
      zoom: 10,
      trackResize: true
    });
    this.map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    $('a[href=\'#tab_2\']').on('shown.bs.tab', () => {
      this.onChangeTab();
    });
  }

  private changeTab(name: IPageSelector): void {
    this.setState({
      tab: name
    }, this.onChangeTab);
  }

  private onChangeTab() {
    let borders = this.props.border?.borders;
    if (!borders)
      return

    const geojson = {
      type: 'FeatureCollection',
      features: borders
        .filter((border) => (border.lng && border.lat))
        .map((border: any) => {
          return {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [border.lng, border.lat]
            },
            properties: {
              title: 'Pórticos',
              name: border.name?.toUpperCase(),
              border,
              logo: border.company.marker?.url?.length
                ? `url("${border.company.marker.url}")`
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
          .setLngLat((marker.geometry.coordinates as [number, number]))
          .setPopup(new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
            <strong>${marker.properties.name}</strong>
<!--            <strong >Editar</strong>-->
          `))
          .addTo($map);

        bounds.extend((marker.geometry.coordinates as [number, number]));
      }
    });
    $map.resize();
    $map.fitBounds(bounds, {padding: 100});
  }



  public render(): React.ReactElement<IPropsType> {
    const {tab} = this.state;
    const {pagination, searchText, loading, borders} = this.props.border;

    let actions: Actions[] = [];
    if (hasPermission(window.user, 'changeBorder'))
      actions.push(Actions.edit)
    if (hasPermission(window.user, 'deleteBorder'))
      actions.push(Actions.delete)

    return (
      <AppContainer title='' cMenu='10' cSubMenu='10.11' cAction='Listado'>
        <section className='content'>
          <Row>
            <div className='col-md-12 col-lg-12'>
              <div className='box box-solid'>
                <ul className='nav nav-pills nav-justified no-padding'>
                  <li className={tab === IPageSelector.list ? 'no-margin active' : 'no-margin'}>
                    <a
                      href='javascript:void(0);'
                      className={tab === IPageSelector.list ? 'background-transition' : ''}
                      style={{borderTop: '0', marginBottom: '0'}}
                      onClick={() => this.changeTab(IPageSelector.list)}
                    >Pórticos</a>
                  </li>
                  <li className={tab === IPageSelector.map ? 'no-margin active' : 'no-margin'}>
                    <a
                      className={tab === IPageSelector.map ? 'background-transition' : ''}
                      href='javascript:void(0);'
                      style={{borderTop: '0', marginBottom: '0'}}
                      onClick={() => this.changeTab(IPageSelector.map)}
                    >Mapa</a>
                  </li>
                </ul>
              </div>
            </div>
          </Row>

          <div className={`box ${tab === IPageSelector.list ? '' : 'hidden'}`}>
            <div className='box-header with-border'>
              <h3 className='box-title'>Pórticos <small>{pagination.count}</small></h3>
              <div className='box-tools pull-right'>
                {
                  hasPermission(window.user, 'addBorder') ?
                    <button className='btn btn-sm btn-success' onClick={this.createBorder}><i
                      className='fa fa-plus'/> Crear Pórtico</button>
                    : null
                }
              </div>
            </div>
            <div className='box-body no-padding'>
              <div className='row'>
                <div className='col-md-12'>
                  <div className='input-group input-group-sm'
                       style={{padding: '10px'}}
                  >
                    <input
                      type='text'
                      value={searchText}
                      className='form-control pull-right'
                      onChange={this.onChangeSearch}
                      placeholder='Buscar'/>
                    <div className='input-group-btn'>
                      <button className='btn btn-default'><i className='fa fa-search'/></button>
                    </div>
                  </div>
                </div>
              </div>

              <TableListView headers={[
                {name: 'Nombre', accessor: (data: IBorder) => data.name},
                {name: 'Ubicación', accessor: (data: IBorder) => `lat:${data.lat}\nlng:${data.lng}`},
                {name: 'Modificado', accessor: (data: IBorder) => moment(data.updatedAt).format('LLL')},
              ]} actions={actions} data={borders} name={'border'} editElement={this.changeBorder} deleteElement={this.deleteBorder} />
            </div>
            {
              pagination.pages > 1 &&
              <div className='box-footer text-right'>
                <Paginator changePage={this.changePage} page={pagination.page} pages={pagination.pages}/>
              </div>
            }
            {
              loading &&
              <div className='overlay'>
                <i className='fa fa-spinner fa-spin text-purple'/>
              </div>
            }
          </div>

          <div className={`box ${tab === IPageSelector.map ? '' : 'hidden'}`}>
            <div className='box-header with-border'>
              <h3 className='box-title'>Pasos de Frontera <small>{pagination.count}</small></h3>
            </div>
            <div className='box-body no-padding'>
              <div
                id='map'
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '70vh'
                }}
              />
            </div>
          </div>
          <ModalView/>
        </section>
      </AppContainer>
    );
  }
}

const mapStateToProps = (state: { border: IBorderState }) => {
  return {
    border: state.border
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch,
    changeTempBorder: (border: IBaseBorder) => dispatch(changeTempBorderAction(border)),
    getCompaniesAction: () => dispatch(getBorderCompanyAction()),
    getBordersAction: (page: number) => dispatch(getBorderAction(page)),
    createBorderAction: () => dispatch(createBorderAction()),
    updateBorderAction: () => dispatch(updateBorderAction()),
    deleteBorderAction: (id: string) => dispatch(deleteBorderAction(id)),
    changeSearchAction: (searchText: string) => dispatch(changeSearchAction(searchText)),
    loadDataAction: (title: string, body: JSX.Element, footer: JSX.Element) => dispatch(loadDataAction(title, body, footer))
  };
};

export default connect<{ border: IBorderState }, { dispatch: any }, IPropsType>(mapStateToProps, mapDispatchToProps)(BordersListView);
