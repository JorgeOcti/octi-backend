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
import DateRangePicker from '../../Utils/DateRangePicker';

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
    return (
      <React.Fragment>
        <div id={`request-${request._id}`} className="row request bg-request-title">
          <div
            className="col-sm-1 col-xs-1 col-md-1 col-lg-1 pointer"
            onClick={() => this.goToDetail(request._id)}
          >
            <i className="fa fa-circle status-circle-red" />
            <strong className="text-underline">
              #{this.padNumber(request.number)}
            </strong>&nbsp;
            <i className="fa fa-share-square-o" style={{fontSize: '10px'}}/>
          </div>
          <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1">
            {
              request.fleet ?
                <i className="fa fa-check-circle-o text-green"/>
                : null

            }
          </div>
          {/* <div className="col-sm-2 col-xs-2 col-md-2 col-lg-2">
            <span className="label label-primary">
              {
                request.status?.name
              }
            </span>
          </div> */}
          <div className="col-sm-3 col-xs-3 col-md-3 col-lg-3">{request.destination.name}</div>
          <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1 center">
            {request.items.length}
          </div>
          <div className="col-sm-2 col-xs-2 col-md-2 col-lg-2 center">
            {moment(request.createdAt).format('DD-MM-YY')}
          </div>
          <div className="col-sm-2 col-xs-2 col-md-2 col-lg-2 center">
            {moment(request.updatedAt).format('DD-MM-YY')}
          </div>
          <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1 center">
            10
          </div>
          <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1 chevron pointer"  onClick={()=>this.props.tabStatusAction(request._id)}>
            {
              open ? <i className="fa fa-chevron-up"/> : <i className="fa fa-chevron-down"/>
            }
          </div>
        </div>
        <div className="table-request" style={{display: open ? 'block' : 'none'}}>
          <table className="table table-hover">
            <thead>
              <tr style={{ backgroundColor: '#f9f9f9' }}>
                <th style={{ width: '28px' }} />
                <th>Progreso</th>
                <th>Estado</th>
                <th style={{ width: '250px' }}>Modelo</th>
                <th>Color</th>
                <th className="text-center">VIN</th>
                <th className="text-center">CDO</th>
                <th className="text-center">Equip. / Carroc. / Preentrega</th>
                <th style={{ width: '100px' }}>Motivo</th>
                <th>Transporte</th>
                <th style={{ width: '70px' }}>Fecha carga</th>
                <th style={{ width: '70px' }}>Fecha llegada</th>
                {/* <th>Observación despacho</th> */}
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
                        <div className={`progress-bar progress-bar-aqua`} style={{ width: `${(item.status?.weigth ?? 0)}%`, backgroundColor: getColorForPercentage(100 / requests.requestItemStatusMax * (item.status?.weigth ?? 0)) }} />
                      </div>
                    </td>
                    {/* <td className="middle">En centro logística</td> */}
                    <td className="middle">
                      <select className="form-control select-sm font-12" value={item.status?._id ?? ''}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>)=>{
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
                    </td>
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
                    <td className="middle">
                      <div className="flex-wrap">
                        <div className={`flex-wrap-item-center ${item.equipment ? '' : 'text-gray'}`}>
                          <i className="material-icons">library_add</i>
                        </div>
                        <div className={`flex-wrap-item-center ${item.body ? '' : 'text-gray'}`}>
                          <i className="material-icons">rv_hookup</i>
                        </div>
                        <div className={`flex-wrap-item-center ${item.washed ? '' : 'text-gray'}`}>
                          <i className="material-icons">local_car_wash</i>
                        </div>
                        <div className={`flex-wrap-item-center ${item.review ? '' : 'text-gray'}`}>
                          <i className="material-icons">build</i>
                        </div>
                      </div>
                    </td>
                    {/* <td className="middle">{item.reason.name}</td> */}
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
                          reasons.map((reason)=>(
                            <option key={reason._id} value={reason._id}>{reason.name}</option>
                          ))
                        }
                      </select>
                    </td>
                    {/* <td className="middle">Schiappacasse</td> */}
                    <td className="middle">
                      <select className="form-control select-sm font-12" value={item.carrier?._id ?? ''}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>)=>{
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
                    </td>
                    {/* <td className="middle">06-11-19</td> */}
                    <td className="middle">
                      <DateRangePicker
                        className={'input-xs'}
                        value={item.uploadDate}
                        onChange={(e) => {
                          this.props.updateRequestItemInListReduxAction!(request._id, {
                            ...item,
                            uploadDate: e
                          });
                        }}
                      />
                    </td>
                    {/* <td className="middle">8-11-19</td> */}
                    <td className="middle">
                      <DateRangePicker
                        className={'input-xs'}
                        value={item.estimatedArrival}
                        onChange={(e) => {
                          this.props.updateRequestItemInListReduxAction!(request._id, {
                            ...item,
                            estimatedArrival: e
                          });
                        }}
                      />
                    </td>
                    {/* <td>{item.observation}</td> */}
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
// export default RequestListDetail;
