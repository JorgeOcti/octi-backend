import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo, Fragment} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import * as io from 'socket.io-client';
import AppContainer from '../../../container/AppContainer';
import {IWindow} from '../../../interfaces/window';
import {hasPermission} from '../../../utils/common';
import ImageLazyLoad from '../../Utils/ImageLazyLoad';
import Paginator from '../../Utils/Paginator';
import ShowIf from '../../Utils/ShowIf';
import TrackingBasePage from "../../Utils/TrackingBasePage";
import TransmittalActions from "../../../actions/transmittal.actions";
import {ITransmittalActionTypes, ITransmittalState} from "../../../actions/transmittal.types";
import TransmitalListDetail from './TransmitalListDetail';
import {Dispatch} from "redux";

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<ITransmittalActionTypes>;
  transmittal: ITransmittalState;
  transmittalActions : TransmittalActions
  getTransmittalsThunkAction: (page: number, orderBy: string, orderType: string, hideLoading?: boolean) => void;
}

interface IStateType {
  error: Error | null;
  exporing: boolean;
}

declare let window: IWindow;

class TransmittalListView extends TrackingBasePage<IPropsType, IStateType> {
  title : string;

  readonly state = {
    error: null,
    exporing: false
  };

  private socket: SocketIOClient.Socket;

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Transporte';
    this.create = this.create.bind(this);
    this.changeOrder = this.changeOrder.bind(this);
    this.changePage = this.changePage.bind(this);
  }

  public componentWillMount(): void {
    const {orderBy, orderType} = this.props.transmittal.options;
    const {page} = this.props.transmittal.pagination;
    window.scrollTo(0, 0);
    this.props.transmittalActions.getFormBaseData();
    this.props.transmittalActions.getTransmittalsThunkAction(page, orderBy, orderType);

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
      this.socket.emit('join', {
        room: `distribution-list-${window.user.team._id}`
      });
    });

    // this.socket.on('UPDATE_REQUEST_ITEM', (data: any): void => {
    //   this.props.updateRequestItemActionInList(data.idRequest, data.item);
    //   const $item = $(`#request-item-${data.item._id}`);
    //   if ($item) {
    //     $item.addClass('bg-aqua-active');
    //     setTimeout(() => {
    //       $item.removeClass('bg-aqua-active');
    //     }, 300);
    //   }
    // });
    //
    // this.socket.on('DELETE_REQUEST_ITEM', (data: any): void => {
    //   const $item = $(`#request-item-${data.item._id}`);
    //   if ($item) {
    //     $item.addClass('bg-red-active');
    //   }
    //   setTimeout(() => {
    //     this.props.deleteRequestItemActionInList(data.idRequest, data.item);
    //   }, 300);
    // });
    //
    // this.socket.on('DELETE_REQUEST', (data: any): void => {
    //   const $item = $(`#request-${data.idRequest}`);
    //   if ($item) {
    //     $item.addClass('bg-red-active');
    //   }
    //   setTimeout(() => {
    //     this.props.deleteRequestActionInList(data.idRequest);
    //   }, 300);
    // });
    //
    // this.socket.on('CREATE_REQUEST', (data: any): void => {
    //   const { page } = this.props.requests.pagination;
    //   const { orderBy, orderType } = this.props.requests.options;
    //   this.props.getRequestsThunkAction(page, orderBy, orderType, true);
    // });
    //
    // this.socket.on('CREATE_REQUEST_ITEM', (data: any): void => {
    //   this.props.createRequestItemActionInList(data.idRequest, data.item);
    //     const $item = $(`#request-item-${data.item._id}`);
    //     if ($item) {
    //       $item.addClass('bg-green-active');
    //     }
    //     setTimeout(() => {
    //       $item.removeClass('bg-green-active');
    //     }, 300);
    // });
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
    if (this.props.transmittal.source) {
      this.props.transmittal.source.cancel('Operation canceled by the user.');
    }
    this.socket.emit('leave', {room: `distribution-list-${window.user.team._id}`});
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
      pagination, loading, data, options: {orderBy, orderType}
    } = this.props.transmittal;
    const {exporing} = this.state;
    return (
      <AppContainer title="" cMenu="3" cSubMenu="3.4">
        <section className="content">
          <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">Transporte <small>{pagination.count}</small></h3>
              <div className="pull-right box-tools">
                {
                  hasPermission(window.user, 'createRequest') ?
                    <button className="btn btn-sm btn-success" onClick={this.create}>
                      <i className="fa fa-fw fa-plus" /> Crear order
                    </button>
                    : null
                }
                <ShowIf condition={data.length > 0}>
                  <button
                    className="btn btn-sm btn-primary hidden-xs"
                    // onClick={this.exportExcel}
                    disabled={exporing}
                    style={{ marginLeft: '5px' }}
                  >
                    {
                      exporing ? <Fragment><i className="fa fa-spin fa-spinner" /> Exportando</Fragment>
                        : <Fragment><i className="fa fa-fw fa-download" /> Exportar</Fragment>
                    }
                  </button>
                </ShowIf>
              </div>
            </div>
            <div className={`box-body transmittal-list`}>
              <ShowIf condition={data.length > 0}>
                <div className="row transmittal bg-primary">
                  <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1 center pointer head-sorted" onClick={() => this.changeOrder('_id')}>
                    <strong>ID</strong> <i className={`fa ${orderBy === '_id' ? `${orderType === 'descending' ? 'fa-sort-down' : 'fa-sort-up'}` : 'fa-sort'}`} />
                  </div>
                  <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1">
                    <strong>Placa</strong>
                  </div>
                  <div className="col-sm-2 col-xs-2 col-md-2 col-lg-2">
                    <strong>Chófer</strong>
                  </div>
                  <div className="col-sm-2 col-xs-2 col-md-2 col-lg-2">
                    <strong>Documentos</strong>
                  </div>
                  <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1">
                    <strong>Nº Vehículos</strong>
                  </div>
                  <div className="col-sm-5 col-xs-5 col-md-5 col-lg-5" />
                </div>
                {
                  data.map((item: any) => (
                    <TransmitalListDetail
                      item={item}
                      key={item._id}
                    />
                  ))
                }
              </ShowIf>
              <ShowIf condition={!loading && data.length === 0}>
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
                  <div className="col-md-6" style={{ padding: '20px 15px' }}>
                    <span className="react-bootstrap-table-pagination-total text-ellipsis">
                      &nbsp;&nbsp;Mostrando registros del {(pagination.page - 1) * 20 + 1} al {(pagination.page) * 20} de {pagination.count} registros.
                      </span>
                  </div>
                  <div className="col-md-6">
                    <div className="text-right" style={{ marginRight: '15px' }}>
                      <Paginator changePage={this.changePage} page={pagination.page} pages={pagination.pages} />
                    </div>
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

  private changeOrder(key: string) {
    const {
      options: {orderBy, orderType},
      pagination: {page}
    } = this.props.transmittal;
    let newOrderType = orderType;
    let newOrderBy = orderBy;
    if (key === orderBy) {
      newOrderType = orderType === 'descending' ? 'ascending' : 'descending';
    } else {
      newOrderBy = key;
    }
    this.props.transmittalActions.getTransmittalsThunkAction(page, newOrderBy, newOrderType);
  }

  private create(): void {
    this.props.history.push('/transmittals/create/');
  }

  private changePage(page: number): void {
    const {options: {orderBy, orderType}} = this.props.transmittal;
    this.props.transmittalActions.getTransmittalsThunkAction(page, orderBy, orderType);
  }

}

const mapStateToProps = (state: { transmittal: ITransmittalState }) => {
  return {
    transmittal: state.transmittal
  };
};

const mapDispatchToProps = (dispatch: any) => {
  const transmittalActions = new TransmittalActions(dispatch);
  return {
    dispatch,
    transmittalActions
  };
};


export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(TransmittalListView);
