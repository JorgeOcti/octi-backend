import * as React from 'react';
import { Field } from 'redux-form';
import InputField from '../../../Utils/forms/InputField';
import { inputStringRequired } from '../../../Utils/forms/validations';
import CheckBoxField from "../../../Utils/forms/CheckBoxField";

interface IPropsType {
  item: string;
  value: any;
}

interface IStateType {
}

class FormEmailTriggerRender extends React.Component<IPropsType, IStateType> {
  public render(): React.ReactElement<IPropsType> {
    const { item, value } = this.props;
    return (
      <div className={`row`}>
        <div className='col-md-10'>
          <Field
            name={`${item}.config.subject`}
            label='Asunto del correo'
            placeholder='ACTA DE ENTREGA '
            type='text'
            component={InputField}
            validate={[inputStringRequired]}
          />
        </div>
        <div className='col-md-10'>
          <Field
            name={`${item}.config.template`}
            label='Template del correo'
            placeholder='vouchers/client-sell.pug'
            type='text'
            component={InputField}
            validate={[inputStringRequired]}
          />
        </div>
        <div className='col-md-10'>
          <Field
            name={`${item}.config.responsible`}
            label='Enviar a responsables de sucursales'
            type='checkbox'
            component={CheckBoxField}
            validate={[]}
          />
        </div>
        { !value.config.responsible ?
          <>
          <div className='col-md-10'>
            <Field
              name={`${item}.config.fullname`}
              label='ID pregunta con nombre / campo del usuario que responde / nombre fijo'
              placeholder=''
              type='text'
              component={InputField}
              validate={[inputStringRequired]}
            />
          </div>
          <div className='col-md-10'>
            <Field
              name={`${item}.config.email`}
              label='ID pregunta con email / campo del usuario que responde / email fijo'
              placeholder='example@email.com'
              type='text'
              component={InputField}
              validate={[inputStringRequired]}
            />
          </div>
        </> : null }
      </div>
    );
  }
}

export default FormEmailTriggerRender;
