import * as React from 'react';
import { Field } from 'redux-form';
import { inputStringRequired } from '../../../Utils/forms/validations';
import SelectField from '../../../Utils/forms/SelectField';
import { IFormsState } from '../../../../actions/form.types';
import { connect } from 'react-redux';
import { IFormTriggerRenderItemItemProps } from '../FormTriggerRender';

interface IPropsType {
  item: string;
  forms: IFormsState;
}

interface IStateType {
}

class FormRequestTriggerRender extends React.Component<IPropsType, IStateType> {
  public render(): React.ReactElement<IPropsType> {
    const { item, forms: {requestStatus} } = this.props;
    return (
      <div className={`row`}>
        <div className='col-md-10'>
          <Field
            name={`${item}.config.requestItemStatus`}
            label='Tipo *'
            component={SelectField}
            validate={[inputStringRequired]}
          >
            <option value={''} disabled={true}>Seleccione</option>
            {
              requestStatus.map((status) => (
                <option key={status._id} value={status._id}>{status.name}</option>
              ))
            }
          </Field>
        </div>
      </div>
    );
  }
}

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

export default connect<{}, {}, IFormTriggerRenderItemItemProps>(mapStateToProps, mapDispatchToProps)(FormRequestTriggerRender);
