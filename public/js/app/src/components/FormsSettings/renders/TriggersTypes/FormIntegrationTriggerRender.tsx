import * as React from 'react';
import { Field } from 'redux-form';
import InputField from '../../../Utils/forms/InputField';
import { inputStringRequired } from '../../../Utils/forms/validations';
import TextAreaField from '../../../Utils/forms/TextAreaField';
import SelectField from '../../../Utils/forms/SelectField';

interface IPropsType {
  item: string;
}

interface IStateType {
}

class FormIntegrationTriggerRender extends React.Component<IPropsType, IStateType> {
  public render(): React.ReactElement<IPropsType> {
    const { item } = this.props;
    return (
      <div className={`row`}>
        <div className='col-md-10'>
          <Field
            name={`${item}.config.url`}
            label='URL'
            placeholder='https://api.osacontrol.com'
            type='text'
            component={InputField}
            validate={[inputStringRequired]}
          />
        </div>
        <div className='col-md-10'>
           <Field
            name={`${item}.config.method`}
            label='Tipo *'
            component={SelectField}
            validate={[inputStringRequired]}
          >
            <option value={''} disabled={true}>Seleccione</option>
            <option value={'post'}>post</option>
          </Field>
        </div>
        <div className='col-md-10'>
          <Field
            name={`${item}.config.header`}
            label='Header'
            placeholder='Authorization: API-KEY 71fMfsbE6PRamEZrK5iw6TiD1iN416yM'
            type='text'
            component={InputField}
            validate={[]}
          />
        </div>
        <div className='col-md-10'>
          <Field
            name={`${item}.config.body`}
            label='Payload'
            placeholder='{"action": "hook"}'
            component={TextAreaField}
            type='text'
            rows={4}
            props={{
              resize: 'none'
            }}
          />
        </div>
      </div>
    );
  }
}

export default FormIntegrationTriggerRender;
