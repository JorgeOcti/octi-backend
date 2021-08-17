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
import ModalView from "../../Modal/ModalView";
import ApiService from "../../../utils/axios";
import * as moment from "moment";
import Axios from "axios";
import * as swal from "sweetalert";

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<ITransmittalActionTypes>;
  transmittal: ITransmittalState;
  transmittalActions : TransmittalActions
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
    this.exportExcel = this.exportExcel.bind(this);
    this.changePage = this.changePage.bind(this);
  }

  public componentWillMount(): void {
    const {orderBy, orderType} = this.props.transmittal.options;
    const {page} = this.props.transmittal.pagination;
    const {transmittalActions} = this.props;
    window.scrollTo(0, 0);
    transmittalActions.getFormBaseData();
    transmittalActions.getTransmittalsThunkAction(page, orderBy, orderType);

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
        room: `transmittal-list-${window.user.team._id}`
      });
    });

    this.socket.on('CREATE_TRANSMITTAL_ITEM', (data: any): void => {
      transmittalActions.createTransmittalItemAction(data.transmittalItem);
      const $item = $(`#transmittal-item-${data.transmittalItem._id}`);
      if ($item) {
        $item.addClass('bg-green-active');
      }
      setTimeout(() => {
        $item.removeClass('bg-green-active');
      }, 300);
    });

    this.socket.on('UPDATE_TRANSMITTAL_ITEM', (data: any): void => {
      transmittalActions.updateTransmittalItemAction(data.transmittalItem);
      const $item = $(`#transmittal-item-${data.transmittalItem._id}`);
      if ($item) {
        $item.addClass('bg-aqua-active');
        setTimeout(() => {
          $item.removeClass('bg-aqua-active');
        }, 300);
      }
    });

    this.socket.on('UPDATE_TRANSMITTAL', (data: any): void => {
      transmittalActions.updateTransmittalAction(data.transmittal);
      const $item = $(`#transmittal-${data.transmittal._id}`);
      if ($item) {
        $item.addClass('bg-aqua-active');
        setTimeout(() => {
          $item.removeClass('bg-aqua-active');
        }, 300);
      }
    });

    this.socket.on('DELETE_TRANSMITTAL_ITEM', (data: any): void => {
      const $item = $(`#transmittal-item-${data.transmittalItem._id}`);
      if ($item) {
        $item.addClass('bg-red-active');
      }
      setTimeout(() => {
        transmittalActions.deleteTransmittalItemAction(data.transmittalItem);
      }, 300);
    });

    this.socket.on('DELETE_TRANSMITTAL', (data: any): void => {
      const $item = $(`#transmittal-${data.transmittal._id}`);
      if ($item) {
        $item.addClass('bg-red-active');
      }
      setTimeout(() => {
        transmittalActions.deleteTransmittalAction(data.transmittal);
        const {orderBy, orderType} = this.props.transmittal.options;
        const {page} = this.props.transmittal.pagination;
        transmittalActions.getTransmittalsThunkAction(page, orderBy, orderType, true);
      }, 300);
    });

    this.socket.on('CREATE_TRANSMITTAL', (data: any): void => {
      const {page} = this.props.transmittal.pagination;
      const {orderBy, orderType} = this.props.transmittal.options;
      transmittalActions.getTransmittalsThunkAction(page, orderBy, orderType, true);
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
                  hasPermission(window.user, 'addTransmittal') ?
                    <button className="btn btn-sm btn-success" onClick={this.create}>
                      <i className="fa fa-fw fa-plus" /> Crear orden
                    </button>
                    : null
                }
                <ShowIf condition={data.length > 0}>
                  <button
                    className="btn btn-sm btn-primary hidden-xs"
                    onClick={this.exportExcel}
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
                  <div className="flex-45 col-sm-1 col-xs-1 col-md-1 col-lg-1 center pointer head-sorted"
                       onClick={() => this.changeOrder('_id')}
                  >
                    <strong>ID</strong> <i className={`fa ${orderBy === '_id' ? `${orderType === 'descending' ? 'fa-sort-down' : 'fa-sort-up'}` : 'fa-sort'}`} />
                  </div>
                  <div className="flex-45 col-sm-1 col-xs-1 col-md-1 col-lg-1">
                    <strong>Placa</strong>
                  </div>
                  <div className="flex-45 col-sm-2 col-xs-2 col-md-2 col-lg-2">
                    <strong>Chófer</strong>
                  </div>
                  <div className="flex-45 col-sm-2 col-xs-2 col-md-2 col-lg-2">
                    <strong>Transportista</strong>
                  </div>
                  <div className="flex-45 col-sm-2 col-xs-2 col-md-2 col-lg-2">
                    <strong>Documentos</strong>
                  </div>
                  <div className="flex-45 col-sm-1 col-xs-1 col-md-1 col-lg-1">
                    <strong>Nº Vehículos</strong>
                  </div>
                  <div className="flex-45 col-sm-3 col-xs-3 col-md-3 col-lg-3" />
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
          <ModalView modalLarge={true}/>
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

  public exportExcel(): void {
    this.trackClick('Exportar');
    this.setState({
      exporing: true
    });
    const api: ApiService = new ApiService();
    const instance = api.getInstance();
    instance.defaults.responseType = 'blob';
    instance
      .get(`/transmittals/export-xls/`)
      .then((response) => {
        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const fileName = `${moment().format('YYYYMMDD')}-distribución.xlsx`;
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
