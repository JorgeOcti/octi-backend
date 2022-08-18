import * as Raven from 'raven-js';
import * as React from 'react';
import { ErrorInfo, Fragment } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { io } from 'socket.io-client';
import { Socket } from 'socket.io-client/build/esm/socket';
import AppContainer from '../../../container/AppContainer';
import { IWindow } from '../../../interfaces/window';
import { hasPermission, parseReplicableURL } from '../../../utils/common';
import ImageLazyLoad from '../../Utils/ImageLazyLoad';
import Paginator from '../../Utils/Paginator';
import ShowIf from '../../Utils/ShowIf';
import TrackingBasePage from '../../Utils/TrackingBasePage';
import TransmittalActions from '../../../actions/transmittal.actions';
import { ITransmittalActionTypes, ITransmittalState } from '../../../actions/transmittal.types';
import TransmitalListDetail from './TransmitalListDetail';
import { Dispatch } from 'redux';
import ModalView from '../../Modal/ModalView';
import { debounce } from 'throttle-debounce';
import { IMilestone } from '../../../../../../../src/distribution/interfaces';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  router: any;
  dispatch: Dispatch<ITransmittalActionTypes>;
  transmittal: ITransmittalState;
  transmittalActions: TransmittalActions;
}

interface IStateType {
  error: Error | null;
  exporing: boolean;
  number: string | undefined;
}

declare let window: IWindow;

class TransmittalListView extends TrackingBasePage<IPropsType, IStateType> {
  title: string;

  readonly state = {
    error: null,
    exporing: false,
    number: ""
  };

  private socket: Socket;

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Transporte';
    this.create = this.create.bind(this);
    this.changeOrder = this.changeOrder.bind(this);
    this.exportExcel = this.exportExcel.bind(this);
    this.changePage = this.changePage.bind(this);
    this.changeNumber = this.changeNumber.bind(this);
    this.callChangeNumber = debounce(1000, this.callChangeNumber.bind(this));
  }

  public render(): React.ReactElement<IPropsType> {
    const {
      pagination, loading, data, options: { orderBy, orderType }, milestones, milestoneTypes
    } = this.props.transmittal;

    let longestMilestones: IMilestone[] = [];

    for (let mType of milestoneTypes) {
      let tmp = milestones
        .filter(m => m.type === mType._id && m.step === 'loadEvidence');
      if (tmp.length > longestMilestones.length)
        longestMilestones = tmp.sort((a, b) => a.order - b.order);
    }

    const { exporing, number } = this.state;
    return (
      <AppContainer title={''
        /*<div
          className='input-group input-group-sm'
          style={{ width: '80%' }}
        >
          <input
            type='text'
            className='form-control pull-right'
            onChange={(e) => {
              this.changeNumber(e.target.value);
            }}
            value={number}
            placeholder='Buscar OT por número ej: 1686' />
          <div className='input-group-btn'>
            <button
              className={`btn ${!!this.state.number?.length ? 'btn-primary' : 'btn-default'}`}
              onClick={!!this.state.number?.length ? () => {
                this.props.history.replace(`/transmittals/`);
                this.changeNumber('');
              }: undefined}
            >
              <ShowIf condition={!!this.state.number?.length} alternative={<i className='fa fa-search' />}>
                <i className='fa fa-close' />
              </ShowIf>
            </button>
          </div>
        </div>*/
      } cMenu='3' cSubMenu='3.4'>
        <section className='content'>
          <div className='box'>
            <div className='box-header with-border'>
              <h3 className='box-title'>Transportes <small>{pagination.count}</small></h3>
              <div className='pull-right box-tools'>
                {
                  hasPermission(window.user, 'addTransmittal') ?
                    <button className='btn btn-sm btn-success' onClick={this.create}>
                      <i className='fa fa-fw fa-plus' /> Crear orden de transporte
                    </button>
                    : null
                }
                <ShowIf condition={data.length > 0}>
                  <button
                    className='btn btn-sm btn-primary hidden-xs'
                    onClick={this.exportExcel}
                    disabled={exporing}
                    style={{ marginLeft: '5px' }}
                  >
                    {
                      exporing ? <Fragment><i className='fa fa-spin fa-spinner' /> Exportando</Fragment>
                        : <Fragment><i className='fa fa-fw fa-download' /> Exportar</Fragment>
                    }
                  </button>
                </ShowIf>
              </div>
            </div>
            <div className={`box-body transmittal-list no-padding`}>
              <div style={{padding: '10px'}}>
                <div className='row'>
                <div className='col-md-12'>
                  <div
                    className='input-group input-group-sm'
                  >
                    <input
                      type='text'
                      className='form-control pull-right'
                      onChange={(e) => {
                        this.changeNumber(e.target.value);
                      }}
                      value={number}
                      placeholder='Buscar OT por número ej: 1686' />
                    <div className='input-group-btn'>
                      <button
                        className={`btn ${!!this.state.number?.length ? 'btn-primary' : 'btn-default'}`}
                        onClick={!!this.state.number?.length ? () => {
                          this.props.history.replace(`/transmittals/`);
                          this.changeNumber('');
                        } : undefined}
                      >
                        <ShowIf condition={!!this.state.number?.length} alternative={<i className='fa fa-search' />}>
                          <i className='fa fa-close' />
                        </ShowIf>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              </div>
              <div className='table-responsive'>
                <ShowIf condition={data.length > 0}>
                  <>
                    <div className='row transmittal bg-primary'>
                      <div
                        className='flex-45 col-sm-1 col-xs-1 col-md-1 col-lg-1 center pointer head-sorted'
                        onClick={() => this.changeOrder('_id')}
                      >
                        <strong>OT Nº</strong> <i
                        className={`fa ${orderBy === '_id' ? `${orderType === 'descending' ? 'fa-sort-down' : 'fa-sort-up'}` : 'fa-sort'}`} />
                      </div>
                      <div className='flex-45 col-sm-1 col-xs-1 col-md-1 col-lg-1'>
                        <strong>Placa</strong>
                      </div>
                      <div className='flex-45 col-sm-1 col-xs-1 col-md-1 col-lg-1'>
                        <strong>Chofer</strong>
                      </div>
                      <div className='flex-45 col-sm-1 col-xs-1 col-md-1 col-lg-1'>
                        <strong>Transportista</strong>
                      </div>
                      <div className='flex-45 col-sm-1 col-xs-1 col-md-1 col-lg-1'>
                        <strong>Carga</strong>
                      </div>
                      <div className='flex-45 col-sm-1 col-xs-1 col-md-1 col-lg-1'>
                        <div className='flex-45 col-sm-8 col-xs-8 col-md-8 col-lg-8'>
                          <strong>Tipo</strong>
                        </div>
                        <div className='flex-45 col-sm-4 col-xs-4 col-md-4 col-lg-4'>
                          <strong>Docs</strong>
                        </div>
                      </div>
                      {
                        longestMilestones.map((milestone: IMilestone, index) => {
                          return (
                              <div
                                className='flex-45 col-sm-1 col-xs-1 col-md-1 col-lg-1 text-center no-padding'
                                key={`${index}${milestone._id}`}>
                              <strong>{milestone.name.replace('Evidencia', '').toUpperCase()}</strong>
                            </div>
                          )
                        })
                      }
                      <div className='flex-45 col-sm-1 col-xs-1 col-md-1 col-lg-1 no-padding'>
                        <strong>FRONTERA</strong>
                      </div>
                      <div className='flex-45 col-sm-1 col-xs-1 col-md-1 col-lg-1 no-padding'>
                        <strong>DESCARGA</strong>
                      </div>
                      <div className='flex-45 col-sm-1 col-xs-1 col-md-1 col-lg-1' />
                    </div>
                    {
                      data.map((item: any, index) => (
                        <TransmitalListDetail
                          router={this.props.router}
                          history={this.props.history}
                          item={item}
                          evidenceMilestones={longestMilestones}
                          key={`${index}${item._id}`}
                        />
                      ))
                    }
                  </>
                </ShowIf>
                <ShowIf condition={!loading && data.length === 0}>
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
            </div>
            {
              pagination.pages > 1 &&
              <div className='box-footer'>
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
              </div>
            }
            {
              data.length === 0 && loading &&
              <div className='overlay'>
                <i className='fa fa-spinner fa-spin text-purple' />
              </div>
            }
          </div>
          <ModalView modalLarge={true} />
        </section>
      </AppContainer>
    );
  }

  public componentWillMount(): void {
    const { orderBy, orderType } = this.props.transmittal.options;
    const { page } = this.props.transmittal.pagination;
    const { location: { query } } = this.props.router;
    const { transmittalActions } = this.props;
    window.scrollTo(0, 0);
    const { number } = query;
    this.setState({ number });
    transmittalActions.getTransmittalsThunkAction({
      nextPage: number ? 1 : page,
      orderBy,
      orderType,
      number
    });
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
        const { orderBy, orderType } = this.props.transmittal.options;
        const { page } = this.props.transmittal.pagination;
        transmittalActions.getTransmittalsThunkAction({ nextPage: page, orderBy, orderType, hideLoading: true });
      }, 300);
    });

    this.socket.on('CREATE_TRANSMITTAL', (): void => {
      const { page } = this.props.transmittal.pagination;
      const { orderBy, orderType } = this.props.transmittal.options;
      transmittalActions.getTransmittalsThunkAction({ nextPage: page, orderBy, orderType, hideLoading: true });
    });

  }

  public componentDidMount(): void {
    super.componentDidMount();
    // window.scrollTo(0, 0);
  }

  public componentDidUpdate(prevProps: IPropsType): void {
    $('[data-toggle="tooltip"]').tooltip();
  }

  public componentWillUnmount(): void {
    // cancel request if component is inmounted
    if (this.props.transmittal.source) {
      this.props.transmittal.source.cancel('Operation canceled by the user.');
    }
    this.socket.emit('leave', { room: `distribution-list-${window.user.team._id}` });
    this.socket.disconnect();
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error });
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  private changeNumber(number: string) {
    this.setState({ number });
    this.callChangeNumber(number);
  }

  private callChangeNumber(number: string) {
    const { options: { orderBy, orderType } } = this.props.transmittal;
    this.props.transmittalActions.getTransmittalsThunkAction({ nextPage: 1, orderBy, orderType, number });
  }

  private changeOrder(key: string) {
    const {
      options: { orderBy, orderType },
      pagination: { page }
    } = this.props.transmittal;
    let newOrderType = orderType;
    let newOrderBy = orderBy;
    if (key === orderBy) {
      newOrderType = orderType === 'descending' ? 'ascending' : 'descending';
    } else {
      newOrderBy = key;
    }
    this.props.transmittalActions.getTransmittalsThunkAction({ nextPage: page, orderBy: newOrderBy, orderType: newOrderType });
  }

  private create(): void {
    this.props.history.push(parseReplicableURL('/transmittals/create/'));
  }

  private changePage(page: number): void {
    const { options: { orderBy, orderType } } = this.props.transmittal;
    this.props.transmittalActions.getTransmittalsThunkAction({ nextPage: page, orderBy, orderType });
  }

  public exportExcel(): void {
    this.trackClick('Exportar');
    window.open(`/transmittals/export-xls/`, '_blank');
    // this.setState({
    //   exporing: true
    // });
    // const api: ApiService = new ApiService();
    // const instance = api.getInstance();
    // instance.defaults.responseType = 'blob';
    // instance
    //   .get(`/transmittals/export-xls/`)
    //   .then((response) => {
    //     const blob = new Blob([response.data], {
    //       type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    //     });
    //     const fileName = `${moment().format('YYYYMMDD')}-distribución.xlsx`;
    //     // if (typeof window.navigator.msSaveBlob !== 'undefined') {
    //     //   // IE workaround for "HTML7007: One or more blob URLs were
    //     //   // revoked by closing the blob for which they were created.
    //     //   // These URLs will no longer resolve as the data backing
    //     //   // the URL has been freed."
    //     //   window.navigator.msSaveBlob(blob, fileName);
    //     // } else {
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
    //     // }
    //   })
    //   .catch((err) => {
    //     this.setState({
    //       exporing: false
    //     });
    //     if (!Axios.isCancel(err)) {
    //       swal!('Exportar usuarios', 'Ha ocurrido un error al general el excel.', 'error');
    //     }
    //   });
  }
}

const mapStateToProps = (state: { transmittal: ITransmittalState, router: any }) => {
  return {
    transmittal: state.transmittal,
    router: state.router
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
