import * as React from 'react';
import { Field, formValueSelector, WrappedFieldArrayProps } from 'redux-form';
import { inputStringRequired } from '../../../Utils/forms/validations';
import { ITransmittalState } from '../../../../actions/transmittal.types';
import TransmittalActions from '../../../../actions/transmittal.actions';
import { connect } from 'react-redux';
import BootstrapSelectField from '../../../Utils/forms/BootstrapSelectField';
import { IRequestItem } from '../../../../../../../../src/request/interfaces/requestItem.interface';
import InputField from '../../../Utils/forms/InputField';
import BootstrapSwitchField from '../../../Utils/forms/BootsrapSwitchField';
import ShowIf from '../../../Utils/ShowIf';
import AddItemsToTransmittal from '../AddItemsToTransmittal';
import { ICar } from '../../../../../../../../src/app/interfaces/car.interface';


export interface IRenderItemProps {
  transmittal: ITransmittalState;
}

interface IPropsType extends WrappedFieldArrayProps<{}>, IRenderItemProps {
  transmittalActions: TransmittalActions;
  formValues: any;
}

interface IStateType {
  error: Error | null;
  exporing: boolean;
  openTabs: string[];
  oneOrigin: boolean;
  oneDestination: boolean;
}

class TramittalRenderItem extends React.Component<IPropsType, IStateType> {

  readonly state: IStateType = {
    error: null,
    exporing: false,
    openTabs: [],
    oneOrigin: true,
    oneDestination: true
  };

  constructor(props: IPropsType) {
    super(props);
    this.toogleTab = this.toogleTab.bind(this);
    this.pushItem = this.pushItem.bind(this);
    this.pushItemCar = this.pushItemCar.bind(this);
  }

  public render(): React.ReactElement<IPropsType> {
    const { fields, meta: { error, submitFailed }, transmittal } = this.props;
    const { openTabs, oneOrigin, oneDestination } = this.state;
    return (
      <React.Fragment>
        {
          fields.length === 0 ?
            <div className='col-md-12'>
              <p
                className='text-center text-muted'
                style={{ padding: '20px 0' }}
              >
                No se han agregado vehículos aún.
              </p>
            </div> :
            <div className='col-md-12'>
              <table className='table table-xs' style={{ minWidth: '1000px' }}>
                <thead>
                <tr className='bg-primary' style={{ height: '45px' }}>
                  <th className='middle-center' style={{ width: '45px' }}>ID Sol.</th>
                  <th className='middle' style={{ width: '120px' }}>VIN</th>
                  <th className='middle'>Marca</th>
                  <th className='middle'>Modelo</th>
                  <th className='middle'>Color</th>
                  <th className='middle' style={{ width: '100px' }}>Partida</th>
                  <th className='middle' style={{ width: '100px' }}>Factura</th>
                  <th className='middle' style={{ width: '150px' }}>Origen</th>
                  <th className='middle' style={{ width: '150px' }}>Destino</th>
                  <th className='middle' style={{ width: '40px' }} />
                  <th className='middle' style={{ width: '28px' }} />
                </tr>
                </thead>
                <tbody>
                {
                  fields.map((item, index) => {
                    const value: IRequestItem = fields.get(index) as IRequestItem;
                    const openTab = openTabs.includes(value._id);
                    return (
                      <React.Fragment key={value._id}>
                        <tr>
                          <td className={`middle-center`}>
                            <ShowIf condition={!!value?.request?.number}>
                              #{this.padNumber(value.request?.number)}
                            </ShowIf>
                          </td>
                          <td className={`middle`}>
                            {value.car?.vin}
                          </td>
                          <td className={`middle`}>
                            {value.car?.brand}
                          </td>
                          <td className={`middle`}>
                            {value.car?.denomination}
                          </td>
                          <td className={`middle`}>
                            {value.car?.color}
                          </td>
                          <td className={`middle`}>
                            {value.car?.entry ?? '-'}
                          </td>
                          <td className={`middle`}>
                            {value.car?.invoice ?? '-'}
                          </td>
                          <td className={`middle form-group-no-margin`}>
                            <Field
                              name={`${item}.origin`}
                              label='Origen *'
                              component={BootstrapSelectField}
                              validate={[inputStringRequired]}
                              props={{
                                noneSelectedText: 'Seleccione...',
                                displayItems: 2,
                                selectedText: 'origenes seleccionados.',
                                autoClouse: true,
                                sm: true,
                                disabled: oneOrigin,
                                labelOff: true,
                                allOption: false,
                                search: true,
                                options: [
                                  ...transmittal.venues.map((venue) => ({
                                    value: venue._id,
                                    text: venue.name
                                  }))
                                ],
                                onClick: (value: string) => this.props.transmittalActions.autofill(`${item}.origin`, value)
                              }}
                            >
                            </Field>
                          </td>
                          <td className={`middle form-group-no-margin`}>
                            <Field
                              name={`${item}.destination`}
                              label='Destino *'
                              component={BootstrapSelectField}
                              validate={[inputStringRequired]}
                              props={{
                                noneSelectedText: 'Seleccione...',
                                displayItems: 2,
                                selectedText: 'destinos seleccionados.',
                                autoClouse: true,
                                sm: true,
                                right: true,
                                disabled: oneDestination,
                                labelOff: true,
                                allOption: false,
                                search: true,
                                options: [
                                  ...transmittal.venues.map((venue) => ({
                                    value: venue._id,
                                    text: venue.name
                                  }))
                                ],
                                onClick: (value: string) => this.props.transmittalActions.autofill(`${item}.destination`, value)
                              }}
                            >
                            </Field>
                          </td>
                          <td className={`middle-center pointer`} onClick={() => this.toogleTab(value._id)}>
                            {
                              openTab ? <i className='fa fa-chevron-up' /> : <i className='fa fa-chevron-down' />
                            }
                          </td>
                          <td className={`middle`}>
                            <button
                              type='button'
                              className='btn btn-sm btn-danger'
                              onClick={() => fields.remove(index)}
                            >
                              <i className='fa fa-trash' />
                            </button>
                          </td>
                        </tr>
                        {
                          openTab ?
                            <tr style={{ borderTop: 'none' }}>
                              <td colSpan={11} className={'b-t-0'}>
                                <table className={'table'} style={{ marginBottom: 0 }}>
                                  <thead>
                                  <tr style={{ backgroundColor: '#f9f9f9' }}>
                                    <th className={'middle width-20'}>Cliente</th>
                                    <th className={'middle width-20'}>BL</th>
                                    <th className={'middle width-20'}>Tipo</th>
                                    <th className={'middle width-20'}>Tipo Operación (Motivo)</th>
                                    <th className={'middle width-20'}>Observación</th>
                                  </tr>
                                  </thead>
                                  <tbody>
                                  <tr>
                                    <td className={'middle form-group-no-margin'}>
                                      <Field
                                        name={`${item}.car.client`}
                                        type='text'
                                        component={InputField}
                                        props={{
                                          labelOff: true
                                        }}
                                      />
                                    </td>
                                    <td className={'middle form-group-no-margin'}>
                                      <Field
                                        name={`${item}.car.bl`}
                                        type='text'
                                        component={InputField}
                                        props={{
                                          labelOff: true
                                        }}
                                      />
                                    </td>
                                    <td className={'middle'}>{value.car?.type ?? '-'}</td>
                                    <td className={'middle'}>{value.reason?.name ?? '-'}</td>
                                    <td className={'middle form-group-no-margin'}>
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
                                  </tbody>
                                </table>
                              </td>
                            </tr> : null
                        }
                      </React.Fragment>
                    );
                  })
                }
                <tr>
                  <td colSpan={7} />
                  <td colSpan={2}>
                    <div className='flex flex-row'>
                      <div className='flex-1' style={{ paddingRight: '3px' }}>
                        <ShowIf condition={false}>
                          <Field
                            name='oneOrigin'
                            label='Un solo origen'
                            type='checkbox'
                            checked={oneOrigin}
                            component={BootstrapSwitchField}
                            onChange={(e: any) => {
                              const { checked } = e.target;
                              if (!checked) {
                                this.props.transmittalActions.autofill(`all.origin`, null);
                              }
                              this.setState({
                                oneOrigin: checked
                              });
                            }}
                            validate={[]}
                          />
                        </ShowIf>
                        <Field
                          name={`all.origin`}
                          label=''
                          component={BootstrapSelectField}
                          props={{
                            noneSelectedText: 'Seleccione...',
                            displayItems: 2,
                            selectedText: 'destinos seleccionados.',
                            autoClouse: true,
                            sm: true,
                            disabled: !oneOrigin,
                            labelOff: true,
                            allOption: false,
                            search: true,
                            options: [
                              ...transmittal.venues.map((venue) => ({
                                value: venue._id,
                                text: venue.name
                              }))
                            ],
                            onClick: (value: string) => {
                              fields.forEach((item) => {
                                this.props.transmittalActions.autofill(`${item}.origin`, value);
                                this.props.transmittalActions.autofill(`all.origin`, value);
                              });
                            }
                          }}
                        >
                        </Field>
                      </div>
                      <div className='flex-1' style={{ paddingLeft: '3px' }}>
                        <ShowIf condition={false}>
                          <Field
                            name='oneDestination'
                            label='Un solo destino'
                            type='checkbox'
                            checked={oneDestination}
                            component={BootstrapSwitchField}
                            onChange={() => {
                              // const { checked } = e.target;
                              // if (!checked) {
                              //   this.props.transmittalActions.autofill(`all.destination`, null);
                              // }
                              // this.setState({
                              //   oneDestination: checked
                              // });
                            }}
                            validate={[]}
                          />
                        </ShowIf>
                        <Field
                          name={`all.destination`}
                          label=''
                          component={BootstrapSelectField}
                          props={{
                            noneSelectedText: 'Seleccione...',
                            displayItems: 2,
                            selectedText: 'destinos seleccionados.',
                            autoClouse: true,
                            right: true,
                            disabled: !oneDestination,
                            sm: true,
                            labelOff: true,
                            allOption: false,
                            search: true,
                            options: [
                              ...transmittal.venues.map((venue) => ({
                                value: venue._id,
                                text: venue.name
                              }))
                            ],
                            onClick: (value: string) => {
                              fields.forEach((item) => {
                                this.props.transmittalActions.autofill(`${item}.destination`, value);
                                this.props.transmittalActions.autofill(`all.destination`, value);
                              });
                            }
                          }}
                        >
                        </Field>
                      </div>
                    </div>
                  </td>
                </tr>

                </tbody>
              </table>
            </div>
        }
        <div className='col-md-12' style={{ marginTop: '10px' }}>
          <h4>Agregar Vehículos</h4>
        </div>
        <div className='col-md-12'>
          <AddItemsToTransmittal fields={fields} onClickRequest={this.pushItem} onClickCar={this.pushItemCar} />
        </div>
        {submitFailed && error && <span>{error}</span>}
      </React.Fragment>
    );
  }

  private pushItemCar(car: ICar) {
    const { formValues } = this.props;
    this.props.transmittalActions.pushItem({
      _id: car._id,
      car: car,
      type: 'car',
      request: null,
      // reason: item.reason,
      origin: formValues?.all?.origin,
      // destination: formValues?.all?.destination ?? item.destination?._id
      destination: formValues?.all?.destination
    });
  }

  private pushItem(item: IRequestItem) {
    const { formValues } = this.props;
    this.props.transmittalActions.pushItem({
      _id: item._id,
      type: 'request',
      car: {
        ...item.car,
        bl: item.car.bl ?? '',
        client: item.car.client ?? ''
      },
      request: item.request,
      reason: item.reason,
      origin: formValues?.all?.origin,
      // destination: formValues?.all?.destination ?? item.destination?._id
      destination: formValues?.all?.destination
    });
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

  private padNumber(n: number): string {
    const s = '000' + n;
    return s.substr(s.length - 4);
  }
}

const mapStateToProps = (state: { transmittal: ITransmittalState }) => {
  const selector = formValueSelector('transmittalForm');
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


export default connect<{}, {}, IRenderItemProps>(mapStateToProps, mapDispatchToProps)(TramittalRenderItem);
