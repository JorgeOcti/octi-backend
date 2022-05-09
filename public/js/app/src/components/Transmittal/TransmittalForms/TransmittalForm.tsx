import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {Field, FieldArray, formValueSelector, InjectedFormProps, reduxForm} from 'redux-form';
import {ITransmittalState} from '../../../actions/transmittal.types';
import InputField from '../../Utils/forms/InputField';
import {inputStringRequired} from '../../Utils/forms/validations';
import MultiUploadFiles, {imageStatus} from "../../Utils/MultiUploadFiles";
import TransmittalActions from "../../../actions/transmittal.actions";
import tramittalRenderItem, {IRenderItemProps} from "./renders/TramittalRenderItem";
import BootstrapSelectField from "../../Utils/forms/BootstrapSelectField";
import ShowIf from '../../Utils/ShowIf';
import TextAreaField from "../../Utils/forms/TextAreaField";


interface IPropsType extends InjectedFormProps {
  update: boolean;
  transmittal: ITransmittalState;
  formValues: any;
  transmittalActions: TransmittalActions
}

interface IStateType {
  filesCache: any[];
  error: Error | null;
}

class Form extends React.Component<IPropsType, IStateType> {

  readonly state = {
    filesCache: [],
    error: null
  };

  constructor(props: IPropsType) {
    super(props);
  }

  public componentWillMount(): void {
    this.props.transmittalActions.getFormBaseData();
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public render(): React.ReactElement<IPropsType> {
    const {handleSubmit, valid, submitFailed, transmittal, formValues} = this.props;
    const {filesCache} = this.state;
    const filesCompleted = filesCache.filter((file: any) => file.status === imageStatus.complete);
    const isUploadingFiles = filesCache.length > 0 && filesCompleted.length < filesCache.length;
    return (
      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-12">
            <div className="row">
              <div className="col-md-6">
                <Field
                  name="transporter.driver"
                  label="Chofer *"
                  component={BootstrapSelectField}
                  validate={[inputStringRequired]}
                  props={{
                    noneSelectedText: "Selecciona un chofer",
                    displayItems: 2,
                    sm: true,
                    selectedText: "choferes seleccionadas.",
                    autoClouse: true,
                    allOption: false,
                    search: true,
                    options: [
                      ...transmittal.drivers.map((driver) => ({
                        value: driver._id,
                        text: `${driver.firstName} ${driver.lastName} - ${driver.company.name}`
                      }))
                    ],
                    onClick: (value: string) => this.props.autofill('transporter.driver', value)
                  }}
                >
                </Field>
              </div>
              <div className="col-md-6">
                <Field
                  name="transporter.carrier"
                  label="Transportista *"
                  component={BootstrapSelectField}
                  validate={[inputStringRequired]}
                  props={{
                    noneSelectedText: "Selecciona un transportista",
                    displayItems: 2,
                    selectedText: "transportistas seleccionadas.",
                    autoClouse: true,
                    sm: true,
                    allOption: false,
                    search: true,
                    options: [
                      ...transmittal.carriers.map((carrier) => ({
                        value: carrier._id,
                        text: carrier.name
                      }))
                    ],
                    onClick: (value: string) => this.props.autofill('transporter.carrier', value)
                  }}
                >
                </Field>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <Field
              name="transporter.patent"
              label="Patente del camión"
              placeholder="ABCD12"
              type="text"
              component={InputField}
              // validate={[inputStringRequired]}
            />
          </div>
          <div className='col-md-6'>
            <Field
              name='type'
              label='Tipo de transporte *'
              component={BootstrapSelectField}
              validate={[inputStringRequired]}
              props={{
                noneSelectedText: 'Selecciona un tipo',
                displayItems: 2,
                selectedText: 'tipo seleccionad0.',
                autoClouse: true,
                sm: true,
                allOption: false,
                search: true,
                options: [
                  ...transmittal.milestoneTypes.map((milestoneType) => ({
                    value: milestoneType._id,
                    text: milestoneType.name
                  }))
                ],
                onClick: (value: string) => this.props.autofill('type', value)
              }}
            >
            </Field>
          </div>
          <div className="col-md-12">
            <div className="form-group">
              <label className="control-label label-left">Adjuntar Documentos</label>
              <div>
                <MultiUploadFiles
                  url={'/api/v1/transmittals/upload-file/'}
                  onChange={(files) => {
                    this.setState({filesCache: files});
                    this.props.autofill('files', files)
                  }}
                  files={filesCache}
                />
                <ShowIf condition={isUploadingFiles}>
                  <p>
                    Se están cargando sus archivos, llevamos {filesCompleted.length} de {filesCache.length} <i className="fa fa-spinner fa-spin"/>.
                  </p>
                </ShowIf>
              </div>
            </div>
          </div>
          <div className="col-md-12 m-t-10">
            <h4>Unidades Cargadas ({formValues.items ? formValues.items.length : ''})</h4>
          </div>
          <FieldArray<IRenderItemProps>
            name="items"
            component={tramittalRenderItem}
            props={{
              transmittal
            }}
          />
          <div className="col-md-12 m-t-10">
            <Field
              name={`observation`}
              label="Observación"
              component={TextAreaField}
              type="text"
              rows={4}
              props={{
                resize: 'none'
              }}
            />
          </div>
          {
            submitFailed && !valid &&
            <div className="col-md-12">
              <div
                className="alert alert-danger m-t-20"
              >
                Todos los campos con * son obligatorios
              </div>
            </div>
          }
        </div>
      </form>
    );
  }
}

const TransmittalForm = reduxForm({
  form: 'transmittalForm'
})(Form);

const mapStateToProps = (state: { transmittal: ITransmittalState }) => {
  const selector = formValueSelector('transmittalForm');
  return {
    formValues: selector(state, 'carrier', 'driver', 'files', 'items'),
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

export default connect<{ transmittal: ITransmittalState }, { dispatch: any }, IPropsType | {}>(mapStateToProps, mapDispatchToProps)(TransmittalForm);
