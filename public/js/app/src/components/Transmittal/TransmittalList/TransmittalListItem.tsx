import * as React from 'react';
import { Dispatch } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import * as moment from 'moment-timezone';
import TransmittalActions from '../../../actions/transmittal.actions';
import { ITransmittalActionTypes, ITransmittalState } from '../../../actions/transmittal.types';
import { ITransmittalItem } from '../../../../../../../src/distribution/interfaces/transmittalItem.interface';
import DateRangePicker from '../../Utils/DateRangePicker';
import ShowIf from '../../Utils/ShowIf';
import * as swal from 'sweetalert';
import ApiService from '../../../utils/axios';
import CopyText from '../../Utils/CopyText';
import { ITransmittal } from '../../../../../../../src/distribution/interfaces/transmittal.interface';
import { IParticipant } from '../../../../../../../src/form/interfaces/participant.interface';
import { getParticipant } from '../../../actions/dashboard.actions';
import { debounce } from 'throttle-debounce';
import { hasPermission, parseReplicableURL } from '../../../utils/common';
import { IWindow } from '../../../interfaces/window';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  router: any;
  dispatch: Dispatch<ITransmittalActionTypes>;
  transmittal: ITransmittalState;
  item: ITransmittal;
  transmittalItem: ITransmittalItem;
  transmittalActions: TransmittalActions;

  getParticipant(id: string): void;
}

type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};


interface IStateType {
  error: Error | null;
}

declare let window: IWindow;

class TransmitalListItem extends React.Component<IPropsType, IStateType> {
  private api: ApiService;
  title: string;

  readonly state = {
    error: null
  };

  constructor(props: IPropsType) {
    super(props);
    this.delete = this.delete.bind(this);
    this.statusIcon = this.statusIcon.bind(this);
    this.debounceUpdateTransmittalItem = debounce(300, this.debounceUpdateTransmittalItem);
    this.api = new ApiService();
  }

  public render(): React.ReactElement<IPropsType> {
    const { transmittalItem, transmittal: { venues } } = this.props;
    return (
      <tr id={`transmittal-item-${transmittalItem._id}`} className='background-transition'>
        <td
          className={'middle-center pointer'}
          onClick={transmittalItem.request?._id ? () => {
            this.props.history.push(`/requests/vehicles/${transmittalItem.request._id}/`);
          } : undefined}
        >
          <strong className="text-underline">
            <ShowIf condition={!!transmittalItem?.request?.number}>
              #{transmittalItem.request?.number}
            </ShowIf>
          </strong>
        </td>
        <td
          className={'middle text-primary'}

        >
          <CopyText value={transmittalItem.car.vin}>
            <strong
              className={'text-underline pointer'}
              onClick={()=>{this.props.history.push(`/settings/cars/${transmittalItem.car._id}/`)}}
            >
              {transmittalItem.car.vin}
            </strong>
          </CopyText>
        </td>
        <td className={'middle'}><strong className={"text-muted"}>{transmittalItem.car.brand}</strong><br /><span className={"text-muted"}>{transmittalItem.car.denomination}</span></td>
        <td className={'middle-center'}>
          <ShowIf condition={hasPermission(window.user, 'changeTransmittal')} alternative={transmittalItem.car.invoice}>
            <input
              type='text'
              className='form-control input-sm'
              defaultValue={transmittalItem.car.invoice}
              onChange={(e) => {
                this.debounceUpdateTransmittalItem({
                  _id: transmittalItem._id,
                  transmittal: transmittalItem.transmittal,
                  car: {
                    _id: transmittalItem.car._id,
                    invoice: e.target.value
                  }
                });
              }}
            />
          </ShowIf>
        </td>
        <td className={'middle-center'}>
          <ShowIf condition={hasPermission(window.user, 'changeTransmittal')} alternative={transmittalItem.car.entry}>
            <input
              type='text'
              className='form-control input-sm'
              defaultValue={transmittalItem.car.entry}
              onChange={(e) => {
                this.debounceUpdateTransmittalItem({
                  _id: transmittalItem._id,
                  transmittal: transmittalItem.transmittal,
                  car: {
                    _id: transmittalItem.car._id,
                    entry: e.target.value
                  }
                });
              }}
            />
          </ShowIf>
        </td>
        <td className={'middle-center'}>
          <ShowIf condition={hasPermission(window.user, 'changeTransmittal')} alternative={transmittalItem.car.bl}>
            <input
              type='text'
              className='form-control input-sm'
              defaultValue={transmittalItem.car.bl}
              onChange={(e) => {
                this.debounceUpdateTransmittalItem({
                  _id: transmittalItem._id,
                  transmittal: transmittalItem.transmittal,
                  car: {
                    _id: transmittalItem.car._id,
                    bl: e.target.value
                  }
                });
              }}
            />
          </ShowIf>
        </td>
        <td className={'middle'}>
          <ShowIf condition={hasPermission(window.user, 'changeTransmittal')} alternative={transmittalItem.origin?.name}>
            <select
              className='form-control select-sm font-12' value={transmittalItem.origin?._id ?? ''}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                this.props.transmittalActions.updateTransmittalItemThunkAction({
                  _id: transmittalItem._id,
                  transmittal: transmittalItem.transmittal,
                  origin: e.target.value
                });
              }}
            >
              {
                venues.map((venue) => (
                  <option key={venue._id} value={venue._id}>{`${venue.name}`}</option>
                ))
              }
            </select>
          </ShowIf>
        </td>
        <td className={'middle'}>
          <ShowIf condition={hasPermission(window.user, 'changeTransmittal')} alternative={transmittalItem.destination?.name}>
            <select
              className='form-control select-sm font-12' value={transmittalItem.destination?._id ?? ''}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                this.props.transmittalActions.updateTransmittalItemThunkAction({
                  _id: transmittalItem._id,
                  transmittal: transmittalItem.transmittal,
                  destination: e.target.value
                });
              }}
            >
              {
                venues.map((venue) => (
                  <option key={venue._id} value={venue._id}>{`${venue.name}`}</option>
                ))
              }
            </select>
          </ShowIf>
        </td>
        <td className={'middle'}>
          <ShowIf
            condition={hasPermission(window.user, 'changeTransmittal')}
            alternative={transmittalItem.loadingDate ? moment(transmittalItem.loadingDate).format('DD-MM-YYYY') : '-'}
          >
            <DateRangePicker
              className={'input-sm'}
              value={transmittalItem.loadingDate}
              format={'DD-MM-YY'}
              disabled={true}
              // onChange={(e) => {
              //   this.props.transmittalActions.updateTransmittalItemThunkAction({
              //     _id: transmittalItem._id,
              //     transmittal: transmittalItem.transmittal,
              //     loadingDate: e?.toDate() ?? ''
              //   });
              // }}
            />
          </ShowIf>
        </td>
        <td className={'middle'}>
          <ShowIf
            condition={hasPermission(window.user, 'changeTransmittal')}
            alternative={transmittalItem.arrivalDate ? moment(transmittalItem.arrivalDate).format('DD-MM-YYYY') : '-'}
          >
            <DateRangePicker
              className={'input-sm'}
              value={transmittalItem.arrivalDate}
              format={'DD-MM-YY'}
              disabled={true}
              // onChange={(e) => {
              //   this.props.transmittalActions.updateTransmittalItemThunkAction({
              //     _id: transmittalItem._id,
              //     transmittal: transmittalItem.transmittal,
              //     arrivalDate: e?.toDate() ?? ''
              //   });
              // }}
            />
          </ShowIf>
        </td>
        <td className={'middle'}>
          {/*<ShowIf*/}
          {/*  condition={hasPermission(window.user, 'changeTransmittal')}*/}
          {/*  alternative={transmittalItem.observation ?? '-'}*/}
          {/*>*/}
          {/*  <input*/}
          {/*    className='form-control input-sm'*/}
          {/*    defaultValue={transmittalItem.observation}*/}
          {/*    onChange={(e) => {*/}
          {/*      this.debounceUpdateTransmittalItem({*/}
          {/*        _id: transmittalItem._id,*/}
          {/*        transmittal: transmittalItem.transmittal,*/}
          {/*        observation: e.target.value*/}
          {/*      });*/}
          {/*    }}*/}
          {/*  />*/}
          {/*</ShowIf>*/}
        </td>
        {
          transmittalItem.revisions.length ?
            this.statusIcon(transmittalItem.revisions[0]) :
            <td className={'middle'} />
        }
        <ShowIf condition={hasPermission(window.user, 'changeTransmittal')}>
          <td className='middle-center text-red pointer' onClick={this.delete}>
            <i className='fa fa-minus-circle' />
          </td>
        </ShowIf>
      </tr>
    );
  }

  private debounceUpdateTransmittalItem(transmittalItem: RecursivePartial<ITransmittalItem>) {
    this.props.transmittalActions.updateTransmittalItemThunkAction(transmittalItem);
  }

  private statusIcon(revision: IParticipant) {
    if (revision.hasDamages) {
      return (
        <td className={'middle-center pointer'} onClick={() => this.props.getParticipant(revision._id)}>
          <i className='fa fa-warning text-red' />
        </td>
      );
    } else if (revision.receptionConfirmation) {
      return (
        <td className={'middle-center pointer'} onClick={() => this.props.getParticipant(revision._id)}>
          <i className='fa fa-check-circle text-primary' />
        </td>
      );
    } else if (!revision.receptionConfirmation) {
      return (
        <td className={'middle-center pointer'} onClick={() => this.props.getParticipant(revision._id)}>
          <i className='fa fa-close text-danger' />
        </td>
      );
    }
    return <td className={'middle'} />;
  }

  private delete() {
    const { transmittalItem } = this.props;
    const { item: transmittal } = this.props;
    swal!({
      title: '¿Estás seguro?',
      text: `Vas a eliminar ${transmittalItem.car.brand} ${transmittalItem.car.denomination}, de la orden ${this.padNumber(transmittal.number)}.`,
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
        const { transmittalItem } = this.props;
        this.api.deleteTransmittalItem(transmittalItem);
      }
    });
  }

  private padNumber(n: number): string {
    const s = '0000' + n;
    return s.substr(s.length - 5);
  }

}

const mapStateToProps = (state: { transmittal: ITransmittalState }) => {
  return {
    transmittal: state.transmittal
  };
};

const mapDispatchToProps = (dispatch: any) => {
  const transmittalActions = new TransmittalActions(dispatch);
  return {
    dispatch,
    transmittalActions,
    getParticipant: (id: string) => dispatch(getParticipant(id))
  };
};


export default connect<{}, {}, IPropsType | any>(mapStateToProps, mapDispatchToProps)(TransmitalListItem);
