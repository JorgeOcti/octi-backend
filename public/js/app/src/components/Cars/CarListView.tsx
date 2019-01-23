///<reference path="../../../node_modules/sweetalert/typings/sweetalert.d.ts"/>
import * as moment from 'moment';
import * as Raven from 'raven-js';
import {ErrorInfo} from 'react';
import * as React from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import {debounce} from 'throttle-debounce';
import {ICar} from '../../../../../../src/interfaces/car.interface';
import {CarReduxAction, getCarsAction, ICarsState} from '../../actions/cars.actions';
import AppContainer from '../../container/AppContainer';
import {IWindow} from '../../interfaces/window';
import {hasPermission} from '../../utils/common';
import ModalView from '../Modal/ModalView';
import Paginator from '../Utils/Paginator';

declare let window: IWindow;

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<CarReduxAction>;
  cars: ICarsState;

  getCarsAction(page: number, search?: string): CarReduxAction;
}

interface IStateType {
  error: Error | null;
  searchText: string;
}

class CarListView extends React.Component<IPropsType, IStateType> {

  // static propTypes = {
  //   dispatch: PropTypes.func.isRequired
  // };

  readonly state = {
    error: null,
    searchText: ''
  };

  constructor(props: IPropsType) {
    super(props);
    this.changePage = this.changePage.bind(this);
    this.onChangeSearch = this.onChangeSearch.bind(this);
    this.debounceOnChangeSearch = debounce(300, this.debounceOnChangeSearch);
  }

  public componentWillMount() {
    const {pagination} = this.props.cars;
    // set the title of the page
    document.title = 'OSA Andes | Listado de autos';
    this.props.getCarsAction(pagination.page);
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public componentWillUnmount() {
    // cancel request if component is inmounted
    if (this.props.cars.source) {
      this.props.cars.source.cancel('Operation canceled by the user.');
    }
  }

  public render(): React.ReactElement<IPropsType> {
    const {loading, cars, pagination} = this.props.cars;
    const {searchText} = this.state;
    return (
      <AppContainer title="" cMenu="10" cSubMenu="10.2" cAction="Listado">
        <section className="content">
          <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">
                Autos <small>{pagination.count}</small>
              </h3>
              <div className="box-tools">
                <div className="form-inline">
                  {
                    hasPermission(window.user, 'addCar') ?
                      <button
                        className="btn btn-sm btn-primary  hidden-xs"
                        onClick={() => this.props.history.push(`/settings/cars/import/`)}
                        style={{marginRight: '5px'}}
                      ><i className="fa fa-fw fa-cloud-upload" /> Importar</button> : null
                  }
                  <div className="input-group input-group-sm" style={{width: '200px'}}>
                    <input
                      type="text"
                      className="form-control pull-right"
                      onChange={this.onChangeSearch}
                      placeholder="Buscar" />
                    <div className="input-group-btn">
                      <button className="btn btn-default"><i className="fa fa-search"/></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="box-body no-padding">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th style={{width: '20%'}}>VIN</th>
                    <th style={{width: '10%'}}>Patente</th>
                    <th style={{width: '10%'}}>Marca</th>
                    <th style={{width: '20%'}} className="hidden-xs">Denominación</th>
                    <th style={{width: '20%'}} className="hidden-xs">Color</th>
                    <th style={{width: '20%'}} className="hidden-xs">Creado</th>
                    {/*<th className="width-10" />*/}
                  </tr>
                </thead>
                <tbody>
                  {
                    !loading && cars.length === 0 && searchText ? <tr>
                      <td colSpan={5}>No se han encontrado resultados.</td>
                    </tr> : null
                  }
                  {
                    cars.map((car: ICar) => {
                      return (
                        <tr key={car._id} id={`car-${car._id}`}>
                          <td>{car.vin}</td>
                          <td>{car.patent}</td>
                          <td>{car.brand}</td>
                          <td className="hidden-xs text-ellipsis">{car.denomination}</td>
                          <td className="hidden-xs text-ellipsis">{car.color}</td>
                          <td className="hidden-xs text-ellipsis">{moment(car.createdAt).format('LLL')}</td>
                        </tr>
                      );
                    })
                  }
                </tbody>
              </table>
            </div>
            {
              pagination.pages > 1 &&
                <div className="box-footer">
                  <div className="row">
                    <div className="col-md-6">
                      {
                        searchText && searchText.length ? <p><strong>Filtrado por:</strong> {searchText}</p> : null
                      }
                    </div>
                    <div className="col-md-6 text-right">
                      <Paginator changePage={this.changePage} page={pagination.page} pages={pagination.pages} />
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
    const {searchText} = this.state;
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

const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    getCarsAction: (page: number, search?: string) => dispatch(getCarsAction(page, search))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(CarListView);
