import * as React from 'react';
import { Field, getFormSyncErrors, getFormValues, getFormMeta, WrappedFieldArrayProps } from 'redux-form';
import { connect } from 'react-redux';
import InputField from '../../../Utils/forms/InputField';
import { inputStringRequired } from '../../../Utils/forms/validations';
import ShowIf from '../../../Utils/ShowIf';
import MultiUploadFiles, { imageStatus } from '../../../Utils/MultiUploadFiles';
import { IReason } from '../../../../../../../../src/request/interfaces/reason.interface';
import BootstrapSelectField from '../../../Utils/forms/BootstrapSelectField';
import * as swal from 'sweetalert';
import ImageLazyLoad from '../../../Utils/ImageLazyLoad';
import InputHiddenField from '../../../Utils/forms/InputHiddenField';


export interface IRenderItemProps {
}

interface IPropsType extends WrappedFieldArrayProps<{}>, IRenderItemProps {
  reasons: any[],
  syncErrors: any;
  formValues: any;
  updateFileCache: any;
  filesCache: Dictionary<any>
  query: any;
  submitFailed: any;
  valid: any;
  loading: boolean;
  autofill(field: string, value: any): void;
}


interface IStateType {
  error: Error | null;
  openTabs: string[];
  reasonSelectedState: Dictionary<string>;
}

class RequestCarRender extends React.Component<IPropsType, IStateType> {

  readonly state: IStateType = {
    error: null,
    openTabs: [],
    reasonSelectedState: {}
  };

  constructor(props: IPropsType) {
    super(props);
    this.toogleTab = this.toogleTab.bind(this);
  }


  public render(): React.ReactElement<IPropsType> {
    const { fields, submitFailed, valid, reasons, syncErrors, query, formValues, loading, filesCache } = this.props;
    const { openTabs, reasonSelectedState } = this.state;
    return (
      <React.Fragment>
        {
          fields.length === 0 ?
            <ShowIf condition={!loading}>
              <div className='col-md-12'>
                <p
                  className={submitFailed && !valid && !formValues.cars.length ? 'text-red text-center' : ' text-muted text-center'}
                  style={{ padding: '60px 0px  30px 0px', margin: '0' }}
                >
                  {submitFailed && !valid && !formValues.cars.length ? 'Debes agregar al menos un vehículo.' : 'No se han agregado vehículos aún.'}
                </p>
              </div>
            </ShowIf> :
            <div className='col-md-12'>
              {
                fields.map((item, index) => {
                  const value: any = fields.get(index) as any;
                  const openTab = openTabs.includes(value.key);
                  const reasonSelected: IReason | undefined = reasons.find((reason: IReason) => reason._id === reasonSelectedState[index] || reason._id === value.reason);
                  let uploadingFiles = 0;
                  let archivos = 0;
                  if (filesCache.hasOwnProperty(index)) {
                    uploadingFiles = filesCache[index].filter((file: any) => file.status !== imageStatus.complete).length;
                    archivos = filesCache[index].length;
                  }
                  let hasErrors = 0;
                  let hasFileErrors = 0;
                  if (syncErrors?.cars?.length > index) {
                    hasErrors = syncErrors?.cars[index]?.answersbkp?.filter((msg: any) => msg).length ?? 0;
                  }
                  if (reasonSelected && reasonSelected.file.active && archivos === 0) {
                    hasErrors++;
                    hasFileErrors++;
                  }
                  return (
                    <div key={value.key}>
                      <table className='table-sm' style={{ width: '100%', backgroundColor: '#f6f6f6', borderTop: '1px solid #e5e3e3' }}>
                        <tbody>
                        <tr>
                          <td className={`middle-center`}>
                            #<strong>{this.padNumber(index + 1)}</strong>
                          </td>
                          <td className={`middle form-group-no-margin`}>
                            <Field
                              name={`${item}.brand`}
                              label='Marca *'
                              type='text'
                              props={{
                                readOnly: true
                              }}
                              component={InputField}
                              validate={[inputStringRequired]}
                            />
                          </td>
                          <td className={`middle form-group-no-margin`}>
                            <Field
                              name={`${item}.denomination`}
                              label='Modelo *'
                              type='text'
                              props={{
                                readOnly: true
                              }}
                              component={InputField}
                              validate={[inputStringRequired]}
                            />
                          </td>
                          <td className={`middle form-group-no-margin`}>
                            <Field
                              name={`${item}.material`}
                              label='Material *'
                              type='text'
                              props={{
                                readOnly: true
                              }}
                              component={InputField}
                              validate={[inputStringRequired]}
                            />
                          </td>
                          <td className={`middle form-group-no-margin`}>
                            <Field
                              name={`${item}.color`}
                              label='Color *'
                              type='text'
                              // input={{
                              //   disabled: true
                              // }}
                              component={InputField}
                              validate={[inputStringRequired]}
                            />
                          </td>
                          <td className={`middle form-group-no-margin`}>
                            <Field
                              name={`${item}.reason`}
                              label='Motivo *'
                              // labelOff={true}
                              component={BootstrapSelectField}
                              validate={[inputStringRequired]}
                              props={{
                                noneSelectedText: 'Seleccione...',
                                displayItems: 2,
                                selectedText: 'sucursal seleccionadas.',
                                autoClouse: true,
                                sm: true,
                                disabled: true,
                                allOption: false,
                                search: true,
                                options: [
                                  ...reasons.map((reason) => ({
                                    value: reason._id,
                                    text: reason.name
                                  }))
                                ],
                                onClick: (value: string) => {
                                  this.setState({
                                    reasonSelectedState: {
                                      ...this.state.reasonSelectedState,
                                      [index]: value
                                    }
                                  });
                                  this.props.autofill(`${item}.reason`, value);
                                }
                              }}
                            >
                            </Field>
                          </td>
                          <td className={`middle-center`} style={{ width: '50px', paddingTop: '19px' }}>
                            <button
                              type='button'
                              className='btn btn-sm btn-danger'
                              onClick={() => {
                                fields.remove(index);
                              }}
                            >
                              <i className='fa fa-trash' />
                            </button>
                          </td>
                          <ShowIf condition={!!(reasonSelected && reasonSelected.questions.length)}>
                            <td
                              className={`middle-center pointer`}
                              style={{ width: '40px', padding: '10px 20px 7px 3px' }}
                              onClick={() => this.toogleTab(value.key)}
                            >
                              {
                                openTab ? <i className='fa fa-chevron-up' /> : <i className='fa fa-chevron-down' />
                              }
                            </td>
                          </ShowIf>
                        </tr>
                        </tbody>
                      </table>
                      <ShowIf condition={!!hasErrors}>
                        <div style={{ padding: '5px 10px ' }} className={submitFailed && !valid?'text-sm bg-red text-primary':'text-sm bg-warning text-warning'}>
                          <i className='fa fa-fw fa-info-circle'/> Quedan {hasErrors} datos adicionales obligatorios sin completar.
                        </div>
                      </ShowIf>
                      <div
                        className='form-horizontal form-group-no-margin table-sm'
                        style={{ backgroundColor: 'rgba(251, 251, 251, 1)', padding: '30px 20px', display: openTab ? '' : 'none' }}>
                        <ShowIf condition={!!(reasonSelected && reasonSelected.questions.length)}>
                          {
                            reasonSelected?.questions.map((question, index) => {
                              return (
                                <div className='form-group' key={question._id}>
                                  <label
                                    htmlFor='color'
                                    className='col-sm-3 col-lg-2 control-label label-left text-ellipsis'
                                  >
                                    {question.name} {question.required ? '*' : ''}
                                  </label>
                                  <div className='col-sm-8 col-lg-8 form-group-no-margin'>
                                    <Field
                                      name={`${item}.answersbkp[${index}]`}
                                      type='text'
                                      sm
                                      props={{
                                        onChange: (e: any) => {
                                          this.props.autofill(`${item}.answersbkp[${index}]`, e.target.value);
                                          this.props.autofill(`${item}.answers[${index}]`, {
                                            questionId: question._id,
                                            answer: e.target.value
                                          });
                                        },
                                        readOnly: query.hasOwnProperty(question._id)
                                      }}
                                      labelOff={true}
                                      component={InputField}
                                      validate={question.required ? [inputStringRequired] : []}
                                    />
                                  </div>
                                  <div className='col-md-1 col-lg-2' />
                                </div>
                              );
                            })
                          }
                        </ShowIf>
                        <ShowIf condition={!!(reasonSelected && reasonSelected.file.active)}>
                          <div className='form-group'>
                            <label className='col-sm-3 col-lg-2 control-label label-left'>Archivos *</label>
                            <div className={`col-sm-8 col-lg-8`}>
                              <Field
                                name={`${item}.files`}
                                type='hidden'
                                labelOff={true}
                                component={InputHiddenField}
                                validate={reasonSelected?.file?.required ? [inputStringRequired] : []}
                              />
                              <MultiUploadFiles
                                url={'/api/v1/requests/upload-file/'}
                                className={submitFailed && !valid && !!hasFileErrors ? 'multi-upload-errors' : ''}
                                onChange={(filesStorage) => {
                                  // console.log('filesStorage.onChange', filesStorage)
                                  this.props.updateFileCache({
                                    ...filesCache,
                                    [index]: filesStorage
                                  });
                                  // this.setState({
                                  //   files: {
                                  //     ...this.state.files,
                                  //     [index]: filesStorage
                                  //   }
                                  // });
                                  this.props.autofill(`${item}.files`, filesStorage);
                                }}
                                files={filesCache[index] ?? []}
                              />
                              <ShowIf condition={submitFailed && !valid && !!hasFileErrors}>
                                <span className="help-block text-red">Este campo es requerido</span>
                              </ShowIf>
                            </div>
                            <div className='col-md-1 col-lg-2' />
                          </div>
                        </ShowIf>
                      </div>
                      <ShowIf condition={!!uploadingFiles}>
                        <div style={{ padding: '5px 10px ' }} className='text-sm bg-primary text-primary '>
                          <i className='fa fa-fw fa-spinner fa-spin' /> Subiendo {uploadingFiles} archivos de {archivos}
                        </div>
                      </ShowIf>
                      {/*<ShowIf condition={!!hasErrors && !openTab}>*/}
                    </div>
                  );
                })
              }
            </div>
        }
      </React.Fragment>
    );
  }

  private toogleTab(key: string) {
    const { openTabs } = this.state;
    if (openTabs.includes(key)) {
      this.setState({
        openTabs: [...openTabs.filter(tab => tab !== key)]
      });
    } else {
      this.setState({
        openTabs: [...openTabs, key]
      });
    }
  }

  private padNumber(n: number): string {
    const s = '000' + n;
    return s.substr(s.length - 3);
  }
}

const mapStateToProps = (state: any) => {
  return {
    // formValues: getFormValues('requestForm')(state),
    syncErrors: getFormSyncErrors('requestForm')(state),
    meta: getFormMeta('requestForm')(state)
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch
  };
};


export default connect<{}, {}, IRenderItemProps>(mapStateToProps, mapDispatchToProps)(RequestCarRender);
