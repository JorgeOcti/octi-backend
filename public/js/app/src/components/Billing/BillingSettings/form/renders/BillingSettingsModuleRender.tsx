import * as React from 'react';
import { Field, FieldArray, formValueSelector, WrappedFieldArrayProps } from 'redux-form';
import { connect } from 'react-redux';
import { IBillingSettingsState } from '../../../../../actions/billingSettings.types';
import BillingSectionSettingsRender from './BillingSettingsSectionRender';
import BootstrapSwitchField from '../../../../Utils/forms/BootsrapSwitchField';

export interface IBillingSettinsModuleRenderItemProps {
  billingSettings: IBillingSettingsState;
}

interface IPropsType extends WrappedFieldArrayProps<{}>, IBillingSettinsModuleRenderItemProps {
  formValues: any;
}

interface IStateType {
}

class BillingModuleRender extends React.Component<IPropsType, IStateType> {
  public render(): React.ReactElement<IPropsType> {
    const { fields, meta: { error, submitFailed }, billingSettings } = this.props;
    return (
      <div className='col-md-12'>
        <h4>Módulos</h4>
        <table style={{width: "100%"}}>
          <tbody>
          {
            fields.map((item, index) => {
              const value: any = fields.get(index);
              return (
                <React.Fragment key={index}>
                  <tr>
                    <td style={{ padding: '5px 0' }}>
                      <Field
                        name={`${item}.active`}
                        label={<div>
                          <strong>{value.name}</strong> <span className={'text-muted'}>({
                          value.subModules.map((subModule: any) => subModule.name).join(', ')
                        })</span>
                        </div>}
                        type='checkbox'
                        checked={value?.active}
                        component={BootstrapSwitchField}
                        validate={[]}
                      />

                    </td>
                  </tr>
                  <tr>
                    <td>
                      <FieldArray<IBillingSettinsModuleRenderItemProps>
                        name={`${item}.sections`}
                        component={BillingSectionSettingsRender}
                        props={{
                          billingSettings
                        }}
                      />
                    </td>
                  </tr>
                </React.Fragment>
              );
            })
          }
          </tbody>
        </table>
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

export default connect<{}, {}, IBillingSettinsModuleRenderItemProps>(mapStateToProps, mapDispatchToProps)(BillingModuleRender);
