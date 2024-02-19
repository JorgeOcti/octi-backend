import * as moment from 'moment';
import * as Raven from 'raven-js';
import { ErrorInfo } from 'react';
import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { Dispatch } from 'redux';
import { debounce } from 'throttle-debounce';
import { ICar } from '../../../../../../src/app/interfaces/car.interface';
import {
  CarReduxAction,
  getCarsAction,
  ICarsState
} from '../../actions/cars.actions';
import AppContainer from '../../container/AppContainer';
import { IWindow } from '../../interfaces/window';
import { hasPermission, parseReplicableURL } from '../../utils/common';
import CopyText from '../Utils/CopyText';
import ShowIf from '../Utils/ShowIf';
import ModalView from '../Modal/ModalView';
import Paginator from '../Utils/Paginator';
import TrackingBasePage from '../Utils/TrackingBasePage';
import BootstrapSelect from '../Utils/BootstrapSelect';

declare let window: IWindow;

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<CarReduxAction>;
  cars: ICarsState;

  getCarsAction(page: number, search?: string): CarReduxAction;
}

interface IStateType {
  error: Error | null;
  searchText: string;
  selectedBrands: string[];
}

class CarListView extends TrackingBasePage<IPropsType, IStateType> {
  title: string;

  // static propTypes = {
  //   dispatch: PropTypes.func.isRequired
  // };

  readonly state: IStateType = {
    error: null,
    searchText: '',
    selectedBrands: []
  };

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Buscador de unidades';
    this.changePage = this.changePage.bind(this);
    this.onChangeSearch = this.onChangeSearch.bind(this);
    this.debounceOnChangeSearch = debounce(1000, this.debounceOnChangeSearch);
  }

  componentDidMount() {
    super.componentDidMount();
  }

  public componentWillMount() {
    const { pagination } = this.props.cars;
    this.props.getCarsAction(pagination.page);
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error });
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public componentDidUpdate(
    prevProps: Readonly<IPropsType>,
    prevState: Readonly<IStateType>,
    snapshot?: any
  ): void {
    if (this.props.cars.pagination !== prevProps.cars.pagination) {
      window.scrollTo(0, 0);
    }
    $('[data-toggle="tooltip"]').tooltip();
  }

  public componentWillUnmount() {
    // cancel request if component is inmounted
    if (this.props.cars.source) {
      this.props.cars.source.cancel('Operation canceled by the user.');
    }
  }

  public render(): React.ReactElement<IPropsType> {
    const { loading, cars, brands, pagination } = this.props.cars;
    const { searchText, selectedBrands } = this.state;
    console.log(this.props.cars.brands);
    return (
      <AppContainer
        // title={}
        cMenu="1"
        cSubMenu="1.0"
        cAction="Listado">
        <section className="content">
          <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">
                {this.title}&nbsp;
                <small>
                  {new Intl.NumberFormat('de-DE').format(pagination.count)}
                </small>
              </h3>
              <div className="box-tools">
                {hasPermission(window.user, 'addCar') ? (
                  <button
                    className="btn btn-sm btn-primary hidden-xs"
                    onClick={() =>
                      this.props.history.push(`/settings/cars/import/`)
                    }>
                    <i className="fa fa-fw fa-cloud-upload" /> Importar
                  </button>
                ) : null}
              </div>
            </div>
            <div className="box-body no-padding">
              <div className="row no-margin">
                <div className="col-md-8 no-padding">
                  <div
                    className="input-group input-group"
                    style={{ padding: '10px' }}>
                    <input
                      type="text"
                      className="form-control pull-right"
                      onChange={this.onChangeSearch}
                      placeholder="Buscar por datos de la unidad"
                    />
                    <div className="input-group-btn">
                      <button className="btn btn-primary">
                        <i className="fa fa-search" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 no-padding" style={{}}>
                  <div 
                    style={{ padding: '10px', height: "100%" }}>
                    <BootstrapSelect
                      noneSelectedText="Todos los controles"
                      displayItems={4}
                      selectedText="formularios seleccionadas."
                      allOption={true}
                      autoClouse={false}
                      notHideOnClickOutside={false}
                      sm={true}
                      separator=" - "
                      options={brands.map((brand) => ({value: brand._id, text: brand.name}))}
                      selected={selectedBrands}
                      onClick={() => {}}
                      selectAll={() => {}}
                    />
                  </div>
                </div>
              </div>
              <table className="table table-andes table-striped">
                <thead>
                  <tr>
                    {/*<th className='middle  hidden-xs' style={{ width: '180px' }}>VIN</th>*/}
                    <th className="middle">Descripción</th>
                    <ShowIf
                      condition={['5bf2de35caf8ef7096105cdd'].includes(
                        window.user.team._id
                      )}>
                      <th
                        className="middle hidden-xs"
                        style={{ width: '100px' }}>
                        Material
                      </th>
                    </ShowIf>
                    <ShowIf
                      condition={
                        !['5bf2de35caf8ef7096105cdd'].includes(
                          window.user.team._id
                        )
                      }>
                      <th
                        className="middle hidden-xs"
                        style={{ width: '100px' }}>
                        Partida
                      </th>
                    </ShowIf>
                    <th
                      className="middle hidden-xs"
                      style={{ width: '15%' }}></th>
                    <th style={{ width: '1%' }} />
                  </tr>
                </thead>
                <tbody>
                  {!loading && cars.length === 0 && searchText ? (
                    <tr>
                      <td colSpan={5}>No se han encontrado resultados.</td>
                    </tr>
                  ) : null}
                  {cars.map((car: ICar) => {
                    return (
                      <tr key={car._id} id={`car-${car._id}`}>
                        <td className="middle text-muted">
                          <CopyText value={car?.vin}>
                            <strong
                              className="text-primary pointer text-underline"
                              onClick={() =>
                                this.props.history.push(
                                  parseReplicableURL(
                                    `/settings/cars/${car?._id}`
                                  )
                                )
                              }>
                              {car?.vin}
                            </strong>
                          </CopyText>
                          <div className={'text-sm'}>
                            <strong className={'text-muted'}>
                              {car?.brand}
                            </strong>
                            <br />
                            {car?.denomination}
                            <br />
                            {car.color}
                          </div>
                          <ShowIf condition={!!car?.patent?.length}>
                            <br />
                            <i className="fa fa-fw fa-id-card-o" />{' '}
                            {car?.patent && car?.patent.length
                              ? car?.patent
                              : '-'}
                          </ShowIf>
                        </td>
                        <ShowIf
                          condition={['5bf2de35caf8ef7096105cdd'].includes(
                            window.user.team._id
                          )}>
                          <td className="middle text-muted  hidden-xs">
                            {car.material?.length ? car.material : '-'}
                          </td>
                        </ShowIf>
                        <ShowIf
                          condition={
                            !['5bf2de35caf8ef7096105cdd'].includes(
                              window.user.team._id
                            )
                          }>
                          <td className="middle text-muted hidden-xs">
                            {car.entry}
                          </td>
                        </ShowIf>
                        <td className="middle hidden-xs text-ellipsis text-muted hidden-xs">
                          <div
                            className="text-muted text-sm"
                            data-toggle="tooltip"
                            data-placement="top"
                            title={moment(car.createdAt).format('LLL')}>
                            <i className="fa fa-fw fa-clock-o" />{' '}
                            {moment(car.createdAt).fromNow()}
                          </div>
                        </td>
                        <td className="text-primary middle-center">
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() =>
                              this.props.history.push(
                                `/settings/cars/${car._id}`
                              )
                            }>
                            <i className="fa fa-bars" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {pagination.pages > 1 && (
              <div className="box-footer">
                <div className="row">
                  <div className="col-md-6">
                    {searchText && searchText.length ? (
                      <p>
                        <strong>Filtrado por:</strong> {searchText}
                      </p>
                    ) : null}
                  </div>
                  <div className="col-md-6 text-right">
                    <Paginator
                      changePage={this.changePage}
                      page={pagination.page}
                      pages={pagination.pages}
                    />
                  </div>
                </div>
              </div>
            )}
            {loading && (
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

  private onChangeSearch(e: React.ChangeEvent<HTMLInputElement>): void {
    e.preventDefault();
    const value = e.target.value.trim();
    this.setState({
      searchText: value
    });
    this.debounceOnChangeSearch();
  }

  private debounceOnChangeSearch(): void {
    const { searchText } = this.state;
    if (searchText && searchText.length) {
      this.props.getCarsAction(1, searchText);
    } else {
      this.props.getCarsAction(1);
    }
  }

  private changePage(page: number): void {
    const { searchText } = this.state;
    this.props.getCarsAction(page, searchText);
  }
}

const mapStateToProps = (state: { cars: ICarsState }) => {
  return {
    cars: state.cars
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch,
    getCarsAction: (page: number, search?: string) =>
      dispatch(getCarsAction(page, search))
  };
};

export default connect<{}, {}, IPropsType>(
  mapStateToProps,
  mapDispatchToProps
)(CarListView);
