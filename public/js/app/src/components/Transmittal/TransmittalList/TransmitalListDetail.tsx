import * as React from 'react';
import {Dispatch} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import TransmittalActions from "../../../actions/transmittal.actions";
import {ITransmittalActionTypes, ITransmittalState} from "../../../actions/transmittal.types";
import {ITransmittalModel} from '../../../../../../../src/distribution/models/transmittal.model';
import TransmitalListItem from './TransmittalListItem';
import ShowIf from "../../Utils/ShowIf";
import BootstrapSelect from "../../Utils/BootstrapSelect";
import {loadDataAction, ModalReduxAction} from "../../../actions/modal.actions";
import SearchCarInRequests from "../TransmittalForms/SearchCarInRequest";
import {IRequestItem} from '../../../../../../../src/request/interfaces/requestItem.interface';
import ApiService from "../../../utils/axios";
import {AxiosError, AxiosResponse} from "axios";
import * as  swal from "sweetalert";

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<ITransmittalActionTypes>;
  transmittal: ITransmittalState;
  item: ITransmittalModel;
  transmittalActions : TransmittalActions
  loadDataAction(title: string, body: JSX.Element, footer: JSX.Element): ModalReduxAction;
}

interface IStateType {
  error: Error | null;
}

class TransmitalListDetail extends React.Component<IPropsType, IStateType> {

  private readonly api: ApiService;

  readonly state = {
    error: null,
  };

  constructor(props: IPropsType) {
    super(props);
    this.openDialogAddCar = this.openDialogAddCar.bind(this);
    this.pushItem = this.pushItem.bind(this);
    this.api = new ApiService();
  }

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
          <table className="table table-hover m-0">
            <thead>
              <tr style={{ backgroundColor: '#f9f9f9' }}>
                <th className="middle" style={{ width: '28px' }}>Solicitud</th>
                <th className="middle" style={{ width: '100px' }}>VIN</th>
                <th className="middle" style={{ width: '160px' }}>Modelo</th>
                <th className="middle" style={{ width: '80px' }}>Factura</th>
                <th className="middle" style={{ width: '80px' }}>Partida</th>
                <th className="middle" style={{ minWidth: '120px' }}>Origen</th>
                <th className="middle" style={{ minWidth: '120px' }}>Destino</th>
                <th className="middle" style={{ width: '100px' }}>Fecha emisión</th>
                <th className="middle" style={{ width: '100px' }}>Fecha arribo</th>
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
          <div className="row">
            <div className="col-md-12 text-right m-b-10">
              <button className="btn btn-sm btn-success" onClick={this.openDialogAddCar}>
                <i className="fa fa-fw fa-plus" /> Agregar vehículo
              </button>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }

  private openDialogAddCar() {
    const {item: transmittal} = this.props;
    this.props.loadDataAction(
      `Agregar vehículo a orden #${this.padNumber(transmittal.number)}`,
      <SearchCarInRequests onClick={this.pushItem} slimView={true}/>,
      <React.Fragment>
        <button type="button" className="btn btn-sm btn-default" data-dismiss="modal">Cerrar</button>
      </React.Fragment>
    );
  }

  private pushItem(requestItem: IRequestItem) {
    const {item: transmittal} = this.props;
    this.api.addTransmittalItem({
      requestItem: requestItem._id,
      car: requestItem.car._id,
      request: requestItem.request._id,
      origin: requestItem.origin._id,
      destination: requestItem.destination._id,
      transmittal: transmittal._id
    })
      .then((response: AxiosResponse): void => {
        swal!('Orden de transporte', 'Se ha creado satisfactoriamente.', 'success')
      })
      .catch((err: AxiosError): void => {
        this.api.errorHandler(err);
      });
  }

  private padNumber(n: number): string {
    const s = '0000' + n;
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
    transmittalActions,
    loadDataAction: (title: string, body: JSX.Element, footer: JSX.Element) => dispatch(loadDataAction(title, body, footer)),
  };
};


export default connect<{}, {}, IPropsType| any>(mapStateToProps, mapDispatchToProps)(TransmitalListDetail);
