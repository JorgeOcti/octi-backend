import * as moment from 'moment-timezone';
import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { ICarrier } from '../../../../../../../src/app/interfaces/carrier.interface';
import { IReason } from '../../../../../../../src/request/interfaces/reason.interface';
import { IRequest } from '../../../../../../../src/request/interfaces/request.interface';
import { IRequestItem } from '../../../../../../../src/request/interfaces/requestItem.interface';
import { IRequestItemStatus } from '../../../../../../../src/request/interfaces/requestItemStatus.interface';
import { tabStatusAction, updateRequestItemInListThunkAction } from '../../../actions/requests.actions';
import { IRequestsState } from '../../../actions/requests.types';
import { IWindow } from '../../../interfaces/window';
import { hasPermission, parseReplicableURL } from '../../../utils/common';
import DateRangePicker from '../../Utils/DateRangePicker';
import ShowIf from '../../Utils/ShowIf';

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
    this.downloadFiles = this.downloadFiles.bind(this);
  }

  public render(): React.ReactElement<IPropsType> {
    const {requests, request, reasons, requestItemStatus} = this.props;
    const {requestSettings} = requests;
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
              #{request.number}
            </strong>&nbsp;
            <i className="fa fa-share-square-o" style={{fontSize: '10px'}}/>
          </div>
          <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1">
            {request.channel ? request.channel.name : ''}
            {/* {
              request.fleet ?
                <i className="fa fa-check-circle-o text-green" />
                : null
            } */}
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
              open ? (<i className='fa fa-chevron-up' />) : (<i className='fa fa-chevron-down' />)
            }
          </div>
        </div>
        <div className="table-request" style={{display: open ? 'block' : 'none'}}>
          <table className="table table-hover">
            <thead>
              <tr style={{ backgroundColor: '#f9f9f9' }}>
                <th className="middle" style={{ width: '28px' }} />
                <th className="middle" style={{ width: '100px' }} >Progreso</th>
                <th className="middle" style={{ width: '120px' }}>Estado</th>
                <th className="middle" style={{ width: '200px' }}>Modelo</th>
                <th className="middle" style={{ width: '100px' }}>Color</th>
                <th className="middle-center" style={{ width: '100px' }}>VIN</th>
                <ShowIf condition={requestSettings.ticket}>
                  <th className='middle-center pointer' style={{ width: '60px' }}>
                    Ticket
                  </th>
                  <th className='middle pointer' style={{ width: '80px' }}>
                    Nº Ticket
                  </th>
                </ShowIf>
                <ShowIf condition={requestSettings.entry}>
                  <th className="middle-center">Partida</th>
                </ShowIf>
                <th className="middle-center" style={{ width: '20px' }}>Adj</th>
                <th className="middle">Obs</th>
                {/* <th className="middle-center">Equip. / Carroc. / Preentrega</th> */}
                <ShowIf condition={requestSettings.reason}>
                  <th className="middle"  style={{ width: '150px' }}>Motivo</th>
                </ShowIf>
                {/* <th className="middle" >Transporte</th>
                <th  className="middle" style={{ width: '70px' }}>Fecha carga</th>
                <th className="middle"  style={{ width: '70px' }}>Fecha llegada</th> */}
                <th />
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
                      {`${item.car.brand} ${item.car.denomination} ${item.car.material ?? ''}`}
                    </td>
                    <td className="middle">
                      {item.car.color}
                    </td>
                    <td className='middle-center'>
                      <ShowIf condition={item.car.vin?.length }>
                        <a
                          href={parseReplicableURL(`/settings/cars/${item.car._id}/`)}
                          target="_blank"
                          style={{
                            textDecoration: 'underline'
                          }}
                        >
                          {item.car.vin} <i className='fa fa-fw fa-share-alt-square' />
                        </a>
                      </ShowIf>
                    </td>
                    <ShowIf condition={requestSettings.ticket}>
                      <td className='middle-center'>
                        {
                          //request.advancePaymentInformation.files[0].file.url
                          request.advancePaymentInformation?.files?.length ?
                            <i
                              className='fa fa-check-circle text-green pointer'
                              onClick={() => this.openBlank(request.advancePaymentInformation.files[0].file.url)}
                            /> : ''
                        }
                      </td>
                      <td className='middle'>{request.advancePaymentInformation?.number}</td>
                    </ShowIf>
                    <ShowIf condition={requestSettings.entry}>
                      <td className='middle-center'>
                        {
                          item.car.entry && item.car.entry.length ? item.car.entry : null
                        }
                      </td>
                    </ShowIf>
                    <td
                      className={`middle-center ${item.files && item.files.length ? 'pointer' : ''}`}
                      onClick={item.files?.length ? () => this.downloadFiles(item) : undefined}
                    >
                      {
                        item.files?.length ?
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
                    <ShowIf condition={requestSettings.reason}>
                      {
                        canChangeRequest ?
                          <td className='middle'>
                            <select
                              className='form-control select-sm font-12' value={item.reason?._id ?? ''}
                              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                this.props.updateRequestItemInListReduxAction!(request._id, {
                                  ...item,
                                  reason: e.target.value
                                });
                              }}
                            >
                              <option value='' disabled={true}>-</option>
                              {
                                reasons.map((reason) => (
                                  <option key={reason._id} value={reason._id}>{reason.name}</option>
                                ))
                              }
                            </select>
                          </td> :
                          <td className='middle'>{item.reason?.name}</td>
                      }
                    </ShowIf>
                    { /*
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
                        */
                    }
                    { /*
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
                        */
                    }
                    { /*
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
                        */
                    }
                    <td></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </React.Fragment>
    );
  }

  private downloadFiles(item: IRequestItem) {
    window.open(`/requests-item/${item._id}/download-files/`, '_blank');
  }

  private openBlank(url: string) {
    window.open(url, '_blank');
  }

  private goToDetail(id: string): void {
    this.props.history.push(parseReplicableURL(`/requests/${id}/`));
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
