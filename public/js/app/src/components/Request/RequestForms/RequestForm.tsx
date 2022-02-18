import * as Raven from 'raven-js';
import * as React from 'react';
import { ErrorInfo } from 'react';
import { connect } from 'react-redux';
import { arrayPush, Field, FieldArray, FormErrors, getFormSyncErrors, getFormValues, InjectedFormProps, reduxForm, submit } from 'redux-form';
import { AxiosError, default as Axios } from 'axios';
import * as moment from 'moment';
import { IReason } from '../../../../../../../src/request/interfaces/reason.interface';
import { IColor } from '../../../../../../../src/app/interfaces/color.interface';
import { ISalesChannel } from '../../../../../../../src/request/interfaces/salesChannel.interface';
import { IPaymentMethod } from '../../../../../../../src/request/interfaces/paymentMethod.interface';
import { IOperationType } from '../../../../../../../src/request/interfaces/operationType.interface';
import ApiService from '../../../utils/axios';
import BootstrapSelectField from '../../Utils/forms/BootstrapSelectField';
import { inputStringRequired } from '../../Utils/forms/validations';
import InputField from '../../Utils/forms/InputField';
import { IRenderItemProps } from '../../Request/RequestForms/renders/RequestCarRender';
import RequestCarRender from './renders/RequestCarRender';
import * as uuid from 'uuid';
import DateRangePickerField from '../../Utils/forms/DateRangePickerField';
import { DecoratedFormProps } from 'redux-form/lib/reduxForm';
import InputHiddenField from '../../Utils/forms/InputHiddenField';
import ShowIf from '../../Utils/ShowIf';
import { IRequestSetting } from '../../../../../../../src/app/interfaces';
import * as  swal from 'sweetalert';
import MultiUploadFiles, { imageStatus } from '../../Utils/MultiUploadFiles';
import { requestSettings } from '../defaults';

interface IPropsType extends InjectedFormProps {
  formValues: any;
  syncErrors: any;
  dispatch: any;
  created: boolean;
  query: Dictionary<string>;
}

interface IStateType {
  filesCache: Dictionary<any>;
  error: Error | null;
  venues: any[];
  reasons: IReason[];
  colors: IColor[];
  channels: ISalesChannel[];
  paymentMethods: IPaymentMethod[];
  operationTypes: IOperationType[];
  requestSettings: IRequestSetting;
  loading: boolean;
  exist: boolean;
}

class Form extends React.Component<IPropsType, IStateType> {

  readonly api: ApiService;
  readonly state: IStateType = {
    filesCache: {},
    error: null,
    venues: [],
    reasons: [],
    colors: [],
    channels: [],
    paymentMethods: [],
    operationTypes: [],
    requestSettings,
    loading: false,
    exist: false,
  };

  constructor(props: IPropsType) {
    super(props);
    this.loadBaseData = this.loadBaseData.bind(this);
    this.addCarToForm = this.addCarToForm.bind(this);
    this.updateFileCache = this.updateFileCache.bind(this);
    this.api = new ApiService();
  }

  private updateFileCache(filesCache: Dictionary<any>){
    this.setState({filesCache})
  }

  public componentWillMount(): void {
    window.scrollTo(0, 0);
    this.loadBaseData();
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error });
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public render(): React.ReactElement<IPropsType> {
    const { handleSubmit, valid, submitFailed, query, syncErrors, formValues, created, submitting } = this.props;
    const { venues, channels, reasons, colors, loading, exist, filesCache, paymentMethods } = this.state;
    const uploadingFiles = !!Object.values(filesCache).filter((files: any) => {
      return !!files.filter((file: any) => file.status !== imageStatus.complete).length;
    }).length;
    return (
      <React.Fragment>
        <div className='container-fluid' style={{ position: 'relative', minHeight: '100vh', padding: '0 0 150px 0' }}>
          <form onSubmit={handleSubmit}>
            <div className='row' style={{ padding: '0 20px' }}>
              <div className='col-md-12'>
                <div className='row'>
                  <div className='col-md-12'>
                    <h3>Crear solicitud</h3>
                  </div>
                  <div className='col-md-12'>
                    <div className='box'>
                      <div className='box-header with-border'>
                        <h3 className='box-title'>Información de venta</h3>
                      </div>
                      <div className='box-body create-request' style={{ paddingBottom: '0' }}>
                        <div className='row'>
                          <div className='col-md-12'>
                            <table className='table-sm' style={{ width: '100%' }}>
                              <tbody>
                              <tr>
                                <td className={'middle'} style={{ width: '30%' }}>
                                  <Field
                                    name='sellerText'
                                    label='Vendedor *'
                                    type='text'
                                    props={{
                                      readOnly: true
                                    }}
                                    component={InputField}
                                    validate={[inputStringRequired]}
                                  />
                                </td>
                                <td className={'middle'} style={{ width: '25%', maxWidth: '25%' }}>
                                  <Field
                                    name='venue'
                                    label='Sucursal *'
                                    // labelOff={true}
                                    component={BootstrapSelectField}
                                    validate={[inputStringRequired]}
                                    props={{
                                      disabled: true,
                                      noneSelectedText: 'Seleccione...',
                                      displayItems: 2,
                                      selectedText: 'sucursal seleccionadas.',
                                      autoClouse: true,
                                      sm: true,
                                      allOption: false,
                                      search: true,
                                      options: [
                                        ...venues.map((venue) => ({
                                          value: venue._id,
                                          text: venue.name
                                        }))
                                      ],
                                      onClick: (value: string) => {
                                        if(formValues.venue === value){
                                          this.props.autofill('venue', "");
                                        } else{
                                          this.props.autofill('venue', value);
                                        }
                                      }
                                    }}
                                  >
                                  </Field>
                                </td>
                                <td className={'middle'} style={{ width: '25%', maxWidth: '25%' }}>
                                  <Field
                                    name='channel'
                                    label='Canal'
                                    component={BootstrapSelectField}
                                    validate={[inputStringRequired]}
                                    props={{
                                      disabled: true,
                                      noneSelectedText: 'Seleccione...',
                                      displayItems: 2,
                                      selectedText: 'canales seleccionadas.',
                                      autoClouse: true,
                                      sm: true,
                                      allOption: false,
                                      search: true,
                                      options: [
                                        ...channels.map((channel) => ({
                                          value: channel._id,
                                          text: channel.name
                                        }))
                                      ],
                                      onClick: (value: string) => {
                                        if (formValues.channel === value) {
                                          this.props.autofill('channel', '');
                                        } else {
                                          this.props.autofill('channel', value);
                                        }
                                      }
                                    }}
                                  >
                                  </Field>
                                </td>
                                <td className={'middle'} style={{ width: '20%' }}>
                                  <Field
                                    name='conectaID'
                                    // labelOff={true}
                                    label='ID Cotización Conecta *'
                                    type='text'
                                    props={{
                                      readOnly: true
                                    }}
                                    component={InputField}
                                    // validate={[inputStringRequired]}
                                  />
                                </td>
                              </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className='col-md-12'>
                    <div className='box'>
                      <div className='box-header with-border'>
                        <h3 className='box-title'>Información del cliente</h3>
                      </div>
                      <div className='box-body create-request' style={{ paddingBottom: '0' }}>
                        <table className='table-xs' style={{ width: '100%' }}>
                          <tbody>
                          <tr>
                            <td className={'middle'} style={{ width: '200px' }}>
                              <Field
                                name='customerInformation.rut'
                                label='RUT *'
                                type='text'
                                props={{
                                  readOnly: query.hasOwnProperty('5bf2de35caf8ef7096105c22')
                                }}
                                component={InputField}
                                validate={[inputStringRequired]}
                              />
                            </td>
                            <td className={'middle'}>
                              <Field
                                name='customerInformation.name'
                                label='Nombre Completo *'
                                type='text'
                                props={{
                                  readOnly: query.hasOwnProperty('5bf2de35caf8ef7096105c21')
                                }}
                                component={InputField}
                                validate={[inputStringRequired]}
                              />
                            </td>
                            <td className={'middle'} style={{ width: '30%' }}>
                              <Field
                                name='customerInformation.email'
                                label='Correo Electrónico *'
                                type='text'
                                props={{
                                  readOnly: query.hasOwnProperty('60b9232164adc90013a79b45')
                                }}
                                component={InputField}
                                validate={[inputStringRequired]}
                              />
                            </td>
                          </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  <div className='col-md-12'>
                    <div className='box'>
                      <div className='box-header with-border'>
                        <h3 className='box-title'>Datos del anticipo o la orden de compra</h3>
                      </div>
                      <div className='box-body create-request' style={{ paddingBottom: '0' }}>
                        <div className='row'>
                          <div className='col-md-12'>
                            <table className='table-xs' style={{ width: '100%' }}>
                          <tbody>
                          <tr>
                            <td className={'middle form-group-no-margin'} style={{ width: '35%' }}>
                              <Field
                                name='advancePaymentInformation.method'
                                label='Método de Pago *'
                                component={BootstrapSelectField}
                                validate={[inputStringRequired]}
                                props={{
                                  noneSelectedText: 'Seleccione...',
                                  displayItems: 2,
                                  selectedText: 'sucursal seleccionadas.',
                                  autoClouse: true,
                                  sm: true,
                                  allOption: false,
                                  search: true,
                                  options: [
                                    ...paymentMethods.map((paymentMethod) => ({
                                      value: paymentMethod._id,
                                      text: paymentMethod.name
                                    }))
                                  ],
                                  onClick: (value: string) => {
                                    if (formValues.advancePaymentInformation.method === value) {
                                      this.props.autofill('advancePaymentInformation.method', '');
                                    } else {
                                      this.props.autofill('advancePaymentInformation.method', value);
                                    }
                                  }
                                }}
                              >
                              </Field>
                            </td>
                            <td className={'middle form-group-no-margin'} style={{ width: '35%' }}>
                              <Field
                                name='advancePaymentInformation.number'
                                label='Nº de Ticket u Orden de Compra *'
                                type='text'
                                component={InputField}
                                validate={[inputStringRequired]}
                              />
                            </td>
                          </tr>
                          <tr>
                            <td className={'middle form-group-no-margin'}>
                              <div
                                className={`form-group ${submitFailed && !valid && !formValues?.advancePaymentInformation?.files?.length ? 'has-error' : ''}`}>
                                <label className='control-label text-ellipsis'>Comprobante del ticket *</label>
                                <Field
                                  name={`advancePaymentInformation.files`}
                                  type='hidden'
                                  labelOff={true}
                                  component={InputHiddenField}
                                  validate={[inputStringRequired]}
                                />
                                <MultiUploadFiles
                                  url={'/api/v1/requests/upload-file/'}
                                  className={submitFailed && !valid && !formValues?.advancePaymentInformation?.files?.length ? 'multi-upload-errors' : ''}
                                  onChange={(files) => {
                                    const lastFile = files.length ? [files[files.length - 1]] : [];
                                    this.updateFileCache({
                                      ...filesCache,
                                      ['payment']: lastFile
                                    });
                                    this.props.autofill('advancePaymentInformation.files', lastFile);
                                  }}
                                  files={filesCache.hasOwnProperty('payment') ? filesCache['payment'] : []}
                                />
                                <ShowIf condition={submitFailed && !valid && !formValues?.advancePaymentInformation?.files?.length}>
                                  <span className='help-block text-red'>Este campo es requerido</span>
                                </ShowIf>
                              </div>
                            </td>
                            <td className={'middle form-group-no-margin'}>
                              <div
                                className={`form-group ${submitFailed && !valid && !formValues?.advancePaymentInformation?.files?.length ? 'has-error' : ''}`}>
                                <label className='control-label text-ellipsis'>Subir Carta de Reserva *</label>
                                <Field
                                  name={`advancePaymentInformation.letters`}
                                  type='hidden'
                                  labelOff={true}
                                  component={InputHiddenField}
                                  validate={[inputStringRequired]}
                                />
                                <MultiUploadFiles
                                  url={'/api/v1/requests/upload-file/'}
                                  className={submitFailed && !valid && !formValues?.advancePaymentInformation?.letters?.length ? 'multi-upload-errors' : ''}
                                  onChange={(files) => {
                                    const lastFile = files.length ? [files[files.length - 1]] : [];
                                    this.updateFileCache({
                                      ...filesCache,
                                      ['letter']: lastFile
                                    });
                                    this.props.autofill('advancePaymentInformation.letters', lastFile);
                                  }}
                                  files={filesCache.hasOwnProperty('letter') ? filesCache['letter'] : []}
                                />
                                <ShowIf condition={submitFailed && !valid && !formValues?.advancePaymentInformation?.letters?.length}>
                                  <span className='help-block text-red'>Este campo es requerido</span>
                                </ShowIf>
                              </div>
                            </td>
                          </tr>
                          </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className='col-md-12'>
                    <div className='box'>
                      <div className='box-header with-border'>
                        <h3 className='box-title'>Datos de entrega</h3>
                      </div>
                      <div className='box-body create-request' style={{ paddingBottom: '0' }}>
                        <div className='row'>
                          <div className='col-md-12'>
                            <table className='table-xs' style={{ width: '100%' }}>
                              <tbody>
                              <tr>
                                <td className={'middle'} style={{ width: '25%' }}>
                                  <Field
                                    name='deliveryVenue'
                                    label='Sucursal'
                                    // labelOff={true}
                                    component={BootstrapSelectField}
                                    // validate={[inputStringRequired]}
                                    props={{
                                      noneSelectedText: 'Seleccione...',
                                      displayItems: 2,
                                      selectedText: 'transportistas seleccionadas.',
                                      autoClouse: true,
                                      sm: true,
                                      allOption: false,
                                      search: true,
                                      options: [
                                        ...venues.map((venue) => ({
                                          value: venue._id,
                                          text: venue.name
                                        }))
                                      ],
                                      onClick: (value: string) => {
                                        if(formValues.deliveryVenue === value){
                                          this.props.autofill('deliveryVenue', "");
                                        } else{
                                          this.props.autofill('deliveryVenue', value);
                                        }
                                      }
                                    }}
                                  >
                                  </Field>
                                </td>
                                <td className={'middle'} style={{ width: '50%' }}>
                                  <Field
                                    name='deliveryAddress'
                                    // labelOff={true}
                                    label='Dirección'
                                    type='text'
                                    component={InputField}
                                    // validate={[inputStringRequired]}
                                  />
                                </td>
                                <td className={'middle'} style={{ width: '25%' }}>
                                  <Field
                                    name='deliveryDate'
                                    // labelOff={true}
                                    label='Fecha'
                                    type='text'
                                    component={DateRangePickerField}
                                    props={{
                                      className: 'input-sm',
                                      format: 'DD-MM-YYYY',
                                      startDate: moment().add(1, 'days').startOf('day'),
                                      onChange: (e: any) => {
                                        this.props.autofill('deliveryDate', e?.toDate() ?? '');
                                      }
                                    }}
                                  />
                                </td>
                              </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className='col-md-12'>
                    <div className='box'>
                      <div className='box-header with-border'>
                        <h3 className={submitFailed && !valid && !formValues.cars.length ? 'text-red box-title' : 'box-title'}>Vehículos</h3>
                      </div>
                      <div className='box-body create-request no-padding'>
                        <div className='row'>
                          <FieldArray<IRenderItemProps>
                            name='cars'
                            component={RequestCarRender}
                            props={{
                              reasons,
                              colors,
                              updateFileCache: this.updateFileCache,
                              filesCache,
                              loading,
                              syncErrors,
                              submitFailed,
                              formValues,
                              valid,
                              query,
                              autofill: this.props.autofill
                            }}
                          />
                          <div className='col-md-12 text-right' style={{ padding: ' 30px' }}>
                            <button
                              className='btn btn-success btn-sm'
                              type='button'
                              onClick={this.addCarToForm}
                            >
                              <i className='fa fa-plus' /> Agregar vehículo
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/*{
                    submitFailed && !valid &&
                    <div className='col-md-12'>
                      <div
                        className='alert alert-danger m-t-20'
                      >
                        Todos los campos con * son obligatorios
                      </div>
                    </div>
                  }*/}
                  <div className='col-md-12 text-right'>
                    <ShowIf condition={uploadingFiles}>
                      <p className={"text-muted text-left"}>Espere a que se terminen de subir las imágenes para crear la solicitud.</p>
                    </ShowIf>
                    <button
                      type={'button'}
                      disabled={submitting || uploadingFiles}
                      onClick={submitting || !valid || uploadingFiles ? () => this.props.dispatch(submit('requestForm')) : () => {
                        swal({
                          title: '¿Estás seguro?',
                          text: `Vas a crear esta solicitud.`,
                          icon: 'warning',
                          dangerMode: true,
                          buttons: {
                            cancel: 'Cancelar' as any,
                            confirm: {
                              text: 'Sí'
                            }
                          }
                        }).then((willCReate: any) => {
                          if (willCReate) {
                            this.props.dispatch(submit('requestForm'));
                          }
                        });
                      }}
                      className='btn btn-primary btn-sm'
                    >
                      {submitting && <i className='fa fa-fw fa-spinner fa-spin' />} Crear solicitud
                    </button>
                  </div>
                  <Field
                    name={`cars_error`}
                    type='hidden'
                    labelOff={true}
                    component={InputHiddenField}
                  />
                </div>
              </div>
            </div>
          </form>
          <div className='text-muted text-center' style={{ position: 'absolute', bottom: '0', height: '30px', width: '100%' }}>
            Copyright (c) {moment().format('YYYY')} <a href='http://www.osacontrol.com' target='_blank'>OSA SPA</a>. All rights reserved.
          </div>
        </div>
        <ShowIf condition={loading}>
          {/*<ShowIf condition={true}>*/}
          <div style={{
            position: 'absolute',
            top: '0',
            height: '100%',
            width: '100vw',
            backgroundColor: 'rgba(246,246,246,0.4)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: '400px'
            // justifyContent: 'center'
          }}>
            <p><i className='fa fa-3x fa-circle-o-notch text-primary fa-spin' /></p>
            {/*<p style={{ padding: '20px', fontSize: '1.7rem'}}><strong>Cargando datos</strong></p>*/}
          </div>
        </ShowIf>
        <ShowIf condition={created}>
          <div style={{
            position: 'absolute',
            top: '0',
            height: '100%',
            width: '100vw',
            backgroundColor: 'rgba(246,246,246,0.4)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: '400px'
            // justifyContent: 'center'
          }}>
          </div>
        </ShowIf>
        <ShowIf condition={exist}>
          <div style={{
            position: 'absolute',
            top: '0',
            height: '100%',
            width: '100vw',
            backgroundColor: 'rgba(246,246,246,0.4)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: '400px'
            // justifyContent: 'center'
          }}>
          </div>
        </ShowIf>
      </React.Fragment>
    );
  }

  private addCarToForm() {
    const { query } = this.props;
    const { reasons } = this.state;
    let data: any = {
      key: uuid.v4(),
      reason: '5fe0930aa9683b0f8a6e0e42',
      brand: query.brand,
      denomination: query.denomination,
      material: query.material,
      answersbkp: [],
      answers: [],
      files: []
    };
    const salfaReason = reasons
      .find((reason) => reason._id === '5fe0930aa9683b0f8a6e0e42');
    if (salfaReason) {
      salfaReason.questions
        .forEach((question) => {
          data.answersbkp.push(query[question._id]);
          if (query[question._id]) {
            data.answers.push({
              questionId: question._id,
              question: question.name,
              answer: query[question._id]
            });
          }
        });
    }
    this.props.dispatch(arrayPush('requestForm', 'cars', data));
  }

  private loadBaseData() {
    const {  query } = this.props;
    const conectaID = query['6154722a94bba10012230aae'] || query['conectaID'];
    this.setState({ loading: true });
    Axios
      .all([
        this.api.getVenues({ page: 1, pageSize: 200, noPopulate: true, filted: true }),
        this.api.getReasons({ page: 1, pageSize: 200 }),
        this.api.getColors({ page: 1, pageSize: 200 }),
        this.api.getSalesChannel({ page: 1, pageSize: 200 }),
        this.api.getTeamSettings(),
        this.api.getOperationTypes({ page: 1, pageSize: 200 }),
        this.api.getPaymentMethods({ page: 1, pageSize: 200 }),
        this.api.validateContectaID(conectaID)
      ])
      .then(Axios.spread((venues, reasons, colors, channels, teamSettings, operationTypes, paymentMethods, validateContecta) => {
        if(validateContecta.data?.error){
          this.setState({ exist: true });
          swal!('Solicitud ya creada para esta cotización', `ID de cotización conecta ${conectaID} ya se encuentra asociado en la solicitud ${validateContecta.data.number}.`, 'warning', {
            button: false,
            closeOnClickOutside: false,
            closeOnEsc: false
          });
        }
        this.props.autofill('channel', teamSettings.data?.user?.defaultChannel);
        this.setState({
          venues: venues.data.results,
          colors: colors.data.results,
          reasons: reasons.data.results,
          channels: channels.data.results,
          paymentMethods: paymentMethods.data.results,
          requestSettings: teamSettings.data.request,
          operationTypes: operationTypes.data.results,
          loading: false
        });
        this.addCarToForm();
      }))
      .catch((err: AxiosError): void => {
        this.api.errorHandler(err);
      });
  }
}

const validate = (values: any, props: DecoratedFormProps<FormData, any, string>): FormErrors<FormData, string> => {
  const errors: any = {};
  if (values.deliveryAddress?.length && !values.deliveryVenue?.length) {
    errors.deliveryVenue = 'Este campo es requerido';
  }
  if (!values.cars?.length) {
    errors.cars_error = 'Este campo es requerido';
  }
  return errors;
};

const RequestForm = reduxForm<any, any, any>({
  form: 'requestForm',
  validate
})(Form);

const mapStateToProps = (state: any) => {
  return {
    formValues: getFormValues('requestForm')(state),
    syncErrors: getFormSyncErrors('requestForm')(state),
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch
  };
};

export default connect<{}, { dispatch: any }, IPropsType | any>(mapStateToProps, mapDispatchToProps)(RequestForm);
