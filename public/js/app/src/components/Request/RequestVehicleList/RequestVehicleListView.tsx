import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { getRequestItemsThunkAction } from '../../../actions/requestItems.actions';
import { IRequestItemsState } from '../../../actions/requestItems.types';
import AppContainer from '../../../container/AppContainer';
import { IWindow } from '../../../interfaces/window';
import Paginator from '../../Utils/Paginator';
import RequestVehicleItem from './RequestVehicleItem';


interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  requestItems: IRequestItemsState;
  // dispatch: Dispatch<IRequestsState>;
  // updateRequestItemActionInList: (idRequest: string, item: IRequestItem) => void;
  getRequestItemsThunkAction: (page: number, orderBy: string, orderType: string) => void;
  // deleteRequestItemActionInList: (idRequest: string, item: IRequestItem) => void;
  // deleteRequestActionInList: (id: string) => void;
  // createRequestItemActionInList: (idRequest: string, item: IRequestItem) => void;
}

interface IStateType {
  error: Error | null;
}

declare let window: IWindow;

class RequestVehicleListView extends React.Component<IPropsType, IStateType> {
  private socket: SocketIOClient.Socket;

  constructor(props: IPropsType) {
    super(props);
    this.changePage = this.changePage.bind(this);
  }

  public componentWillMount(): void {
    const {orderBy, orderType} = this.props.requestItems.options;
    document.title = 'OSA Andes | Solicitudes';
    window.scrollTo(0, 0);

    this.props.getRequestItemsThunkAction(1, orderBy, orderType);

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
      // this.props.updateRequestItemActionInList(data.idRequest, data.item);
      // const $item = $(`#request-item-${data.item._id}`);
      // if ($item) {
      //   $item.addClass('bg-aqua-active');
      //   setTimeout(() => {
      //     $item.removeClass('bg-aqua-active');
      //   }, 300);
      // }
    });

    this.socket.on('DELETE_REQUEST_ITEM', (data: any): void => {
      // const $item = $(`#request-item-${data.item._id}`);
      // if ($item) {
      //   $item.addClass('bg-red-active');
      // }
      // setTimeout(() => {
      //   this.props.deleteRequestItemActionInList(data.idRequest, data.item);
      // }, 300);
    });

    this.socket.on('DELETE_REQUEST', (data: any): void => {
      // const $item = $(`#request-${data.idRequest}`);
      // if ($item) {
      //   $item.addClass('bg-red-active');
      // }
      // setTimeout(() => {
      //   this.props.deleteRequestActionInList(data.idRequest);
      // }, 300);
    });

    this.socket.on('CREATE_REQUEST_ITEM', (data: any): void => {
      // this.props.createRequestItemActionInList(data.idRequest, data.item);
      // const $item = $(`#request-item-${data.item._id}`);
      // if ($item) {
      //   $item.addClass('bg-green-active');
      // }
      // setTimeout(() => {
      //   $item.removeClass('bg-green-active');
      // }, 300);
    });
  }

  public render(): React.ReactElement<IPropsType> {
    const {
      pagination, loading, requestItems, reasons, requestItemStatus, carriers
    } = this.props.requestItems;
    const { orderBy, orderType} = this.props.requestItems.options;
    return (
      <AppContainer title="" cMenu="3" cSubMenu="3.2">
        <section className="content">
          <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">Vehículos <small>{pagination.count}</small></h3>
              <div className="pull-right box-tools">
                <button className="btn btn-sm btn-success" onClick={undefined}>
                  <i className="fa fa-fw fa-plus" /> Crear solicitud
                </button>
              </div>
            </div>
            <div className="box-body no-padding table-responsive">
              <table className="table table-xs table-hover" style={{marginTop: '15px', minWidth: '1000px'}}>
                <thead>
                  <tr className="bg-primary" style={{ height: '45px' }}>
                    <th className="middle" style={{ width: '28px' }} />
                    <th
                      className="middle pointer"
                      style={{ width: '80px' }}
                    >
                      Solicitud
                      <span style={{float: 'right'}}><i className={`fa fa-fw ${orderBy === 'request' ? `${orderType === 'descending' ? 'fa-sort-down' : 'fa-sort-up'}` : 'fa-sort'}`} /></span>
                    </th>
                    <th className="middle pointer" style={{ width: '100px' }}>
                      Marca
                      <span style={{float: 'right'}}><i className={`fa fa-fw ${orderBy === 'request' ? `${orderType === 'descending' ? 'fa-sort-down' : 'fa-sort-up'}` : 'fa-sort'}`} /></span>
                    </th>
                    <th className="middle pointer" style={{ width: '150px' }}>
                      Modelo
                      <span style={{float: 'right'}}><i className={`fa fa-fw ${orderBy === 'request' ? `${orderType === 'descending' ? 'fa-sort-down' : 'fa-sort-up'}` : 'fa-sort'}`} /></span>
                    </th>
                    <th className="middle">Color</th>
                    <th className="middle pointer">
                      Estado
                      <span style={{float: 'right'}}><i className={`fa fa-fw ${orderBy === 'request' ? `${orderType === 'descending' ? 'fa-sort-down' : 'fa-sort-up'}` : 'fa-sort'}`} /></span>
                    </th>
                    <th className="middle">VIN</th>
                    <th className="middle">CDO</th>
                    <th className="middle pointer" style={{ width: '100px' }}>
                      Motivo
                      <span style={{float: 'right'}}><i className={`fa fa-fw ${orderBy === 'request' ? `${orderType === 'descending' ? 'fa-sort-down' : 'fa-sort-up'}` : 'fa-sort'}`} /></span>
                    </th>
                    <th className="middle">Carrocería</th>
                    <th className="middle">Pre-Entrega</th>
                    <th className="middle">Transporte</th>
                    <th className="middle pointer" style={{ width: '80px' }}>
                      F. carga
                      <span style={{float: 'right'}}><i className={`fa fa-fw ${orderBy === 'request' ? `${orderType === 'descending' ? 'fa-sort-down' : 'fa-sort-up'}` : 'fa-sort'}`} /></span>
                    </th>
                    <th className="middle pointer" style={{ width: '80px' }}>
                      F. llegada
                      <span style={{float: 'right'}}><i className={`fa fa-fw ${orderBy === 'request' ? `${orderType === 'descending' ? 'fa-sort-down' : 'fa-sort-up'}` : 'fa-sort'}`} /></span>
                    </th>
                    <th className="middle" style={{ width: '30px' }} />
                  </tr>
                </thead>
                <tbody>
                  {
                    requestItems.map((item, index) => (
                      <RequestVehicleItem
                        key={index}
                        item={item}
                      />
                    ))
                  }
                </tbody>
              </table>
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

  private changePage(page: number): void {
    const {orderBy, orderType} = this.props.requestItems.options;
    this.props.getRequestItemsThunkAction(page, orderBy, orderType);
  }
}

const mapStateToProps = (state: { requestItems: IRequestItemsState }) => {
  return {
    requestItems: state.requestItems
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch,
    getRequestItemsThunkAction: (page: number, orderBy: string, orderType: string) => dispatch(getRequestItemsThunkAction(page, orderBy, orderType)),
    // createRequestItemActionInList: (idRequest: string, item: IRequestItem) => dispatch(createRequestItemActionInList(idRequest, item)),
    // updateRequestItemActionInList: (idRequest: string, item: IRequestItem) => dispatch(updateRequestItemActionInList(idRequest, item)),
    // deleteRequestItemActionInList: (idRequest: string, item: IRequestItem) => dispatch(deleteRequestItemActionInList(idRequest, item)),
    // deleteRequestActionInList: (id: string) => dispatch(deleteRequestActionInList(id))
  };
};


export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(RequestVehicleListView);