import * as React from 'react';
import { Field, formValueSelector, WrappedFieldArrayProps } from 'redux-form';
import InputField from '../../../../Utils/forms/InputField';
import { inputStringRequired } from '../../../../Utils/forms/validations';
import { connect } from 'react-redux';
import { IBillingSettingsState } from '../../../../../actions/billingSettings.types';
import * as uuid from 'uuid';

export interface IBillingSettinsNotificationRenderItemProps {
  billingSettings: IBillingSettingsState;
}

interface IPropsType extends WrappedFieldArrayProps<{}>, IBillingSettinsNotificationRenderItemProps {
  formValues: any;
}

interface IStateType {
}

class BillingNotificationRender extends React.Component<IPropsType, IStateType> {
  public render(): React.ReactElement<IPropsType> {
    const { fields, meta: { error, submitFailed }, billingSettings } = this.props;
    return (
      <div className='col-md-12'>
        <h4>Notificaciones</h4>
        <table width={'100%'}>
          <tbody>
          {
            fields.map((item, index) => {
              const value: any = fields.get(index);
              // console.log(value);
              return (
                <tr key={index}>
                  <td className={'form-group-no-margin'} style={{ padding: '5px' }}>
                    <Field
                      name={`${item}.name`}
                      label='Nombre *'
                      placeholder='Nombre'
                      type='text'
                      component={InputField}
                      validate={[inputStringRequired]}
                    />
                  </td>
                  <td className={'form-group-no-margin'} style={{ padding: '5px' }}>
                    <Field
                      name={`${item}.email`}
                      label='Email *'
                      placeholder='Email'
                      type='text'
                      component={InputField}
                      validate={[inputStringRequired]}
                    />
                  </td>
                  <td style={{paddingTop: "10px", width: "10px"}}>
                    <button className={"btn btn-sm btn-danger"} onClick={(e) => {
                      e.preventDefault();
                      fields.remove(index);
                    }}>
                      <i className='fa fa-minus-circle' />
                    </button>
                  </td>
                </tr>
              );
            })
          }
          </tbody>
        </table>
        <div className='row'>
          <div className='col-md-12 text-right'>
            <button
              className='btn btn-sm btn-success'
              onClick={(e) => {
                e.preventDefault();
                fields.push({
                  tid: uuid.v4(),
                  enabled: true
                });
              }}
            >
              <i className='fa fa-plus' /> Agregar Destinatario
            </button>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: { billingSettings: IBillingSettingsState }) => {
  const selector = formValueSelector('formTypeForm');
  return {
    formValues: selector(state, 'all.origin', 'all.destination'),
    billingSettings: state.billingSettings
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch
  };
};

export default connect<{}, {}, IBillingSettinsNotificationRenderItemProps>(mapStateToProps, mapDispatchToProps)(BillingNotificationRender);
