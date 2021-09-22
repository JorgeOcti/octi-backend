import Axios from 'axios';
import * as moment from 'moment';
import * as React from 'react';
import { Dispatch, Fragment } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import * as swal from 'sweetalert';
import { debounce } from 'throttle-debounce';
import {
  IRequestItem
} from '../../../../../../../src/request/interfaces/requestItem.interface';
import {
  changeFilterRequestAction,
  createRequestItemAction,
  deleteRequestItemAction,
  getRequestItemsThunkAction,
  updateRequestItemAction
} from '../../../actions/requestItems.actions';
import { IRequestItemsFilters, IRequestItemsState, RequestItemsReduxActions } from '../../../actions/requestItems.types';
import AppContainer from '../../../container/AppContainer';
import { IWindow } from '../../../interfaces/window';
import ApiService from '../../../utils/axios';
import { hasPermission } from '../../../utils/common';
import BootstrapSelect from '../../Utils/BootstrapSelect';
import DateRangePicker from '../../Utils/DateRangePicker';
import ImageLazyLoad from '../../Utils/ImageLazyLoad';
import Paginator from '../../Utils/Paginator';
import ShowIf from '../../Utils/ShowIf';
import TrackingBasePage from '../../Utils/TrackingBasePage';
import RequestVehicleItem from './RequestVehicleItem';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  requestItems: IRequestItemsState;
  dispatch: Dispatch<RequestItemsReduxActions>;
  updateRequestItemAction: (item: IRequestItem) => void;
  getRequestItemsThunkAction: (page: number, orderBy: string, orderType: string, hideLoading?: boolean) => void;
  deleteRequestItemAction: (item: IRequestItem) => void;
  createRequestItemAction: (item: IRequestItem) => void;
  changeFilterRequestAction: (key: keyof IRequestItemsFilters, value: any | any[]) => void;
}

interface IStateType {
  error: Error | null;
  exporing: boolean;
}

declare let window: IWindow;

class RequestVehicleListView extends TrackingBasePage<IPropsType, IStateType> {
  title: string;

  private socket: SocketIOClient.Socket;

  readonly state = {
    error: null,
    exporing: false
  };

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Solicitudes';
    this.changePage = this.changePage.bind(this);
    this.changeOrder = this.changeOrder.bind(this);
    this.changeFilterDebounced = debounce(200, this.changeFilterDebounced.bind(this));
    this.changeFilter = this.changeFilter.bind(this);
    this.exportExcel = this.exportExcel.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.import = this.import.bind(this);
  }

  componentDidMount() {
    super.componentDidMount();
  }

  public componentWillMount(): void {
    const { orderBy, orderType } = this.props.requestItems.options;
    const { page } = this.props.requestItems.pagination;
    window.scrollTo(0, 0);

    this.props.getRequestItemsThunkAction(page, orderBy, orderType);

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
      this.socket.emit('join', { room: `request-list-${window.user.team._id}` });
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

    this.socket.on('CREATE_REQUEST', (data: any): void => {
      const { page } = this.props.requestItems.pagination;
      const { orderBy, orderType } = this.props.requestItems.options;
      if (page === 1) {
        for (const item of data.request.items) {
          if (window.user.venuesAccess.includes(item.destination._id)) {
            this.props.createRequestItemAction(item);
            const $item = $(`#request-item-${item._id}`);
            if ($item) {
              $item.addClass('bg-green-active');
            }
            setTimeout(() => {
              $item.removeClass('bg-green-active');
            }, 300);
          }
        }
      } else {
        this.props.getRequestItemsThunkAction(page, orderBy, orderType, true);
      }
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

  public componentWillUnmount(): void {
    // cancel request if component is inmounted
    if (this.props.requestItems.source) {
      this.props.requestItems.source.cancel('Operation canceled by the user.');
    }
    this.socket.emit('leave', { room: `request-list-${window.user.team._id}` });
    this.socket.disconnect();
  }

  public render(): React.ReactElement<IPropsType> {
    const {
      pagination, loading, requestItems, requestItemStatus, venues, filters, properties, requestSettings
    } = this.props.requestItems;
    const { orderBy, orderType } = this.props.requestItems.options;
    const { exporing } = this.state;
    return (
      <AppContainer title='' cMenu='3' cSubMenu='3.2'>
        <section className='content'>
          <div className='box'>
            <div className='box-header with-border'>
              <h3 className='box-title'>Vehículos <small>{pagination.count}</small></h3>
              <div className='pull-right box-tools'>
                <ShowIf condition={hasPermission(window.user, 'updateMassiveRequest')}>
                  <button
                    className='btn btn-sm btn-success'
                    onClick={this.update}
                  >
                    <i className='fa fa-fw fa-plus' /> Actualizador
                  </button>
                </ShowIf>
                <ShowIf condition={hasPermission(window.user, 'importRequest')}>
                  <button
                    style={{ marginLeft: '5px' }}
                    className='btn btn-sm btn-success'
                    onClick={this.import}
                  >
                    <i className='fa fa-fw fa-plus' /> Importar
                  </button>
                </ShowIf>
                <ShowIf condition={hasPermission(window.user, 'createRequest')}>
                  <button
                    className='btn btn-sm btn-success'
                    onClick={this.create}
                    style={{ marginLeft: '5px' }}
                  >
                    <i className='fa fa-fw fa-plus' /> Crear solicitud
                  </button>
                </ShowIf>
                <ShowIf condition={requestItems.length > 0}>
                  <button
                    className='btn btn-sm btn-primary hidden-xs'
                    onClick={this.exportExcel}
                    disabled={exporing}
                    style={{ marginLeft: '5px' }}
                  >
                    {
                      exporing ?
                        <Fragment><i className='fa fa-spin fa-spinner' /> Exportando</Fragment> :
                        <Fragment><i className='fa fa-fw fa-download' /> Exportar</Fragment>
                    }
                  </button>
                </ShowIf>
              </div>
            </div>
            <div className='box-body no-padding'>
              <div style={{ padding: '10px 0' }}>
                <div className='row' style={{ margin: 0 }}>
                  <div className='col-md-8'>
                    <div className='form-group'>
                      <label className='control-label'>
                        Vehículo
                      </label>
                      <input
                        type='text'
                        className='form-control input-sm'
                        placeholder='Busca por VIN, marca, modelo, material o nº de solicitud.'
                        defaultValue={filters.text}
                        onChange={(e) => {
                          this.changeFilterDebounced('text', e.target.value);
                        }}
                      />
                    </div>
                  </div>
                  <div className='col-md-4'>
                    <div className='form-group'>
                      <label className='control-label'>
                        Nº Solicitudes
                      </label>
                      <input
                        type='text'
                        className='form-control input-sm'
                        placeholder='Nº de solicitudes ejemplo: 2, 8, 10'
                        defaultValue={filters.request}
                        onChange={(e) => {
                          this.changeFilterDebounced('request', e.target.value);
                        }}
                      />
                    </div>
                  </div>
                  <div className='col-md-3'>
                    <div className='form-group'>
                      <label htmlFor='venues' className='control-label'>Propiedad</label>
                      <BootstrapSelect
                        noneSelectedText='Todas'
                        search={true}
                        displayItems={2}
                        selectedText='propiedades seleccionadas.'
                        selected={filters.properties}
                        sm={true}
                        allOption={true}
                        selectAll={
                          (all: boolean) => {
                            if (all) {
                              this.changeFilter('properties', properties.map((property) => property._id));
                            } else {
                              this.changeFilter('properties', []);
                            }
                          }
                        }
                        options={properties.map((property) => ({
                          value: property._id,
                          text: property.name
                        }))}
                        onClick={(selected: any) => {
                          if (filters.properties.includes(selected)) {
                            this.changeFilter('properties', [...filters.properties.filter((property) => property !== selected)]);
                          } else {
                            this.changeFilter('properties', [...filters.properties, selected]);
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className='col-md-3'>
                    <div className='form-group'>
                      <label htmlFor='venues' className='control-label'>Sucursales</label>
                      <BootstrapSelect
                        noneSelectedText='Todas'
                        search={true}
                        displayItems={2}
                        selectedText='sucursales seleccionadas.'
                        selected={filters.venues}
                        sm={true}
                        allOption={true}
                        selectAll={
                          (all: boolean) => {
                            if (all) {
                              this.changeFilter('venues', venues.map((venue) => venue._id));
                            } else {
                              this.changeFilter('venues', []);
                            }
                          }
                        }
                        options={venues.map((venue) => ({
                          value: venue._id,
                          text: venue.name
                        }))}
                        onClick={(selected: any) => {
                          if (filters.venues.includes(selected)) {
                            this.changeFilter('venues', [...filters.venues.filter((venue) => venue !== selected)]);
                          } else {
                            this.changeFilter('venues', [...filters.venues, selected]);
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className='col-md-3'>
                    <div className='form-group'>
                      <label htmlFor='venues' className='control-label'>Estados</label>
                      <BootstrapSelect
                        noneSelectedText='Todos'
                        displayItems={2}
                        selectedText='estados seleccionados.'
                        selected={filters.status}
                        sm={true}
                        allOption={true}
                        selectAll={
                          (all: boolean) => {
                            if (all) {
                              this.changeFilter('status', requestItemStatus.map((status) => status._id));
                            } else {
                              this.changeFilter('status', []);
                            }
                          }
                        }
                        options={requestItemStatus.map((status) => ({
                          value: status._id,
                          text: status.name
                        }))}
                        onClick={(selected: any) => {
                          if (filters.status.includes(selected)) {
                            this.changeFilter('status', [...filters.status.filter((status) => status !== selected)]);
                          } else {
                            this.changeFilter('status', [...filters.status, selected]);
                          }
                        }}
                      />
                    </div>
                  </div>
                  {
                    /* <div className="col-md-3">
                    <div className="form-group">
                      <label htmlFor="venues" className="control-label">Marcas</label>
                      <BootstrapSelect
                        noneSelectedText="Todas"
                        search={true}
                        displayItems={2}
                        selectedText="marcas seleccionadas."
                        selected={[]}
                        allOption={true}
                        selectAll={[]}
                        options={[]}
                        onClick={() => { }}
                      />
                    </div>
                  </div> */
                  }
                  <div className='col-md-3'>
                    <div className='row'>
                      <div className='col-md-6'>
                        <div className='form-group'>
                          <label htmlFor='venues' className='control-label'>Desde</label>
                          <DateRangePicker
                            value={filters.from}
                            className={'input-sm'}
                            onChange={(e) => {
                              this.changeFilter('from', e);
                            }}
                          />
                        </div>
                      </div>
                      <div className='col-md-6'>
                        <div className='form-group'>
                          <label htmlFor='venues' className='control-label'>Hasta</label>
                          <DateRangePicker
                            value={filters.to}
                            className={'input-sm'}
                            onChange={(e) => {
                              this.changeFilter('to', e);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <ShowIf condition={requestItems.length > 0}>
                <div className='table-responsive'>
                  <table className='table table-xs table-hover' style={{ minWidth: '1000px' }}>
                    <thead>
                    <tr className='bg-primary' style={{ height: '45px' }}>
                      <th className='middle' style={{ width: '28px' }} />
                      <th
                        className='middle pointer'
                        style={{ width: '80px' }}
                        onClick={() => this.changeOrder('request.number')}
                      >
                        Solicitud
                        <span style={{ float: 'right' }}><i
                          className={`fa fa-fw ${orderBy === 'request.number' ? `${orderType === 'descending' ? 'fa-sort-down' : 'fa-sort-up'}` : 'fa-sort'}`} /></span>
                      </th>
                      <th
                        className='middle pointer'
                        style={{ width: '80px' }}
                        onClick={() => this.changeOrder('origin.name')}
                      >
                        Creada
                        <span style={{ float: 'right' }}><i
                          className={`fa fa-fw ${orderBy === 'origin.name' ? `${orderType === 'descending' ? 'fa-sort-down' : 'fa-sort-up'}` : 'fa-sort'}`} /></span>
                      </th>
                      <th
                        className='middle pointer'
                        style={{ width: '80px' }}
                        onClick={() => this.changeOrder('destination.name')}
                      >
                        Destino
                        <span style={{ float: 'right' }}><i
                          className={`fa fa-fw ${orderBy === 'destination.name' ? `${orderType === 'descending' ? 'fa-sort-down' : 'fa-sort-up'}` : 'fa-sort'}`} /></span>
                      </th>
                      <th
                        className='middle pointer'
                        // style={{ width: '100px' }}
                        onClick={() => this.changeOrder('car.property')}
                      >
                        Prop.
                        <span style={{ float: 'right' }}><i
                          className={`fa fa-fw ${orderBy === 'car.property' ? `${orderType === 'descending' ? 'fa-sort-down' : 'fa-sort-up'}` : 'fa-sort'}`} /></span>
                      </th>
                      <th
                        className='middle pointer'
                        style={{ minWidth: '100px', maxWidth: '120px' }}
                        onClick={() => this.changeOrder('car.brand')}
                      >
                        Marca
                        <span style={{ float: 'right' }}><i
                          className={`fa fa-fw ${orderBy === 'car.brand' ? `${orderType === 'descending' ? 'fa-sort-down' : 'fa-sort-up'}` : 'fa-sort'}`} /></span>
                      </th>
                      <ShowIf condition={requestSettings.denomination}>
                        <th
                          className='middle pointer'
                          style={{ minWidth: '120px' }}
                          onClick={() => this.changeOrder('car.denomination')}
                        >
                          Modelo
                          <span style={{ float: 'right' }}><i
                            className={`fa fa-fw ${orderBy === 'car.denomination' ? `${orderType === 'descending' ? 'fa-sort-down' : 'fa-sort-up'}` : 'fa-sort'}`} /></span>
                        </th>
                      </ShowIf>
                      <ShowIf condition={requestSettings.material}>
                        <th
                          className='middle pointer'
                          style={{ width: '70px' }}
                          onClick={() => this.changeOrder('car.material')}
                        >
                          Material
                          <span style={{ float: 'right' }}><i
                            className={`fa fa-fw ${orderBy === 'car.material' ? `${orderType === 'descending' ? 'fa-sort-down' : 'fa-sort-up'}` : 'fa-sort'}`} /></span>
                        </th>
                      </ShowIf>
                      <ShowIf condition={requestSettings.color}>
                        <th className='middle' style={{ minWidth: '80px' }}>Color</th>
                      </ShowIf>
                      <th
                        className='middle pointer'
                        style={{ minWidth: '120px', maxWidth: '160px' }}
                        onClick={() => this.changeOrder('status.weigth')}
                      >
                        Estado
                        <span style={{ float: 'right' }}><i
                          className={`fa fa-fw ${orderBy === 'status.weigth' ? `${orderType === 'descending' ? 'fa-sort-down' : 'fa-sort-up'}` : 'fa-sort'}`} /></span>
                      </th>
                      <th className='middle' style={{ width: '150px' }}>VIN</th>
                      <ShowIf condition={requestSettings.internalNumber}>
                        <th className='middle' style={{ width: '60px' }}>CDO</th>
                      </ShowIf>
                      <th
                        className='middle pointer'
                        style={{ minWidth: '100px' }}
                        onClick={() => this.changeOrder('reason.name')}
                      >
                        Motivo
                        <span style={{ float: 'right' }}><i
                          className={`fa fa-fw ${orderBy === 'reason.name' ? `${orderType === 'descending' ? 'fa-sort-down' : 'fa-sort-up'}` : 'fa-sort'}`} /></span>
                      </th>
                      {/* <th className="middle">Carrocería</th>
                        <th className="middle">Pre-Entrega</th> */}
                      <th className='middle-center' style={{ width: '40px' }}>Adj</th>
                      <th className='middle-center' style={{ width: '20px' }}>Obs</th>
                      {/* <th
                          className="middle pointer"
                          style={{ width: '100px' }}
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
                        </th> */}
                      <ShowIf condition={hasPermission(window.user, 'deleteRequest')}>
                        <th className='middle' style={{ width: '30px' }} />
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
                </div>
              </ShowIf>
              <ShowIf condition={!loading && requestItems.length === 0}>
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
                          <span className='react-bootstrap-table-pagination-total text-ellipsis'>
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
            <ShowIf condition={loading}>
              <div className='overlay'>
                <i className='fa fa-spinner fa-spin text-purple' />
              </div>
            </ShowIf>
          </div>
        </section>
      </AppContainer>
    );
  }

  private create(): void {
    this.props.history.push('/requests/vehicles/create/');
  }

  private update() {
    this.props.history.push('/requests/update/');
  }

  private import() {
    this.props.history.push('/requests/import/');
  }

  private changeFilterDebounced(key: keyof IRequestItemsFilters, value: any | any[]): void {
    this.changeFilter(key, value);
  }

  private changeFilter(key: keyof IRequestItemsFilters, value: any | any[]): void {
    const { orderBy, orderType } = this.props.requestItems.options;
    this.props.changeFilterRequestAction(key, value);
    this.props.getRequestItemsThunkAction(1, orderBy, orderType, true);
  }

  private changeOrder(key: string) {
    const { page } = this.props.requestItems.pagination;
    const { orderBy, orderType } = this.props.requestItems.options;
    let newOrderType = orderType;
    let newOrderBy = orderBy;
    if (key === orderBy) {
      newOrderType = orderType === 'descending' ? 'ascending' : 'descending';
    } else {
      newOrderBy = key;
    }
    this.props.getRequestItemsThunkAction(page, newOrderBy, newOrderType, true);
  }

  private changePage(page: number): void {
    window.scrollTo(0, 0);
    const { orderBy, orderType } = this.props.requestItems.options;
    this.props.getRequestItemsThunkAction(page, orderBy, orderType);
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
    getRequestItemsThunkAction: (page: number, orderBy: string, orderType: string, hideLoading?: boolean) => dispatch(getRequestItemsThunkAction(page, orderBy, orderType, hideLoading)),
    createRequestItemAction: (item: IRequestItem) => dispatch(createRequestItemAction(item)),
    updateRequestItemAction: (item: IRequestItem) => dispatch(updateRequestItemAction(item)),
    deleteRequestItemAction: (item: IRequestItem) => dispatch(deleteRequestItemAction(item)),
    changeFilterRequestAction: (key: keyof IRequestItemsFilters, value: any | any[]) => dispatch(changeFilterRequestAction(key, value))
  };
};


export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(RequestVehicleListView);
