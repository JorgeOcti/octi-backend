import Axios from 'axios';
import * as moment from 'moment';
import * as React from 'react';
import { Dispatch } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import * as swal from 'sweetalert';
import { IRequestItem } from '../../../../../../../src/interfaces/requestItem.interface';
import { createRequestItemAction, deleteRequestItemAction, getRequestItemsThunkAction, updateRequestItemAction } from '../../../actions/requestItems.actions';
import { IRequestItemsState } from '../../../actions/requestItems.types';
import AppContainer from '../../../container/AppContainer';
import { IWindow } from '../../../interfaces/window';
import ApiService from '../../../utils/axios';
import { hasPermission } from '../../../utils/common';
import ImageLazyLoad from '../../Utils/ImageLazyLoad';
import Paginator from '../../Utils/Paginator';
import ShowIf from '../../Utils/ShowIf';
import RequestVehicleItem from './RequestVehicleItem';


interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  requestItems: IRequestItemsState;
  dispatch: Dispatch<IRequestItemsState>;
  updateRequestItemAction: (item: IRequestItem) => void;
  getRequestItemsThunkAction: (page: number, orderBy: string, orderType: string) => void;
  deleteRequestItemAction: (item: IRequestItem) => void;
  // deleteRequestActionInList: (id: string) => void;
  createRequestItemAction: (item: IRequestItem) => void;
}

interface IStateType {
  error: Error | null;
  exporing: boolean;
}

declare let window: IWindow;

class RequestVehicleListView extends React.Component<IPropsType, IStateType> {

  private socket: SocketIOClient.Socket;

  readonly state = {
    error: null,
    exporing: false
  };

  constructor(props: IPropsType) {
    super(props);
    this.changePage = this.changePage.bind(this);
    this.changeOrder = this.changeOrder.bind(this);
    this.exportExcel = this.exportExcel.bind(this);
    this.create = this.create.bind(this);
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
      this.props.updateRequestItemAction(data.item);
      const $item = $(`#request-item-${data.item._id}`);
      if ($item) {
        $item.addClass('bg-aqua-active');
        setTimeout(() => {
          $item.removeClass('bg-aqua-active');
        }, 300);
      }
    });

    this.socket.on('DELETE_REQUEST_ITEM', (data: any): void => {
      const $item = $(`#request-item-${data.item._id}`);
      if ($item) {
        $item.addClass('bg-red-active');
      }
      setTimeout(() => {
        this.props.deleteRequestItemAction(data.item);
      }, 300);
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
      this.props.createRequestItemAction(data.item);
      const $item = $(`#request-item-${data.item._id}`);
      if ($item) {
        $item.addClass('bg-green-active');
      }
      setTimeout(() => {
        $item.removeClass('bg-green-active');
      }, 300);
    });
  }

  public componentDidUpdate(prevProps: IPropsType): void {
    $('[data-toggle="tooltip"]').tooltip();
  }

  public render(): React.ReactElement<IPropsType> {
    const {
      pagination, loading, requestItems
    } = this.props.requestItems;
    const { orderBy, orderType} = this.props.requestItems.options;
    const {exporing} = this.state;
    return (
      <AppContainer title="" cMenu="3" cSubMenu="3.2">
        <section className="content">
          <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">Vehículos <small>{pagination.count}</small></h3>
              <div className="pull-right box-tools">
                <ShowIf condition={hasPermission(window.user, 'createRequest')}>
                  <button
                    className="btn btn-sm btn-success"
                    onClick={this.create}
                  >
                    <i className="fa fa-fw fa-plus" /> Crear solicitud
                  </button>
                </ShowIf>
                <button
                  className="btn btn-sm btn-primary hidden-xs"
                  onClick={this.exportExcel}
                  disabled={exporing}
                  style={{marginLeft: '5px'}}
                >
                  {
                    exporing ?
                      <React.Fragment>
                        <i className="fa fa-spin fa-spinner"/> Exportando
                      </React.Fragment>
                      : <React.Fragment>
                        <i className="fa fa-fw fa-download"/> Exportar
                      </React.Fragment>
                  }
                </button>
              </div>
            </div>
            <div className="box-body no-padding table-responsive">
              <ShowIf condition={requestItems.length > 0}>
                <table className="table table-xs table-hover" style={{ marginTop: '15px', minWidth: '1000px' }}>
                  <thead>
                    <tr className="bg-primary" style={{ height: '45px' }}>
                      <th className="middle" style={{ width: '28px' }} />
                      <th
                        className="middle pointer"
                        style={{ width: '80px' }}
                        onClick={() => this.changeOrder('request.number')}
                      >
                        Solicitud
                      <span style={{ float: 'right' }}><i className={`fa fa-fw ${orderBy === 'request.number' ? `${orderType === 'descending' ? 'fa-sort-down' : 'fa-sort-up'}` : 'fa-sort'}`} /></span>
                      </th>
                      <th
                        className="middle pointer"
                        style={{ width: '80px' }}
                        onClick={() => this.changeOrder('destination.name')}
                      >
                        Destino
                      <span style={{ float: 'right' }}><i className={`fa fa-fw ${orderBy === 'destination.name' ? `${orderType === 'descending' ? 'fa-sort-down' : 'fa-sort-up'}` : 'fa-sort'}`} /></span>
                      </th>
                      <th
                        className="middle pointer"
                        style={{ width: '100px' }}
                        onClick={() => this.changeOrder('car.brand')}
                      >
                        Marca
                      <span style={{ float: 'right' }}><i className={`fa fa-fw ${orderBy === 'car.brand' ? `${orderType === 'descending' ? 'fa-sort-down' : 'fa-sort-up'}` : 'fa-sort'}`} /></span>
                      </th>
                      <th
                        className="middle pointer"
                        style={{ width: '120px' }}
                        onClick={() => this.changeOrder('car.description')}
                      >
                        Modelo
                      <span style={{ float: 'right' }}><i className={`fa fa-fw ${orderBy === 'car.description' ? `${orderType === 'descending' ? 'fa-sort-down' : 'fa-sort-up'}` : 'fa-sort'}`} /></span>
                      </th>
                      <th
                        className="middle pointer"
                        style={{ width: '120px' }}
                        onClick={() => this.changeOrder('car.material')}
                      >
                        Material
                      <span style={{ float: 'right' }}><i className={`fa fa-fw ${orderBy === 'car.material' ? `${orderType === 'descending' ? 'fa-sort-down' : 'fa-sort-up'}` : 'fa-sort'}`} /></span>
                      </th>
                      <th className="middle">Color</th>
                      <th
                        className="middle pointer"
                        onClick={() => this.changeOrder('status.name')}
                      >
                        Estado
                      <span style={{ float: 'right' }}><i className={`fa fa-fw ${orderBy === 'status.name' ? `${orderType === 'descending' ? 'fa-sort-down' : 'fa-sort-up'}` : 'fa-sort'}`} /></span>
                      </th>
                      <th className="middle">VIN</th>
                      <th className="middle">CDO</th>
                      <th
                        className="middle pointer"
                        style={{ width: '100px' }}
                        onClick={() => this.changeOrder('reason.name')}
                      >
                        Motivo
                      <span style={{ float: 'right' }}><i className={`fa fa-fw ${orderBy === 'reason.name' ? `${orderType === 'descending' ? 'fa-sort-down' : 'fa-sort-up'}` : 'fa-sort'}`} /></span>
                      </th>
                      <th className="middle">Carrocería</th>
                      <th className="middle">Pre-Entrega</th>
                      <th
                        className="middle pointer"
                        onClick={() => this.changeOrder('carrier.name')}
                      >
                        Transporte
                      <span style={{ float: 'right' }}><i className={`fa fa-fw ${orderBy === 'carrier.name' ? `${orderType === 'descending' ? 'fa-sort-down' : 'fa-sort-up'}` : 'fa-sort'}`} /></span>
                      </th>
                      <th
                        className="middle pointer"
                        style={{ width: '80px' }}
                        onClick={() => this.changeOrder('uploadDate')}
                      >
                        F. carga
                      <span style={{ float: 'right' }}><i className={`fa fa-fw ${orderBy === 'uploadDate' ? `${orderType === 'descending' ? 'fa-sort-down' : 'fa-sort-up'}` : 'fa-sort'}`} /></span>
                      </th>
                      <th
                        className="middle pointer"
                        style={{ width: '80px' }}
                        onClick={() => this.changeOrder('estimatedArrival')}
                      >
                        F. llegada
                      <span style={{ float: 'right' }}><i className={`fa fa-fw ${orderBy === 'estimatedArrival' ? `${orderType === 'descending' ? 'fa-sort-down' : 'fa-sort-up'}` : 'fa-sort'}`} /></span>
                      </th>
                      <ShowIf condition={hasPermission(window.user, 'deleteRequest')}>
                        <th className="middle" style={{ width: '30px' }} />
                      </ShowIf>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      requestItems.map((item, index) => (
                        <RequestVehicleItem
                          key={item._id}
                          item={item}
                          {...this.props}
                        />
                      ))
                    }
                  </tbody>
                </table>
              </ShowIf>
              <ShowIf condition={!loading && requestItems.length === 0}>
                <div className="row">
                  <div className="col-md-12 text-center" style={{paddingTop: '10px', paddingBottom: '10px'}}>
                      <ImageLazyLoad
                        url="/images/not_found.png"
                        height={'200px'}
                        style={{
                          opacity: 0.5,
                          maxHeight: '200px',
                          marginBottom: '10px'
                        }}
                        replaceLoading={<i
                          className={'fa fa-2x fa-circle-o-notch text-primary fa-spin'}
                          style={{ padding: '30px' }}
                        />}
                      /><br />
                      <strong>No hay información para mostrar</strong>
                  </div>
                </div>
              </ShowIf>
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

  private create(): void {
    this.props.history.push('/requests/vehicles/create/');
  }

  private changeOrder(key: string){
    const {page} = this.props.requestItems.pagination;
    const {orderBy, orderType} = this.props.requestItems.options;
    let newOrderType = orderType;
    let newOrderBy = orderBy;
    if (key === orderBy) {
      newOrderType = orderType === 'descending' ? 'ascending' : 'descending';
    } else {
      newOrderBy = key;
    }
    this.props.getRequestItemsThunkAction(page, newOrderBy, newOrderType);
  }

  private changePage(page: number): void {
    const {orderBy, orderType} = this.props.requestItems.options;
    this.props.getRequestItemsThunkAction(page, orderBy, orderType);
  }

  public exportExcel() {
    this.setState({
      exporing: true
    });
    const api: ApiService = new ApiService();
    const instance = api.getInstance();
    instance.defaults.responseType = 'blob';
    instance
      .get(`/requests/export/`)
      .then((response) => {
        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const fileName = `${moment().format('YYYYMMDD')}-solicitudes.xlsx`;
        if (typeof window.navigator.msSaveBlob !== 'undefined') {
          // IE workaround for "HTML7007: One or more blob URLs were
          // revoked by closing the blob for which they were created.
          // These URLs will no longer resolve as the data backing
          // the URL has been freed."
          window.navigator.msSaveBlob(blob, fileName);
        } else {
          const blobURL = URL.createObjectURL(blob);
          const tempLink = document.createElement('a');
          tempLink.style.display = 'none';
          tempLink.href = blobURL;
          tempLink.setAttribute('download', fileName);
          // Safari thinks _blank anchor are pop ups. We only want to set _blank
          // target if the browser does not support the HTML5 download attribute.
          // This allows you to download files in desktop safari if pop up blocking
          // is enabled.
          if (typeof tempLink.download === 'undefined') {
            tempLink.setAttribute('target', '_blank');
          }
          this.setState({
            exporing: false
          });
          document.body.appendChild(tempLink);
          tempLink.click();
          document.body.removeChild(tempLink);
          URL.revokeObjectURL(blobURL);
        }
      })
      .catch((err) => {
        this.setState({
          exporing: false
        });
        if (!Axios.isCancel(err)) {
          swal('Exportar usuarios', 'Ha ocurrido un error al general el excel.', 'error');
        }
      });
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
    createRequestItemAction: (item: IRequestItem) => dispatch(createRequestItemAction(item)),
    updateRequestItemAction: (item: IRequestItem) => dispatch(updateRequestItemAction(item)),
    deleteRequestItemAction: (item: IRequestItem) => dispatch(deleteRequestItemAction(item))
    // deleteRequestActionInList: (id: string) => dispatch(deleteRequestActionInList(id))
  };
};


export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(RequestVehicleListView);