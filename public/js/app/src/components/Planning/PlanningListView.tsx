import * as React from "react";
import {RouteComponentProps} from "react-router";
import {Dispatch} from "redux";
import {connect} from "react-redux";
import AppContainer from "../../container/AppContainer";
import ModalView from "../Modal/ModalView";
import {getPlanningAction, IPlanningState, PlanningReduxAction} from "../../actions/planning.action";
import {IWindow} from "../../interfaces/window";
import {ErrorInfo} from "react";
import * as Raven from "raven-js";
import * as moment from "moment";
import Paginator from "../Utils/Paginator";
import TrackingBasePage from "../Utils/TrackingBasePage";
import { io } from "socket.io-client";
import { Socket } from 'socket.io-client/build/esm/socket';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<PlanningReduxAction>;
  planning: IPlanningState;

  getPlanningAction(page: number): PlanningReduxAction;
}

interface IStateType {
  error: Error | null;
}

declare let window: IWindow;

class PlanningListView extends TrackingBasePage<IPropsType, IStateType> {
  title : string;

  private socket: Socket;

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Listado de planificación';
    this.changePage = this.changePage.bind(this);
    this.import = this.import.bind(this);
  }

  public componentWillMount(): void {
    const {pagination} = this.props.planning;
    // set the title of the page
    this.props.getPlanningAction(pagination.page);

    // socket
    this.socket = io(`${location.protocol}//${location.host}`, {
      secure: location.protocol === 'https:',
      transports: ['websocket'],
      reconnection: true,
      query: {token: (window.user as any).token}
    });
    this.socket.on('connect', () => {
      this.socket.emit('join', {room: `planning-list-${window.user.team._id}`});
    });
    this.socket.on('REFRESH', (): void => {
        this.props.getPlanningAction(pagination.page);
    });
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public componentDidUpdate(prevProps: Readonly<IPropsType>, prevState: Readonly<IStateType>, snapshot?: any): void {
    if(this.props.planning.pagination !== prevProps.planning.pagination){
      window.scrollTo(0, 0);
    }
  }

  public componentDidMount(): void {
    super.componentDidMount();
    window.scrollTo(0, 0);
  }

  public componentWillUnmount(): void {
    // cancel request if component is inmounted
    if (this.props.planning.source) {
      this.props.planning.source.cancel('Operation canceled by the user.');
    }
    this.socket.disconnect();
  }

  public render(): React.ReactElement<IPropsType> {
    const {loading, plannings, pagination} = this.props.planning;
    return (
      <AppContainer title="" cMenu="5" cSubMenu="5.1">
        <section className="content">
          <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">Planificación <small>{pagination.count}</small></h3>
              <div className="box-tools pull-right">
                <button className="btn btn-sm btn-success" onClick={this.import}>Importar</button>
              </div>
            </div>
            <div className="box-body">
              {
                !loading && !plannings.length?
                  <div className="row">
                    <div className="col-md-12">
                      <p>No se han encontrado resultados.</p>
                    </div>
                  </div>
                  :null
              }
              {
                plannings.length ?
                  <table className="table">
                    <thead>
                      <tr>
                        <th>VIN</th>
                        <th>Marca</th>
                        <th>Denominación</th>
                        <th>Color</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {
                        plannings.map((item)=>(
                          <tr key={item.car.vin}>
                            <td>{item.car.vin}</td>
                            <td>{item.car.brand}</td>
                            <td>{item.car.denomination}</td>
                            <td>{item.car.color}</td>
                            <td>{moment(item.date).format("DD-MM-YYYY")}</td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                  : null
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
          <ModalView />
        </section>
      </AppContainer>
    );
  }
  private changePage(page: number): void {
    // change the page
    this.props.getPlanningAction(page);
  }

  private import(): void {
    this.props.history.push('/planning/import/');
  }
}

const mapStateToProps = (state: { planning: IPlanningState }) => {
  return {
    planning: state.planning
  };
};

const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    getPlanningAction: (page: number) => dispatch(getPlanningAction(page)),
  };
};

export default connect<{planning: IPlanningState}, {dispatch: any}, IPropsType>(mapStateToProps, mapDispatchToProps)(PlanningListView);
