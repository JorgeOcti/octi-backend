///<reference path="../../../node_modules/sweetalert/typings/sweetalert.d.ts"/>
// import * as moment from 'moment';
import moment = require('moment');
import * as PropTypes from 'prop-types';
import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import {ICar} from '../../../../../../src/interfaces/car.interface';
import {CarReduxAction, getCarsAction, ICarsState} from '../../actions/cars';
import AppContainer from '../../container/AppContainer';
import ModalView from '../Modal/ModalView';
import Paginator from '../Paginator';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<CarReduxAction>;
  cars: ICarsState;
  getCarsAction(page?: number): CarReduxAction;
}

interface IStateType {
  error: Error | null;
}

class CarsListView extends React.Component<IPropsType, IStateType> {

  static propTypes = {
    dispatch: PropTypes.func.isRequired
  };

  constructor(props: IPropsType) {
    super(props);
    this.changePage = this.changePage.bind(this);
  }

  public componentWillMount() {
    // set the title of the page
    document.title = 'OSA Andes | Listado de autos';
    this.props.getCarsAction();
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
    return (
      <AppContainer title="" cMenu="2" cSubMenu="2.2" cAction="Listado">
        <section className="content">
          <div className="box">
            <div className="box-header with-border"><h3 className="box-title">Autos <small>{pagination.count}</small></h3>
            {/*<div className="box-header with-border"><h3 className="box-title">Autos</h3>*/}
              <div className="box-tools pull-right">
                <button className="btn btn-sm btn-primary" onClick={() => this.props.history.push(`/settings/cars/import/`)}>Importar</button>
              </div>
            </div>
            <div className="box-body">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>VIN</th>
                    <th>Marca</th>
                    <th className="hidden-xs">Denominación</th>
                    <th className="hidden-xs">Color</th>
                    <th className="hidden-xs">Modificado</th>
                    {/*<th className="width-10" />*/}
                    {/*<th className="width-10" />*/}
                  </tr>
                </thead>
                <tbody>
                  {
                    cars.map((car: ICar) => {
                      return (
                        <tr key={car._id} id={`car-${car._id}`}>
                          <td>{car.vin}</td>
                          <td>{car.brand}</td>
                          <td className="hidden-xs">{car.denomination}</td>
                          <td className="hidden-xs">{car.color}</td>
                          <td className="hidden-xs">{moment(car.updatedAt).format('LLL')}</td>
                          {/*<td className="text-blue pointer" onClick={() => this.editUser(user)}><i className="fa fa-pencil"/></td>*/}
                          {/*<td className="text-red pointer" onClick={() => this.deleteUser(user)}><i className="fa fa-minus-circle"/></td>*/}
                        </tr>
                      );
                    })
                  }
                </tbody>
              </table>
            </div>
            {
              pagination.pages > 1 &&
                <div className="box-footer text-right">
                  <Paginator changePage={this.changePage} page={pagination.page} pages={pagination.pages} />
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

  private changePage(page: number) {
    // change the page
    this.props.getCarsAction(page);
  }
}

const mapStateToProps = (state: { cars: ICarsState }) => {
  return {
    cars: state.cars
  };
};

// const mapDispatchToProps = (dispatch: Dispatch<UserReduxAction> ) => {
const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    getCarsAction: (page?: number) => dispatch(getCarsAction(page))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(CarsListView);
