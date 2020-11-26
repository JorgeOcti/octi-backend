import * as Raven from 'raven-js';
import * as React from 'react';
import { Dispatch, ErrorInfo } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import * as io from 'socket.io-client';
import { IRequestItem } from '../../../../../../../src/interfaces/requestItem.interface';
import { deleteRequestActionInList, deleteRequestItemActionInList, getRequestsThunkAction, updateRequestItemActionInList } from '../../../actions/requests.actions';
import { IRequestsState } from '../../../actions/requests.types';
import AppContainer from '../../../container/AppContainer';
import { IWindow } from '../../../interfaces/window';
import Paginator from '../../Utils/Paginator';
import RequestListDetail from './RequestDetail';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  requests: IRequestsState;
  dispatch: Dispatch<IRequestsState>;
  updateRequestItemActionInList: (idRequest: string, item: IRequestItem) => void;
  getRequestsThunkAction: (page: number, orderBy: string, orderType: string) => void;
  deleteRequestItemActionInList: (idRequest: string, item: IRequestItem) => void;
  deleteRequestActionInList: (idRequest: string) => void;
}

interface IStateType {
  error: Error | null;
  orderBy: string;
  orderType: string;
}

declare let window: IWindow;

class RequestListView extends React.Component<IPropsType, IStateType> {

  readonly state = {
    error: null,
    orderBy: '_id',
    orderType: 'descending'
  };

  private socket: SocketIOClient.Socket;

  constructor(props: IPropsType) {
    super(props);
    this.create = this.create.bind(this);
    this.changeOrder = this.changeOrder.bind(this);
    this.changePage = this.changePage.bind(this);
  }

  public componentWillMount(): void {
    const { orderBy, orderType } = this.state;
    document.title = 'OSA Andes | Solicitudes';
    window.scrollTo(0, 0);

    this.props.getRequestsThunkAction(1, orderBy, orderType);

    // socket
    this.socket = io.connect(`${location.protocol}//${location.host}`, {
      secure: location.protocol === 'https:',
      transports: ['websocket'],
      reconnection: true,
      query: {
        token: window.user.token
      }
    });

    this.socket.on('connect', () => {
      this.socket.emit('join', {room: `request-list-${window.user.team}`});
    });

    this.socket.on('UPDATE_REQUEST_ITEM', (data: any): void => {
      this.props.updateRequestItemActionInList(data.idRequest, data.item);
      const $item = $(`#request-item-${data.item._id}`);
      if ($item) {
        $item.addClass('bg-aqua-active');
        setTimeout(() => {
          $item.removeClass('bg-aqua-active');
        }, 300);
      }
    });

    this.socket.on('DELETE_REQUEST_ITEM', (data: any): void => {
      console.log('DELETE_REQUEST_ITEM', data);
      const $item = $(`#request-item-${data.item._id}`);
      if ($item) {
        $item.addClass('bg-red-active');
      }
      setTimeout(() => {
        this.props.deleteRequestItemActionInList(data.idRequest, data.item);
      }, 300);
    });

    this.socket.on('DELETE_REQUEST', (data: any): void => {
      console.log('DELETE_REQUEST', data);
      const $item = $(`#request-${data.idRequest}`);
      if ($item) {
        $item.addClass('bg-red-active');
      }
      setTimeout(() => {
        this.props.deleteRequestActionInList(data.idRequest);
      }, 300);
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
    this.socket.emit('leave', {room: `request-list-${window.user.team}`});
    this.socket.disconnect();
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public render(): React.ReactElement<IPropsType> {
    const {
      pagination, loading, requests, reasons, requestItemStatus, carriers
    } = this.props.requests;
    const { orderType, orderBy } = this.state;
    return (
      <AppContainer title="" cMenu="3" cSubMenu="3.1">
        <section className="content">
          <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">Solicitudes <small>{pagination.count}</small></h3>
              <div className="pull-right box-tools">
                <button className="btn btn-sm btn-success" onClick={this.create}>
                  <i className="fa fa-fw fa-plus" /> Crear solicitud
                </button>
              </div>
            </div>
            <div className="box-body table-responsive request-list">
              {/* <div className="row" style={{ margin: 0 }}>
                <div className="col-md-4 col-md-offset-4 text-right">
                  <div className="checkbox" style={{paddingTop: '10px'}}>
                    <label style={{paddingLeft: '0', fontWeight: 600}} onClick={()=>console.log}>
                      <Checkbox
                        active={true}
                        action={()=>console.log}
                        classes="icheck-in-checkbox"
                        style={{marginTop: '-4px', marginRight: '5px'}}
                      />
                      Ver completados
                    </label>
                  </div>
                </div>
                <div className="col-md-4" style={{ paddingRight: '0' }}>
                  <div className="input-group input-group-sm" style={{ padding: '10px 0px 10px 5px' }}>
                    <input type="text" className="form-control pull-right" placeholder="Buscar" />
                    <div className="input-group-btn">
                      <button className="btn btn-default"><i className="fa fa-search" /></button>
                    </div>
                  </div>
                </div>
              </div> */}
              <div className="row request bg-primary">
                <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1 center pointer head-sorted" onClick={() => this.changeOrder('_id')}>
                  <strong>ID</strong> <i className={`fa ${orderBy === '_id' ? `${orderType === 'descending' ? 'fa-sort-down' : 'fa-sort-up'}` : 'fa-sort'}`} />
                </div>
                <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1">
                  <strong>Flota</strong>
                </div>
                <div className="col-sm-3 col-xs-3 col-md-3 col-lg-3">
                  <strong>Destino</strong>
                </div>
                <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1">
                  <strong>Nº Vehículos</strong>
                </div>
                <div className="col-sm-2 col-xs-2 col-md-2 col-lg-2  pointer head-sorted" onClick={() => this.changeOrder('createdAt')}>
                  <strong>Fecha Creación</strong> <i className={`fa ${orderBy === 'createdAt' ? `${orderType === 'descending' ? 'fa-sort-down' : 'fa-sort-up'}` : 'fa-sort'}`} />
                </div>
                <div className="col-sm-2 col-xs-2 col-md-2 col-lg-2  pointer head-sorted" onClick={() => this.changeOrder('updatedAt')}>
                  <strong>Última Actualización</strong> <i className={`fa ${orderBy === 'updatedAt' ? `${orderType === 'descending' ? 'fa-sort-down' : 'fa-sort-up'}` : 'fa-sort'}`} />
                </div>
                <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1 center">
                  <strong><i className="fa fa-comment" /></strong>
                </div>
                <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1" />
              </div>
              {
                requests.map((request: any) => (
                  <RequestListDetail
                    request={request}
                    requestItemStatus={requestItemStatus}
                    reasons={reasons}
                    carriers={carriers}
                    key={request._id}
                    {...this.props}
                  />
                ))
              }
            </div>
            {
              pagination.pages > 1 &&
              <div className="box-footer">
                <div className="row">
                  <div className="col-md-12 text-right">
                    <Paginator changePage={this.changePage} page={pagination.page} pages={pagination.pages} />
                  </div>
                </div>
              </div>
            }
            {
              loading &&
              <div className="overlay">
                <i className="fa fa-spinner fa-spin text-purple" />
              </div>
            }
          </div>
        </section>
      </AppContainer>
    );
  }

  private changeOrder(key: string){
    const {page} = this.props.requests.pagination;
    const {orderBy, orderType} = this.state;
    let newOrderType = orderType;
    let newOrderBy = orderBy;
    if (key === orderBy) {
      newOrderType = orderType === 'descending' ? 'ascending' : 'descending';
    } else {
      newOrderBy = key;
    }
    this.setState({
      orderBy: newOrderBy,
      orderType: newOrderType
    });
    this.props.getRequestsThunkAction(page, newOrderBy, newOrderType);
  }

  private create(): void {
    this.props.history.push('/requests/create/');
  }

  private changePage(page: number): void {
    const {orderBy, orderType} = this.state;

    this.props.getRequestsThunkAction(1, orderBy, orderType);
    this.props.getRequestsThunkAction(page, orderBy, orderType);
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
    getRequestsThunkAction: (page: number, orderBy: string, orderType: string) => dispatch(getRequestsThunkAction(page, orderBy, orderType)),
    updateRequestItemActionInList: (idRequest: string, item: IRequestItem) => dispatch(updateRequestItemActionInList(idRequest, item)),
    deleteRequestItemActionInList: (idRequest: string, item: IRequestItem) => dispatch(deleteRequestItemActionInList(idRequest, item)),
    deleteRequestActionInList: (idRequest: string) => dispatch(deleteRequestActionInList(idRequest))
  };
};


export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(RequestListView);
