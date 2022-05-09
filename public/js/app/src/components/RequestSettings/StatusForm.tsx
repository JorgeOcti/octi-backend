import * as Raven from 'raven-js';
import * as React from 'react';
import { ErrorInfo } from 'react';
import { connect } from 'react-redux';
import { Field, InjectedFormProps, reduxForm } from 'redux-form';
import { IRequestStatusState } from '../../actions/requestStatus.types';
import BootstrapSwitchField from '../Utils/forms/BootsrapSwitchField';
import InputField from '../Utils/forms/InputField';
import { inputStringRequired } from '../Utils/forms/validations';

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
    const { handleSubmit, valid, submitFailed } = this.props;
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
          <div className="col-md-12">
            <Field
              name="weigth"
              label="Peso *"
              placeholder="Peso"
              type="text"
              component={InputField}
              validate={[inputStringRequired]}
            />
          </div>
          <div className="col-md-12">
            <Field
              name={`default`}
              label="Por defecto"
              type="checkbox"
              component={BootstrapSwitchField}
              validate={[]}
            />
          </div>
          {
            submitFailed && valid === false &&
            <div className="col-md-12">
              <div
                className="alert alert-danger"
                style={{ marginTop: '20px' }}
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

const StatusForm = reduxForm({
  form: 'statusForm'
})(Form);

const mapStateToProps = (state: { requestStatus: IRequestStatusState }) => {
  return {
    requestStatus: state.requestStatus
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch
  };
};

export default connect<{ requestStatus: IRequestStatusState }, { dispatch: any }, IPropsType | {}>(mapStateToProps, mapDispatchToProps)(StatusForm);