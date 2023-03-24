import * as Raven from 'raven-js';
import * as React from 'react';
import { Dispatch, ErrorInfo, Fragment } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { io } from 'socket.io-client';
import { Socket } from 'socket.io-client/build/esm/socket';
import { IRequestItem } from '../../../../../../../src/request/interfaces/requestItem.interface';
import {
  createRequestItemActionInList,
  deleteRequestActionInList,
  deleteRequestItemActionInList,
  getRequestsThunkAction,
  updateRequestItemActionInList
} from '../../../actions/requests.actions';
import { IRequestsState } from '../../../actions/requests.types';
import AppContainer from '../../../container/AppContainer';
import { IWindow } from '../../../interfaces/window';
import { hasPermission, parseReplicableURL } from '../../../utils/common';
import ImageLazyLoad from '../../Utils/ImageLazyLoad';
import Paginator from '../../Utils/Paginator';
import ShowIf from '../../Utils/ShowIf';
import RequestListDetail from './RequestDetail';
import TrackingBasePage from '../../Utils/TrackingBasePage';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  requests: IRequestsState;
  dispatch: Dispatch<IRequestsState>;
  updateRequestItemActionInList: (idRequest: string, item: IRequestItem) => void;
  getRequestsThunkAction: (page: number, orderBy: string, orderType: string, hideLoading?: boolean) => void;
  deleteRequestItemActionInList: (idRequest: string, item: IRequestItem) => void;
  deleteRequestActionInList: (id: string) => void;
  createRequestItemActionInList: (idRequest: string, item: IRequestItem) => void;
}

interface IStateType {
  error: Error | null;
  exporing: boolean;
}

declare let window: IWindow;

class RequestListView extends TrackingBasePage<IPropsType, IStateType> {
  title: string;

  readonly state = {
    error: null,
    exporing: false
  };

  private socket: Socket;

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Solicitudes de unidades';
    this.create = this.create.bind(this);
    this.changeOrder = this.changeOrder.bind(this);
    this.changePage = this.changePage.bind(this);
    this.exportExcel = this.exportExcel.bind(this);
  }

  public componentWillMount(): void {
    const { orderBy, orderType } = this.props.requests.options;
    const { page } = this.props.requests.pagination;
    window.scrollTo(0, 0);

    this.props.getRequestsThunkAction(page, orderBy, orderType);

    // socket
    this.socket = io(`${location.protocol}//${location.host}`, {
      secure: location.protocol === 'https:',
      transports: ['websocket'],
      reconnection: true,
      query: {
        token: window.user.token
      }
    });

    this.socket.on('connect', () => {
      this.socket.emit('join', { room: `request-list-${window.user.team._id}` });
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
      const $item = $(`#request-item-${data.item._id}`);
      if ($item) {
        $item.addClass('bg-red-active');
      }
      setTimeout(() => {
        this.props.deleteRequestItemActionInList(data.idRequest, data.item);
      }, 300);
    });

    this.socket.on('DELETE_REQUEST', (data: any): void => {
      const $item = $(`#request-${data.idRequest}`);
      if ($item) {
        $item.addClass('bg-red-active');
      }
      setTimeout(() => {
        this.props.deleteRequestActionInList(data.idRequest);
      }, 300);
    });

    this.socket.on('CREATE_REQUEST', (): void => {
      const { page } = this.props.requests.pagination;
      const { orderBy, orderType } = this.props.requests.options;
      this.props.getRequestsThunkAction(page, orderBy, orderType, true);
    });

    this.socket.on('CREATE_REQUEST_ITEM', (data: any): void => {
      this.props.createRequestItemActionInList(data.idRequest, data.item);
      const $item = $(`#request-item-${data.item._id}`);
      if ($item) {
        $item.addClass('bg-green-active');
      }
      setTimeout(() => {
        $item.removeClass('bg-green-active');
      }, 300);
    });
  }

  public componentDidMount(): void {
    super.componentDidMount();
    window.scrollTo(0, 0);
  }

  public componentDidUpdate(prevProps: IPropsType): void {
    $('[data-toggle="tooltip"]').tooltip();
  }

  public componentWillUnmount(): void {
    // cancel request if component is inmounted
    if (this.props.requests.source) {
      this.props.requests.source.cancel('Operation canceled by the user.');
    }
    this.socket.emit('leave', { room: `request-list-${window.user.team._id}` });
    this.socket.disconnect();
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error });
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public render(): React.ReactElement<IPropsType> {
    const {
      pagination, loading, requests, reasons, requestItemStatus, carriers
    } = this.props.requests;
    const { orderBy, orderType } = this.props.requests.options;
    const { exporing } = this.state;
    return (
      <AppContainer title='' cMenu='3' cSubMenu='3.1'>
        <section className='content'>
          <div className='box'>
            <div className='box-header with-border'>
              <h3 className='box-title'>Solicitudes <small>{new Intl.NumberFormat('de-DE').format(pagination.count)}</small></h3>
              <div className='pull-right box-tools'>
                {/*<div className='btn-group btn-group-sm'>*/}
                <ShowIf condition={hasPermission(window.user, 'createRequest')}>
                  <button
                    className='btn btn-sm btn-success'
                    onClick={this.create}
                    style={{ marginRight: '5px' }}
                  >
                    <i className='fa fa-fw fa-plus' /> Crear solicitud
                  </button>
                </ShowIf>
                <ShowIf condition={requests.length > 0}>
                  <button
                    className='btn btn-sm btn-primary hidden-xs'
                    onClick={this.exportExcel}
                    disabled={exporing}
                  >
                    {
                      exporing ? <Fragment><i className='fa fa-spin fa-spinner' /> Exportando</Fragment>
                        : <Fragment><i className='fa fa-fw fa-download' /> Exportar</Fragment>
                    }
                  </button>
                </ShowIf>
                {/*</div>*/}
              </div>
            </div>
            <div className='box-body table-responsive request-list no-padding'>
              <ShowIf condition={requests.length > 0}>
                <div className='row request bg-primary'>
                  <div className='col-sm-1 col-xs-1 col-md-1 col-lg-1 center pointer head-sorted' onClick={() => this.changeOrder('_id')}>
                    <strong>SOL Nº</strong> <i
                    className={`fa ${orderBy === '_id' ? `${orderType === 'descending' ? 'fa-sort-down' : 'fa-sort-up'}` : 'fa-sort'}`} />
                  </div>
                  <div className='col-sm-1 col-xs-1 col-md-1 col-lg-1'>
                    <strong>Canal</strong>
                  </div>
                  <div className='col-sm-2 col-xs-2 col-md-2 col-lg-2'>
                    <strong>Solicitante</strong>
                  </div>
                  <div className='col-sm-2 col-xs-2 col-md-2 col-lg-2'>
                    <strong>Destino</strong>
                  </div>
                  <div className='col-sm-1 col-xs-1 col-md-1 col-lg-1'>
                    <strong>Unidades</strong>
                  </div>
                  <div className='col-sm-2 col-xs-2 col-md-2 col-lg-2  pointer head-sorted' onClick={() => this.changeOrder('createdAt')}>
                    <strong>Creación</strong> <i
                    className={`fa ${orderBy === 'createdAt' ? `${orderType === 'descending' ? 'fa-sort-down' : 'fa-sort-up'}` : 'fa-sort'}`} />
                  </div>
                  <div className='col-sm-2 col-xs-2 col-md-2 col-lg-2  pointer head-sorted' onClick={() => this.changeOrder('updatedAt')}>
                    <strong>Actualización</strong> <i
                    className={`fa ${orderBy === 'updatedAt' ? `${orderType === 'descending' ? 'fa-sort-down' : 'fa-sort-up'}` : 'fa-sort'}`} />
                  </div>
                  {/* <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1 center"> */}
                  {/* <strong><i className="fa fa-comment" /></strong> */}
                  {/* </div> */}
                  <div className='col-sm-1 col-xs-1 col-md-1 col-lg-1' />
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
              </ShowIf>
              <ShowIf condition={!loading && requests.length === 0}>
                <div className='row'>
                  <div className='col-md-12 text-center' style={{ paddingTop: '10px', paddingBottom: '10px' }}>
                    <ImageLazyLoad
                      url='/images/not_found.png'
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
            <div className='box-footer'>
              <div className='row'>
                <div className='col-md-12'>
                  <ShowIf condition={pagination.pages > 1}>
                    <div className='row'>
                      <div className='col-md-6' style={{ padding: '20px 15px' }}>
                          <span className='react-bootstrap-table-pagination-total text-muted text-ellipsis'>
                            &nbsp;&nbsp;Mostrando registros del {(pagination.page - 1) * 20 + 1} al {(pagination.page) * 20} de {pagination.count} registros.
                          </span>
                      </div>
                      <div className='col-md-6'>
                        <div className='text-right' style={{ marginRight: '15px' }}>
                          <Paginator changePage={this.changePage} page={pagination.page} pages={pagination.pages} />
                        </div>
                      </div>
                    </div>
                  </ShowIf>
                </div>
              </div>
            </div>
            <ShowIf condition={loading && requests.length === 0}>
              <div className='overlay'>
                <i className='fa fa-spinner fa-spin text-purple' />
              </div>
            </ShowIf>
          </div>
        </section>
      </AppContainer>
    );
  }

  private changeOrder(key: string) {
    const { page } = this.props.requests.pagination;
    const { orderBy, orderType } = this.props.requests.options;
    let newOrderType = orderType;
    let newOrderBy = orderBy;
    if (key === orderBy) {
      newOrderType = orderType === 'descending' ? 'ascending' : 'descending';
    } else {
      newOrderBy = key;
    }
    this.props.getRequestsThunkAction(page, newOrderBy, newOrderType);
  }

  private create(): void {
    this.props.history.push(parseReplicableURL('/requests/create/'));
  }

  private changePage(page: number): void {
    const { orderBy, orderType } = this.props.requests.options;
    this.props.getRequestsThunkAction(page, orderBy, orderType);
  }

  public exportExcel() {
    this.trackClick('Exportar');
    window.open(`/requests/export/`, '_blank');
    // this.setState({
    //   exporing: true
    // });
    // const api: ApiService = new ApiService();
    // const instance = api.getInstance();
    // instance.defaults.responseType = 'blob';
    // instance
    //   .get(`/requests/export/`)
    //   .then((response) => {
    //     const blob = new Blob([response.data], {
    //       type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    //     });
    //     const fileName = `${moment().format('YYYYMMDD')}-solicitudes.xlsx`;
    //     if (typeof window.navigator.msSaveBlob !== 'undefined') {
    //       // IE workaround for "HTML7007: One or more blob URLs were
    //       // revoked by closing the blob for which they were created.
    //       // These URLs will no longer resolve as the data backing
    //       // the URL has been freed."
    //       window.navigator.msSaveBlob(blob, fileName);
    //     } else {
    //       const blobURL = URL.createObjectURL(blob);
    //       const tempLink = document.createElement('a');
    //       tempLink.style.display = 'none';
    //       tempLink.href = blobURL;
    //       tempLink.setAttribute('download', fileName);
    //       // Safari thinks _blank anchor are pop ups. We only want to set _blank
    //       // target if the browser does not support the HTML5 download attribute.
    //       // This allows you to download files in desktop safari if pop up blocking
    //       // is enabled.
    //       if (typeof tempLink.download === 'undefined') {
    //         tempLink.setAttribute('target', '_blank');
    //       }
    //       this.setState({
    //         exporing: false
    //       });
    //       document.body.appendChild(tempLink);
    //       tempLink.click();
    //       document.body.removeChild(tempLink);
    //       URL.revokeObjectURL(blobURL);
    //     }
    //   })
    //   .catch((err) => {
    //     this.setState({
    //       exporing: false
    //     });
    //     if (!Axios.isCancel(err)) {
    //       swal('Exportar usuarios', 'Ha ocurrido un error al general el excel.', 'error');
    //     }
    //   });
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
    getRequestsThunkAction: (page: number, orderBy: string, orderType: string, hideLoading?: boolean) => dispatch(getRequestsThunkAction(page, orderBy, orderType, hideLoading)),
    createRequestItemActionInList: (idRequest: string, item: IRequestItem) => dispatch(createRequestItemActionInList(idRequest, item)),
    updateRequestItemActionInList: (idRequest: string, item: IRequestItem) => dispatch(updateRequestItemActionInList(idRequest, item)),
    deleteRequestItemActionInList: (idRequest: string, item: IRequestItem) => dispatch(deleteRequestItemActionInList(idRequest, item)),
    deleteRequestActionInList: (id: string) => dispatch(deleteRequestActionInList(id))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(RequestListView);
