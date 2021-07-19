import * as React from 'react';
import {Dispatch} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import TransmittalActions from "../../../actions/transmittal.actions";
import {ITransmittalActionTypes, ITransmittalState} from "../../../actions/transmittal.types";
import {ITransmittalItemModel} from '../../../../../../../src/distribution/models/transmittalItem.model';
import DateRangePicker from '../../Utils/DateRangePicker';
import BootstrapSelect from "../../Utils/BootstrapSelect";
// import {hasPermission} from "../../../utils/common";
import ShowIf from "../../Utils/ShowIf";

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<ITransmittalActionTypes>;
  transmittal: ITransmittalState;
  transmittalItem: ITransmittalItemModel;
  transmittalActions : TransmittalActions;
}

interface IStateType {
  error: Error | null;
}

class TransmitalListItem extends React.Component<IPropsType, IStateType> {
  title : string;

  readonly state = {
    error: null,
  };

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
        <td>
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
              this.props.transmittalActions.updateTransmittalItem({
                _id: transmittalItem._id,
                origin: e
              });
            }}
          />
        </td>
        <td>
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
              this.props.transmittalActions.updateTransmittalItem({
                _id: transmittalItem._id,
                destination: e
              });
            }}
          />
        </td>
        <td>
          <DateRangePicker
            className={'input-sm'}
            value={transmittalItem.loadingDate}
            format={'DD-MM-YYYY'}
            onChange={(e) => {
              this.props.transmittalActions.updateTransmittalItem({
                _id: transmittalItem._id,
                loadingDate: e?.toDate()
              });
            }}
          />
        </td>
        <td>
          <DateRangePicker
            className={'input-sm'}
            value={transmittalItem.arrivalDate}
            format={'DD-MM-YYYY'}
            onChange={(e) => {
              this.props.transmittalActions.updateTransmittalItem({
                _id: transmittalItem._id,
                arrivalDate: e?.toDate()
              });
            }}
          />
        </td>
        <td></td>
        <ShowIf condition={true}>
          {/*<ShowIf condition={hasPermission(window.user, 'deleteRequest')}>*/}
          <td className="middle-center text-red pointer" onClick={() => {

          }}>
            <i className="fa fa-minus-circle"/>
          </td>
        </ShowIf>
      </tr>
    );
  }

  private padNumber(n: number): string {
    const s = '000' + n;
    return s.substr(s.length - 4);
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
    transmittalActions
  };
};


export default connect<{}, {}, IPropsType| any>(mapStateToProps, mapDispatchToProps)(TransmitalListItem);
