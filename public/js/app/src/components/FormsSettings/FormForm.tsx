import * as Raven from 'raven-js';
import * as React from 'react';
import { ErrorInfo } from 'react';
import { connect } from 'react-redux';
import { Field, FieldArray, InjectedFormProps, reduxForm } from 'redux-form';
import { IFormsState } from '../../actions/form.types';
import InputField from '../Utils/forms/InputField';
import { inputStringRequired } from '../Utils/forms/validations';
import FormTriggerRenderItem, { IFormTriggerRenderItemItemProps } from './renders/FormTriggerRender';

interface IPropsType extends InjectedFormProps {
  update: boolean;
  forms: IFormsState;
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
    const { handleSubmit, valid , submitFailed, forms} = this.props;
    return (
      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-12">
            <Field
              name="name"
              label="Nombre *"
              placeholder="Nombre"
              type="text"
              component={InputField}
              validate={[inputStringRequired]}
            />
          </div>
          <div className='col-md-12'>
            <FieldArray<IFormTriggerRenderItemItemProps>
              name='triggers'
              component={FormTriggerRenderItem}
              props={{
                forms
              }}
            />
          </div>
          {
            submitFailed && !valid &&
            <div className="col-md-12">
              <div
                className="alert alert-danger"
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

const FormForm = reduxForm({
  form: 'formForm'
})(Form);

const mapStateToProps = (state: { forms: IFormsState }) => {
  return {
    forms: state.forms
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch
  };
};

export default connect<{ forms: IFormsState }, { dispatch: any }, IPropsType | {}>(mapStateToProps, mapDispatchToProps)(FormForm);
