import * as React from 'react';
import { Field } from 'redux-form';
import InputField from '../../../Utils/forms/InputField';
import { inputStringRequired } from '../../../Utils/forms/validations';

interface IPropsType {
  item: string;
}

interface IStateType {
}

class FormEmailRender extends React.Component<IPropsType, IStateType> {
  public render(): React.ReactElement<IPropsType> {
    const { item } = this.props;
    return (
      <div className={`row`}>
        <div className='col-md-10'>
          <Field
            name={`${item}.config.subject`}
            label='Asunto'
            placeholder='ACTA DE ENTREGA '
            type='text'
            component={InputField}
            validate={[inputStringRequired]}
          />
        </div>
        <div className='col-md-10'>
          <Field
            name={`${item}.config.template`}
            label='Template'
            placeholder='vouchers/client-sell.pug'
            type='text'
            component={InputField}
            validate={[inputStringRequired]}
          />
        </div>
      </div>
    );
  }
}

export default FormEmailRender;
