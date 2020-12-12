
import { AxiosError, AxiosResponse } from 'axios';
import * as Raven from 'raven-js';
import * as React from 'react';
import { ErrorInfo } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';
import { debounce } from 'throttle-debounce';
import { ICar } from '../../../../../../../src/interfaces/car.interface';
import { IRequestItem } from '../../../../../../../src/interfaces/requestItem.interface';
import { IRequestItemsState } from '../../../actions/requestItems.types';
import { IWindow } from '../../../interfaces/window';
import ApiService from '../../../utils/axios';
import AutocompleteInput from '../../Utils/AutocompleteInput';
import DateRangePicker from '../../Utils/DateRangePicker';

interface IPropsType extends RouteComponentProps<{ id: string }> {
  requestItems: IRequestItemsState;
  item: IRequestItem;
  // updateRequestItemInDetailThunkAction: ({ item, debounce }: { item: IRequestItem, debounce?: boolean }) => void;
  // deleteRequestItemThunkAction: (item: IRequestItem) => void;
  // deleteRequestThunkAction: (idRequest: string) => void;
}

interface IStateType {
  error: Error | null;
  recommends: ICar[];
}

declare let window: IWindow;

class RequestVehicleItem extends React.Component<IPropsType, IStateType> {
  readonly api: ApiService;

  readonly state = {
    error: null,
    recommends: []
  };

  constructor(props: IPropsType) {
    super(props);
    this.search = debounce(500, this.search.bind(this));
    this.api = new ApiService();
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error });
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public render(): React.ReactElement<IPropsType> {
    const { item } = this.props;
    const { requestItemStatus, reasons, carriers } = this.props.requestItems;
    const { recommends } = this.state;
    return (
      <tr id={`request-item-${item._id}`} className={'background-transition'}>
        <td
          className="middle-center pointer"
          onClick={() => {
            // this.props.updateRequestItemInDetailThunkAction({
            //   item: {
            //     ...item,
            //     priority: !item.priority
            //   },
            //   debounce: false
            // });
          }}
        >
          {item.priority ? <i className="fa fa-star text-yellow" /> : <i className="fa fa-star text-gray" />}
        </td>
        <td className="middle"><strong className="text-underline">#{this.padNumber(item.request?.number)}</strong></td>
        {/* <td className="middle">{item.car.brand}</td> */}
        <td className="middle">
          <AutocompleteInput
            value={item.car.brand}
            inputClass={'input-sm'}
            items={recommends}
            renderItem={(car, index) => (
              <div key={index} className="item">
                {car.denomination} <br />
                <strong>{car.brand}</strong>
              </div>
            )}
            onChange={(e) => {
              const { value } = e.target;
              // this.props.updateRequestItemInDetailThunkAction({
              //   item: {
              //     ...item,
              //     car: {
              //       ...item.car,
              //       brand: value
              //     }
              //   },
              //   debounce: true
              // });
              this.search(value);
            }}
            onSelect={(car: any) => {
              // this.props.updateRequestItemInDetailThunkAction({
              //   item: {
              //     ...item,
              //     car: {
              //       ...item.car,
              //       brand: car.brand,
              //       denomination: car.denomination,
              //       material: car.material ?? ''
              //     }
              //   },
              //   debounce: false
              // });
            }}
          />
        </td>
        {/* <td className="middle">{item.car.denomination}</td> */}
        <td className="middle">
          <AutocompleteInput
            value={item.car.denomination}
            inputClass={'input-sm'}
            items={recommends}
            renderItem={(car, index) => (
              <div key={index} className="item">
                {car.denomination} <br />
                <strong>{car.brand}</strong>
              </div>
            )}
            onChange={(e) => {
              const { value } = e.target;
              // this.props.updateRequestItemInDetailThunkAction({
              //   item: {
              //     ...item,
              //     car: {
              //       ...item.car,
              //       denomination: value
              //     }
              //   },
              //   debounce: true
              // });
              this.search(value);
            }}
            onSelect={(car: any) => {
              // this.props.updateRequestItemInDetailThunkAction({
              //   item: {
              //     ...item,
              //     car: {
              //       ...item.car,
              //       brand: car.brand,
              //       denomination: car.denomination,
              //       material: car.material ?? ''
              //     }
              //   },
              //   debounce: false
              // });
            }}
          />
        </td>
        {/* <td className="middle">{item.car.color}</td> */}
        <td className="middle">
          <input type="text"
            className="form-control input-sm"
            defaultValue={item.car.color}
            style={{ width: '80px' }}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              // this.props.updateRequestItemInDetailThunkAction({
              //   item: {
              //     ...item,
              //     car: {
              //       ...item.car,
              //       color: e.target.value
              //     }
              //   },
              //   debounce: false
              // });
            }}
          />
        </td>
        {/* <td className="middle">{item.status.name}</td> */}
        <td className="middle">
          <select className="form-control select-sm font-12" value={item.status?._id ?? ''}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              // this.props.updateRequestItemInDetailThunkAction({
              //   item: {
              //     ...item,
              //     status: {
              //       ...item.status,
              //       _id: e.target.value
              //     }
              //   },
              //   debounce: true
              // });
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
              // this.props.updateRequestItemInDetailThunkAction({
              //   item: {
              //     ...item,
              //     car: {
              //       ...item.car,
              //       internalNumber: e.target.value
              //     }
              //   },
              //   debounce: false
              // });
            }}
          />
        </td>
        {/* <td className="middle">{item.reason?.name}</td> */}
        <td className="middle">
          <select
            className="form-control select-sm font-12" value={item.reason?._id ?? ''}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              // this.props.updateRequestItemInDetailThunkAction({
              //   item: {
              //     ...item,
              //     reason: {
              //       ...item.reason,
              //       _id: e.target.value
              //     }
              //   },
              //   debounce: false
              // });
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
                // this.props.updateRequestItemInDetailThunkAction({
                //   item: {
                //     ...item,
                //     equipment: !item.equipment
                //   },
                //   debounce: false
                // });
              }}
            >
              <i className="material-icons font-14">library_add</i>
            </div>
            <div
              className={`flex-wrap-item-center ${undefined ?? 'pointer'} ${item.body ? '' : 'text-gray'}`}
              onClick={() => {
                // this.props.updateRequestItemInDetailThunkAction({
                //   item: {
                //     ...item,
                //     body: !item.body
                //   },
                //   debounce: false
                // });
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
                // this.props.updateRequestItemInDetailThunkAction({
                //   item: {
                //     ...item,
                //     washed: !item.washed
                //   },
                //   debounce: false
                // });
              }}
            >
              <i className="material-icons font-14">local_car_wash</i>
            </div>
            <div
              className={`flex-wrap-item-center ${undefined ?? 'pointer'} ${item.review ? '' : 'text-gray'}`}
              onClick={() => {
                // this.props.updateRequestItemInDetailThunkAction({
                //   item: {
                //     ...item,
                //     review: !item.review
                //   },
                //   debounce: false
                // });
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
              // this.props.updateRequestItemInDetailThunkAction({
              //   item: {
              //     ...item,
              //     carrier: !e.target.value.length ? null : {
              //       ...item.reason,
              //       _id: e.target.value
              //     }
              //   },
              //   debounce: false
              // });
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
            className={'input-sm'}
            value={item.uploadDate}
            onChange={(e) => {
              // this.props.updateRequestItemInDetailThunkAction({
              //   item: {
              //     ...item,
              //     uploadDate: e as any
              //   },
              //   debounce: false
              // });
            }}
          />
        </td>
        <td className="middle">
          <DateRangePicker
            className={'input-sm'}
            value={item.estimatedArrival}
            onChange={(e) => {
              // this.props.updateRequestItemInDetailThunkAction({
              //   item: {
              //     ...item,
              //     estimatedArrival: e as any
              //   },
              //   debounce: false
              // });
            }}
          />
        </td>
        <td className="middle-center text-red pointer" onClick={() => this.deleteRequestItem(item)}>
          <i className="fa fa-minus-circle" />
        </td>
      </tr>
    );
  }

  private search(text: string): void {
    this.api
      .searchCar(text)
      .then((response: AxiosResponse): void => {
        this.setState({
          recommends: response.data.cars
        });
      })
      .catch((err: AxiosError): void => {
        this.api.errorHandler(err);
      });
  }

  private deleteRequestItem(item: IRequestItem) {
    const { requestItems } = this.props;
    // if (request.items.length > 1) {
    //   swal({
    //     title: '¿Estás seguro?',
    //     text: `Vas a eliminar este vehículo ${item.car.brand} ${item.car.denomination} ${item.car.material}.`,
    //     icon: 'warning',
    //     dangerMode: true,
    //     buttons: {
    //       cancel: 'Cancelar' as any,
    //       confirm: {
    //         text: 'Sí'
    //       }
    //     }
    //   }).then((willDelete) => {
    //     if (willDelete) {
    //       // this.props.deleteRequestItemThunkAction(item);
    //     }
    //   });
    // } else {
    //   swal({
    //     title: '¿Estás seguro?',
    //     text: `Si eliminas este último vehículo, vas a eliminar esta solicitud.`,
    //     icon: 'warning',
    //     dangerMode: true,
    //     buttons: {
    //       cancel: 'Cancelar' as any,
    //       confirm: {
    //         text: 'Sí'
    //       }
    //     }
    //   }).then((willDelete) => {
    //     if (willDelete) {
    //       this.props.deleteRequestThunkAction(request._id);
    //     }
    //   });
    // }
  }

  private padNumber(n: number): string {
    const s = '000' + n;
    return s.substr(s.length - 4);
  }
}


const mapStateToProps = (state: { requestItems: IRequestItemsState }) => {
  return {
    requestItems: state.requestItems
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch
    // updateRequestItemInDetailThunkAction: ({ item, debounce }: { item: IRequestItem, debounce?: boolean }) => dispatch(updateRequestItemInDetailThunkAction({ item, debounce })),
    // deleteRequestItemThunkAction: (item: IRequestItem) => dispatch(deleteRequestItemThunkAction(item)),
    // deleteRequestThunkAction: (idRequest: string) => dispatch(deleteRequestThunkAction(idRequest))
  };
};


export default connect<{}, {}, IPropsType | any>(mapStateToProps, mapDispatchToProps)(RequestVehicleItem);