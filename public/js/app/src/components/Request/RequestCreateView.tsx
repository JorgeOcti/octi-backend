import { AxiosError, AxiosResponse, default as Axios } from 'axios';
import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import * as swal from 'sweetalert';
import { debounce } from 'throttle-debounce';
import * as uuid from 'uuid';
import { IReason } from '../../../../../../src/request/interfaces/reason.interface';
import { ISalesChannel } from '../../../../../../src/request/interfaces/salesChannel.interface';
import { IInventoryState } from '../../actions/inventory.actions';
import AppContainer from '../../container/AppContainer';
import ApiService from '../../utils/axios';
import AutoCompleteInput from '../Utils/AutoCompleteInput';
import BootstrapSelect from '../Utils/BootstrapSelect';
import MultiUploadFiles, { imageStatus } from '../Utils/MultiUploadFiles';
import ShowIf from '../Utils/ShowIf';
import TrackingBasePage from '../Utils/TrackingBasePage';
import { IRequestSetting } from '../../../../../../src/app/interfaces/teamSetting.interface';
import { IOperationType } from '../../../../../../src/request/interfaces/operationType.interface';
import { parseReplicableURL } from '../../utils/common';
import { requestSettings } from './defaults';


interface IPropsType extends RouteComponentProps<{}> {
}

interface INewCar {
  brand: string;
  brands: any[];
  denomination: string;
  denominations: any[];
  material: string;
  materials: any[];
  color: string;
  amount: number;
  observation: string;
  priority: boolean;
  files: any[];
  answers: any[];
  equipment: boolean;
  washed: boolean;
  reason: string;
}

interface IStateType {
  newCar: INewCar;
  cars: any[];
  sellerText: string;
  venue: string;
  venues: any[];
  reasons: IReason[];
  channels: ISalesChannel[];
  operationTypes: IOperationType[];
  requestSettings: IRequestSetting;
  channel: string;
  operationType: string;
  fleet: boolean;
  loading: boolean;
  error: Error | null;
}

const initialNewCar = {
  brand: '',
  brands: [],
  denomination: '',
  denominations: [],
  material: '',
  materials: [],
  files: [],
  answers: [],
  color: '',
  amount: 1,
  observation: '',
  reason: '',
  priority: false,
  equipment: false,
  washed: false
};

class RequestCreateView extends TrackingBasePage<IPropsType, IStateType> {
  title: string;

  readonly api: ApiService;

  readonly state: IStateType = {
    newCar: initialNewCar,
    cars: [],
    venue: '',
    sellerText: '',
    venues: [],
    reasons: [],
    channels: [],
    requestSettings,
    operationTypes: [],
    operationType: '',
    loading: false,
    fleet: false,
    channel: '',
    error: null,
  };

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Crear solicitud';
    this.cancel = this.cancel.bind(this);
    this.addCar = this.addCar.bind(this);
    this.deleteCar = this.deleteCar.bind(this);
    this.searchReason = this.searchReason.bind(this);
    this.createRequest = this.createRequest.bind(this);
    this.loadBaseData = this.loadBaseData.bind(this);
    this.changeNewCar = this.changeNewCar.bind(this);
    this.changeVenue = this.changeVenue.bind(this);
    this.changeNumberNewCar = this.changeNumberNewCar.bind(this);
    this.changeBooleanNewCar = this.changeBooleanNewCar.bind(this);
    this.changeFleet = this.changeFleet.bind(this);
    this.search = debounce(500, this.search.bind(this));
    this.api = new ApiService();
  }

  public componentWillMount(): void {
    window.scrollTo(0, 0);
    this.loadBaseData();
  }

  public componentDidMount(): void {
    super.componentDidMount();
    const $amount: any = $('#amount');
    $amount.TouchSpin({
      initval: 1,
      min: 1,
      max: 50
    }).on('change', () => {
      this.changeNumberNewCar('amount', parseInt($amount.val(), 10));
    });
    $('.bootstrap-touchspin')
      .addClass('input-group-sm');
  }

  public render(): React.ReactElement<IPropsType> {
    const { newCar, cars, requestSettings, loading, venues, reasons, channel, channels, operationTypes, operationType } = this.state;
    const vehiclesView = this.props.location.pathname === '/requests/vehicles/create/';
    const filesCompleted = newCar.files.filter((file: any) => file.status === imageStatus.complete);
    const isUploadingFiles = newCar.files.length > 0 && filesCompleted.length < newCar.files.length;
    const reasonSelected: IReason | undefined = (reasons as IReason[]).find((reason: IReason) => reason._id === newCar.reason);
    return (
      <AppContainer  cMenu='3' cSubMenu={vehiclesView ? '3.2' : '3.1'} cAction='Crear solicitud'>
        <section className='content'>
          <div className='box'>
            <div className='box-header with-border'>
              <h3 className='box-title'>Crear solicitud</h3>
            </div>
            <div className='box-body create-request'>
              <div className='row'>
                <div className='col-md-6 col-lg-6'>
                  <h3>Agregar Unidades</h3>
                  <div className='form-horizontal'>
                    <div className='form-group'>
                      <label htmlFor='marca' className='col-sm-3 control-label label-left'>Marca *</label>
                      <div className='col-sm-9'>
                        <AutoCompleteInput
                          value={newCar.brand}
                          inputClass={'input-sm'}
                          items={newCar.brands}
                          renderItem={(item, index) => (
                            <div key={index} className='item'>
                              {item.material ? `${item.material} - ` : ''} {item.denomination} <br />
                              <strong>{item.brand}</strong>
                            </div>
                          )}
                          onChange={(e) => {
                            const { value } = e.target;
                            this.changeNewCar('brand', value);
                            this.search(value, 'brands');
                          }}
                          onSelect={(item) => {
                            this.setState({
                              newCar: {
                                ...this.state.newCar,
                                brand: item.brand,
                                brands: [],
                                denomination: item.denomination,
                                denominations: [],
                                material: '',
                                materials: []
                              }
                            });
                          }}
                        />
                      </div>
                    </div>
                    <div className='form-group'>
                      <label htmlFor='modelo' className='col-sm-3 control-label label-left'>Modelo {
                        requestSettings.materialRequired ? '*' : ''
                      }</label>
                      <div className='col-sm-9'>
                        <AutoCompleteInput
                          value={newCar.denomination}
                          inputClass={'input-sm'}
                          items={newCar.denominations}
                          renderItem={(item, index) => (
                            <div key={index} className='item'>
                              {item.material ? `${item.material} - ` : ''} {item.denomination} <br />
                              <strong>{item.brand}</strong>
                            </div>
                          )}
                          onChange={(e) => {
                            const { value } = e.target;
                            this.changeNewCar('denomination', value);
                            this.search(value, 'denominations');
                          }}
                          onSelect={(item) => {
                            this.setState({
                              newCar: {
                                ...this.state.newCar,
                                brand: item.brand,
                                brands: [],
                                denomination: item.denomination,
                                denominations: [],
                                material: '',
                                materials: []
                              }
                            });
                          }}
                        />
                      </div>
                    </div>
                    <ShowIf condition={requestSettings.material}>
                      <div className='form-group'>
                        <label htmlFor='material' className='col-sm-3 control-label label-left'>Material {
                          requestSettings.materialRequired ? '*' : ''
                        }</label>
                        <div className='col-sm-9'>
                          <AutoCompleteInput
                            value={newCar.material}
                            inputClass={'input-sm'}
                            items={newCar.materials}
                            renderItem={(item, index) => (
                              <div key={index} className='item'>
                                {item.material ? `${item.material} - ` : ''} {item.denomination} <br />
                                <strong>{item.brand}</strong>
                              </div>

                            )}
                            onChange={(e) => {
                              const { value } = e.target;
                              this.changeNewCar('material', value);
                              this.search(value, 'materials');
                            }}
                            onSelect={(item) => {
                              this.setState({
                                newCar: {
                                  ...this.state.newCar,
                                  brand: item.brand,
                                  brands: [],
                                  denomination: item.denomination,
                                  denominations: [],
                                  material: '',
                                  materials: []
                                }
                              });
                            }}
                          />
                        </div>
                      </div>
                    </ShowIf>
                    <div className='form-group'>
                      <label htmlFor='color' className='col-sm-3 control-label label-left'>Color {
                        requestSettings.colorRequired ? '*' : ''
                      }</label>
                      <div className='col-sm-9'>
                        <input
                          type='text'
                          className='input-sm form-control'
                          value={newCar.color}
                          onChange={(e) => {
                            this.changeNewCar('color', e.target.value);
                          }}
                        />
                      </div>
                    </div>
                    <div className='form-group'>
                      <label className='col-sm-3 control-label label-left'>Motivo *</label>
                      <div className='col-sm-9'>
                        <BootstrapSelect
                          noneSelectedText='Seleccione'
                          displayItems={1}
                          sm={true}
                          search={true}
                          autoClouse={true}
                          selectedText='motivos seleccionados.'
                          selected={newCar.reason.length ? [newCar.reason] : []}
                          allOption={false}
                          options={reasons.map((reason: any) => ({
                            value: reason._id,
                            text: reason.name
                          }))}
                          onClick={(value: string) => {
                            this.changeNewCar('reason', value);
                          }}
                        />
                      </div>
                    </div>
                    <ShowIf condition={!!(reasonSelected && reasonSelected.questions.length)}>
                      {
                        reasonSelected?.questions.map((question: any) => {
                          const currentAnswer: any = newCar.answers.find((answer: any) => (answer.questionId === question._id));
                          return (
                            <div className='form-group' key={(question)._id}>
                              <label
                                htmlFor='color'
                                className='col-sm-3 control-label label-left'
                              >
                                {question.name} {question.required ? '*' : ''}
                              </label>
                              <div className='col-sm-9'>
                                {
                                  question._id === '5bf2de35caf8ef7096105c23' ?
                                    <select
                                      className='form-control select-sm font-12'
                                      value={currentAnswer ? currentAnswer.answer : ''}
                                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                        this.changeNewCar('answers', (() => {
                                          if (e.target.value) {
                                            if (currentAnswer) {
                                              return [...newCar.answers].map((answer: any) => {
                                                if (question._id === answer.questionId) {
                                                  answer.answer = e.target.value;
                                                }
                                                return answer;
                                              });
                                            }
                                            return [...newCar.answers, {
                                              questionId: question._id,
                                              question: question.name,
                                              answer: e.target.value
                                            }];
                                          }
                                          return [...newCar.answers].filter((answer: any) => (question._id !== answer.questionId));
                                        })());
                                      }}
                                    >
                                      <option value="" disabled={true}>Seleccione</option>
                                      <option value="VPP+CREDITO">VPP+CREDITO</option>
                                      <option value="VPP">VPP</option>
                                      <option value="CREDITO">CREDITO</option>
                                      <option value="CONTADO">CONTADO</option>
                                      <option value="LEASING">LEASING</option>
                                    </select> :
                                    <input
                                      type='text'
                                      className='input-sm form-control'
                                      value={currentAnswer ? currentAnswer.answer : ''}
                                      onChange={(e) => {
                                        this.changeNewCar('answers', (() => {
                                          if (e.target.value) {
                                            if (currentAnswer) {
                                              return [...newCar.answers].map((answer: any) => {
                                                if (question._id === answer.questionId) {
                                                  answer.answer = e.target.value;
                                                }
                                                return answer;
                                              });
                                            }
                                            return [...newCar.answers, {
                                              questionId: question._id,
                                              question: question.name,
                                              answer: e.target.value
                                            }];
                                          }
                                          return [...newCar.answers].filter((answer: any) => (question._id !== answer.questionId));
                                        })());
                                      }}
                                    />
                                }
                              </div>
                            </div>
                          );
                        })
                      }
                    </ShowIf>
                    <ShowIf condition={!!(reasonSelected && reasonSelected.file.active)}>
                      <div className='form-group'>
                        <label className='col-sm-3 control-label label-left'>Archivos *</label>
                        <div className='col-sm-9'>
                          <MultiUploadFiles
                            url={'/api/v1/requests/upload-file/'}
                            onChange={(files) => {
                              this.changeNewCar('files', files);
                            }}
                            files={newCar.files}
                          />
                          <ShowIf condition={isUploadingFiles}>
                            <p>
                              Se están cargando sus archivos, llevamos {filesCompleted.length} de {newCar.files.length} <i
                              className='fa fa-spinner fa-spin' />.
                            </p>
                          </ShowIf>
                        </div>
                      </div>
                    </ShowIf>
                    {
                      /* <div className="form-group">
                        <label className="col-sm-3 control-label label-left">Pre-entrega</label>
                        <div className="col-sm-9">
                          <div className="checkbox">
                            <label>
                              <input
                                type="checkbox"
                                checked={newCar.washed}
                                onChange={() => {
                                  this.changeBooleanNewCar('washed', !newCar.washed);
                                }}
                              /> <i className="material-icons">local_car_wash</i> Lavado
                            </label>
                          </div>
                          <div className="checkbox">
                            <label>
                              <input
                                type="checkbox"
                                checked={newCar.equipment}
                                onChange={() => {
                                  this.changeBooleanNewCar('equipment', !newCar.equipment);
                                }}
                              /> <i className="material-icons">build</i> Pre-entrega mecánica
                            </label>
                          </div>
                        </div>
                      </div> */
                    }
                    <div className='form-group'>
                      <label className='col-sm-3 control-label label-left'>Cantidad</label>
                      <div className='col-sm-4'>
                        <input id='amount' type='text' className='form-control' />
                      </div>
                    </div>
                    <div className='form-group'>
                      <label className='col-sm-3 control-label label-left'>Prioridad</label>
                      <div className='col-sm-6'>
                        {
                          newCar.priority ?
                            <i
                              className='fa fa-2x fa-star text-yellow pointer'
                              style={{ marginTop: '5px', fontSize: '1.7em' }}
                              onClick={() => this.changeBooleanNewCar('priority', false)}
                            />
                            :
                            <i
                              className='fa fa-2x fa-star-o text-yellow pointer'
                              style={{ marginTop: '5px', fontSize: '1.7em' }}
                              onClick={() => this.changeBooleanNewCar('priority', true)}
                            />
                        }
                      </div>
                    </div>
                    <div className='form-group'>
                      <label className='col-sm-3 control-label label-left'>Observación despacho</label>
                      <div className='col-sm-9'>
                        <textarea
                          className='form-control input-sm'
                          onChange={(e) => {
                            const { value } = e.target;
                            this.changeNewCar('observation', value);
                          }}
                          value={newCar.observation}
                          style={{ resize: 'none' }}
                          rows={4}
                        />
                      </div>
                    </div>
                    <div className='text-right'>
                      <button
                        className='btn btn-sm btn-primary'
                        onClick={this.addCar}
                        disabled={
                          !(reasonSelected && reasonSelected.questions.length === newCar.answers.length) ||
                          !newCar.brand.length ||
                          (requestSettings.denomination && requestSettings.denominationRequired && !newCar.denomination.length) ||
                          (requestSettings.material && requestSettings.materialRequired && !newCar.material.length) ||
                          (requestSettings.color && requestSettings.colorRequired && !newCar.color.length) ||
                          !newCar.reason ||
                          isUploadingFiles
                        }
                      >
                        Agregar
                      </button>
                    </div>
                  </div>
                </div>
                <div className='col-md-6 col-lg-6' style={{ paddingLeft: '10px' }}>
                  <div className='add-cars'>
                    <div className='arrow'>
                      <i className='fa fa-3x fa-caret-right' />
                    </div>
                    <div className='detail'>
                      <h3>Solicitud</h3>
                      <div className='form-horizontal'>
                        <div className='form-group'>
                          <label className='col-sm-3 control-label label-left'>Destino</label>
                          <div className='col-sm-9'>
                            <BootstrapSelect
                              noneSelectedText='Seleccione'
                              displayItems={1}
                              sm={true}
                              search={true}
                              autoClouse={true}
                              selectedText='sucursales seleccionadas.'
                              selected={this.state.venue.length ? [this.state.venue] : []}
                              allOption={false}
                              options={venues.map((venue: any) => ({
                                value: venue._id,
                                text: venue.name
                              }))}
                              onClick={(value: string) => {
                                this.changeVenue(value);
                              }}
                            />
                          </div>
                        </div>
                        <div className='form-group'>
                          <label className='col-sm-3 control-label label-left'>Vendedor</label>
                          <div className='col-sm-9'>
                            <input type='text' className='form-control input-sm' onChange={(e) => {
                              this.setState({
                                sellerText: e.target.value
                              });
                            }} />
                          </div>
                        </div>
                        <div className='form-group'>
                          <label className='col-sm-3 control-label label-left'>Canal *</label>
                          <div className='col-sm-9'>
                            <BootstrapSelect
                              noneSelectedText='Seleccione'
                              displayItems={1}
                              sm={true}
                              search={true}
                              autoClouse={true}
                              selected={channel.length ? [channel] : []}
                              allOption={false}
                              options={channels.map((channel: any) => ({
                                value: channel._id,
                                text: channel.name
                              }))}
                              onClick={(value: string) => {
                                this.setState({
                                  channel: value
                                });
                              }}
                            />
                          </div>
                        </div>
                        <ShowIf condition={!!operationTypes.length}>
                          <div className='form-group'>
                            <label className='col-sm-3 control-label label-left'>Tipo operación</label>
                            <div className='col-sm-9'>
                              <BootstrapSelect
                                noneSelectedText='Seleccione'
                                displayItems={1}
                                sm={true}
                                search={true}
                                autoClouse={true}
                                selected={operationType.length ? [operationType] : []}
                                allOption={false}
                                options={operationTypes.map((operationType: any) => ({
                                  value: operationType._id,
                                  text: operationType.name
                                }))}
                                onClick={(value: string) => {
                                  this.setState({
                                    operationType: value
                                  });
                                }}
                              />
                            </div>
                          </div>
                        </ShowIf>
                      </div>
                      {/* <div className="form-group-switch">
                        <label className="switch-label switch-label-left">Estás solicitando flota</label>
                        <BootstrapSwitch
                          checked={fleet}
                          color="blue"
                          onChange={this.changeFleet}
                        />
                      </div> */}
                      <div className='create-detail'>
                        <table className='table'>
                          <tbody>
                          {
                            cars.map((car: any) => (
                              <tr key={car.tid}>
                                <td className='middle'>{`${car.denomination} ${car.material} ${car.brand}`}</td>
                                <td className='middle'>{car.color}</td>
                                <td className='middle'>{this.searchReason(car.reason)}</td>
                                <td className='middle'>
                                  <i className={`material-icons ${!car.washed ? 'text-gray' : ''}`}>local_car_wash</i>
                                </td>
                                <td className='middle'>
                                  <i className={`material-icons ${!car.equipment ? 'text-gray' : ''}`}>build</i>
                                </td>
                                <td className='middle'>
                                  {car.files.length ? <i className={`fa fa-paperclip`} /> : null}
                                </td>
                                <td className='middle text-muted' style={{ width: '140px' }}>
                                  {
                                    car.observation && car.observation.length ?
                                      car.observation
                                      : 'Sin observaciones'
                                  }
                                </td>
                                <td
                                  className='middle'
                                  onClick={() => this.deleteCar(car)}
                                >
                                  <i className='fa fa-trash text-red pointer' />
                                </td>
                              </tr>
                            ))
                          }
                          </tbody>
                        </table>
                      </div>
                      <div className='text-right text-muted' style={{ padding: '2px' }}>
                        {cars.length} unidades
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className='box-footer text-right'>
              <button className='btn btn-sm btn-default' onClick={this.cancel}>Cancelar</button>
              <button
                className='btn btn-sm btn-primary'
                style={{ marginLeft: '5px' }}
                onClick={this.createRequest}
              >
                Crear
              </button>
            </div>
            {
              loading ?
                <div className='overlay'>
                  <i className='fa fa-spinner fa-spin text-purple' />
                </div> : null
            }
          </div>
        </section>
      </AppContainer>
    );
  }

  private addCar(): void {
    const { newCar, reasons } = this.state;
    const reasonSelected: IReason | undefined = (reasons as IReason[]).find((reason: IReason) => reason._id === newCar.reason);
    if (reasonSelected?.file.required && !newCar.files.length) {
      swal!('Solicitud', `Se requiere que subas un archivo para este vehículo.`, 'error');
    } else {
      const $amount: any = $('#amount');
      const cars = Array(newCar.amount).fill({
        brand: newCar.brand,
        denomination: newCar.denomination,
        files: newCar.files,
        answers: newCar.answers,
        material: newCar.material,
        color: newCar.color,
        observation: newCar.observation,
        priority: newCar.priority,
        equipment: newCar.equipment,
        reason: newCar.reason,
        washed: newCar.washed
      });
      this.setState({
        cars: [...this.state.cars, ...cars.map((car) => {
          const tid = uuid.v4();
          return {
            ...car,
            tid
          };
        })],
        newCar: initialNewCar
      }, () => {
        $amount.val(1);
      });
    }
  }

  private searchReason(id: string) {
    const { reasons } = this.state;
    const reason: any = reasons.find((r: any) => r._id === id);
    if (reason) {
      return reason.name;
    }
    return '';
  }

  private deleteCar(dcar: any): void {
    swal({
      title: '¿Estás seguro?',
      text: `Vas a eliminar ${dcar.denomination} ${dcar.material} ${dcar.brand} (${dcar.color})`,
      icon: 'warning',
      dangerMode: true,
      buttons: {
        cancel: 'Cancelar' as any,
        confirm: {
          text: 'Sí'
        }
      }
    }).then((willDelete: any) => {
      if (willDelete) {
        this.setState({
          cars: this.state.cars.filter((car: any) => car.tid !== dcar.tid)
        });
      }
    });
  }

  private changeNewCar(field: keyof INewCar, value: any) {
    const extra: any = {};
    if (field === 'reason') {
      extra.answers = [];
    }
    this.setState({
      newCar: {
        ...this.state.newCar,
        ...extra,
        [field]: value
      }
    });
  }

  private changeNumberNewCar(field: 'amount', value: number) {
    this.setState({
      newCar: {
        ...this.state.newCar,
        [field]: value
      }
    });
  }

  private changeBooleanNewCar(field: 'priority' | 'equipment' | 'washed', value: boolean) {
    this.setState({
      newCar: {
        ...this.state.newCar,
        [field]: value
      }
    });
  }

  private changeVenue(venue: string) {
    this.setState({
      venue
    });
  }

  private changeFleet() {
    const { fleet } = this.state;
    this.setState({
      fleet: !fleet
    });
  }

  private loadBaseData() {
    this.setState({ loading: true });
    Axios
      .all([
        this.api.getVenues({ page: 1, pageSize: 200, noPopulate: true, filted: true }),
        this.api.getReasons({ page: 1, pageSize: 200 }),
        this.api.getSalesChannel({ page: 1, pageSize: 200 }),
        this.api.getTeamSettings(),
        this.api.getOperationTypes({ page: 1, pageSize: 200 })
      ])
      .then(Axios.spread((venues, reasons, channels, teamSettings, operationTypes) => {
        this.setState({
          venues: venues.data.results,
          reasons: reasons.data.results,
          channels: channels.data.results,
          requestSettings: teamSettings.data.request,
          operationTypes: operationTypes.data.results,
          loading: false
        });
      }))
      .catch((err: AxiosError): void => {
        this.api.errorHandler(err);
      });
  }

  private search(text: string, base: 'denominations' | 'brands' | 'materials'): void {
    this.api
      .searchCar(text)
      .then((response: AxiosResponse): void => {
        this.setState({
          newCar: {
            ...this.state.newCar,
            [base]: response.data.cars
          }
        });
      })
      .catch((err: AxiosError): void => {
        this.api.errorHandler(err);
      });
  }

  private createRequest() {
    const vehiclesView = this.props.location.pathname === parseReplicableURL('/requests/vehicles/create/');
    const { cars, channel, venue, sellerText, operationType } = this.state;
    if (!cars.length) {
      swal!('Solicitud', 'No se han agregado unidades para crear la solicitud.', 'error');
    } else if (!venue.length) {
      swal!('Solicitud', 'No se ha seleccionado destino para crear la solicitud.', 'error');
    } else if (!channel.length) {
      swal!('Solicitud', 'No se ha seleccionado canal para crear la solicitud.', 'error');
    } else {
      this.api
        .createRequest({
          cars,
          channel,
          operationType,
          venue,
          sellerText
        })
        .then(() => {
          swal!('Solicitud', 'Se ha creado satisfactoriamente.', 'success').then(() => {
            this.props.history.push(parseReplicableURL(vehiclesView ? '/requests/vehicles/' : '/requests/'));
          });
        })
        .catch((err: AxiosError): void => {
          this.api.errorHandler(err);
        });
    }
  }

  private cancel(): void {
    const vehiclesView = this.props.location.pathname === '/requests/vehicles/create/';
    this.props.history.push(parseReplicableURL(vehiclesView ? '/requests/vehicles/' : '/requests/'));
  }
}

const mapStateToProps = (state: { inventories: IInventoryState }) => {
  return {
    inventories: state.inventories
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch
  };
};


export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(RequestCreateView);
