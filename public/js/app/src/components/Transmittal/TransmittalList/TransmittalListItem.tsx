import * as React from 'react';
import {Dispatch} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import TransmittalActions from "../../../actions/transmittal.actions";
import {ITransmittalActionTypes, ITransmittalState} from "../../../actions/transmittal.types";
import { ITransmittalItemModel } from '../../../../../../../src/distribution/models/transmittalItem.model';
import DateRangePicker from '../../Utils/DateRangePicker';
import BootstrapSelect from "../../Utils/BootstrapSelect";

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
    const {transmittalItem} = this.props;
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
            selectedText="sucursales seleccionadas."
            selected={[]}
            allOption={false}
            options={[].map((venue: any) => ({
              value: venue._id,
              text: venue.name
            }))}
            onClick={(e: string) => {
              console.log(e);
            }}
          />
        </td>
        <td>
          <BootstrapSelect
            noneSelectedText="Selecciona una sucursal"
            displayItems={2}
            selectedText="sucursales seleccionadas."
            selected={[]}
            allOption={false}
            options={[].map((venue: any) => ({
              value: venue._id,
              text: venue.name
            }))}
            onClick={(e: string) => {
              console.log(e);
            }}
          />
        </td>
        <td>
          <DateRangePicker
            className={'input-sm'}
            value={transmittalItem.loadingDate}
            format={'DD-MM-YYYY'}
            onChange={(e) => {
              console.log('loadingDate', e)
              // this.props.updateRequestItemInListReduxAction!(request._id, {
              //   ...item,
              //   uploadDate: e
              // });
            }}
          />
        </td>
        <td>
          <DateRangePicker
            className={'input-sm'}
            value={transmittalItem.arrivalDate}
            format={'DD-MM-YYYY'}
            onChange={(e) => {
              console.log('arrivalDate', e)
              // this.props.updateRequestItemInListReduxAction!(request._id, {
              //   ...item,
              //   uploadDate: e
              // });
            }}
          />
        </td>
        <td></td>
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
