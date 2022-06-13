import * as React from 'react';
import { autofill, Field, FieldArray, formValueSelector, WrappedFieldArrayProps } from 'redux-form';
import { IRenderItemProps } from '../../../Transmittal/TransmittalForms/renders/TramittalRenderItem';
import { ITransmittalState } from '../../../../actions/transmittal.types';
import TransmittalActions from '../../../../actions/transmittal.actions';
import { connect } from 'react-redux';
import InputField from '../../../Utils/forms/InputField';
import BootstrapSelectField from '../../../Utils/forms/BootstrapSelectField';
import { inputStringRequired } from '../../../Utils/forms/validations';
import { ISalesChannel } from '../../../../../../../../src/request/interfaces/salesChannel.interface';
import { IOperationType } from '../../../../../../../../src/request/interfaces/operationType.interface';
import { Dispatch } from 'redux';
import RequestImportRenderRequestItem from './RequestImportRenderRequestItem';
import { IReason } from '../../../../../../../../src/request/interfaces/reason.interface';
import { IVenue } from '../../../../../../../../src/app/interfaces/venue.interface';
import ShowIf from '../../../Utils/ShowIf';

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

class RequestImportRenderRequest extends React.Component<IPropsType, IStateType> {

  public render(): React.ReactElement<IPropsType> {
    const { fields, meta: { error, submitFailed, warning }, channels, operationTypes, reasons, venues } = this.props;
    return (
      <>
        {
          fields.map((item, index) => {
            return (
              <div className='row' key={index}>
                <div className='col-md-3'>
                  <Field
                    name={`${item}.number`}
                    label='Número de Solicitud'
                    type='text'
                    component={InputField}
                    validate={[inputStringRequired]}
                  />
                </div>
                <div className='col-md-3'>
                  <Field
                    name={`${item}.sellerText`}
                    label='Vendedor'
                    type='text'
                    component={InputField}
                  />
                </div>
                <div className='col-md-3'>
                  <Field
                    name={`${item}.channel`}
                    label='Canal'
                    component={BootstrapSelectField}
                    validate={[]}
                    props={{
                      noneSelectedText: 'Seleccione...',
                      displayItems: 2,
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
                        this.props.dispatch(
                          autofill('requestImportForm', `${item}.channel`, value)
                        );
                      }
                    }}
                  >
                  </Field>
                </div>
                <div className='col-md-3'>
                  <Field
                    name={`${item}.operationType`}
                    label='Tipo operación'
                    component={BootstrapSelectField}
                    validate={[]}
                    props={{
                      noneSelectedText: 'Seleccione...',
                      displayItems: 2,
                      autoClouse: true,
                      sm: true,
                      allOption: false,
                      search: true,
                      options: [
                        ...operationTypes.map((operationType) => ({
                          value: operationType._id,
                          text: operationType.name
                        }))
                      ],
                      onClick: (value: string) => {
                        this.props.dispatch(
                          autofill('requestImportForm', `${item}.operationType`, value)
                        );
                      }
                    }}
                  >
                  </Field>
                </div>
                <div className='col-md-12' style={{ paddingBottom: '20px', position: 'static' }}>
                  <div className='table-responsive'>
                    <table
                      className='table table-striped table-sm'
                      style={{
                        minWidth: '3400px'
                      }}
                    >
                      <thead>
                      <tr>
                        <th className='middle' style={{ width: '150px' }}>Motivo</th>
                        <th className='middle' style={{ width: '150px' }}>Origen</th>
                        <th className='middle' style={{ width: '150px' }}>Destino</th>
                        <th className='middle'>Chasis</th>
                        <th className='middle'>Motor</th>
                        <th className='middle'>Marca</th>
                        <th className='middle'>Modelo</th>
                        <th className='middle'>Color</th>
                        <th className='middle'>Tipo</th>
                        <th className='middle'>Cliente</th>
                        <th className='middle'>Partida</th>
                        <th className='middle'>Factura</th>
                        <th className='middle'>BL</th>
                        <th className='middle'>Cilindrada</th>
                        <th className='middle'>Tracción</th>
                        <th className='middle'>Año Comercial</th>
                        <th className='middle'>Año Fabricación</th>
                        <th className='middle'>Monto</th>
                        <th className='middle'>Seguro</th>
                        <th className='middle'>Peso</th>
                        <th className='middle'>Gas</th>
                        <th className='middle'>AP</th>
                        <th className='middle'>Pais Origen</th>
                        <th className='middle'>Observacion</th>
                        <th className='middle'>Fecha de Carga</th>
                      </tr>
                      </thead>
                      <tbody>
                      <FieldArray<any>
                        name={`${item}.cars`}
                        component={RequestImportRenderRequestItem}
                        props={{
                          channels,
                          operationTypes,
                          reasons,
                          venues
                        }}
                      />
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
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


export default connect<{}, {}, IRequestImportRenderItemProps>(mapStateToProps, mapDispatchToProps)(RequestImportRenderRequest);
