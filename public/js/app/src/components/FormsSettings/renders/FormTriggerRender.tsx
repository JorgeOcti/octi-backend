import * as React from 'react';
import { Field, formValueSelector, WrappedFieldArrayProps } from 'redux-form';
import { connect } from 'react-redux';
import { IFormsState } from '../../../actions/form.types';
import InputField from '../../Utils/forms/InputField';
import { inputStringRequired } from '../../Utils/forms/validations';
import CheckBoxField from '../../Utils/forms/CheckBoxField';
import SelectField from '../../Utils/forms/SelectField';
import { KindTrigger } from '../../../../../../../src/form/models/trigger.model';
import FormFileTriggerRender from './TriggersTypes/FormFileTriggerRender';
import FormEmailTriggerRender from './TriggersTypes/FormEmaiTriggerRender';
import FormRequestTriggerRender from './TriggersTypes/FormRequestTriggerRender';
import ShowIf from '../../Utils/ShowIf';
import FormIntegrationTriggerRender from './TriggersTypes/FormIntegrationTriggerRender';
import * as uuid from 'uuid';


export interface IFormTriggerRenderItemItemProps {
  forms: IFormsState;
}

interface IPropsType extends WrappedFieldArrayProps<{}>, IFormTriggerRenderItemItemProps {
  formValues: any;
}

interface IStateType {
  error: Error | null;
  openTabs: string[];
}

class FormTriggerRender extends React.Component<IPropsType, IStateType> {

  readonly state: IStateType = {
    error: null,
    openTabs: []
  };

  constructor(props: IPropsType) {
    super(props);
  }

  public render(): React.ReactElement<IPropsType> {
    const { fields, meta: { error, submitFailed }, forms } = this.props;
    const { openTabs } = this.state;
    return (
      <React.Fragment>
        <h4>Triggers</h4>
        <ShowIf condition={!fields?.length}>
          <div className='row'>
            <div className='col-md-12'>
              <p
                className='text-center text-muted'
                style={{ padding: '20px 0' }}
              >
                No hay triggers para agregar uno <a href='javascript:void(0)'
                                                    onClick={() => fields.push({
                                                      tid: uuid.v4(),
                                                      enabled: true,
                                                      config: { method: 'post' }
                                                    })}>haz click aquí.</a>
              </p>
            </div>
          </div>
        </ShowIf>
        {
          fields.map((item, index) => {
            const value: any = fields.get(index);
            const openTab = openTabs.includes(value._id ?? value.tid);
            return (
              <div className='row' key={index} style={{paddingTop: '10px'}}>
                <div className='col-md-4' style={{backgroundColor: '#fff'}}>
                  <Field
                    name={`${item}.name`}
                    label='Nombre *'
                    placeholder='Nombre'
                    type='text'
                    component={InputField}
                    validate={[inputStringRequired]}
                  />
                </div>
                <div className='col-md-4' style={{backgroundColor: '#fff'}}>
                  <Field
                    name={`${item}.kind`}
                    label='Tipo *'
                    component={SelectField}
                    validate={[inputStringRequired]}
                  >
                    <option value={''} disabled={true}>Seleccione</option>
                    <option key={KindTrigger.file} value={KindTrigger.file}>Archivo</option>
                    <option key={KindTrigger.email} value={KindTrigger.email}>Correo</option>
                    <option key={KindTrigger.request} value={KindTrigger.request}>Estado solicitudes</option>
                    <option key={KindTrigger.integration} value={KindTrigger.integration}>Integraciones</option>
                  </Field>
                </div>
                <div className='col-md-2' style={{backgroundColor: '#fff', paddingBottom: '13px'}}>
                  <Field
                    name={`${item}.enabled`}
                    label='Activo'
                    placeholder='Activo'
                    type='checkbox'
                    component={CheckBoxField}
                    props={{
                      style: {
                        marginBottom: 0,
                        marginTop: '30px'
                      }
                    }}
                    validate={[]}
                  />
                </div>
                <div
                  className={`col-md-2 pointer text-right`}
                  style={{ paddingTop: '30px', paddingBottom: '10px', backgroundColor: '#fff' }}
                >
                  <ul className="list-inline">
                    <li onClick={() => fields.remove(index)} style={{padding: '0 10px'}}>
                      <i className='fa fa-minus-circle text-red' />
                    </li>
                    <li onClick={() => this.toogleTab(value._id ?? value.tid)} style={{padding: '0 10px'}}>
                      {
                        openTab ? <i className='fa fa-chevron-up' /> : <i className='fa fa-chevron-down' />
                      }
                    </li>
                  </ul>
                </div>
                <ShowIf condition={openTab}>
                  <div
                    className='col-md-12'
                    style={{ backgroundColor: '#f4f4f4', paddingTop: '10px', paddingBottom: '10px' }}
                  >
                    <ShowIf condition={KindTrigger.file === value.kind}>
                      <FormFileTriggerRender item={item} />
                    </ShowIf>
                    <ShowIf condition={KindTrigger.email === value.kind}>
                      <FormEmailTriggerRender item={item} />
                    </ShowIf>
                    <ShowIf condition={KindTrigger.request === value.kind}>
                      <FormRequestTriggerRender item={item} forms={forms} />
                    </ShowIf>
                    <ShowIf condition={KindTrigger.integration === value.kind}>
                      <FormIntegrationTriggerRender item={item} />
                    </ShowIf>
                    <ShowIf condition={!value.kind}>
                      <span className={"text-muted"}>Seleccione un tipo</span>
                    </ShowIf>
                  </div>
                </ShowIf>
              </div>
            );
          })
        }
        <div className='row' style={{padding: '15px 0'}}>
          <div className='col-md-12 text-right'>
            <button
              className='btn btn-sm btn-success'
              onClick={() => fields.push({
                tid: uuid.v4(),
                enabled: true,
                config: { method: 'post' } }
              )}
            >
              <i className='fa fa-plus' /> Agregar trigger
            </button>
          </div>
        </div>
        {submitFailed && error && <span>{error}</span>}
      </React.Fragment>
    );
  }

  private toogleTab(id: string) {
    const { openTabs } = this.state;
    if (openTabs.includes(id)) {
      this.setState({
        openTabs: [...openTabs.filter(tab => tab !== id)]
      });
    } else {
      this.setState({
        openTabs: [...openTabs, id]
      });
    }
  }
}

const mapStateToProps = (state: { forms: IFormsState }) => {
  const selector = formValueSelector('formTypeForm');
  return {
    formValues: selector(state, 'all.origin', 'all.destination'),
    forms: state.forms
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch
  };
};

export default connect<{}, {}, IFormTriggerRenderItemItemProps>(mapStateToProps, mapDispatchToProps)(FormTriggerRender);
