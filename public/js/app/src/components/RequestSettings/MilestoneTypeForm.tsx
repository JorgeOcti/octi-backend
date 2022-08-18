import * as Raven from 'raven-js';
import * as React from 'react';
import { ErrorInfo } from 'react';
import { connect } from 'react-redux';
import { Field, InjectedFormProps, reduxForm } from 'redux-form';
import { IReasonsState } from '../../actions/reasons.types';
import InputField from '../Utils/forms/InputField';
import { inputStringRequired } from '../Utils/forms/validations';
import CheckBoxField from "../Utils/forms/CheckBoxField";
import Checkbox from "../Utils/CheckBox";

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
          <div className='col-md-12' style={{ backgroundColor: '#fff', paddingBottom: '13px' }}>
            <Field
              name='needMarkBorder'
              label='Necesita marcar pasó por pórtico?'
              placeholder='Activo'
              type='checkbox'
              component={CheckBoxField}
              props={{
                style: {
                  marginBottom: 0,
                }
              }}
              validate={[]}
            />
          </div>
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

const MilestoneTypeForm = reduxForm({
  form: 'milestoneTypeForm'
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

export default connect<{ reasons: IReasonsState }, { dispatch: any }, IPropsType | {}>(mapStateToProps, mapDispatchToProps)(MilestoneTypeForm);
