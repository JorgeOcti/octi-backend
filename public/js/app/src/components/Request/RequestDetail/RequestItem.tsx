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
import { deleteRequestItemThunkAction, deleteRequestThunkAction, updateRequestItemInDetailThunkAction } from '../../../actions/requests.actions';
import { IRequestsState } from '../../../actions/requests.types';
import { IWindow } from '../../../interfaces/window';
import ApiService from '../../../utils/axios';
import { hasPermission } from '../../../utils/common';
import AutoCompleteInput from '../../Utils/AutoCompleteInput';
import AutoCompleteVinInput from '../../Utils/AutoCompleteVinInput';
import ShowIf from '../../Utils/ShowIf';
import { debounceTime, switchMap } from 'rxjs/operators';
import { ajax } from 'rxjs/ajax';
import { Subject } from 'rxjs/internal/Subject';

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
  VINRecommends: any[];
}

declare let window: IWindow;

class RequestItem extends React.Component<IPropsType, IStateType> {
  readonly api: ApiService;
  readonly $subjectRecommends = new Subject<any>();
  readonly $subjectVINRecommends = new Subject<any>();

  readonly state = {
    error: null,
    recommends: [],
    VINRecommends: []
  };

  constructor(props: IPropsType) {
    super(props);
    this.search = debounce(500, this.search.bind(this));
    this.downloadFiles = this.downloadFiles.bind(this);
    this.api = new ApiService();
    this.$subjectRecommends.pipe(
      debounceTime(300),
      switchMap((text: string) => {
        return ajax({
          url: `/api/v1/requests/search-car/?search=${text}`,
          headers: {
            'Content-Type': 'application/json;charset=UTF-8'
          },
          method: 'GET'
        });
      })
    ).subscribe((response) => {
      this.setState({
        recommends: response.response.cars
      });
    });
    this.$subjectVINRecommends.pipe(
      debounceTime(300),
      switchMap((vin: string) => {
        return ajax({
          url: `/api/v1/requests/search-vin/?vin=${vin}`,
          headers: {
            'Content-Type': 'application/json;charset=UTF-8'
          },
          method: 'GET'
        });
      })
    ).subscribe((response) => {
      this.setState({
        VINRecommends: response.response.data
      });
    });
  }

  public render(): React.ReactElement<IPropsType> {
    const { item, index, request } = this.props;
    const { requestItemStatus, reasons, requestSettings } = this.props.requests;
    const { recommends } = this.state;
    const canChangeRequest = hasPermission(window.user, 'changeRequest');
    return (
      <tr id={`request-item-${item._id}`} className={'background-transition'}>
        {/*<ShowIf condition={requestSettings.priority}>*/}
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
            {item.priority ? <i className='fa fa-star text-yellow' /> : <i className='fa fa-star text-gray' />}
          </td>
        {/*</ShowIf>*/}
        <td className="middle-center"><strong>{item.order}</strong></td>
        {/*<td className="middle">{item.car.property ? item.car.property : '-'}</td>*/}
        <ShowIf condition={requestSettings.brand}>
          {
            canChangeRequest && !requestSettings.brandReadOnly ?
              <td className="middle">
                <AutoCompleteInput
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
              : <td className="middle"><strong>{item.car.brand}</strong></td>
          }
        </ShowIf>
        <ShowIf condition={requestSettings.denomination}>
          {
            canChangeRequest && !requestSettings.denominationReadOnly ?
              <td className="middle">
                <AutoCompleteInput
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
              </td> : <td className="middle text-muted"><strong>{item.car.denomination}</strong></td>
          }
        </ShowIf>
        <ShowIf
          condition={
            ['5bf2de35caf8ef7096105cdd'].includes(window.user.team._id) &&
            requestSettings.material
          }
        >
          {
            canChangeRequest && !requestSettings.materialReadOnly ?
              <td className='middle'>
                <AutoCompleteInput
                  value={item.car.material}
                  inputClass={'input-sm'}
                  items={recommends}
                  renderItem={(car, index) => (
                    <div key={index} className='item'>
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
              <td className='middle'><strong>{item.car.material}</strong></td>
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
              <td className='middle text-muted'>
                <ShowIf condition={!!item.car?.color}>
                  <strong className='text-primary'>{item.car?.color}</strong><br />
                </ShowIf>
                {item.car?.firstColorOption}
                {item.car?.secondColorOption?.length ? `, ${item.car?.secondColorOption}` : ''}{item.car?.thirdColorOption?.length ? `, ${item.car?.thirdColorOption}` : ''}

              </td>
          }
        </ShowIf>
        {
          canChangeRequest ?
           <td
              className='middle'
              style={{ paddingRight: !item.car.vin?.length ? '29px' : undefined }}>
             <div className='flex'>
              <AutoCompleteVinInput
                  history={this.props.history}
                  defaultValue={item.car.vin}
                  item={item}
                  inputClass={'input-sm'}
                  renderItem={(car, index) => (
                    <div key={index} className='item'>
                      {car.vin ? `${car.vin} - ` : ''} {car.denomination} <br />
                      <strong>{car.brand}</strong>
                    </div>
                  )}
                />
               </div>
            </td> :
            <td className="middle">{item.car.vin}</td>
        }
        {
          canChangeRequest ?
            <td className="middle" style={{width: '120px'}}>
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
        <ShowIf condition={requestSettings.ticket}>
          <td className='middle-center'>
             <div
              data-toggle='tooltip'
              data-placement='top'
              className={`${item.request?.advancePaymentInformation?.files?.length ? 'pointer' : ''}`}
              title={item.request?.advancePaymentInformation?.number ?? '-'}
              onClick={
               request.advancePaymentInformation?.files?.length
                 ? () => this.openBlank(request.advancePaymentInformation.files[0].file.url)
                 : undefined
             }
            >
              {
                //request.advancePaymentInformation.files[0].file.url
                item.request?.advancePaymentInformation?.files?.length ?
                  <i
                    className='fa fa-check-circle text-green'
                  /> : ''
              }
            </div>
          </td>
        </ShowIf>
        <ShowIf
          condition={
            ['5bf2de35caf8ef7096105cdd'].includes(window.user.team._id) &&
            requestSettings.internalNumber
          }
        >
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
        <ShowIf condition={false && requestSettings.reason}>
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
        <ShowIf condition={hasPermission(window.user, 'deleteRequest')}>
          <td className="middle-center text-red pointer" onClick={() => this.deleteRequestItem(item)}>
            <i className="fa fa-minus-circle" />
          </td>
        </ShowIf>
      </tr>
    );
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error });
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  private downloadFiles(item: IRequestItem) {
    if (item.files && item.files.length) {
      this.openBlank(`/requests-item/${item._id}/download-files/`);
    }
  }

  private openBlank(url: string) {
    window.open(decodeURI(url), '_blank');
  }

  private search(text: string): void {
    this.$subjectRecommends.next(text)
  }

  private searchVin(vin: string): void {
    this.$subjectVINRecommends.next(vin)
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
