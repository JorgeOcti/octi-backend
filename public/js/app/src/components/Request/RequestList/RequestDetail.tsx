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
import ShowIf from '../../Utils/ShowIf';
import CopyText from '../../Utils/CopyText';
import RequestStatusDislay from '../StatusComponents/RequestStatusDislay';

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
  open: boolean;
  error: Error | null;
}

export const getColorForPercentage = (value: number): string => {
  if (value < 11) {
    return '#00c0ef';
  } else if (value < 80) {
    return '#f39c12';
  } else if (value < 100) {
    return '#337ab7';
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
    const { requests, request, reasons, requestItemStatus } = this.props;
    const { requestSettings } = requests;
    const open = this.props.requests.requestOpen.includes(request._id);
    const canChangeRequest = hasPermission(window.user, 'changeRequest');
    return (
      <React.Fragment>
        <div id={`request-${request._id}`} className='row request bg-request-title background-transition'>
          <div
            className='col-sm-1 col-xs-1 col-md-1 col-lg-1 pointer center'
            onClick={() => this.goToDetail(request._id)}
          >
            {/* <i className="fa fa-circle status-circle-red" /> */}
            <strong className='text-underline'>
              #{request.number}
            </strong>&nbsp;
          </div>
          <div className='col-sm-1 col-xs-1 col-md-1 col-lg-1'>
            <strong className='text-info'>{request.channel ? request.channel.name : ''}</strong>
            {/* {
              request.fleet ?
                <i className="fa fa-check-circle-o text-green" />
                : null
            } */}
          </div>
          <div className='col-sm-2 col-xs-2 col-md-2 col-lg-2'>{request.createdBy?.firstName.length ? `${request.createdBy?.firstName} ${request.createdBy?.lastName}`: '-'}</div>
          <div className='col-sm-2 col-xs-2 col-md-2 col-lg-2'><strong className='text-primary'>{request.destination.name}</strong></div>
          <div className='col-sm-1 col-xs-1 col-md-1 col-lg-1 text-muted'>
            {
              request.items.length
            }
          </div>
          <div className='col-sm-2 col-xs-2 col-md-2 col-lg-2 text-muted'>
            {moment(request.createdAt).format('DD-MM-YY')}
          </div>
          <div className='col-sm-2 col-xs-2 col-md-2 col-lg-2 text-muted'>
            {moment(request.updatedAt).format('DD-MM-YY')}
          </div>
          {/* <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1 center"> */}
          {/* 10 */}
          {/* </div> */}
          <div className='col-sm-1 col-xs-1 col-md-1 col-lg-1 chevron pointer' onClick={() => this.props.tabStatusAction(request._id)}>
            {
              open ? (<i className='fa fa-chevron-up' />) : (<i className='fa fa-chevron-down' />)
            }
          </div>
        </div>
        <div className='table-request' style={{ display: open ? 'block' : 'none' }}>
          <ShowIf condition={!this.props.requests.requestItemsById.hasOwnProperty(request._id)}>
            <div className='text-center' style={{
              padding: '10px',
              borderBottom: '1px solid #e1e1e1',
              borderLeft: '1px solid #e1e1e1',
              borderRight: '1px solid #e1e1e1'
            }}>
              <i className='fa fa-spinner fa-spin text-purple' />
            </div>
          </ShowIf>
          <ShowIf condition={this.props.requests.requestItemsById.hasOwnProperty(request._id)}>
            <table className='table table-xd table-striped table-hover'>
              <thead>
              <tr style={{ backgroundColor: '#f9f9f9' }}>
                <th className='middle' style={{ width: '28px' }} />
                <th className='middle' style={{ width: '100px' }}>Solicitud</th>
                <th className='middle' style={{ width: '160px' }}>VIN</th>
                <ShowIf condition={requestSettings.entry}>
                  <th>Partida</th>
                </ShowIf>
                <ShowIf
                  condition={
                    ['5bf2de35caf8ef7096105cdd'].includes(window.user.team._id) &&
                    requestSettings.material
                  }
                >
                  <th
                    className='middler pointer'
                    style={{ width: '70px' }}
                  >
                    Material
                  </th>
                </ShowIf>
                <th className='middle' style={{ width: '180px' }}>Descripción</th>
                <th className='middle' style={{ width: '120px' }}>Color</th>
                <ShowIf condition={requestSettings.ticket}>
                  <th className='middle-center pointer' style={{ width: '60px' }}>
                    Ticket
                  </th>
                </ShowIf>
                {/*<th className='middle' style={{ width: '110px' }}>Estado</th>*/}
                <th>OT</th>
                <th>F. emisión</th>
                <th>F. carga</th>
                <th>F. arribo</th>
                <th className='middle-center' style={{ width: '20px' }}></th>
                <th className='middle' />
                {/* <th className="middle-center">Equip. / Carroc. / Preentrega</th> */}
                <ShowIf condition={requestSettings.reason && false}>
                  <th className='middle' style={{ width: '150px' }}>Motivo</th>
                </ShowIf>
                {/* <th className="middle" >Transporte</th>
                <th  className="middle" style={{ width: '70px' }}>Fecha carga</th>
                <th className="middle"  style={{ width: '70px' }}>Fecha llegada</th> */}
                <th />
              </tr>
              </thead>
              <tbody>
              {
                (this.props.requests.requestItemsById[request._id] || []).map((item: any) => (
                  <tr key={item._id} id={`request-item-${item._id}`} className={'background-transition'}>
                    <td className='middle-center'>
                      {item.priority ?
                        <i className='fa fa-star text-yellow' />
                        : null}
                    </td>
                    <td className='middle'>
                      <RequestStatusDislay requestItem={item} showNumber={true} />
                    </td>
                    <td className={`middle`}>
                      <ShowIf condition={item.car.vin?.length}>
                        <CopyText value={item.car.vin}>
                          <strong
                            className={'text-underline text-primary pointer'}
                            onClick={() => {
                              this.props.history.push(parseReplicableURL(`/settings/cars/${item.car._id}/`));
                            }}
                          >
                            {item.car.vin}
                          </strong>
                        </CopyText>
                      </ShowIf>
                    </td>
                    <ShowIf condition={requestSettings.entry}>
                      <td className='middle'>
                        {
                          item.car.entry && item.car.entry.length ? item.car.entry : null
                        }
                      </td>
                    </ShowIf>
                    <ShowIf
                      condition={
                        ['5bf2de35caf8ef7096105cdd'].includes(window.user.team._id) &&
                        requestSettings.material
                      }
                    >
                      <td className='middle text-muted'>
                        {
                          item.car.material?.length ? item.car.material : null
                        }
                      </td>
                    </ShowIf>
                    <td className='middle text-muted'>
                      <strong>{item.car.brand}</strong><br />{`${item.car.denomination}`}
                    </td>
                    <td className='middle text-muted'>
                      <ShowIf condition={!!item.car?.color}>
                        <strong className='text-primary'>{item.car?.color}</strong><br />
                      </ShowIf>
                      {item.car?.firstColorOption}
                      {item.car?.secondColorOption?.length ? `, ${item.car?.secondColorOption}` : ''}{item.car?.thirdColorOption?.length ? `, ${item.car?.thirdColorOption}` : ''}
                    </td>
                    <ShowIf condition={requestSettings.ticket}>
                      <td className='middle-center'>
                        <div
                          data-toggle='tooltip'
                          data-placement='top'
                          className={`${request?.advancePaymentInformation?.files?.length ? 'pointer' : ''}`}
                          title={request?.advancePaymentInformation?.number ?? '-'}
                          onClick={() => this.openBlank(request.advancePaymentInformation.files[0].file.url)}
                        >
                          {
                            //request.advancePaymentInformation.files[0].file.url
                            request?.advancePaymentInformation?.files?.length ?
                              <i
                                className='fa fa-check-circle text-green'
                              /> : ''
                          }
                        </div>
                      </td>
                    </ShowIf>
                    {
                      canChangeRequest && false ?
                        <td className='middle'>
                          <select className='form-control select-sm font-12' value={item.status?._id ?? ''}
                                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                    this.props.updateRequestItemInListReduxAction!(request._id, {
                                      ...item,
                                      status: e.target.value
                                    });
                                  }}
                          >
                            <option value='' disabled={true}>-</option>
                            {
                              requestItemStatus.map((req) => (
                                <option key={req._id} value={req._id}>{req.name}</option>
                              ))
                            }

                          </select>
                        </td> : null
                      // <td className='middle'>{item.status?.name}</td>
                    }
                    <td
                      className={`middle ${item.transmittal?.number ? 'pointer' : ''}`}
                      onClick={item.transmittal?.number ? () => this.openOT(
                        item.transmittal.number.toString(),
                        item?.transmittal?._id,
                        item?.transmittalItem?._id
                      ) : undefined}
                    >
                      <strong className={'text-underline'}>
                        {item?.transmittal?.number ? `#${item?.transmittal?.number}` : ''}
                      </strong>
                    </td>
                    <td
                      className='middle text-muted'>{item.transmittalItem?.loadingDate ? moment(item.transmittalItem.loadingDate).format('DD-MM-YY') : ''}</td>
                    <td
                      className='middle text-muted'>{item?.transmittalItem?.revisions?.length ? moment(item.transmittalItem.revisions[item.transmittalItem.revisions.length - 1].createdAt).format('DD-MM-YY') : ''}</td>
                    <td
                      className='middle text-muted'>{item?.transmittal?.revision ? moment(item.transmittal.revision.createdAt).format('DD-MM-YY') : ''}</td>
                    {/*<td>{item.transmittalItem?.arrivalDate ? moment(item.transmittalItem.arrivalDate).format('DD-MM-YYYY') : '-'}</td>*/}
                    <td
                      className={`middle-center ${item.files && item.files.length ? 'pointer' : ''}`}
                      onClick={item.files?.length ? () => this.downloadFiles(item) : undefined}
                    >
                      {
                        item.files?.length ?
                          <i
                            className='fa fa-paperclip'
                            data-toggle='tooltip'
                            data-placement='top'
                            title={`${item.files.length} archivos adjuntos.`}
                          /> : null
                      }
                    </td>
                    <td className='middle-center'>
                      {
                        item.observation && item.observation.length ?
                          <i
                            className='fa fa-comment'
                            data-toggle='tooltip'
                            data-placement='top'
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
                    <ShowIf condition={requestSettings.reason && false}>
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
          </ShowIf>
        </div>
      </React.Fragment>
    );
  }

  private openOT(number: string, transmittal: string, item: string) {
    this.props.history.push(parseReplicableURL(`/transmittals?number=${number}&transmittal=${transmittal}&item=${item}`,
      ['number', 'transmittal', 'item']));
    // window.open(parseReplicableURL(`/transmittals/?number=${number}`), '_blank');
  }

  private downloadFiles(item: IRequestItem) {
    window.open(`/requests-item/${item._id}/download-files/`, '_blank');
  }

  private openBlank(url: string) {
    window.open(decodeURI(url), '_blank');
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
