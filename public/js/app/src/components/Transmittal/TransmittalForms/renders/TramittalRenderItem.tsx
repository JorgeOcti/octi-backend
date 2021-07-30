import * as React from "react";
import {Field, WrappedFieldArrayProps} from "redux-form";
import {inputStringRequired} from "../../../Utils/forms/validations";
import {ITransmittalState} from "../../../../actions/transmittal.types";
import TransmittalActions from "../../../../actions/transmittal.actions";
import {connect} from "react-redux";
import BootstrapSelectField from "../../../Utils/forms/BootstrapSelectField";
import SearchCarInRequests from '../SearchCarInRequest';
import {IRequestItem} from "../../../../../../../../src/request/interfaces/requestItem.interface";
import InputField from "../../../Utils/forms/InputField";
import TextAreaField from "../../../Utils/forms/TextAreaField";


export interface IRenderItemProps {
  transmittal: ITransmittalState;
}

interface IPropsType extends WrappedFieldArrayProps<{}>, IRenderItemProps {
  transmittalActions : TransmittalActions
}

interface IStateType {
  error: Error | null;
  exporing: boolean;
  openTabs: string[]
}

class TramittalRenderItem extends React.Component<IPropsType, IStateType> {

  readonly state: IStateType = {
    error: null,
    exporing: false,
    openTabs: []
  };

  constructor(props:IPropsType) {
    super(props);
    this.toogleTab = this.toogleTab.bind(this)
  }

  public render(): React.ReactElement<IPropsType> {
    const {fields, meta: {error, submitFailed}, transmittal} = this.props;
    const {openTabs} = this.state;
    return (
      <React.Fragment>
        {
          fields.length === 0 ?
            <div className="col-md-12">
              <p
                className="text-center text-muted"
                style={{padding: '20px 0'}}
              >
                No se han agregado vehículos aún.
              </p>
            </div> :
            <div className="col-md-12">
              <table className="table table-xs" style={{minWidth: '1000px'}}>
                <thead>
                <tr className="bg-primary" style={{height: '45px'}}>
                  <th className="middle-center" style={{width: '45px'}}>ID Sol.</th>
                  <th className="middle" style={{width: '120px'}}>VIN</th>
                  <th className="middle">Marca</th>
                  <th className="middle">Modelo</th>
                  <th className="middle">Color</th>
                  <th className="middle" style={{width: '100px'}}>Partida</th>
                  <th className="middle" style={{width: '100px'}}>Factura</th>
                  <th className="middle" style={{width: '150px'}}>Origen</th>
                  <th className="middle" style={{width: '150px'}}>Destino</th>
                  <th className="middle" style={{width: '30px'}}/>
                  <th className="middle" style={{width: '28px'}}/>
                </tr>
                </thead>
                <tbody>
                {
                  fields.map((item, index) => {
                    const value: IRequestItem = fields.get(index) as IRequestItem;
                    const openTab = openTabs.includes(value._id);
                    return (
                      <React.Fragment key={value._id}>
                        <tr>
                          <td className={`middle-center`}>
                            #{this.padNumber(value.request.number)}
                          </td>
                          <td className={`middle`}>
                            {value.car?.vin}
                          </td>
                          <td className={`middle`}>
                            {value.car?.brand}
                          </td>
                          <td className={`middle`}>
                            {value.car?.denomination}
                          </td>
                          <td className={`middle`}>
                            {value.car?.color}
                          </td>
                          <td className={`middle`}>
                            {value.car?.entry ?? '-'}
                          </td>
                          <td className={`middle`}>
                            {value.car?.invoice ?? '-'}
                          </td>
                          <td className={`middle form-group-no-margin`}>
                            <Field
                              name={`${item}.origin`}
                              label="Origen *"
                              component={BootstrapSelectField}
                              validate={[inputStringRequired]}
                              props={{
                                noneSelectedText: "Selecciona un origen",
                                displayItems: 2,
                                selectedText: "origenes seleccionados.",
                                autoClouse: true,
                                sm: true,
                                labelOff: true,
                                allOption: false,
                                search: true,
                                options: [
                                  ...transmittal.venues.map((venue) => ({
                                    value: venue._id,
                                    text: venue.name
                                  }))
                                ],
                                onClick: (value: string) => this.props.transmittalActions.autofill(`${item}.origin`, value),
                              }}
                            >
                            </Field>
                          </td>
                          <td className={`middle form-group-no-margin`}>
                            <Field
                              name={`${item}.destination`}
                              label="Destino *"
                              component={BootstrapSelectField}
                              validate={[inputStringRequired]}
                              props={{
                                noneSelectedText: "Selecciona un destino",
                                displayItems: 2,
                                selectedText: "destinos seleccionados.",
                                autoClouse: true,
                                sm: true,
                                labelOff: true,
                                allOption: false,
                                search: true,
                                options: [
                                  ...transmittal.venues.map((venue) => ({
                                    value: venue._id,
                                    text: venue.name
                                  }))
                                ],
                                onClick: (value: string) => this.props.transmittalActions.autofill(`${item}.destination`, value),
                              }}
                            >
                            </Field>
                          </td>
                          <td className={`middle-center pointer`} onClick={() => this.toogleTab(value._id)}>
                            {
                              openTab ? <i className="fa fa-chevron-up"/> : <i className="fa fa-chevron-down"/>
                            }
                          </td>
                          <td className={`middle`}>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={() => fields.remove(index)}
                            >
                              <i className="fa fa-trash"/>
                            </button>
                          </td>
                        </tr>
                        {
                          openTab ?
                            <tr style={{borderTop: 'none'}}>
                              <td colSpan={5} className={'b-t-0'}>
                                <table className={'table'} style={{marginBottom:0}}>
                                  <thead>
                                  <tr style={{backgroundColor: '#f9f9f9'}}>
                                    <th className={'middle width-25'}>Cliente</th>
                                    <th className={'middle width-25'}>BL</th>
                                    <th className={'middle width-25'}>Tipo</th>
                                    <th className={'middle width-25'}>Tipo Operación (Motivo)</th>
                                  </tr>
                                  </thead>
                                  <tbody>
                                  <tr>
                                    <td className={'middle form-group-no-margin'}>
                                      <Field
                                        name={`${item}.car.client`}
                                        type="text"
                                        component={InputField}
                                        props={{
                                          labelOff: true
                                        }}
                                      />
                                    </td>
                                    <td className={'middle form-group-no-margin'}>
                                      <Field
                                        name={`${item}.car.bl`}
                                        type="text"
                                        component={InputField}
                                        props={{
                                          labelOff: true
                                        }}
                                      />
                                    </td>
                                    <td className={'middle'}>{value.car?.type ?? '-'}</td>
                                    <td className={'middle'}>{value.reason?.name ?? '-'}</td>
                                  </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr> : null
                        }
                      </React.Fragment>
                    );
                  })
                }
                </tbody>
              </table>
            </div>
        }
        <SearchCarInRequests fields={fields}/>
        {submitFailed && error && <span>{error}</span>}
      </React.Fragment>
    );
  }

  private toogleTab(id: string) {
    const {openTabs} = this.state;
    if (openTabs.includes(id)) {
      this.setState({
        openTabs: [...openTabs.filter(tab => tab !== id)]
      })
    } else {
      this.setState({
        openTabs: [...openTabs, id]
      })
    }
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


export default connect<{}, {}, IRenderItemProps>(mapStateToProps, mapDispatchToProps)(TramittalRenderItem);
