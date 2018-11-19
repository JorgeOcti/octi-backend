import * as moment from 'moment';
// import * as PropTypes from 'prop-types';
import * as Raven from 'raven-js';
import {ErrorInfo} from 'react';
import * as React from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import * as io from 'socket.io-client';
import {ICar} from '../../../../../../src/interfaces/car.interface';
import {DashboardReduxAction, getCarsAction, IDashboardState} from '../../actions/dashboard.actions';
import AppContainer from '../../container/AppContainer';
import {IWindow} from '../../interfaces/window';
import Paginator from '../Paginator';

declare let window: IWindow;

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<DashboardReduxAction>;
  dashboard: IDashboardState;

  getCarsAction(page?: number, loading?: boolean): void;
}

interface IStateType {
  error: Error | null;
  highlight: string[];
}

class DashboardVinView extends React.Component<IPropsType, IStateType> {

  // static propTypes = {
  //   dashboard: PropTypes.object.isRequired,
  //   dispatch: PropTypes.func.isRequired,
  //   getCarsAction: PropTypes.func.isRequired
  // };

  state = {
    error: null,
    highlight: []
  };

  protected isMount: boolean = false;
  private socket: SocketIOClient.Socket;

  constructor(props: IPropsType) {
    super(props);
    this.changePage = this.changePage.bind(this);
  }

  public componentWillMount(): void {
    // set the title of the page
    document.title = 'OSA Andes | Revisiones';
    this.props.getCarsAction();

    // socket
    this.socket = io.connect(`${location.protocol}//${location.host}`, {
      secure: location.protocol === 'https:',
      reconnection: true,
      // transports: ['websocket'],
      query: {
        token: (window.user as any).token
      }
    });
    this.socket.on('connect', () => {
      this.socket.emit('join', {room: `dashboard-vin-view-${window.user.company}`});
    });
    this.socket.on('REFRESH', (data: any): void => {
      const {page} = this.props.dashboard.pagination;
      if (data.update) {
        this.props.getCarsAction(page, false);
        if (!this.state.highlight.includes(data.car as never)) {
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

  public render(): React.ReactElement<IPropsType> {
    const {loading, cars, pagination} = this.props.dashboard;
    const {highlight} = this.state;
    return (
      <AppContainer title="" cMenu="1" cSubMenu="1.2">
        <section className="content">
          <div className="box">
            <div className="box-header with-border"><h3 className="box-title">Revisiones</h3>
              <div className="box-tools pull-right">
              </div>
            </div>
            <div className="box-body no-padding">
              {
                cars.length ?
                  <table className="table table-striped">
                    <thead>
                    <tr>
                      <th style={{width: '20%'}} className="middle">VIN</th>
                      <th style={{width: '20%'}} className="middle hidden-xs">Marca</th>
                      <th style={{width: '20%'}} className="middle hidden-xs">Supervisor</th>
                      <th style={{width: '20%'}} className="hidden-xs">Calificación</th>
                      <th style={{width: '20%'}} className="hidden-xs">Último checkeo</th>
                      <th className="width-10"/>
                    </tr>
                    </thead>
                    <tbody>
                    {
                      cars.map((car: ICar) => {
                        return (
                          <tr
                            key={car._id} id={`car-${car._id}`}
                            className={highlight.length && highlight.includes(car._id as never) ? 'highlight-info' : ''}
                          >
                            <td className="middle">{car.vin}</td>
                            <td className="middle hidden-xs">{car.brand}</td>
                            <td className="middle">
                              {`${car.lastForm.user ? `${car.lastForm.user.firstName} ${car.lastForm.user.lastName}` : ''}`}
                            </td>
                            <td className="middle">
                              {`${car.lastForm && car.lastForm.hasOwnProperty('qualification') ? `${Math.round(car.lastForm.qualification)}%` : ''}`}
                            </td>
                            <td className="middle hidden-xs">
                              {moment(car.lastForm.createdAt).format('LLL')}
                            </td>
                            <td className="text-primary">
                              <button className="btn btn-xs btn-primary" onClick={() => this.props.history.push(`/cars/${car._id}`)}><i
                                className="fa fa-bars"/></button>
                            </td>
                          </tr>
                        );
                      })
                    }
                    </tbody>
                  </table>
                  : !loading ? <strong>Aún no se han realizado revisiones.</strong> : null
              }
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

  private changePage(page: number): void {
    // change the page
    this.props.getCarsAction(page);
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
    getCarsAction: (page?: number, loading?: boolean) => dispatch(getCarsAction(page, loading))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(DashboardVinView);
