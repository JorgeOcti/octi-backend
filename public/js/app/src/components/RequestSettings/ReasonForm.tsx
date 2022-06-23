import * as Raven from 'raven-js';
import * as React from 'react';
import { ErrorInfo } from 'react';
import { connect } from 'react-redux';
import { Field, FieldArray, InjectedFormProps, reduxForm, WrappedFieldArrayProps } from 'redux-form';
import { IReasonsState } from '../../actions/reasons.types';
import BootstrapSwitchField from '../Utils/forms/BootsrapSwitchField';
import CheckBoxField from '../Utils/forms/CheckBoxField';
import InputField from '../Utils/forms/InputField';
import { inputStringRequired } from '../Utils/forms/validations';

const renderQuestion: React.FunctionComponent<WrappedFieldArrayProps<{}>> = ({
  fields,
  meta: { error, submitFailed }
}) => {
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
          fields.map((question, index) => {
            return (
              <div style={{
                borderBottom: index + 1 !== fields.length ? '1px solid #ededed' : '',
                margin: '0',
                marginBottom:  index + 1 !== fields.length ? '5px': '0'
              }}
                key={index} className="row"
              >
                <div className="col-md-11 col-sm-11 col-xs-10">
                  <Field
                    name={`${question}.name`}
                    label={`Pregunta ${index + 1} *`}
                    component={InputField}
                    validate={[inputStringRequired]}
                  />
                  <Field
                    name={`${question}.required`}
                    label="Hacer obligatoria"
                    type="checkbox"
                    component={CheckBoxField}
                    validate={[]}
                  />
                </div>
                <div className="col-md-1 col-sm-1 col-xs-2 text-left" style={{ paddingLeft: '0' }}>
                  <button
                    type="button"
                    style={{ marginTop: '25px' }}
                    className="btn btn-sm btn-danger"
                    onClick={() => fields.remove(index)}
                  >
                    <i className="fa fa-trash" />
                  </button>
                </div>
                {/* <div className="col-md-2 col-sm-2 col-xs-2" /> */}
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
              <i className="fa fa-fw fa-plus" /> Agregar pregunta
        </button>
            {submitFailed && error && <span>{error}</span>}
          </div>
          : null
      }
    </React.Fragment>
  );
};

interface IPropsType extends InjectedFormProps {
  update: boolean;
}

interface IStateType {
  error: Error | null;
}

class Form extends React.Component<IPropsType, IStateType> {
  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error });
    Raven.captureException(error, {
      extra: errorInfo
    });
  }
  public render(): React.ReactElement<IPropsType> {
    const { handleSubmit, valid , submitFailed} = this.props;
    return (
      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-10">
            <Field
              name="name"
              label="Nombre *"
              placeholder="Nombre"
              type="text"
              component={InputField}
              validate={[inputStringRequired]}
            />
          </div>
          <div className="col-md-4">
            <Field
              name="file.active"
              label="Requerir archivos"
              type="checkbox"
              component={BootstrapSwitchField}
              validate={[]}
            />
          </div>
          <div className="col-md-8">
            <Field
              name="file.required"
              label="Archivos obligatorios"
              type="checkbox"
              component={BootstrapSwitchField}
              validate={[]}
            />
          </div>
          <div className="col-md-12" style={{marginTop: '10px'}}>
            <h4>Preguntas personalizadas</h4>
          </div>
          <FieldArray
            props={{}}
            name="questions"
            component={renderQuestion}
          />
          {
            submitFailed && valid === false &&
            <div className="col-md-12">
              <div
                className="alert alert-danger"
                style={{marginTop: '20px'}}
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

const ReasonForm = reduxForm({
  form: 'reasonForm'
})(Form);

const mapStateToProps = (state: { reasons: IReasonsState }) => {
  return {
    reasons: state.reasons
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch
  };
};

export default connect<{ reasons: IReasonsState }, { dispatch: any }, IPropsType | {}>(mapStateToProps, mapDispatchToProps)(ReasonForm);
