
import * as Raven from 'raven-js';
import * as React from 'react';
import { ErrorInfo } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';
import { IRequest } from '../../../../../../../src/interfaces/request.interface';
import { IRequestItem } from '../../../../../../../src/interfaces/requestItem.interface';
import { IRequestsState } from '../../../actions/requests.types';
import { IWindow } from '../../../interfaces/window';
import DateRangePicker from '../../Utils/DateRangePicker';

interface IPropsType extends RouteComponentProps<{ id: string }> {
  requests: IRequestsState;
  request: IRequest;
  item: IRequestItem;
  index: any;
  getRequestAction(id: string): void;
  updateRequestItemActionInDetail: (item: IRequestItem) => void;
  updateRequestItemInDetailReduxAction: (idRequest: string, item: IRequestItem) => void;
}

interface IStateType {
  error: Error | null;
}

declare let window: IWindow;

class RequestItem extends React.Component<IPropsType, IStateType> {

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error });
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public render(): React.ReactElement<IPropsType> {
    const { request, item, index } = this.props;
    const { requestItemStatus, reasons, carriers } = this.props.requests;
    return (
      <tr id={`request-item-${item._id}`} className={'background-transition'}>
        <td className="middle-center">{index + 1}</td>
        <td
          className="middle-center pointer"
          onClick={() => {
            this.props.updateRequestItemInDetailReduxAction(request._id, {
              ...item,
              priority: !item.priority
            });
          }}
        >
          {item.priority ? <i className="fa fa-star text-yellow" /> : <i className="fa fa-star text-muted" />}
        </td>
        <td className="middle">{item.car.brand}</td>
        <td className="middle">{item.car.denomination}</td>
        <td className="middle">{item.car.material}ASFG58644</td>
        {/* <td className="middle">{item.car.color}</td> */}
        <td className="middle">
          <input type="text"
            className="form-control input-sm"
            defaultValue={item.car.color}
            style={{ width: '80px' }}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              this.props.updateRequestItemInDetailReduxAction(request._id, {
                ...item,
                car: {
                  ...item.car,
                  color: e.target.value
                }
              });
            }}
          />
        </td>
        {/* <td className="middle">{item.status.name}</td> */}
        <td className="middle">
          <select className="form-control select-sm font-12" value={item.status?._id ?? ''}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              this.props.updateRequestItemInDetailReduxAction(request._id, {
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
        {/* <td className="middle">{item.car.vin}12345678901234567</td> */}
        <td className="middle">
          <input
            type="text"
            style={{ width: '125px' }}
            className="form-control input-sm"
            defaultValue="12345678901234567"
          />
        </td>
        <td className="middle">
          <input type="text"
            className="form-control input-sm"
            style={{ width: '80px' }}
            defaultValue={item.car.internalNumber}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              this.props.updateRequestItemInDetailReduxAction(request._id, {
                ...item,
                car: {
                  ...item.car,
                  internalNumber: e.target.value
                }
              });
            }}
          />
        </td>
        {/* <td className="middle">{item.reason?.name}</td> */}
        <td className="middle">
          <select
            className="form-control select-sm font-12" value={item.reason?._id ?? ''}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              this.props.updateRequestItemInDetailReduxAction(request._id, {
                ...item,
                reason: e.target.value as any
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
        </td>
        <td className="middle">
          <div className="flex-wrap">
            <div
              className={`flex-wrap-item-center ${undefined ?? 'pointer'} ${item.equipment ? '' : 'text-gray'}`}
              onClick={() => {
                this.props.updateRequestItemInDetailReduxAction(request._id, {
                  ...item,
                  equipment: !item.equipment
                });
              }}
            >
              <i className="material-icons font-14">library_add</i>
            </div>
            <div
              className={`flex-wrap-item-center ${undefined ?? 'pointer'} ${item.body ? '' : 'text-gray'}`}
              onClick={() => {
                this.props.updateRequestItemInDetailReduxAction(request._id, {
                  ...item,
                  body: !item.body
                });
              }}
            >
              <i className="material-icons font-14">rv_hookup</i>
            </div>
          </div>
        </td>
        <td className="middle">
          <div className="flex-wrap">
            <div
              className={`flex-wrap-item-center ${undefined ?? 'pointer'} ${item.washed ? '' : 'text-gray'}`}
              onClick={() => {
                this.props.updateRequestItemInDetailReduxAction(request._id, {
                  ...item,
                  washed: !item.washed
                });
              }}
            >
              <i className="material-icons font-14">local_car_wash</i>
            </div>
            <div
              className={`flex-wrap-item-center ${undefined ?? 'pointer'} ${item.review ? '' : 'text-gray'}`}
              onClick={() => {
                this.props.updateRequestItemInDetailReduxAction(request._id, {
                  ...item,
                  review: !item.review
                });
              }}
            >
              <i className="material-icons font-14">build</i>
            </div>
          </div>
        </td>
        {/* <td className="middle">{item.carrier?.name}</td> */}
        <td className="middle">
          <select className="form-control select-sm font-12" value={item.carrier?._id ?? ''}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              this.props.updateRequestItemInDetailReduxAction(request._id, {
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
        <td className="middle">
          <DateRangePicker
            className={'input-xs'}
            value={item.uploadDate}
            onChange={(e) => {
              this.props.updateRequestItemInDetailReduxAction(request._id, {
                ...item,
                uploadDate: e as any
              });
            }}
          />
        </td>
        <td className="middle">
          <DateRangePicker
            className={'input-xs'}
            value={item.estimatedArrival}
            onChange={(e) => {
              this.props.updateRequestItemInDetailReduxAction(request._id, {
                ...item,
                estimatedArrival: e as any
              });
            }}
          />
        </td>
        <td className="middle-center text-red pointer">
          <i className="fa fa-minus-circle" />
        </td>
      </tr>
    );
  }
}

const mapStateToProps = (state: { requests: IRequestsState }) => {
  return {
    requests: state.requests
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch
    // updateRequestItemActionInDetail: (item: IRequestItem) => dispatch(updateRequestItemActionInDetail(item)),
    // updateRequestItemInDetailReduxAction: (idRequest: string, item: IRequestItem) => dispatch(updateRequestItemInDetailReduxAction(idRequest, item)),
    // getRequestAction: (id: string) => dispatch(getRequestAction(id))
  };
};


export default connect<{ }, { }, IPropsType | any > (mapStateToProps, mapDispatchToProps)(RequestItem);