import * as Raven from 'raven-js';
import * as React from 'react';
import { ErrorInfo } from 'react';
import { connect } from 'react-redux';
import { Field, InjectedFormProps, reduxForm } from 'redux-form';
import InputField from '../Utils/forms/InputField';
import { inputStringRequired } from '../Utils/forms/validations';
import { ISalesChannelState } from '../../actions/requestChannel.types';

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
          {
            submitFailed && !valid &&
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

const ChannelForm = reduxForm({
  form: 'channelForm'
})(Form);

const mapStateToProps = (state: { requestChannel: ISalesChannelState }) => {
  return {
    requestChannel: state.requestChannel
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch
  };
};

export default connect<{ requestChannel: ISalesChannelState }, { dispatch: any }, IPropsType | {}>(mapStateToProps, mapDispatchToProps)(ChannelForm);
