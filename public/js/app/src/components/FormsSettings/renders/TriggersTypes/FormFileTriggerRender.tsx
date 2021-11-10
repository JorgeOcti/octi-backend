import * as React from 'react';
import { Field } from 'redux-form';
import InputField from '../../../Utils/forms/InputField';
import { inputStringRequired } from '../../../Utils/forms/validations';

interface IPropsType {
  item: string;
}

interface IStateType {
}

class FormFileTriggerRender extends React.Component<IPropsType, IStateType> {
  public render(): React.ReactElement<IPropsType> {
    const { item } = this.props;
    return (
      <div className={`row`}>
        <div className='col-md-10'>
          <Field
            name={`${item}.config.filename`}
            label='Nombre del archivo'
            placeholder='voucher.pdf'
            type='text'
            component={InputField}
            validate={[inputStringRequired]}
          />
        </div>
        <div className='col-md-10'>
          <Field
            name={`${item}.config.template`}
            label='Template del archivo'
            placeholder='vouchers/client-sell.pug'
            type='text'
            component={InputField}
            validate={[inputStringRequired]}
          />
        </div>
        <div className='col-md-10'>
          <Field
            name={`${item}.config.signature`}
            label='ID Signature question (Si desea utilizarla en el template)'
            placeholder='618ad37fdf7f091efa6c6633'
            type='text'
            component={InputField}
            validate={[]}
          />
        </div>
      </div>
    );
  }
}

export default FormFileTriggerRender;
