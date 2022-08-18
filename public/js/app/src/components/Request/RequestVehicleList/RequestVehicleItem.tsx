import * as Raven from 'raven-js';
import * as React from 'react';
import { ErrorInfo } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';
import { ICar } from '../../../../../../../src/app/interfaces/car.interface';
import { IRequestItem } from '../../../../../../../src/request/interfaces';
import { updateRequestItemsThunkAction } from '../../../actions/requestItems.actions';
import { IRequestItemsState } from '../../../actions/requestItems.types';
import { IWindow } from '../../../interfaces/window';
import ApiService from '../../../utils/axios';
import { hasPermission, parseReplicableURL } from '../../../utils/common';
import AutoCompleteInput from '../../Utils/AutoCompleteInput';
import ShowIf from '../../Utils/ShowIf';
import { debounceTime, switchMap } from 'rxjs/operators';
import { ajax } from 'rxjs/ajax';
import AutoCompleteVinInput from '../../Utils/AutoCompleteVinInput';
import { Subject } from 'rxjs/internal/Subject';
import CopyText from '../../Utils/CopyText';
import JsonFormatter from 'react-json-formatter';
import RequestStatusDislay from '../StatusComponents/RequestStatusDislay';
import TransmittalStatusDislay from '../StatusComponents/TransmittalStatusDislay';

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
  readonly $subjectRecommends = new Subject<any>();

  readonly state = {
    error: null,
    recommends: []
  };

  constructor(props: IPropsType) {
    super(props);
    this.goToDetail = this.goToDetail.bind(this);
    this.openOT = this.openOT.bind(this);
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
  }

  public render(): React.ReactElement<IPropsType> {
    const { item } = this.props;
    const { requestItemStatus, reasons, requestSettings } = this.props.requestItems;
    const { recommends } = this.state;
    const canChangeRequest = hasPermission(window.user, 'changeRequest') && window.user.isAdmin;

    return (
      <tr id={`request-item-${item._id}`} className={'background-transition'}>
        {/*<ShowIf condition={requestSettings.priority}>*/}
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
          {item.priority ? <i className='fa fa-star text-yellow' /> : <i className='fa fa-star text-gray' />}
        </td>
        <td
          className='middle pointer'
          onClick={() => this.goToDetail(item._id, item.request._id)}
          style={{}}
        >
          <RequestStatusDislay requestItem={item} showNumber={true} />
        </td>
        <td
          className='middle pointer'
          onClick={() => this.goToDetail(item._id, item.request._id)}
          style={{ fontSize: '80%' }}
        >
          <div>
            <strong className='text-primary text-underline'>
              {item.destination?.name?.toUpperCase() ?? '-'}
            </strong>
          </div>
          <div className={'text-info'}>
            <strong>
              {item.destination?.company?.name?.toUpperCase() ?? '-'}
            </strong>
          </div>
        </td>
        <ShowIf condition={hasPermission(window.user, 'viewTransmittal')}>
          <td
            className={`middle ${item.transmittal?.number ? 'pointer' : ''}`}
            onClick={item.transmittal?.number
              ? () => this.openOT(item.transmittal?.number.toString(), item.transmittal?._id, item?.transmittalItem?._id)
              : undefined
            }
          >
            <TransmittalStatusDislay transmittal={item.transmittal} showNumber={true} />
          </td>
        </ShowIf>
        <ShowIf condition={hasPermission(window.user, 'viewTransmittal')}>
          <td
            className={`middle text-sm ${!!item.transmittalItem?.origin?.name?.length || !!item.transmittalItem?.destination?.name?.length ? 'pointer' : ''}`}
            style={{ padding: '20px 5px' }}
            onClick={!!item.transmittalItem?.origin?.name?.length || !!item.transmittalItem?.destination?.name?.length
              ? () => this.openOT(item.transmittal.number.toString(), item.transmittal._id, item?.transmittalItem._id)
              : undefined
            }
          >
            <ShowIf
              condition={
                !!item.transmittalItem?.origin?.name?.length ||
                !!item.transmittalItem?.destination?.name?.length
              }
            >
              <ShowIf
                condition={
                  item?.transmittal?.transporter?.driver?._id?.length
                }
              >
                <div className={'text-primary'}>
                  <strong>{
                    item?.transmittal?.transporter?.driver?.firstName?.toUpperCase()} {item?.transmittal?.transporter?.driver?.lastName?.toUpperCase()
                  }</strong>
                </div>

              </ShowIf>
              <ShowIf
                condition={
                  item?.transmittal?.transporter?.carrier?._id?.length
                }
              >
                <div className={'text-info'}>
                  <strong>
                    <ShowIf condition={!!item?.transmittal?.transporter?.patent?.length}>
                      PLACA: {item?.transmittal?.transporter?.patent?.toUpperCase()} -
                    </ShowIf> {item?.transmittal?.transporter?.carrier?.name?.toUpperCase()}
                  </strong>
                </div>

              </ShowIf>

              <div className={'text-info'}>
                <strong>
                  {
                    item.transmittalItem?.origin?.name?.length
                      ? item.transmittalItem?.origin?.name?.toUpperCase()
                      : '-'
                  }
                  <i className='fa fa-fw fa-flag-o text-black' />
                </strong>
                {/*<br />{item.transmittalItem.origin?.company?.name}*/}
              </div>
              <div className={'text-primary  text-underline'}>
                <strong>
                  {
                    item.transmittalItem?.destination?.name?.length
                      ? item.transmittalItem?.destination?.name?.toUpperCase()
                      : '-'
                  }
                  <i className='fa fa-fw fa-flag-checkered text-black' />
                </strong>
                {/*<br />{item.transmittalItem.destination?.company?.name}*/}
              </div>
              <ShowIf condition={false}>
                <JsonFormatter
                  json={JSON.stringify({
                    // transmittal: Object.keys(item?.transmittal ?? {}),
                    transporter: Object.keys(item?.transmittal?.transporter ?? {}),
                    driver: item?.transmittal?.transporter?.driver ?? {},
                    carrier: item?.transmittal?.transporter?.carrier ?? {}
                    // transmittalItem: Object.keys(item?.transmittalItem ?? {})
                  })}
                  jsonStyle={{
                    propertyStyle: { color: 'red' },
                    stringStyle: { color: 'green' },
                    numberStyle: { color: 'darkorange' }
                  }}
                />
              </ShowIf>
            </ShowIf>
          </td>
        </ShowIf>
        <ShowIf condition={false}>
          <td className='middle' style={{ fontSize: '80%' }}>{item.origin?.name ?? '-'}</td>
        </ShowIf>
        {/*<td className="middle">{item.car.property ? item.car.property : '-'}</td>*/}
        {
          // canChangeRequest && !requestSettings.brandReadOnly ?
          !canChangeRequest ? <td className='middle'>
              <strong className={'text-primary'}>
                {item.car?.brand}
              </strong><br />
              {item.car?.denomination}<br />
              <ShowIf condition={!!item.car?.vin?.length && !!item.car?.color?.length}>
                <strong>{item.car?.color?.toUpperCase()}</strong><br />
              </ShowIf>
              <ShowIf condition={!item.car?.vin?.length && !!item.car?.firstColorOption.length}>
                {item.car?.firstColorOption}
                {item.car?.secondColorOption?.length ? `, ${item.car?.secondColorOption?.toUpperCase()}` : ''}{item.car?.thirdColorOption?.length ? `, ${item.car?.thirdColorOption?.toUpperCase()}` : ''}
              </ShowIf>
            </td> :null
        }
        <ShowIf condition={requestSettings.entry && false}>
          <td className='middle-center'><strong>{item.car?.bl}</strong></td>
        </ShowIf>
        <ShowIf condition={requestSettings.entry}>
          {
            canChangeRequest ?
              <td className='middle'>
                <input
                  type='text'
                  className='form-control input-sm'
                  defaultValue={item.car?.entry}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    this.props.updateRequestItemsThunkAction({
                      item: {
                        ...item,
                        car: {
                          ...item.car,
                          entry: e.target.value
                        }
                      },
                      debounce: true
                    });
                  }}
                />
              </td>
              : <td className='middle-center'><strong>{item.car?.entry}</strong></td>
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
                  value={item.car?.material}
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
              : <td className='middle-center'><strong>{item.car?.material}</strong></td>
          }
        </ShowIf>
        <ShowIf
          condition={hasPermission(window.user, 'changeRequest') || window.user.isAdmin}
          alternative={
            <td
              className='middle'
              style={{ padding: '20px 10px 20px 5px' }}
            >
              <ShowIf
                condition={hasPermission(window.user, 'viewCar') && item.car?.vin?.length > 0}
                alternative={item.car?.vin}
              >
                <CopyText value={item.car?.vin}>
                  <strong
                    className={'text-underline text-primary pointer'}
                    onClick={() => {
                      this.props.history.push(`/settings/cars/${item.car._id}/`);
                    }}
                  >
                    {item.car?.vin}
                  </strong>
                </CopyText>
              </ShowIf>
            </td>
          }
        >
          <td
            className='middle'
            style={{ padding: '20px 10px 20px 5px' }}
          >
            <div className='flex'>
              <AutoCompleteVinInput
                history={this.props.history}
                defaultValue={item.car?.vin}
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
          </td>
        </ShowIf>
        <ShowIf condition={canChangeRequest}>
          <td className='middle'>
              <AutoCompleteInput
                value={item.car?.brand}
                inputClass={'input-sm'}
                items={recommends}
                renderItem={(car, index) => {
                  return (
                    <div key={index} className='item'>
                      {car.material ? `${car.material} - ` : ''} {car.denomination} <br />
                      <strong>{car.brand}</strong>
                    </div>
                  );
                }}
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
        </ShowIf>
        {/*<ShowIf condition={canChangeRequest && !requestSettings.denominationReadOnly}>*/}
        <ShowIf condition={canChangeRequest}>
          <td className='middle'>
            <AutoCompleteInput
              value={item.car?.denomination}
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
        </ShowIf>
        <ShowIf condition={requestSettings.color && false}>
          {
            canChangeRequest && !requestSettings.colorReadOnly
              ?
              <td className='middle'>
                <input type='text'
                       className='form-control input-sm'
                       defaultValue={item.car?.color}
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
              : <td className={`middle ${!!item.car?.color?.length ? '' : ' text-muted'}`}>
                <ShowIf condition={!!item.car?.color?.length}>
                  <strong>{item.car?.color}</strong><br />
                </ShowIf>
                <ShowIf condition={!item.car?.color}>
                  {item.car?.firstColorOption}
                </ShowIf>
                {item.car?.secondColorOption?.length ? `, ${item.car?.secondColorOption}` : ''}{item.car?.thirdColorOption?.length ? `, ${item.car?.thirdColorOption}` : ''}
              </td>
          }
        </ShowIf>
        <ShowIf condition={canChangeRequest && false}>
          {
            canChangeRequest ?
              <td className='middle'>
                <select
                  className='form-control select-sm font-12'
                  value={item.status?._id ?? ''}
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
                  <option value='' disabled={true}>-</option>
                  {
                    requestItemStatus.map((req) => (
                      <option key={req._id} value={req._id}>{req.name}</option>
                    ))
                  }
                </select>
              </td>
              : <td className='middle text-muted'>{item.status?.name}</td>
          }
        </ShowIf>
        <ShowIf
          condition={
            ['5bf2de35caf8ef7096105cdd'].includes(window.user.team._id) &&
            requestSettings.internalNumber
          }
        >
          {
            canChangeRequest ?
              <td className='middle'>
                <input type='text'
                       className='form-control input-sm'
                       defaultValue={item.car?.internalNumber}
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
              : <td className='middle'>{item.car?.internalNumber}</td>
          }
        </ShowIf>
        <ShowIf condition={requestSettings.reason && false}>
          {
            canChangeRequest ?
              <td className='middle'>
                <select
                  className='form-control select-sm font-12'
                  value={item.reason?._id ?? ''}
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
                  <option value='' disabled={true}>-</option>
                  {
                    reasons.map((reason) => (
                      <option key={reason._id} value={reason._id}>{reason.name}</option>
                    ))
                  }
                </select>
              </td>
              : <td className='middle'>{item.reason?.name}</td>
          }
        </ShowIf>
        <ShowIf condition={requestSettings.ticket}>
          <td
            className='middle-center'
          >
            <div
              data-toggle='tooltip'
              data-placement='top'
              className={`${item.request?.advancePaymentInformation?.files?.length ? 'pointer' : ''}`}
              title={item.request?.advancePaymentInformation?.number ?? '-'}
              onClick={() => this.openBlank(item.request.advancePaymentInformation.files[0].file.url)}
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
        {/*<td
          className={`middle-center ${item.files && item.files.length ? 'pointer' : ''}`}
          style={{ fontSize: '80%' }}
          onClick={item.files?.length ? () => this.downloadFiles(item) : undefined}
        >
          {
            item.files?.length ?
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
        </td>*/}
      </tr>
    );
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error });
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public componentDidUpdate(prevProps: IPropsType): void {
    $('[data-toggle="tooltip"]').tooltip();
  }

  public componentWillUnmount() {
    this.$subjectRecommends.unsubscribe();
  }

  private openOT(number: string, transmittal: string, item: string) {
    this.props.history.push(parseReplicableURL(`/transmittals?number=${number}&transmittal=${transmittal}&item=${item}`,
      ['number', 'transmittal', 'item']));
    // window.open(parseReplicableURL(`/transmittals/?number=${number}`), '_blank');
  }

  private goToDetail(item: string, request: string): void {
    this.props.history.push(parseReplicableURL(`/requests/vehicles/${request}?item=${item}`, ['item']));
  }

  private downloadFiles(item: IRequestItem) {
    window.open(`/requests-item/${item._id}/download-files/`, '_blank');
  }

  private search(text: string): void {
    this.$subjectRecommends.next(text);
  }

  /*private deleteRequestItem(item: IRequestItem) {
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
  }*/

  private openBlank(url: string) {
    window.open(decodeURI(url), '_blank');
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
    updateRequestItemsThunkAction: ({ item, debounce }: { item: IRequestItem, debounce?: boolean }) => dispatch(updateRequestItemsThunkAction({
      item,
      debounce
    }))
    // deleteRequestItemsThunkAction: (id: string) => dispatch(deleteRequestItemsThunkAction(id))
    // deleteRequestThunkAction: (idRequest: string) => dispatch(deleteRequestThunkAction(idRequest))
  };
};

export default connect<{}, {}, IPropsType | any>(mapStateToProps, mapDispatchToProps)(RequestVehicleItem);
