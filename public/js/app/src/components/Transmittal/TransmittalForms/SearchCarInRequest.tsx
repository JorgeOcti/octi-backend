import * as Raven from 'raven-js';
import * as React from 'react';
import { ErrorInfo } from 'react';
import * as moment from 'moment-timezone';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import TransmittalActions from '../../../actions/transmittal.actions';
import { ITransmittalActionTypes, ITransmittalState } from '../../../actions/transmittal.types';
import { Dispatch } from 'redux';
import { FieldArrayFieldsProps } from 'redux-form/lib/FieldArray';
import Paginator from '../../Utils/Paginator';
import { IRequestItem } from '../../../../../../../src/request/interfaces/requestItem.interface';
import { debounce } from 'throttle-debounce';
import { IUser } from '../../../../../../../src/app/interfaces/user.interface';
import * as io from 'socket.io-client';
import { IWindow } from '../../../interfaces/window';


interface IExternarlPropsType {
  fields?: FieldArrayFieldsProps<any>;
  slimView?: boolean;

  onClick(item: IRequestItem): void;
}

interface IPropsType extends RouteComponentProps<{}>, IExternarlPropsType {
  dispatch: Dispatch<ITransmittalActionTypes>;
  transmittal: ITransmittalState;
  transmittalActions: TransmittalActions;
}

interface IStateType {
  error: Error | null;
}

declare let window: IWindow;

class SearchCarInRequests extends React.Component<IPropsType, IStateType> {

  readonly state = {
    error: null
  };

  private socket: SocketIOClient.Socket;

  constructor(props: IPropsType) {
    super(props);
    this.changePage = this.changePage.bind(this);
    this.getRequestItemDebounced = debounce(800, this.getRequestItemDebounced.bind(this));
  }

  public componentWillMount(): void {
    this.props.transmittalActions.getRequestItemThunkAction(1);

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

    this.socket.on('CREATE_TRANSMITTAL_ITEM', (): void => {
      const { requestItemsPagination } = this.props.transmittal;
      this.props.transmittalActions.getRequestItemThunkAction(requestItemsPagination.page, true);
    });

    this.socket.on('DELETE_TRANSMITTAL_ITEM', (): void => {
      const { requestItemsPagination } = this.props.transmittal;
      this.props.transmittalActions.getRequestItemThunkAction(requestItemsPagination.page, true);
    });
    this.socket.on('DELETE_TRANSMITTAL', (): void => {
      const { requestItemsPagination } = this.props.transmittal;
      this.props.transmittalActions.getRequestItemThunkAction(requestItemsPagination.page, true);
    });

    this.socket.on('CREATE_TRANSMITTAL', (): void => {
      const { requestItemsPagination } = this.props.transmittal;
      this.props.transmittalActions.getRequestItemThunkAction(requestItemsPagination.page, true);
    });
  }

  public componentWillUnmount(): void {
    //cancel request if component is inmounted
    if (this.props.transmittal.source) {
      this.props.transmittal.source.cancel('Operation canceled by the user.');
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error });
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public render(): React.ReactElement<IPropsType> {
    const { transmittalActions, transmittal, fields, slimView } = this.props;
    const { requestItems, requestItemsfilters, requestItemsPagination, requestItemsLoading } = transmittal;
    const addedItems = fields?.getAll() ? fields.getAll().map(field => field._id) : [];
    return (
      <div className='row'>
        <div className='col-md-12'>
          <div className='table-container-overlay'>
            <div className='row'>
              <div className='col-md-8'>
                <div className='form-group'>
                  <label className='control-label'>
                    Vehículo
                  </label>
                  <input
                    type='text'
                    className='form-control input-sm'
                    placeholder='Busca por VIN, marca, modelo, material o nº de solicitud.'
                    defaultValue={requestItemsfilters.text}
                    onChange={(e) => {
                      transmittalActions.filterRequestItemAction('text', e.target.value);
                      this.getRequestItemDebounced();
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
                    defaultValue={requestItemsfilters.request}
                    onChange={(e) => {
                      transmittalActions.filterRequestItemAction('request', e.target.value);
                      this.getRequestItemDebounced();
                    }}
                  />
                </div>
              </div>
              <div className='col-md-12'>
                <table className='table table-xs table-hover' style={!slimView ? { minWidth: '1000px' } : {}}>
                  <thead>
                  <tr className='bg-primary' style={{ height: '45px' }}>
                    <th className='middle-center' style={{ width: '45px' }}>ID Sol.</th>
                    <th className='middle' style={{ width: '120px' }}>VIN</th>
                    {
                      slimView ?
                        <React.Fragment>
                          <th className='middle'> Vehículo</th>
                        </React.Fragment>
                        : <React.Fragment>
                          <th className='middle'>Marca</th>
                          <th className='middle'>Modelo</th>
                          <th className='middle'>Color</th>
                        </React.Fragment>
                    }
                    <th className='middle' style={{ width: '100px' }}>Partida</th>
                    <th className='middle' style={{ width: '100px' }}>Factura</th>
                    {
                      slimView ?
                        <React.Fragment>
                          <th className='middle' style={{ width: '150px' }}>Solicitante</th>
                        </React.Fragment>
                        : <React.Fragment>
                          <th className='middle' style={{ width: '150px' }}>Solicitante</th>
                          <th className='middle' style={{ width: '100px' }}>Fecha</th>
                        </React.Fragment>
                    }
                    <th className='middle' style={{ width: '28px' }} />
                  </tr>
                  </thead>
                  <tbody>
                  {
                    requestItems
                      .filter(item => !addedItems.includes(item._id))
                      .map((item) => {
                        return (
                          <tr key={item._id}>
                            <td className={`middle-center`}>
                              #{this.padNumber(item.request?.number)}
                            </td>
                            <td className={`middle`}>
                              {item.car?.vin}
                            </td>
                            {
                              slimView ?
                                <React.Fragment>
                                  <td className='middle'>
                                    <strong>{item.car?.brand}</strong> {item.car?.denomination}< br />
                                    {item.car?.color}
                                  </td>
                                </React.Fragment> :
                                <React.Fragment>
                                  <td className={`middle`}>
                                    {item.car?.brand}
                                  </td>
                                  <td className={`middle`}>
                                    {item.car?.denomination}
                                  </td>
                                  <td className={`middle`}>
                                    {item.car?.color}
                                  </td>
                                </React.Fragment>
                            }

                            <td className={`middle`}>
                              {item.car?.entry ?? '-'}
                            </td>
                            <td className={`middle`}>
                              {item.car?.invoice ?? '-'}
                            </td>
                            {
                              slimView ?
                                <React.Fragment>
                                  <td className={`middle`}>
                                    {this.createdBy(item.request?.createdBy) ?? '-'}<br />
                                    {moment(item.request?.createdAt).format('DD/MM/YY') ?? '-'}
                                  </td>
                                </React.Fragment> :
                                <React.Fragment>
                                  <td className={`middle`}>
                                    {this.createdBy(item.request?.createdBy) ?? '-'}
                                  </td>
                                  <td className={`middle`}>
                                    {moment(item.request?.createdAt).format('DD/MM/YY') ?? '-'}
                                  </td>
                                </React.Fragment>
                            }
                            <td className={`middle`}>
                              <a
                                className='btn btn-success btn-xs'
                                href={'javascript:void(0);'}
                                onClick={() => this.props.onClick(item)}
                              >
                                <i className='fa fa-plus' /> Agregar
                              </a>
                            </td>
                          </tr>
                        );
                      })
                  }
                  </tbody>
                </table>
              </div>
            </div>
            {
              requestItemsPagination.pages > 1 &&
              <div className='row'>
                <div className='col-md-6' style={{ padding: '20px 15px' }}>
              <span className='react-bootstrap-table-pagination-total text-ellipsis'>
                &nbsp;&nbsp;Mostrando registros del {(requestItemsPagination.page - 1) * 20 + 1} al {(requestItemsPagination.page) * 20} de {requestItemsPagination.count} registros.
              </span>
                </div>
                <div className='col-md-6'>
                  <div className='text-right' style={{ marginRight: '15px' }}>
                    <Paginator changePage={this.changePage} page={requestItemsPagination.page} pages={requestItemsPagination.pages} />
                  </div>
                </div>
              </div>
            }
          </div>
          {
            requestItemsLoading &&
            <div className='overlay' style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: '100%',
              zIndex: 50,
              background: 'rgba(255,255,255,0.7)'
            }}>
              <i className='fa fa-spinner fa-spin text-purple' style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                marginLeft: '-15px',
                marginTop: '-15px',
                color: '#000',
                fontSize: '30px'
              }} />
            </div>
          }
        </div>
      </div>
    );
  }

  private createdBy(createdBy: IUser): string | null {
    return createdBy ? `${createdBy.firstName} ${createdBy.lastName}` : null;
  }

  private getRequestItemDebounced() {
    this.props.transmittalActions.getRequestItemThunkAction(1, false);
  }

  private changePage(page: number): void {
    // window.scrollTo(0, 0);
    this.props.transmittalActions.getRequestItemThunkAction(page);
  }

  private padNumber(n: number): string {
    const s = '000' + n;
    return s.substr(s.length - 4);
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


export default connect<{}, {}, IExternarlPropsType | any>(mapStateToProps, mapDispatchToProps)(SearchCarInRequests);
