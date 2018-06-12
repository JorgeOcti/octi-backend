import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from "react";
import AppContainer from "../../container/AppContainer";
import {connect} from "react-redux";
import {Dispatch} from "redux";
import {RouteComponentProps} from "react-router";
import {DashboardReduxAction, getCarsAction, IDashboardState} from "../../actions/dashboard";
import * as PropTypes from "prop-types";
import * as moment from "moment";
// backend interfaces
import {ICar} from "../../../../../../src/interfaces/car.interface";

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<DashboardReduxAction>;
  dashboard: IDashboardState;

  getCarsAction(page?: number): void;
}

interface IStateType {
  error: Error | null;
}

class DashboardVinView extends React.Component<IPropsType, IStateType> {

  static propTypes = {
    dashboard: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    getCarsAction: PropTypes.func.isRequired,
  };

  componentWillMount(){
    // set the title of the page
    document.title = 'OSA Andes | Listado de VINs';
    this.props.getCarsAction();
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public componentWillUnmount(){
    // cancel request if component is inmounted
    if (this.props.dashboard.source) {
      this.props.dashboard.source.cancel('Operation canceled by the user.');
    }
  }

  private changePage(page:number){
    // change the page
    this.props.getCarsAction(page);
  }

  public render(): React.ReactElement<IPropsType> {
    const {loading, cars, pagination} = this.props.dashboard;
    return (
      <AppContainer title='' cMenu='1' cSubMenu='1.2'>
        <section className="content">
          <div className="box">
            <div className="box-header with-border"><h3 className="box-title">Listado de VINs</h3>
              <div className="box-tools pull-right">
              </div>
            </div>
            <div className="box-body">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>VIN</th>
                    <th>Supervisor</th>
                    <th className="hidden-xs">Último checkeo</th>
                    <th className="width-10" />
                  </tr>
                </thead>
                <tbody>
                  {
                    cars.map((car: ICar) => {
                      return (
                        <tr key={car._id} id={`car-${car._id}`}>
                          <td className="middle">{car.vin}</td>
                          <td className="middle">{`${car.lastForm.user ? `${car.lastForm.user.firstName} ${car.lastForm.user.lastName}` : ''}`}</td>
                          <td className="middle hidden-xs">{moment(car.lastForm.createdAt).format('LLL')}</td>
                          <td className="text-primary">
                            <button className="btn btn-xs btn-primary" onClick={() => this.props.history.push(`/cars/${car._id}`)}><i className="fa fa-bars"/></button>
                          </td>
                        </tr>
                      )
                    })
                  }
                </tbody>
              </table>

            </div>
            <div className="box-footer text-right">
              <ul className="pagination">
                {/*<li className="page-item disabled">*/}
                  {/*<a className="page-link" href="#">Previous</a>*/}
                {/*</li>*/}
                {
                  new Array(pagination.pages).fill(1).map((item, index) => {
                    const idPagination = index + 1;
                    const onClick = idPagination !== pagination.page ? () => this.changePage(idPagination) : () => {};
                    // if((idPagination > pagination.page - 3 && idPagination < pagination.page + 3)  || (idPagination !== 1 || idPagination !== pagination.pages)) {
                    if((idPagination > pagination.page - 3 && idPagination < pagination.page + 3)  || (idPagination === 1 || idPagination === pagination.pages)) {
                      return (
                        <li className={`page-item ${idPagination === pagination.page ? 'active' : ''}`} key={idPagination}>
                          <a className="page-link" href="javascript:void(0)" onClick={onClick}>{idPagination}</a>
                        </li>
                      )
                    } else if (idPagination > pagination.page + 3 && idPagination === pagination.pages - 1) {
                      return (
                          <li className={`page-item disabled`} key={idPagination}>
                            <a className="page-link" href="javascript:void(0)">...</a>
                          </li>
                        )
                    }else if (idPagination < pagination.page - 3 && idPagination === 2) {
                      return (
                          <li className={`page-item disabled`} key={idPagination}>
                            <a className="page-link" href="javascript:void(0)">...</a>
                          </li>
                        )
                    } else {
                      return null
                    }
                  })
                }
                {/*<li className="page-item">*/}
                  {/*<a className="page-link" href="#">Next</a>*/}
                {/*</li>*/}
              </ul>
            </div>
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
}

const mapStateToProps = (state: { dashboard: IDashboardState }) => {
  return {
    dashboard: state.dashboard
  };
};

const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    getCarsAction: (page?: number) => dispatch(getCarsAction(page)),
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(DashboardVinView);

