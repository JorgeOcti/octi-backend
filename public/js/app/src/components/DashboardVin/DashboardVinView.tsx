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
import Paginator from "../Paginator";
import * as io from 'socket.io-client';
// backend interfaces
import {ICar} from "../../../../../../src/interfaces/car.interface";

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<DashboardReduxAction>;
  dashboard: IDashboardState;

  getCarsAction(page?: number, loading?: boolean): void;
}

interface IStateType {
  error: Error | null;
}

class DashboardVinView extends React.Component<IPropsType, IStateType> {

  private socket: SocketIOClient.Socket;

  static propTypes = {
    dashboard: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    getCarsAction: PropTypes.func.isRequired,
  };

  constructor(props: IPropsType) {
    super(props);
    this.changePage = this.changePage.bind(this);
    this.socket = io();
    this.socket.on('dashboard-vin-view', (data: any): void => {
      const {page} = this.props.dashboard.pagination;
      console.log(data);
      if(data.update){
        console.log('CALL');
        this.props.getCarsAction(page, false);
      }
    });
  }

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
                    <th className="middle">VIN</th>
                    <th className="middle hidden-xs">Marca</th>
                    <th className="middle">Supervisor</th>
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
                          <td className="middle hidden-xs">{car.brand}</td>
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
    getCarsAction: (page?: number, loading?: boolean) => dispatch(getCarsAction(page, loading)),
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(DashboardVinView);

