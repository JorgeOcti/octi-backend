import * as React from 'react';
import {autofill, Field, getFormValues, InjectedFormProps, WrappedFieldArrayProps} from 'redux-form';
import { inputStringRequired } from '../../../Utils/forms/validations';
import { IFormsState } from '../../../../actions/form.types';
import { connect } from 'react-redux';
import { IFormTriggerRenderItemItemProps } from '../FormTriggerRender';
import BootstrapSelectField from "../../../Utils/forms/BootstrapSelectField";
import {Dispatch} from "redux";
import {get} from "lodash";

interface IPropsType {

  dispatch: Dispatch<any>;
  item: string;
  forms: IFormsState;
}


interface IPropsFullType {
  formValues?: any;
  dispatch?: Dispatch<any>;
  item: string;
  forms: IFormsState;
}


interface IStateType {
}

class FormTransmittalTriggerRender extends React.Component<IPropsFullType, IStateType> {
  public render(): React.ReactElement<IPropsFullType> {
    const { item, forms: {milestoneTypes} } = this.props;
    return (
      <div className={`row`}>
        <div className='col-md-10'>
          <Field
            name={`${item}.config.transmittalTypes`}
            label='Tipo de Hito en el/los cual(es) intenta cerrar la OT *'
            component={BootstrapSelectField}
            validate={[inputStringRequired]}
            props={{
              noneSelectedText: 'Selecciona un tipo',
              selectedText: 'tipo seleccionad0.',
              autoClouse: false,
              sm: true,
              allOption: true,
              search: true,
              options: [
                ...milestoneTypes.map((milestoneType) => ({
                  value: milestoneType._id,
                  text: milestoneType.name
                }))
              ],
              selectAll: (all: boolean) => {
                this.props.dispatch!!(autofill('formForm', `${item}.config.transmittalTypes`, all ? milestoneTypes.map(mT => mT._id) : []))
              },
              onClick: (value: string) => {
                let currentValue = get(this.props.formValues!!, `${item}.config.transmittalTypes`) ?? [];
                if (currentValue.includes(value))
                  currentValue = currentValue.filter((v: string) => v !== value)
                else
                  currentValue.push(value)
                this.props.dispatch!!(autofill('formForm', `${item}.config.transmittalTypes`, currentValue))
              }
            }}
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: any) => {
  return {
    formValues: getFormValues('formForm')(state),
    forms: state.forms
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch
  };
};

export default connect<{}, {}, IFormTriggerRenderItemItemProps>(mapStateToProps, mapDispatchToProps)(FormTransmittalTriggerRender);
