import * as React from 'react';
import {Dispatch} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import * as moment from 'moment-timezone';
import TransmittalActions from "../../../actions/transmittal.actions";
import {ITransmittalActionTypes, ITransmittalState} from "../../../actions/transmittal.types";
import {ITransmittalItemModel} from '../../../../../../../src/distribution/models/transmittalItem.model';
import DateRangePicker from '../../Utils/DateRangePicker';
import BootstrapSelect from "../../Utils/BootstrapSelect";
import ShowIf from "../../Utils/ShowIf";
import * as swal from "sweetalert";
import ApiService from "../../../utils/axios";
import {ITransmittalModel} from '../../../../../../../src/distribution/models/transmittal.model';
import {IParticipant} from '../../../../../../../src/form/interfaces/participant.interface';
import {getParticipant} from "../../../actions/dashboard.actions";
import {debounce} from "throttle-debounce";
import {hasPermission} from "../../../utils/common";
import {IWindow} from "../../../interfaces/window";

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<ITransmittalActionTypes>;
  transmittal: ITransmittalState;
  item: ITransmittalModel;
  transmittalItem: ITransmittalItemModel;
  transmittalActions: TransmittalActions;
  getParticipant(id: string): void;
}

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
    const {transmittalItem, transmittal: {venues}} = this.props;
    return (
      <tr id={`transmittal-item-${transmittalItem._id}`} className="background-transition">
        <td className={"middle"}>
          <strong>
            #{this.padNumber(transmittalItem.request.number)}
          </strong>
        </td>
        <td className={"middle"}>{transmittalItem.car.vin}</td>
        <td className={"middle"}>{transmittalItem.car.brand} {transmittalItem.car.denomination}</td>
        <td className={"middle"}>{transmittalItem.car.invoice}</td>
        <td className={"middle"}>{transmittalItem.car.entry}</td>
        <td className={"middle"}>
          {
            hasPermission(window.user, 'changeTransmittal') ?
              (
                <BootstrapSelect
                  noneSelectedText="Selecciona una sucursal"
                  displayItems={2}
                  sm={true}
                  selectedText="sucursales seleccionadas."
                  selected={transmittalItem.origin ? [transmittalItem.origin._id] : []}
                  autoClouse={true}
                  allOption={false}
                  search={true}
                  options={venues.map((venue: any) => ({
                    value: venue._id,
                    text: venue.name
                  }))}
                  onClick={(e: string) => {
                    this.props.transmittalActions.updateTransmittalItemThunkAction({
                      _id: transmittalItem._id,
                      transmittal: transmittalItem.transmittal,
                      origin: e
                    });
                  }}
                />
              ) :
              (
                `${transmittalItem.origin?.name}`
              )
          }
        </td>
        <td className={"middle"}>
          {
            hasPermission(window.user, 'changeTransmittal') ?
              (
                <BootstrapSelect
                  noneSelectedText="Selecciona una sucursal"
                  displayItems={2}
                  sm={true}
                  selectedText="sucursales seleccionadas."
                  selected={transmittalItem.destination ? [transmittalItem.destination._id] : []}
                  autoClouse={true}
                  allOption={false}
                  search={true}
                  options={venues.map((venue: any) => ({
                    value: venue._id,
                    text: venue.name
                  }))}
                  onClick={(e: string) => {
                    this.props.transmittalActions.updateTransmittalItemThunkAction({
                      _id: transmittalItem._id,
                      transmittal: transmittalItem.transmittal,
                      destination: e
                    });
                  }}
                />
              ) :
              (
                `${transmittalItem.destination?.name}`
              )
          }

        </td>
        <td className={"middle"}>
          {
            hasPermission(window.user, 'changeTransmittal') ?
              (
                <DateRangePicker
                  className={'input-sm'}
                  value={transmittalItem.loadingDate}
                  format={'DD-MM-YY'}
                  onChange={(e) => {
                    this.props.transmittalActions.updateTransmittalItemThunkAction({
                      _id: transmittalItem._id,
                      transmittal: transmittalItem.transmittal,
                      loadingDate: e?.toDate() ?? ''
                    });
                  }}
                />
              ) :
              (
                `${transmittalItem.loadingDate ? moment(transmittalItem.loadingDate).format('DD-MM-YYYY'): '-'}`
              )
          }
        </td>
        <td className={"middle"}>
          {
            hasPermission(window.user, 'changeTransmittal') ?
              (
                <DateRangePicker
                  className={'input-sm'}
                  value={transmittalItem.arrivalDate}
                  format={'DD-MM-YY'}
                  onChange={(e) => {
                    this.props.transmittalActions.updateTransmittalItemThunkAction({
                      _id: transmittalItem._id,
                      transmittal: transmittalItem.transmittal,
                      arrivalDate: e?.toDate() ?? ''
                    });
                  }}
                />
              ) :
              (
                `${transmittalItem.arrivalDate ? moment(transmittalItem.arrivalDate).format('DD-MM-YYYY'): '-'}`
              )
          }

        </td>
        <td className={"middle"}>
          {
            hasPermission(window.user, 'changeTransmittal') ?
              (
                <input
                  className="form-control input-sm"
                  defaultValue={transmittalItem.observation}
                  onChange={(e) => {
                    this.debounceUpdateTransmittalItem({
                      _id: transmittalItem._id,
                      transmittal: transmittalItem.transmittal,
                      observation: e.target.value
                    })
                  }}
                />
              ) :
              (
                `${transmittalItem.observation ?? '-'}`
              )
          }
        </td>
        {
          transmittalItem.revisions.length ?
            this.statusIcon(transmittalItem.revisions[0]) :
            <td className={"middle"} />
        }
        <ShowIf condition={hasPermission(window.user, 'changeTransmittal')}>
          <td className="middle-center text-red pointer" onClick={this.delete}>
            <i className="fa fa-minus-circle"/>
          </td>
        </ShowIf>
      </tr>
    );
  }
  private debounceUpdateTransmittalItem(transmittalItem: Partial<ITransmittalItemModel>){
    this.props.transmittalActions.updateTransmittalItemThunkAction(transmittalItem);
  }

  private statusIcon(revision: IParticipant){
    if (revision.receptionConfirmation) {
      return (
        <td className={"middle pointer"} onClick={() => this.props.getParticipant(revision._id)}>
          <i className="fa fa-check-circle text-primary"/>
        </td>
      );
    } else if (!revision.receptionConfirmation) {
      return (
        <td className={"middle pointer"} onClick={() => this.props.getParticipant(revision._id)}>
          <i className="fa fa-close text-danger"/>
        </td>
      );
    } else if (revision.hasDamages) {
      return (
        <td className={"middle pointer"} onClick={() => this.props.getParticipant(revision._id)}>
          <i className="fa fa-warning text-red"/>
        </td>
      );
    }
    return <td className={"middle"} />;
  }

  private delete() {
    const {transmittalItem} = this.props;
    const {item: transmittal} = this.props;
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
        const {transmittalItem} = this.props;
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
    getParticipant: (id: string) => dispatch(getParticipant(id)),
  };
};


export default connect<{}, {}, IPropsType | any>(mapStateToProps, mapDispatchToProps)(TransmitalListItem);
