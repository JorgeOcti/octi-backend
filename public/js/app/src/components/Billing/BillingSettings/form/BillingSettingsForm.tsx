import * as Raven from 'raven-js';
import * as React from 'react';
import { ErrorInfo } from 'react';
import { connect } from 'react-redux';
import { autofill, Field, FieldArray, formValueSelector, getFormValues, InjectedFormProps, reduxForm } from 'redux-form';

import InputField from '../../../Utils/forms/InputField';
import { inputStringRequired } from '../../../Utils/forms/validations';
import { IBillingSettingsState } from '../../../../actions/billingSettings.types';
import BillingNotificationRender, { IBillingSettinsNotificationRenderItemProps } from './renders/BillingSettingsNotificationRender';
import BillingModuleRender, { IBillingSettinsModuleRenderItemProps } from './renders/BillingSettingsModuleRender';
import BootstrapSelectField from '../../../Utils/forms/BootstrapSelectField';
import BillingSettingsActions from '../../../../actions/billingSettings.actions';
import JsonFormatter from 'react-json-formatter';
import ShowIf from '../../../Utils/ShowIf';


interface IPropsType extends InjectedFormProps {
  formValues: any;
  update: boolean;
  billingSettings: IBillingSettingsState;
  billingSettingsActions: BillingSettingsActions;
}

interface IStateType {
  change: boolean;
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
    const { handleSubmit, valid, submitFailed, billingSettings, billingSettingsActions, formValues } = this.props;
    return (
      <form onSubmit={handleSubmit}>
        <div className='row'>
          {/*<div className='col-md-12 form-group-no-margin'>
            <Field
              name='name'
              label='Nombre *'
              placeholder='Nombre'
              type='text'
              component={InputField}
              validate={[inputStringRequired]}
            />
          </div>*/}
          <div className='col-md-12 form-group-no-margin'>
            <Field
              name='businessName'
              label='Razón social *'
              placeholder='Razón social'
              type='text'
              component={InputField}
              validate={[inputStringRequired]}
            />
          </div>
          <div className='col-md-12 form-group-no-margin'>
            <Field
              name='rut'
              label='RUT *'
              placeholder='RUT'
              type='text'
              component={InputField}
              validate={[inputStringRequired]}
            />
          </div>
          <div className='col-md-12 form-group-no-margin'>
            <Field
              name='baseCost'
              label='Costo Base'
              type='number'
              component={InputField}
            />
          </div>
          <div className='col-md-12 form-group-no-margin'>
            <Field
              name='textBaseCost'
              label='Texto Costo Base'
              type='text'
              component={InputField}
            />
          </div>
          <div className='col-md-12 form-group-no-margin'>
            <Field
            name={`companies`}
            label='Empresas *'
            component={BootstrapSelectField}
            validate={[inputStringRequired]}
            props={{
              noneSelectedText: 'Seleccione empresas',
              selectedText: 'empresas seleccionadas.',
              autoClouse: false,
              sm: true,
              displayItems: 3,
              allOption: false,
              search: true,
              options: billingSettings.companies.map(company => ({
                value: company._id,
                text: `${company?.team?.name} - ${company.name}`
              })),
              selectAll: (all: boolean) => {
                /*this.props.dispatch!!(autofill('formForm', `${item}.config.transmittalTypes`, all ? milestoneTypes.map(mT => mT._id) : []))*/
              },
              onClick: (value: string) => {
                let currentValue = formValues?.companies ?? [];
                if (currentValue?.includes(value)) {
                  currentValue = currentValue.filter((v: string) => v !== value);
                } else {
                  currentValue.push(value);
                }
                billingSettingsActions.autofill(`companies`, currentValue);
                this.setState({ change: true });
              }
            }}
            />
          </div>

          <FieldArray<IBillingSettinsModuleRenderItemProps>
            name='modules'
            component={BillingModuleRender}
            props={{
              billingSettings
            }}
          />

          <ShowIf condition={false}>
            <div className='col-md-12'>
            <JsonFormatter
              json={JSON.stringify(billingSettings.modules)}
              jsonStyle={{
                propertyStyle: { color: 'red' },
                stringStyle: { color: 'green' },
                numberStyle: { color: 'darkorange' }
              }}
            />
            </div>
          </ShowIf>

          <FieldArray<IBillingSettinsNotificationRenderItemProps>
            name='notifications'
            component={BillingNotificationRender}
            props={{
              billingSettings
            }}
          />

          {
            submitFailed && !valid &&
            <div className='col-md-12'>
              <div
                className='alert alert-danger'
                style={{marginTop: '10px'}}
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

const BillingSettingsForm = reduxForm({
  form: 'billingSettingsForm'
})(Form);

const mapStateToProps = (state: { billingSettings: IBillingSettingsState, router: any }) => {
  return {
    formValues:  getFormValues('billingSettingsForm')(state),
    billingSettings: state.billingSettings
  };
};

const mapDispatchToProps = (dispatch: any) => {
  const billingSettingsActions = new BillingSettingsActions(dispatch);
  return {
    billingSettingsActions,
    dispatch
  };
};

export default connect<{ billingSettings: IBillingSettingsState }, { dispatch: any }, IPropsType | {}>(mapStateToProps, mapDispatchToProps)(BillingSettingsForm);
