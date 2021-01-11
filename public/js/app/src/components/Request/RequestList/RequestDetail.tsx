import * as moment from 'moment-timezone';
import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { ICarrier } from '../../../../../../../src/interfaces/carrier.interface';
import { IReason } from '../../../../../../../src/interfaces/reason.interface';
import { IRequest } from '../../../../../../../src/interfaces/request.interface';
import { IRequestItem } from '../../../../../../../src/interfaces/requestItem.interface';
import { IRequestItemStatus } from '../../../../../../../src/interfaces/requestItemStatus.interface';
import { tabStatusAction, updateRequestItemInListThunkAction } from '../../../actions/requests.actions';
import { IRequestsState } from '../../../actions/requests.types';
import { IWindow } from '../../../interfaces/window';
import { hasPermission } from '../../../utils/common';
import DateRangePicker from '../../Utils/DateRangePicker';

declare let window: IWindow;

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  requests: IRequestsState;
  key: any;
  request: IRequest;
  reasons: IReason[];
  carriers: ICarrier[];
  requestItemStatus: IRequestItemStatus[];
  updateRequestItemInListReduxAction: (idRequest: string, item: IRequestItem) => void;
  tabStatusAction: (request: string) => void;
}

interface IStateType {
  error: Error | null;
}

const getColorForPercentage = (value: number): string => {
  if(value < 40){
    return '#00c0ef';
  } else if (value <60){
    return '#f39c12';
  } else {
    return '#00a65a';
  }
};

class RequestListDetail extends React.Component<IPropsType, IStateType> {

  readonly state = {
    error: null,
    open: false
  };

  constructor(props: IPropsType) {
    super(props);
    this.goToDetail = this.goToDetail.bind(this);
  }

  public render(): React.ReactElement<IPropsType> {
    const {requests, request, reasons, requestItemStatus, carriers} = this.props;
    const open = this.props.requests.requestOpen.includes(request._id);
    const canChangeRequest = hasPermission(window.user, 'changeRequest');
    return (
      <React.Fragment>
        <div id={`request-${request._id}`} className="row request bg-request-title background-transition">
          <div
            className="col-sm-1 col-xs-1 col-md-1 col-lg-1 pointer center"
            onClick={() => this.goToDetail(request._id)}
          >
            {/* <i className="fa fa-circle status-circle-red" /> */}
            <strong className="text-underline">
              #{this.padNumber(request.number)}
            </strong>&nbsp;
            <i className="fa fa-share-square-o" style={{fontSize: '10px'}}/>
          </div>
          <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1">
            {
              request.fleet ?
                <i className="fa fa-check-circle-o text-green" />
                : null
            }
          </div>
          <div className="col-sm-2 col-xs-2 col-md-2 col-lg-2">{request.sellerText?.length ? request.sellerText : '-'}</div>
          <div className="col-sm-2 col-xs-2 col-md-2 col-lg-2">{request.destination.name}</div>
          <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1">
            {request.items.length}
          </div>
          <div className="col-sm-2 col-xs-2 col-md-2 col-lg-2">
            {moment(request.createdAt).format('DD-MM-YY')}
          </div>
          <div className="col-sm-2 col-xs-2 col-md-2 col-lg-2">
            {moment(request.updatedAt).format('DD-MM-YY')}
          </div>
          {/* <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1 center"> */}
            {/* 10 */}
          {/* </div> */}
          <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1 chevron pointer" onClick={() => this.props.tabStatusAction(request._id)}>
            {
              open ? <i className="fa fa-chevron-up" /> : <i className="fa fa-chevron-down" />
            }
          </div>
        </div>
        <div className="table-request" style={{display: open ? 'block' : 'none'}}>
          <table className="table table-hover">
            <thead>
              <tr style={{ backgroundColor: '#f9f9f9' }}>
                <th className="middle" style={{ width: '28px' }} />
                <th className="middle" >Progreso</th>
                <th className="middle" style={{ width: '150px' }}>Estado</th>
                <th className="middle" style={{ width: '250px' }}>Modelo</th>
                <th className="middle" style={{ width: '100px' }}>Color</th>
                <th className="middle-center">VIN</th>
                <th className="middle-center">CDO</th>
                <th className="middle">Adj</th>
                <th className="middle">Obs</th>
                {/* <th className="middle-center">Equip. / Carroc. / Preentrega</th> */}
                <th className="middle"  style={{ width: '100px' }}>Motivo</th>
                <th className="middle" >Transporte</th>
                <th  className="middle" style={{ width: '70px' }}>Fecha carga</th>
                <th className="middle"  style={{ width: '70px' }}>Fecha llegada</th>
              </tr>
            </thead>
            <tbody>
              {
                request.items.map((item: any) => (
                  <tr key={item._id} id={`request-item-${item._id}`} className={'background-transition'}>
                    <td className="middle-center">
                      {item.priority ?
                        <i className="fa fa-star text-yellow" />
                        : null}
                    </td>
                    <td className="middle">
                      <div className="progress progress-xs">
                        <div
                          className={`progress-bar progress-bar-aqua`}
                          style={{ width: `${(item.status?.weigth ?? 0)}%`, backgroundColor: getColorForPercentage(100 / requests.requestItemStatusMax * (item.status?.weigth ?? 0)) }}
                        />
                      </div>
                    </td>
                    {
                      canChangeRequest ?
                        <td className="middle">
                          <select className="form-control select-sm font-12" value={item.status?._id ?? ''}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                              this.props.updateRequestItemInListReduxAction!(request._id, {
                                ...item,
                                status: e.target.value
                              });
                            }}
                          >
                            <option value="" disabled={true}>-</option>
                            {
                              requestItemStatus.map((req) => (
                                <option key={req._id} value={req._id}>{req.name}</option>
                              ))
                            }

                          </select>
                        </td> :
                        <td className="middle">{item.status?.name}</td>
                    }
                    <td className="middle">
                      {`${item.car.brand} ${item.car.denomination} ${item.car.material}`}
                    </td>
                    <td className="middle">
                      {item.car.color}
                    </td>
                    <td className="middle-center">
                      {
                        item.car.vin && item.car.vin.length ?
                          <i className="fa fa-check-circle text-olive" />
                          : null
                      }
                    </td>
                    <td className="middle-center">
                      {
                        item.car.internalNumber && item.car.internalNumber.length ?
                          <i className="fa fa-check-circle text-olive" />
                          : null
                      }
                    </td>
                    <td className="middle-center">
                      {
                        item.files && item.files.length ?
                          <i
                            className="fa fa-paperclip"
                            data-toggle="tooltip"
                            data-placement="top"
                            title={`${item.files.length} archivos adjuntos.`}
                          /> : null
                      }
                    </td>
                    <td className="middle-center">
                      {
                        item.observation && item.observation.length ?
                          <i
                            className="fa fa-comment"
                            data-toggle="tooltip"
                            data-placement="top"
                            title={item.observation}
                          /> : null
                      }
                    </td>
                    {/* <td className="middle">
                      <div className="flex-wrap">
                        <div
                          className={`flex-wrap-item-center ${item.equipment ? '' : 'text-gray'}`}
                          data-toggle="tooltip"
                          data-placement="top"
                          title="Accesorización"
                        >
                          <i className="material-icons">library_add</i>
                        </div>
                        <div
                          className={`flex-wrap-item-center ${item.body ? '' : 'text-gray'}`}
                          data-toggle="tooltip"
                          data-placement="top"
                          title="Carrocero"
                        >
                          <i className="material-icons">rv_hookup</i>
                        </div>
                        <div
                          className={`flex-wrap-item-center ${item.washed ? '' : 'text-gray'}`}
                          data-toggle="tooltip"
                          data-placement="top"
                          title="Pre-Lavado"
                        >
                          <i className="material-icons">local_car_wash</i>
                        </div>
                        <div
                          className={`flex-wrap-item-center ${item.review ? '' : 'text-gray'}`}
                          data-toggle="tooltip"
                          data-placement="top"
                          title="Inspección Pre-entrega"
                        >
                          <i className="material-icons">build</i>
                        </div>
                      </div>
                    </td> */}
                    {
                      canChangeRequest ?
                        <td className="middle">
                          <select
                            className="form-control select-sm font-12" value={item.reason?._id ?? ''}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                              this.props.updateRequestItemInListReduxAction!(request._id, {
                                ...item,
                                reason: e.target.value
                              });
                            }}
                          >
                            <option value="" disabled={true}>-</option>
                            {
                              reasons.map((reason) => (
                                <option key={reason._id} value={reason._id}>{reason.name}</option>
                              ))
                            }
                          </select>
                        </td> :
                        <td className="middle">{item.reason?.name}</td>
                    }
                    {
                      canChangeRequest ?
                        <td className="middle">
                          <select className="form-control select-sm font-12" value={item.carrier?._id ?? ''}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                              this.props.updateRequestItemInListReduxAction!(request._id, {
                                ...item,
                                carrier: !e.target.value.length ? null : e.target.value
                              });
                            }}
                          >
                            <option value="">-</option>
                            {
                              carriers.map((carrier) => (
                                <option key={carrier._id} value={carrier._id}>{carrier.name}</option>
                              ))
                            }
                          </select>
                        </td> :
                        <td className="middle">{item.carrier?.name}</td>
                    }
                    {
                      canChangeRequest ?
                        <td className="middle">
                          <DateRangePicker
                            className={'input-sm'}
                            value={item.uploadDate}
                            onChange={(e) => {
                              this.props.updateRequestItemInListReduxAction!(request._id, {
                                ...item,
                                uploadDate: e
                              });
                            }}
                          />
                        </td> :
                        <td className="middle">{item.uploadDate ? moment(item.uploadDate).format('DD-MM-YY') : '-'}</td>
                    }
                    {
                      canChangeRequest ?
                        <td className="middle">
                          <DateRangePicker
                            className={'input-sm'}
                            value={item.estimatedArrival}
                            onChange={(e) => {
                              this.props.updateRequestItemInListReduxAction!(request._id, {
                                ...item,
                                estimatedArrival: e
                              });
                            }}
                          />
                        </td> :
                        <td className="middle">{item.estimatedArrival ? moment(item.estimatedArrival).format('DD-MM-YY') : '-'}</td>
                    }
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </React.Fragment>
    );
  }

  private goToDetail(id: string): void {
    this.props.history.push(`/requests/${id}/`);
  }

  private padNumber(n: number): string {
    const s = '000' + n;
    return s.substr(s.length - 4);
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
    updateRequestItemInListReduxAction: (idRequest: string, item: IRequestItem) => dispatch(updateRequestItemInListThunkAction(idRequest, item)),
    tabStatusAction: (request: string) => dispatch(tabStatusAction(request))
  };
};


export default connect<{}, {}, IPropsType | any>(mapStateToProps, mapDispatchToProps)(RequestListDetail);
