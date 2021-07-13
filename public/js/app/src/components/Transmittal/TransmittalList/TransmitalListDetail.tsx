import * as React from 'react';
import {Dispatch} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import TransmittalActions from "../../../actions/transmittal.actions";
import {ITransmittalActionTypes, ITransmittalState} from "../../../actions/transmittal.types";
import { ITransmittalModel } from '../../../../../../../src/distribution/models/transmittal.model';
import TransmitalListItem from './TransmittalListItem';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<ITransmittalActionTypes>;
  transmittal: ITransmittalState;
  item: ITransmittalModel;
  transmittalActions : TransmittalActions
}

interface IStateType {
  error: Error | null;
}

class TransmitalListDetail extends React.Component<IPropsType, IStateType> {
  title : string;

  readonly state = {
    error: null,
  };

  public render(): React.ReactElement<IPropsType> {
    const {item: transmittal, transmittalActions} = this.props;
    const open = this.props.transmittal.transmittalOpen.includes(transmittal._id);
    return (
      <React.Fragment>
        <div id={`transmittal-${transmittal._id}`} className="row transmittal bg-transmittal-title background-transition">
          <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1 center pointer head-sorted">
            <strong className="text-underline">#{this.padNumber(transmittal.number)}</strong>&nbsp;
          </div>
          <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1">
            {transmittal.transporter.patent}
          </div>
          <div className="col-sm-2 col-xs-2 col-md-2 col-lg-2">
            {transmittal.transporter.driver.firstName} {transmittal.transporter.driver.lastName}
          </div>
          <div className="col-sm-2 col-xs-2 col-md-2 col-lg-2">
            {transmittal.files.length}
          </div>
          <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1">
            {transmittal.items.length}
          </div>
          <div className="col-sm-4 col-xs-4 col-md-4 col-lg-4"/>
          <div
            className="col-sm-1 col-xs-1 col-md-1 col-lg-1 chevron pointer"
            onClick={() => transmittalActions.toogleTab(transmittal._id)}
          >
            {
              open ? <i className="fa fa-chevron-up" /> : <i className="fa fa-chevron-down" />
            }
          </div>
        </div>
        <div className="table-request" style={{display: open ? 'block' : 'none'}}>
          <table className="table table-hover">
            <thead>
              <tr style={{ backgroundColor: '#f9f9f9' }}>
                <th className="middle" style={{ width: '28px' }}>Solicitud</th>
                <th className="middle" style={{ width: '100px' }}>VIN</th>
                <th className="middle" style={{ width: '160px' }}>Modelo</th>
                <th className="middle" style={{ width: '100px' }}>Factura</th>
                <th className="middle" style={{ width: '100px' }}>Partida</th>
                <th className="middle">Origen</th>
                <th className="middle">Destino</th>
                <th className="middle" style={{ width: '120px' }}>Fecha emisión</th>
                <th className="middle" style={{ width: '120px' }}>Fecha arribo</th>
                <th className="middle" style={{ width: '150px' }}>Observación</th>
              </tr>
            </thead>
            <tbody>
              {
                transmittal.items.map((transmittalItem) => (
                  <TransmitalListItem
                    transmittalItem={transmittalItem}
                    key={transmittalItem._id}
                  />
                ))
              }
            </tbody>
          </table>
        </div>
      </React.Fragment>
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


export default connect<{}, {}, IPropsType| any>(mapStateToProps, mapDispatchToProps)(TransmitalListDetail);
