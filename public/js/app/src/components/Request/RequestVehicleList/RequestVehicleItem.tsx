import {AxiosError, AxiosResponse} from 'axios';
import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router-dom';
import {debounce} from 'throttle-debounce';
import {ICar} from '../../../../../../../src/app/interfaces/car.interface';
import {IRequestItem} from '../../../../../../../src/request/interfaces/requestItem.interface';
import {deleteRequestItemsThunkAction, updateRequestItemsThunkAction} from '../../../actions/requestItems.actions';
import {IRequestItemsState} from '../../../actions/requestItems.types';
import {IWindow} from '../../../interfaces/window';
import ApiService from '../../../utils/axios';
import {hasPermission} from '../../../utils/common';
import AutocompleteInput from '../../Utils/AutocompleteInput';
import * as swal from 'sweetalert';
import ShowIf from '../../Utils/ShowIf';

interface IPropsType extends RouteComponentProps<{ id: string }> {
  requestItems: IRequestItemsState;
  item: IRequestItem;
  updateRequestItemsThunkAction: ({ item, debounce }: { item: IRequestItem, debounce?: boolean }) => void;
  deleteRequestItemsThunkAction: (id: string) => void;
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
    this.goToDetail = this.goToDetail.bind(this);
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
    const { item } = this.props;
    const { requestItemStatus, reasons, requestSettings } = this.props.requestItems;
    const { recommends } = this.state;
    const canChangeRequest = hasPermission(window.user, 'changeRequest');
    return (
      <tr id={`request-item-${item._id}`} className={'background-transition'}>
        <td
          className={`middle-center ${canChangeRequest ? 'pointer' : ''}`}
          onClick={canChangeRequest ? () => {
            this.props.updateRequestItemsThunkAction({
              item: {
                ...item,
                priority: !item.priority
              },
              debounce: false
            });
          } : undefined}
        >
          {item.priority ? <i className="fa fa-star text-yellow" /> : <i className="fa fa-star text-gray" />}
        </td>
        <td
          className="middle pointer"
          onClick={() => this.goToDetail(item.request._id)}
        >
            <strong className="text-underline">#{this.padNumber(item.request?.number)}</strong>
        </td>
        <td className="middle" style={{fontSize: '80%'}}>{item.origin?.name ?? '-'}</td>
        <td className="middle" style={{fontSize: '80%'}}>{item.destination?.name ?? '-'}</td>
        {/*<td className="middle">{item.car.property ? item.car.property : '-'}</td>*/}
        {
          canChangeRequest ?
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
                  this.props.updateRequestItemsThunkAction({
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
                  this.props.updateRequestItemsThunkAction({
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
        {
          canChangeRequest ?
            <td className="middle">
              <input
                type="text"
                className="form-control input-sm"
                defaultValue={item.car.vin}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  this.props.updateRequestItemsThunkAction({
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
            </td>
            : <td className="middle">{item.car.vin}</td>
        }
        {
          canChangeRequest ?
            <td className="middle">
              <input
                type="text"
                className="form-control input-sm"
                defaultValue={item.car.entry}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  this.props.updateRequestItemsThunkAction({
                    item: {
                      ...item,
                      car: {
                        ...item.car,
                        entry: e.target.value
                      }
                    },
                    debounce: false
                  });
                }}
              />
            </td>
            : <td className="middle">{item.car.entry}</td>
        }
        <ShowIf condition={requestSettings.denomination}>
          {
            canChangeRequest ?
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
                    this.props.updateRequestItemsThunkAction({
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
                    this.props.updateRequestItemsThunkAction({
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
              : <td className="middle">{item.car.denomination}</td>
          }
        </ShowIf>
        <ShowIf condition={requestSettings.material}>
          {
            canChangeRequest ?
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
                    this.props.updateRequestItemsThunkAction({
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
                    this.props.updateRequestItemsThunkAction({
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
              : <td className="middle">{item.car.material}</td>
          }
        </ShowIf>
        <ShowIf condition={requestSettings.color}>
          {
            canChangeRequest ?
              <td className="middle">
                <input type="text"
                  className="form-control input-sm"
                  defaultValue={item.car.color}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    this.props.updateRequestItemsThunkAction({
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
              </td>
              : <td className="middle">{item.car.color}</td>
          }
        </ShowIf>
        {
          canChangeRequest ?
            <td className="middle">
              <select className="form-control select-sm font-12" value={item.status?._id ?? ''}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  this.props.updateRequestItemsThunkAction({
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
            </td>
            : <td className="middle">{item.status?.name}</td>
        }
        <ShowIf condition={requestSettings.internalNumber}>
          {
            canChangeRequest ?
              <td className="middle">
                <input type="text"
                  className="form-control input-sm"
                  defaultValue={item.car.internalNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    this.props.updateRequestItemsThunkAction({
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
              </td>
              : <td className="middle">{item.car.internalNumber}</td>
          }
        </ShowIf>
        {
          canChangeRequest ?
            <td className="middle">
              <select
                className="form-control select-sm font-12" value={item.reason?._id ?? ''}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  this.props.updateRequestItemsThunkAction({
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
            </td>
            : <td className="middle">{item.reason?.name}</td>
        }
        <td
          className={`middle-center ${item.files && item.files.length ? 'pointer' : ''}`}
          style={{ fontSize: '80%' }}
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
        <td className="middle-center text-gray">
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
        <ShowIf condition={hasPermission(window.user, 'deleteRequest')}>
          <td className="middle-center text-red pointer" onClick={() => this.deleteRequestItem(item)}>
            <i className="fa fa-minus-circle" />
          </td>
        </ShowIf>
      </tr>
    );
  }

  private goToDetail(id: string): void {
    this.props.history.push(`/requests/vehicles/${id}/`);
  }

  private downloadFiles(item: IRequestItem) {
    window.open(`/requests-item/${item._id}/download-files/`, '_blank');
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
          this.props.deleteRequestItemsThunkAction(item._id);
        }
      });
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
    dispatch,
    updateRequestItemsThunkAction: ({ item, debounce }: { item: IRequestItem, debounce?: boolean }) => dispatch(updateRequestItemsThunkAction({ item, debounce })),
    deleteRequestItemsThunkAction: (id: string) => dispatch(deleteRequestItemsThunkAction(id))
    // deleteRequestThunkAction: (idRequest: string) => dispatch(deleteRequestThunkAction(idRequest))
  };
};


export default connect<{}, {}, IPropsType | any>(mapStateToProps, mapDispatchToProps)(RequestVehicleItem);
