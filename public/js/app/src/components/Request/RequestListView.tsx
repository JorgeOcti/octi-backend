import * as React from 'react';
import {Dispatch, ErrorInfo} from 'react';
import {RouteComponentProps} from "react-router";
import {connect} from "react-redux";
import AppContainer from "../../container/AppContainer";
import {IWindow} from "../../interfaces/window";
import RequestDetailView from "./RequestDetailView";
import {getRequestsAction, IRequestsState} from "../../actions/requests.actions";
import * as io from "socket.io-client";
import Paginator from "../Utils/Paginator";
import * as Raven from "raven-js";

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  requests: IRequestsState;
  dispatch: Dispatch<IRequestsState>;

  getRequestsAction(page: number): void;
}

interface IStateType {
  error: Error | null;
}

declare let window: IWindow;

class RequestListView extends React.Component<IPropsType, IStateType> {

  readonly state = {
    error: null
  };

  private socket: SocketIOClient.Socket;

  constructor(props: IPropsType) {
    super(props);
    this.create = this.create.bind(this);
    this.changePage = this.changePage.bind(this);
  }

  public componentWillMount(): void {
    document.title = 'OSA Andes | Solicitudes';
    window.scrollTo(0, 0);

    this.props.getRequestsAction(1);

    // socket
    this.socket = io.connect(`${location.protocol}//${location.host}`, {
      secure: location.protocol === 'https:',
      transports: ['websocket'],
      reconnection: true,
      query: {
        token: window.user.token
      }
    });
  }

  public componentDidMount(): void {
    window.scrollTo(0, 0);
  }

  public componentWillUnmount(): void {
    // cancel request if component is inmounted
    if (this.props.requests.source) {
      this.props.requests.source.cancel('Operation canceled by the user.');
    }
    // this.socket.emit('leave', {room: `inventory-list-${window.user.team}`});
    this.socket.disconnect();
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public render(): React.ReactElement<IPropsType> {
    const {pagination, loading, requests} = this.props.requests;
    return (
      <AppContainer title="" cMenu="3" cSubMenu="3.1">
        <section className="content">
          <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">Solicitudes <small>{pagination.count}</small></h3>
              <div className="pull-right box-tools">
                <button className="btn btn-sm btn-success" onClick={this.create}>Crear solicitud</button>
                {
                  /*hasPermission(window.user, 'createInventory') ?
                    : null*/
                }
              </div>
            </div>
            <div className="box-body table-responsive request-list">
              <div className="row" style={{margin: 0}}>
                <div className="col-md-4 col-md-offset-8" style={{paddingRight: "0"}}>
                  <div className="input-group input-group-sm" style={{padding: "10px 0px 10px 5px"}}>
                    <input type="text" className="form-control pull-right" placeholder="Buscar" value="" onChange={()=>{}}/>
                    <div className="input-group-btn">
                      <button className="btn btn-default"><i className="fa fa-search" /></button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="row request">
                <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1 center"><strong>ID</strong></div>
                <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1"><strong>Flota</strong></div>
                <div className="col-sm-2 col-xs-2 col-md-2 col-lg-2"><strong>Estado</strong></div>
                <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1"><strong>Destino</strong></div>
                <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1 center"><strong>Nº Vehículos</strong></div>
                <div className="col-sm-2 col-xs-2 col-md-2 col-lg-2 center"><strong>Fecha Creación</strong></div>
                <div className="col-sm-2 col-xs-2 col-md-2 col-lg-2 center"><strong>Última Actualización</strong></div>
                <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1 center">
                  <strong><i className="fa fa-comment"/></strong>
                </div>
                <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1" />
              </div>
              {
                requests.map((request: any) => <RequestDetailView request={request} key={request._id}/>)
              }
            </div>
            {
              pagination.pages > 1 &&
              <div className="box-footer">
                <div className="row">
                  <div className="col-md-12 text-right">
                    <Paginator changePage={this.changePage} page={pagination.page} pages={pagination.pages}/>
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
        </section>
      </AppContainer>
    )
  }

  private create(): void {
    this.props.history.push('/requests/create/');
  }

  private changePage(page: number): void {
    this.props.getRequestsAction(page);
  }
}

const mapStateToProps = (state: { requests: IRequestsState }) => {
  return {
    requests: state.requests
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch,
    getRequestsAction: (page: number) => dispatch(getRequestsAction(page))
  };
};


export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(RequestListView);
