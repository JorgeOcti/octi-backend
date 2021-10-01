import * as React from 'react';
import { autofill, Field, formValueSelector, WrappedFieldArrayProps } from 'redux-form';
import { IRenderItemProps } from '../../../Transmittal/TransmittalForms/renders/TramittalRenderItem';
import { ITransmittalState } from '../../../../actions/transmittal.types';
import TransmittalActions from '../../../../actions/transmittal.actions';
import { connect } from 'react-redux';
import BootstrapSelectField from '../../../Utils/forms/BootstrapSelectField';
import { inputStringRequired } from '../../../Utils/forms/validations';
import { ISalesChannel } from '../../../../../../../../src/request/interfaces/salesChannel.interface';
import { IOperationType } from '../../../../../../../../src/request/interfaces/operationType.interface';
import { Dispatch } from 'redux';
import { IReason } from '../../../../../../../../src/request/interfaces/reason.interface';
import { IVenue } from '../../../../../../../../src/app/interfaces/venue.interface';
import InputField from '../../../Utils/forms/InputField';

export interface IRequestImportRenderItemProps {
  channels: ISalesChannel[];
  operationTypes: IOperationType[];
  reasons: IReason[];
  venues: IVenue[];
}


interface IPropsType extends WrappedFieldArrayProps<{}>, IRenderItemProps {
  dispatch: Dispatch<any>;
  channels: ISalesChannel[];
  operationTypes: IOperationType[];
  reasons: IReason[];
  venues: IVenue[];
  formValues: any;
}

interface IStateType {
  error: Error | null;
}

class RequestImportRenderRequestItem extends React.Component<IPropsType, IStateType> {

  public render(): React.ReactElement<IPropsType> {
    const { fields, meta: { error, submitFailed, warning }, reasons, venues } = this.props;
    return (
      <>
        {
          fields.map((item, index) => {
            return (
              <tr key={index}>
                <td className='form-group-no-margin'>
                  <Field
                    name={`${item}.reason`}
                    label='Motivo'
                    component={BootstrapSelectField}
                    props={{
                      noneSelectedText: 'Seleccione...',
                      displayItems: 2,
                      labelOff: true,
                      autoClouse: true,
                      sm: true,
                      allOption: false,
                      search: true,
                      options: [
                        ...reasons.map((reason) => ({
                          value: reason._id,
                          text: reason.name
                        }))
                      ],
                      onClick: (value: string) => {
                        this.props.dispatch(
                          autofill('requestImportForm', `${item}.reason`, value)
                        );
                      }
                    }}
                  >
                  </Field>
                </td>
                <td className='form-group-no-margin'>
                  <Field
                    name={`${item}.origin`}
                    label='Motivo'
                    component={BootstrapSelectField}
                    validate={[inputStringRequired]}
                    props={{
                      noneSelectedText: 'Seleccione...',
                      displayItems: 2,
                      labelOff: true,
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
                        this.props.dispatch(
                          autofill('requestImportForm', `${item}.origin`, value)
                        );
                      }
                    }}
                  >
                  </Field>
                </td>
                <td className='form-group-no-margin'>
                  <Field
                    name={`${item}.destination`}
                    label='Motivo'
                    component={BootstrapSelectField}
                    validate={[inputStringRequired]}
                    props={{
                      noneSelectedText: 'Seleccione...',
                      displayItems: 2,
                      labelOff: true,
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
                        this.props.dispatch(
                          autofill('requestImportForm', `${item}.destination`, value)
                        );
                      }
                    }}
                  >
                  </Field>
                </td>
                <td className='form-group-no-margin'>
                  <Field
                    name={`${item}.vin`}
                    type='text'
                    component={InputField}
                    props={{
                      labelOff: true
                    }}
                  />
                </td>
                <td className='form-group-no-margin'>
                  <Field
                    name={`${item}.engineNumber`}
                    type='text'
                    component={InputField}
                    props={{
                      labelOff: true
                    }}
                  />
                </td>
                <td className='form-group-no-margin'>
                  <Field
                    name={`${item}.brand`}
                    type='text'
                    component={InputField}
                    props={{
                      labelOff: true
                    }}
                  />
                </td>
                <td className='form-group-no-margin'>
                  <Field
                    name={`${item}.denomination`}
                    type='text'
                    component={InputField}
                    props={{
                      labelOff: true
                    }}
                  />
                </td>
                <td className='form-group-no-margin'>
                  <Field
                    name={`${item}.color`}
                    type='text'
                    component={InputField}
                    props={{
                      labelOff: true
                    }}
                  />
                </td>
                <td className='form-group-no-margin'>
                  <Field
                    name={`${item}.type`}
                    type='text'
                    component={InputField}
                    props={{
                      labelOff: true
                    }}
                  />
                </td>
                <td className='form-group-no-margin'>
                  <Field
                    name={`${item}.client`}
                    type='text'
                    component={InputField}
                    props={{
                      labelOff: true
                    }}
                  />
                </td>
                <td className='form-group-no-margin'>
                  <Field
                    name={`${item}.entry`}
                    type='text'
                    component={InputField}
                    props={{
                      labelOff: true
                    }}
                  />
                </td>
                <td className='form-group-no-margin'>
                  <Field
                    name={`${item}.invoice`}
                    type='text'
                    component={InputField}
                    props={{
                      labelOff: true
                    }}
                  />
                </td>
                <td className='form-group-no-margin'>
                  <Field
                    name={`${item}.bl`}
                    type='text'
                    component={InputField}
                    props={{
                      labelOff: true
                    }}
                  />
                </td>
                <td className='form-group-no-margin'>
                  <Field
                    name={`${item}.engineSize`}
                    type='text'
                    component={InputField}
                    props={{
                      labelOff: true
                    }}
                  />
                </td>
                <td className='form-group-no-margin'>
                  <Field
                    name={`${item}.driveType`}
                    type='text'
                    component={InputField}
                    props={{
                      labelOff: true
                    }}
                  />
                </td>
                <td className='form-group-no-margin'>
                  {/* pasar a fecha*/}
                  <Field
                    name={`${item}.businessYear`}
                    type='text'
                    component={InputField}
                    props={{
                      labelOff: true
                    }}
                  />
                </td>
                <td className='form-group-no-margin'>
                  {/* pasar a fecha*/}
                  <Field
                    name={`${item}.manufacturingYear`}
                    type='text'
                    component={InputField}
                    props={{
                      labelOff: true
                    }}
                  />
                </td>
                <td className='form-group-no-margin'>
                  <Field
                    name={`${item}.price`}
                    type='text'
                    component={InputField}
                    props={{
                      labelOff: true
                    }}
                  />
                </td>
                <td className='form-group-no-margin'>
                  <Field
                    name={`${item}.insurancePrice`}
                    type='text'
                    component={InputField}
                    props={{
                      labelOff: true
                    }}
                  />
                </td>
                <td className='form-group-no-margin'>
                  <Field
                    name={`${item}.weight`}
                    type='text'
                    component={InputField}
                    props={{
                      labelOff: true
                    }}
                  />
                </td>
                <td className='form-group-no-margin'>
                  <Field
                    name={`${item}.gas`}
                    type='text'
                    component={InputField}
                    props={{
                      labelOff: true
                    }}
                  />
                </td>
                <td className='form-group-no-margin'>
                  <Field
                    name={`${item}.ap`}
                    type='text'
                    component={InputField}
                    props={{
                      labelOff: true
                    }}
                  />
                </td>
                <td className='form-group-no-margin'>
                  <Field
                    name={`${item}.countryOrigin`}
                    type='text'
                    component={InputField}
                    props={{
                      labelOff: true
                    }}
                  />
                </td>
                <td className='form-group-no-margin'>
                  <Field
                    name={`${item}.observation`}
                    type='text'
                    component={InputField}
                    props={{
                      labelOff: true
                    }}
                  />
                </td>
              </tr>
            );
          })
        }
      </>
    );
  }
}

const mapStateToProps = (state: { transmittal: ITransmittalState }) => {
  const selector = formValueSelector('requestImportForm');
  return {
    formValues: selector(state, 'all.origin', 'all.destination'),
    transmittal: state.transmittal
  };
};

const mapDispatchToProps = (dispatch: any) => {
  const transmittalActions = new TransmittalActions(dispatch);
  return {
    dispatch,
    transmittalActions
  };
};


export default connect<{}, {}, IRequestImportRenderItemProps>(mapStateToProps, mapDispatchToProps)(RequestImportRenderRequestItem);
