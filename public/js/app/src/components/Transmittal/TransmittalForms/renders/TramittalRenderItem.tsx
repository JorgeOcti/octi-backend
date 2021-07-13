import * as React from "react";
import {Field, formValueSelector, WrappedFieldArrayProps} from "redux-form";
import InputField from "../../../Utils/forms/InputField";
import {inputStringRequired} from "../../../Utils/forms/validations";
import CheckBoxField from "../../../Utils/forms/CheckBoxField";
import {ITransmittalState} from "../../../../actions/transmittal.types";
import TransmittalActions from "../../../../actions/transmittal.actions";
import {connect} from "react-redux";
import BootstrapSelectField from "../../../Utils/forms/BootstrapSelectField";


export interface IRenderItemProps {
  transmittal: ITransmittalState;
}

interface IPropsType extends WrappedFieldArrayProps<{}>, IRenderItemProps {
  transmittalActions : TransmittalActions
}

interface IStateType {
  error: Error | null;
  exporing: boolean;
}

class TramittalRenderItem extends React.Component<IPropsType, IStateType> {
  public render(): React.ReactElement<IPropsType> {
    const {fields, meta: {error, submitFailed}, transmittal} = this.props;
    return (
      <React.Fragment>
        {
          fields.length === 0 ?
            <div className="col-md-12">
              <p
                className="text-center text-muted"
                style={{padding: '20px 0'}}
              >
                No hay preguntas personalizadas para agregar una <a href="javascript:void(0)" onClick={() => fields.push({})}>haz click aquí.</a>
              </p>
            </div> :
            fields.map((item, index) => {
              return (
                <div style={{
                  borderBottom: index + 1 !== fields.length ? '1px solid #ededed' : '',
                  margin: '0',
                  marginBottom: index + 1 !== fields.length ? '5px' : '0'
                }}
                     key={index} className="row"
                >
                  <div className="col-md-2">
                    <Field
                      name={`${item}.invoice`}
                      label="Factura"
                      placeholder="ABCD12"
                      type="text"
                      component={InputField}
                      validate={[inputStringRequired]}
                    />
                  </div>
                  <div className="col-md-2">
                    <Field
                      name={`${item}.entry`}
                      label="Partida *"
                      placeholder="ABCD12"
                      type="text"
                      component={InputField}
                      validate={[inputStringRequired]}
                    />
                  </div>
                  <div className="col-md-2 col-sm-2 col-xs-2">
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
                    {/*<Field*/}
                    {/*  name={`${item}.required`}*/}
                    {/*  label="Hacer obligatoria"*/}
                    {/*  type="checkbox"*/}
                    {/*  component={CheckBoxField}*/}
                    {/*  validate={[]}*/}
                    {/*/>*/}
                  </div>
                  <div className="col-md-2 col-sm-2 col-xs-2">
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
                  </div>

                  <div className="col-md-1 col-sm-1 col-xs-2 text-left" style={{paddingLeft: '0'}}>
                    <button
                      type="button"
                      style={{marginTop: '25px'}}
                      className="btn btn-sm btn-danger"
                      onClick={() => fields.remove(index)}
                    >
                      <i className="fa fa-trash"/>
                    </button>
                  </div>
                </div>
              );
            })
        }
        {
          fields.length >= 1 ?
            <div className="col-md-12 col-sm-12 col-xs-12 text-right">
              <button
                type="button"
                className="btn btn-sm btn-success"
                onClick={() => fields.push({})}
              >
                <i className="fa fa-fw fa-plus"/> Agregar pregunta
              </button>
              {submitFailed && error && <span>{error}</span>}
            </div>
            : null
        }
      </React.Fragment>
    );
  };
}

const mapStateToProps = (state: { transmittal: ITransmittalState }) => {
  return {
    transmittal: state.transmittal
  };
};

const mapDispatchToProps = (dispatch: any) => {
  const transmittalActions = new TransmittalActions(dispatch);
  const selector = formValueSelector('transmittalForm');
  return {
    dispatch,
    transmittalActions
  };
};


export default connect<{}, {}, IRenderItemProps>(mapStateToProps, mapDispatchToProps)(TramittalRenderItem);
