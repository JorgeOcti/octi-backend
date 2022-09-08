import * as React from 'react';
import { Field, formValueSelector, WrappedFieldArrayProps } from 'redux-form';
import InputField from '../../../../Utils/forms/InputField';
import { inputStringRequired } from '../../../../Utils/forms/validations';
import { connect } from 'react-redux';
import { IBillingSettingsState } from '../../../../../actions/billingSettings.types';
import * as uuid from 'uuid';

export interface IBillingSettinsSectionRenderItemProps {
  billingSettings: IBillingSettingsState;
}

interface IPropsType extends WrappedFieldArrayProps<{}>, IBillingSettinsSectionRenderItemProps {
  formValues: any;
}

interface IStateType {
}

class BillingSectionRender extends React.Component<IPropsType, IStateType> {
  public render(): React.ReactElement<IPropsType> {
    const { fields, meta: { error, submitFailed }, billingSettings } = this.props;
    return (
      <React.Fragment>
        <table className={"table"} width={'100%'}>
          <thead>
            <tr>
              <th>Tramo</th>
              <th>Desde</th>
              <th>Hasta</th>
              <th>Precio</th>
              <th>Texto</th>
              <th></th>
            </tr>
          </thead>
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
                      placeholder=''
                      type='text'
                      component={InputField}
                      validate={[inputStringRequired]}
                       props={{
                         labelOff: true
                       }}
                    />
                  </td>
                  <td className={'form-group-no-margin'} style={{ padding: '5px' }}>
                    <Field
                      name={`${item}.start`}
                      label=''
                      placeholder=''
                      type='number'
                      component={InputField}
                      validate={[inputStringRequired]}
                      props={{
                        labelOff: true
                      }}
                    />
                  </td>
                  <td className={'form-group-no-margin'} style={{ padding: '5px' }}>
                    <Field
                      name={`${item}.end`}
                      label=''
                      placeholder=''
                      type='number'
                      component={InputField}
                      validate={[inputStringRequired]}
                      props={{
                        labelOff: true
                      }}
                    />
                  </td>
                   <td className={'form-group-no-margin'} style={{ padding: '5px' }}>
                    <Field
                      name={`${item}.price`}
                      label=''
                      placeholder=''
                      type='number'
                      component={InputField}
                      validate={[inputStringRequired]}
                      props={{
                        labelOff: true
                      }}
                    />
                  </td>
                  <td className={'form-group-no-margin'} style={{ padding: '5px' }}>
                    <Field
                      name={`${item}.text`}
                      label=''
                      placeholder=''
                      type='text'
                      component={InputField}
                      // validate={[inputStringRequired]}
                       props={{
                         labelOff: true
                       }}
                    />
                  </td>
                  <td style={{paddingTop: "5px", width: "10px"}}>
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
              <i className='fa fa-plus' /> Agregar Tramo
            </button>
          </div>
        </div>
      </React.Fragment>
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

export default connect<{}, {}, IBillingSettinsSectionRenderItemProps>(mapStateToProps, mapDispatchToProps)(BillingSectionRender);
