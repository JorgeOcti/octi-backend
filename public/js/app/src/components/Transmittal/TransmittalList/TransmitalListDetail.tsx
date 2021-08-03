import * as React from 'react';
import {Dispatch} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import TransmittalActions from "../../../actions/transmittal.actions";
import {ITransmittalActionTypes, ITransmittalState} from "../../../actions/transmittal.types";
import { ITransmittalModel } from '../../../../../../../src/distribution/models/transmittal.model';
import TransmitalListItem from './TransmittalListItem';
import ShowIf from "../../Utils/ShowIf";
import BootstrapSelect from "../../Utils/BootstrapSelect";

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
    const {carriers, drivers} = this.props.transmittal;
    const open = this.props.transmittal.transmittalOpen.includes(transmittal._id);
    return (
      <React.Fragment>
        <div id={`transmittal-${transmittal._id}`} className="row transmittal bg-transmittal-title background-transition">
          <div className="flex-45 col-sm-1 col-xs-1 col-md-1 col-lg-1 center pointer head-sorted">
            <strong className="text-underline">#{this.padNumber(transmittal.number)}</strong>&nbsp;
          </div>
          <div className="flex-45 col-sm-1 col-xs-1 col-md-1 col-lg-1">
            {transmittal.transporter.patent}
          </div>
          <div className="flex-45 col-sm-2 col-xs-2 col-md-2 col-lg-2">
            <BootstrapSelect
              noneSelectedText="Selecciona un chófer"
              displayItems={2}
              sm={true}
              selectedText="choferes seleccionadas."
              selected={transmittal.transporter.driver ? [transmittal.transporter.driver._id] : []}
              autoClouse={true}
              allOption={false}
              search={true}
              options={drivers.map((driver: any) => ({
                value: driver._id,
                text: `${driver.firstName} ${driver.lastName}`
              }))}
              onClick={(e: string) => {
                this.props.transmittalActions.updateTransmittalThunkAction({
                  _id: transmittal._id,
                  'transporter.driver': e
                });
              }}
            />
            {/*{transmittal.transporter.driver._id}*/}
            {/*{transmittal.transporter.driver.firstName} {transmittal.transporter.driver.lastName}*/}
          </div>
          <div className="flex-45 col-sm-2 col-xs-2 col-md-2 col-lg-2">
            <BootstrapSelect
              noneSelectedText="Selecciona un transportista"
              displayItems={2}
              sm={true}
              selectedText="transportistas seleccionadas."
              selected={transmittal.transporter.carrier ? [transmittal.transporter.carrier._id] : []}
              autoClouse={true}
              allOption={false}
              search={true}
              options={carriers.map((carrier: any) => ({
                value: carrier._id,
                text: carrier.name
              }))}
              onClick={(e: string) => {
                this.props.transmittalActions.updateTransmittalThunkAction({
                  _id: transmittal._id,
                  'transporter.carrier': e
                });
              }}
            />
            {/*{transmittal.transporter.carrier.name}*/}
          </div>
          <div className="flex-45 col-sm-2 col-xs-2 col-md-2 col-lg-2">
            {transmittal.files.length}
          </div>
          <div className="flex-45 col-sm-1 col-xs-1 col-md-1 col-lg-1">
            {transmittal.items.length}
          </div>
          <div className="flex-45 col-sm-2 col-xs-2 col-md-2 col-lg-2"/>
          <div
            className="flex-45 col-sm-1 col-xs-1 col-md-1 col-lg-1 chevron pointer"
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
                <ShowIf condition={true}>
                  {/*<ShowIf condition={hasPermission(window.user, 'deleteRequest')}>*/}
                  <th className="middle" style={{ width: '30px' }} />
                </ShowIf>
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
