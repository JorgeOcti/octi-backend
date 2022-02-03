import { AxiosError, AxiosResponse } from 'axios';
import * as moment from 'moment-timezone';
import * as Raven from 'raven-js';
import * as React from 'react';
import { ErrorInfo } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';
import * as swal from 'sweetalert';
import { debounce } from 'throttle-debounce';
import { ICar } from '../../../../../../../src/app/interfaces/car.interface';
import { IRequest } from '../../../../../../../src/request/interfaces/request.interface';
import { IRequestItem } from '../../../../../../../src/request/interfaces/requestItem.interface';
import {
  deleteRequestItemThunkAction,
  deleteRequestThunkAction,
  updateRequestItemInDetailThunkAction
} from '../../../actions/requests.actions';
import { IRequestsState } from '../../../actions/requests.types';
import { IWindow } from '../../../interfaces/window';
import ApiService from '../../../utils/axios';
import { hasPermission } from '../../../utils/common';
import AutocompleteInput from '../../Utils/AutocompleteInput';
import DateRangePicker from '../../Utils/DateRangePicker';
import ShowIf from '../../Utils/ShowIf';

interface IPropsType extends RouteComponentProps<{ id: string }> {
  requests: IRequestsState;
  request: IRequest;
  item: IRequestItem;
  index: any;
  updateRequestItemInDetailThunkAction: ({ item, debounce }: { item: IRequestItem, debounce?: boolean }) => void;
  deleteRequestItemThunkAction: (item: IRequestItem) => void;
  deleteRequestThunkAction: (idRequest: string) => void;
}

interface IStateType {
  error: Error | null;
  recommends: ICar[];
}

declare let window: IWindow;

class RequestItem extends React.Component<IPropsType, IStateType> {
  readonly api: ApiService;

  readonly state = {
    error: null,
    recommends: []
  };

  constructor(props: IPropsType) {
    super(props);
    this.search = debounce(500, this.search.bind(this));
    this.downloadFiles = this.downloadFiles.bind(this);
    this.api = new ApiService();
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error });
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public render(): React.ReactElement<IPropsType> {
    const { item, index } = this.props;
    const { requestItemStatus, reasons, requestSettings } = this.props.requests;
    const { recommends } = this.state;
    const canChangeRequest = hasPermission(window.user, 'changeRequest');
    return (
      <tr id={`request-item-${item._id}`} className={'background-transition'}>
        <td className="middle-center">{index + 1}</td>
        <ShowIf condition={requestSettings.priority}>
          <td
            className={`middle-center ${canChangeRequest ? 'pointer' : ''}`}
            onClick={canChangeRequest ? () => {
              this.props.updateRequestItemInDetailThunkAction({
                item: {
                  ...item,
                  priority: !item.priority
                },
                debounce: false
              });
            } : undefined}
          >
            {item.priority ? <i className='fa fa-star text-yellow' /> : <i className='fa fa-star text-muted' />}
          </td>
        </ShowIf>
        <td className="middle">{item.car.property ? item.car.property : '-'}</td>
        <ShowIf condition={requestSettings.brand}>
          {
            canChangeRequest && !requestSettings.brandReadOnly ?
              <td className="middle">
                <AutocompleteInput
                  value={item.car.brand}
                  inputClass={'input-sm'}
                  items={recommends}
                  renderItem={(car, index) => (
                    <div key={index} className="item">
                      {car.material ? `${car.material} - ` : ''} {car.denomination} <br />
                      <strong>{car.brand}</strong>
                    </div>
                  )}
                  onChange={(e) => {
                    const { value } = e.target;
                    this.props.updateRequestItemInDetailThunkAction({
                      item: {
                        ...item,
                        car: {
                          ...item.car,
                          brand: value
                        }
                      },
                      debounce: true
                    });
                    this.search(value);
                  }}
                  onSelect={(car: any) => {
                    this.props.updateRequestItemInDetailThunkAction({
                      item: {
                        ...item,
                        car: {
                          ...item.car,
                          brand: car.brand,
                          denomination: car.denomination,
                          material: car.material ?? ''
                        }
                      },
                      debounce: false
                    });
                  }}
                />
              </td>
              : <td className="middle">{item.car.brand}</td>
          }
        </ShowIf>
        <ShowIf condition={requestSettings.denomination}>
          {
            canChangeRequest && !requestSettings.denominationReadOnly ?
              <td className="middle">
                <AutocompleteInput
                  value={item.car.denomination}
                  inputClass={'input-sm'}
                  items={recommends}
                  renderItem={(car, index) => (
                    <div key={index} className="item">
                      {car.material ? `${car.material} - ` : ''} {car.denomination} <br />
                      <strong>{car.brand}</strong>
                    </div>
                  )}
                  onChange={(e) => {
                    const { value } = e.target;
                    this.props.updateRequestItemInDetailThunkAction({
                      item: {
                        ...item,
                        car: {
                          ...item.car,
                          denomination: value
                        }
                      },
                      debounce: true
                    });
                    this.search(value);
                  }}
                  onSelect={(car: any) => {
                    this.props.updateRequestItemInDetailThunkAction({
                      item: {
                        ...item,
                        car: {
                          ...item.car,
                          brand: car.brand,
                          denomination: car.denomination,
                          material: car.material ?? ''
                        }
                      },
                      debounce: false
                    });
                  }}
                />
              </td> : <td className="middle">{item.car.denomination}</td>
          }
        </ShowIf>
        <ShowIf condition={requestSettings.material}>
          {
            canChangeRequest && !requestSettings.materialReadOnly ?
              <td className="middle">
                <AutocompleteInput
                  value={item.car.material}
                  inputClass={'input-sm'}
                  items={recommends}
                  renderItem={(car, index) => (
                    <div key={index} className="item">
                      {car.material ? `${car.material} - ` : ''} {car.denomination} <br />
                      <strong>{car.brand}</strong>
                    </div>
                  )}
                  onChange={(e) => {
                    const { value } = e.target;
                    this.props.updateRequestItemInDetailThunkAction({
                      item: {
                        ...item,
                        car: {
                          ...item.car,
                          material: value
                        }
                      },
                      debounce: true
                    });
                    this.search(value);
                  }}
                  onSelect={(car: any) => {
                    this.props.updateRequestItemInDetailThunkAction({
                      item: {
                        ...item,
                        car: {
                          ...item.car,
                          brand: car.brand,
                          denomination: car.denomination,
                          material: car.material ?? ''
                        }
                      },
                      debounce: false
                    });
                  }}
                />
              </td> :
              <td className="middle">{item.car.material}</td>
          }
        </ShowIf>
        <ShowIf condition={requestSettings.color}>
          {
            canChangeRequest && !requestSettings.colorReadOnly ?
              <td className="middle">
                <input type="text"
                  className="form-control input-sm"
                  defaultValue={item.car.color}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    this.props.updateRequestItemInDetailThunkAction({
                      item: {
                        ...item,
                        car: {
                          ...item.car,
                          color: e.target.value
                        }
                      },
                      debounce: false
                    });
                  }}
                />
              </td> :
              <td className="middle">{item.car.color}</td>
          }
        </ShowIf>
        {
          canChangeRequest ?
            <td className="middle">
              <input
                type="text"
                className="form-control input-sm"
                defaultValue={item.car.vin}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  this.props.updateRequestItemInDetailThunkAction({
                    item: {
                      ...item,
                      car: {
                        ...item.car,
                        vin: e.target.value
                      }
                    },
                    debounce: false
                  });
                }}
              />
            </td> :
            <td className="middle">{item.car.vin}</td>
        }
        {
          canChangeRequest ?
            <td className="middle">
              <select className="form-control select-sm font-12" value={item.status?._id ?? ''}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  this.props.updateRequestItemInDetailThunkAction({
                    item: {
                      ...item,
                      status: {
                        ...item.status,
                        _id: e.target.value
                      }
                    },
                    debounce: false
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
        <ShowIf condition={requestSettings.conectaID}>
          <td className="middle">{item.request?.conectaID}</td>
        </ShowIf>
        <ShowIf condition={requestSettings.internalNumber}>
          {
            canChangeRequest ?
              <td className="middle">
                <input type="text"
                  className="form-control input-sm"
                  defaultValue={item.car.internalNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    this.props.updateRequestItemInDetailThunkAction({
                      item: {
                        ...item,
                        car: {
                          ...item.car,
                          internalNumber: e.target.value
                        }
                      },
                      debounce: false
                    });
                  }}
                />
              </td> :
              <td className="middle">{item.car.internalNumber}</td>
          }
        </ShowIf>
        <ShowIf condition={requestSettings.reason}>
          {
            canChangeRequest ?
              <td className="middle">
                <select
                  className="form-control select-sm font-12" value={item.reason?._id ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    this.props.updateRequestItemInDetailThunkAction({
                      item: {
                        ...item,
                        reason: {
                          ...item.reason,
                          _id: e.target.value
                        }
                      },
                      debounce: false
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
        </ShowIf>
        <td
          className={`middle-center ${item.files && item.files.length ? 'pointer' : ''}`}
          onClick={() => this.downloadFiles(item)}
        >
          {
            item.files && item.files.length ?
              <span
                data-toggle={'tooltip'}
                data-placement={'top'}
                title={`${item.files.length} archivos adjuntos.`}
              >
                <i className="fa fa-paperclip" /> ({item.files.length})
              </span> : null
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
              className={`flex-wrap-item-center ${canChangeRequest ? 'pointer' : ''} ${item.equipment ? '' : 'text-gray'}`}
              data-toggle="tooltip"
              data-placement="top"
              title="Accesorización"
              onClick={canChangeRequest ? () => {
                this.props.updateRequestItemInDetailThunkAction({
                  item: {
                    ...item,
                    equipment: !item.equipment
                  },
                  debounce: false
                });
              } : undefined}
            >
              <i className="material-icons font-14">library_add</i>
            </div>
            <div
              className={`flex-wrap-item-center ${canChangeRequest ? 'pointer' : ''} ${item.body ? '' : 'text-gray'}`}
              data-toggle="tooltip"
              data-placement="top"
              title="Carrocero"
              onClick={canChangeRequest ? () => {
                this.props.updateRequestItemInDetailThunkAction({
                  item: {
                    ...item,
                    body: !item.body
                  },
                  debounce: false
                });
              } : undefined}
            >
              <i className="material-icons font-14">rv_hookup</i>
            </div>
          </div>
        </td>
        <td className="middle">
          <div className="flex-wrap">
            <div
              className={`flex-wrap-item-center ${canChangeRequest ? 'pointer' : ''} ${item.washed ? '' : 'text-gray'}`}
              data-toggle="tooltip"
              data-placement="top"
              title="Pre-Lavado"
              onClick={canChangeRequest ? () => {
                this.props.updateRequestItemInDetailThunkAction({
                  item: {
                    ...item,
                    washed: !item.washed
                  },
                  debounce: false
                });
              } : undefined}
            >
              <i className="material-icons font-14">local_car_wash</i>
            </div>
            <div
              className={`flex-wrap-item-center ${canChangeRequest ? 'pointer' : ''} ${item.review ? '' : 'text-gray'}`}
              data-toggle="tooltip"
              data-placement="top"
              title="Inspección Pre-entrega"
              onClick={canChangeRequest ? () => {
                this.props.updateRequestItemInDetailThunkAction({
                  item: {
                    ...item,
                    review: !item.review
                  },
                  debounce: false
                });
              } : undefined}
            >
              <i className="material-icons font-14">build</i>
            </div>
          </div>
        </td> */}
        {/*
          canChangeRequest ?
            <td className="middle">
              <select className="form-control select-sm font-12" value={item.carrier?._id ?? ''}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  this.props.updateRequestItemInDetailThunkAction({
                    item: {
                      ...item,
                      carrier: !e.target.value.length ? null : {
                        ...item.carrier,
                        _id: (e.target.value as any)
                      }
                    },
                    debounce: false
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
        {/*
          canChangeRequest ?
            <td className="middle">
              <DateRangePicker
                className={'input-sm'}
                value={item.uploadDate}
                onChange={(e) => {
                  this.props.updateRequestItemInDetailThunkAction({
                    item: {
                      ...item,
                      uploadDate: e as any
                    },
                    debounce: false
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
                  this.props.updateRequestItemInDetailThunkAction({
                    item: {
                      ...item,
                      estimatedArrival: e as any
                    },
                    debounce: false
                  });
                }}
              />
            </td>
            :<td className="middle">{item.estimatedArrival ? moment(item.estimatedArrival).format('DD-MM-YY') : '-'}</td>
            */
        }
        <ShowIf condition={hasPermission(window.user, 'deleteRequest')}>
          <td className="middle-center text-red pointer" onClick={() => this.deleteRequestItem(item)}>
            <i className="fa fa-minus-circle" />
          </td>
        </ShowIf>
      </tr>
    );
  }

  private downloadFiles(item: IRequestItem) {
    if (item.files && item.files.length) {
      window.open(`/requests-item/${item._id}/download-files/`, '_blank');
    }
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
    const {request} = this.props;
    if (request.items.length > 1) {
      swal({
        title: '¿Estás seguro?',
        text: `Vas a eliminar este vehículo ${item.car.brand} ${item.car.denomination} ${item.car.material}.`,
        icon: 'warning',
        dangerMode: true,
        buttons: {
          cancel: 'Cancelar' as any,
          confirm: {
            text: 'Sí'
          }
        }
      }).then((willDelete) => {
        if (willDelete) {
          this.props.deleteRequestItemThunkAction(item);
        }
      });
    } else {
      swal({
        title: '¿Estás seguro?',
        text: `Si eliminas este último vehículo, vas a eliminar esta solicitud.`,
        icon: 'warning',
        dangerMode: true,
        buttons: {
          cancel: 'Cancelar' as any,
          confirm: {
            text: 'Sí'
          }
        }
      }).then((willDelete) => {
        if (willDelete) {
          this.props.deleteRequestThunkAction(request._id);
        }
      });
    }
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
    updateRequestItemInDetailThunkAction: ({ item, debounce }: { item: IRequestItem, debounce?: boolean }) => dispatch(updateRequestItemInDetailThunkAction({ item, debounce })),
    deleteRequestItemThunkAction: (item: IRequestItem) => dispatch(deleteRequestItemThunkAction(item)),
    deleteRequestThunkAction: (idRequest: string) => dispatch(deleteRequestThunkAction(idRequest))
  };
};


export default connect<{}, {}, IPropsType | any>(mapStateToProps, mapDispatchToProps)(RequestItem);
