import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { IInventoryState } from '../../actions/inventory.actions';
import { connect } from 'react-redux';
import AppContainer from '../../container/AppContainer';
import BootstrapSwitch from '../Utils/BootstrapSwitch';
import AutocompleteInput from '../Utils/AutocompleteInput';
import ApiService from '../../utils/axios';
import { debounce } from 'throttle-debounce';
import * as uuid from 'uuid';
import * as swal from 'sweetalert';
import BootstrapSelect from '../Utils/BootstrapSelect';
import { AxiosError, AxiosResponse, default as Axios } from 'axios';

interface IPropsType extends RouteComponentProps<{}> { }

interface IStateType {
  newCar: {
    brand: string
    brands: any[],
    denomination: string;
    denominations: any[];
    material: string;
    materials: any[];
    color: string;
    amount: number;
    observation: string;
    priority: boolean;
    equipment: boolean;
    washed: boolean;
    reason: string;
  };
  fleet: boolean;
  cars: any[];
  venue: string;
  venues: any[];
  reasons: any[];
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
  color: '',
  amount: 1,
  observation: '',
  reason: '',
  priority: false,
  equipment: false,
  washed: false
};

class RequestCreateView extends React.Component<IPropsType, IStateType> {

  readonly api: ApiService;

  readonly state = {
    newCar: initialNewCar,
    cars: [],
    venue: '',
    venues: [],
    reasons: [],
    loading: false,
    fleet: false,
    error: null
  };

  constructor(props: IPropsType) {
    super(props);
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
    document.title = 'OSA Andes | Crear solicitud';
    window.scrollTo(0, 0);
    this.loadBaseData();
  }

  public componentDidMount(): void {
    const $amount: any = $('#amount');
    $amount.TouchSpin({
      initval: 1,
      min: 1,
      max: 50
    }).on('change', () => {
      this.changeNumberNewCar('amount', parseInt($amount.val(), 10));
    });
    $('.bootstrap-touchspin').addClass('input-group-sm');
  }

  public render(): React.ReactElement<IPropsType> {
    const { newCar, cars, fleet, loading, venues, reasons } = this.state;
    return (
      <AppContainer title="" cMenu="3" cSubMenu="3.1" cAction="Crear solicitud">
        <section className="content">
          <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">Crear solicitud</h3>
            </div>
            <div className="box-body create-request">
              <div className="row">
                <div className="col-md-5 col-lg-5">
                  <h3>Agregar Vehículos</h3>
                  <div className="form-horizontal">
                    <div className="form-group">
                      <label htmlFor="marca" className="col-sm-3 control-label label-left">Marca *</label>
                      <div className="col-sm-9">
                        <AutocompleteInput
                          value={newCar.brand}
                          inputClass={'input-sm'}
                          items={newCar.brands}
                          renderItem={(item, index) => (
                            <div key={index} className="item">
                              {item.denomination} <br />
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
                    <div className="form-group">
                      <label htmlFor="modelo" className="col-sm-3 control-label label-left">Modelo *</label>
                      <div className="col-sm-9">
                        <AutocompleteInput
                          value={newCar.denomination}
                          inputClass={'input-sm'}
                          items={newCar.denominations}
                          renderItem={(item, index) => (
                            <div key={index} className="item">
                              {item.denomination} <br />
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
                    <div className="form-group">
                      <label htmlFor="material" className="col-sm-3 control-label label-left">Material</label>
                      <div className="col-sm-9">
                        <AutocompleteInput
                          value={newCar.material}
                          inputClass={'input-sm'}
                          items={newCar.materials}
                          renderItem={(item, index) => (
                            <div key={index} className="item">
                              {item.denomination} <br />
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
                    <div className="form-group">
                      <label htmlFor="color" className="col-sm-3 control-label label-left">Color *</label>
                      <div className="col-sm-9">
                        <input
                          type="text"
                          className="input-sm form-control"
                          value={newCar.color}
                          onChange={(e) => {
                            this.changeNewCar('color', e.target.value);
                          }}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="col-sm-3 control-label label-left">Motivo *</label>
                      <div className="col-sm-9">
                        <BootstrapSelect
                          noneSelectedText="Seleccione"
                          displayItems={1}
                          sm={true}
                          search={true}
                          autoClouse={true}
                          selectedText="motivos seleccionados."
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
                    <div className="form-group">
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
                    </div>
                    <div className="form-group">
                      <label className="col-sm-3 control-label label-left">Cantidad</label>
                      <div className="col-sm-4">
                        <input id="amount" type="text" className="form-control" />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="col-sm-3 control-label label-left">Prioridad</label>
                      <div className="col-sm-6">
                        {
                          newCar.priority ?
                            <i
                              className="fa fa-2x fa-star text-yellow pointer"
                              style={{ marginTop: '5px', fontSize: '1.7em' }}
                              onClick={() => this.changeBooleanNewCar('priority', false)}
                            />
                            :
                            <i
                              className="fa fa-2x fa-star-o text-yellow pointer"
                              style={{ marginTop: '5px', fontSize: '1.7em' }}
                              onClick={() => this.changeBooleanNewCar('priority', true)}
                            />
                        }
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="col-sm-3 control-label label-left">Observación despacho</label>
                      <div className="col-sm-9">
                        <textarea
                          className="form-control input-sm"
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
                    <div className="text-right">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={this.addCar}
                        disabled={!newCar.brand.length || !newCar.denomination.length || !newCar.color.length}
                      >
                        Agregar
                      </button>
                    </div>
                  </div>
                </div>
                <div className="col-md-7 col-lg-7" style={{ paddingLeft: '10px' }}>
                  <div className="add-cars">
                    <div className="arrow">
                      <i className="fa fa-3x fa-caret-right" />
                    </div>
                    <div className="detail">
                      <h3>Solicitud</h3>
                      <div className="form-horizontal">
                        <div className="form-group">
                          <label className="col-sm-2 control-label label-left">Destino</label>
                          <div className="col-sm-10">
                            <BootstrapSelect
                              noneSelectedText="Seleccione"
                              displayItems={1}
                              sm={true}
                              search={true}
                              autoClouse={true}
                              selectedText="sucursales seleccionadas."
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
                      </div>
                      <div className="form-group-switch">
                        <label className="switch-label switch-label-left">Estás solicitando flota</label>
                        <BootstrapSwitch
                          checked={fleet}
                          color="blue"
                          onChange={this.changeFleet} />
                        {/*<label className="switch-label switch-label-right">Flota</label>*/}
                      </div>
                      <div className="create-detail">
                        <table className="table">
                          <tbody>
                            {
                              cars.map((car: any) => (
                                <tr key={car.tid}>
                                  <td className="middle">{`${car.denomination} ${car.material} ${car.brand}`}</td>
                                  <td className="middle">{car.color}</td>
                                  <td className="middle">{this.searchReason(car.reason)}</td>
                                  <td className="middle">
                                    <i className={`material-icons ${!car.washed ? 'text-gray' : ''}`}>local_car_wash</i>
                                  </td>
                                  <td className="middle">
                                    <i className={`material-icons ${!car.equipment ? 'text-gray' : ''}`}>build</i>
                                  </td>
                                  <td className="middle text-muted" style={{ width: '140px' }}>
                                    {
                                      car.observation && car.observation.length ?
                                        car.observation
                                        : 'Sin observaciones'
                                    }
                                  </td>
                                  <td
                                    className="middle"
                                    onClick={() => this.deleteCar(car)}
                                  >
                                    <i className="fa fa-trash text-red pointer" />
                                  </td>
                                </tr>
                              ))
                            }
                          </tbody>
                        </table>
                      </div>
                      <div className="text-right text-muted" style={{ padding: '2px' }}>
                        {cars.length} vehículos
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="box-footer text-right">
              <button className="btn btn-sm btn-default" onClick={this.cancel}>Cancelar</button>
              <button
                className="btn btn-sm btn-primary"
                style={{ marginLeft: '5px' }}
                onClick={this.createRequest}
              >
                Crear
              </button>
            </div>
            {
              loading ?
                <div className="overlay">
                  <i className="fa fa-spinner fa-spin text-purple" />
                </div> : null
            }
          </div>
        </section>
      </AppContainer>
    );
  }

  private addCar(): void {
    const { newCar } = this.state;
    const $amount: any = $('#amount');
    const cars = Array(newCar.amount).fill({
      brand: newCar.brand,
      denomination: newCar.denomination,
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

  private changeNewCar(field: 'color' | 'brand' | 'denomination' | 'material' | 'observation' | 'reason', value: string) {
    this.setState({
      newCar: {
        ...this.state.newCar,
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
        this.api.getVenues(1, 200, true),
        this.api.getReasons(1, 200)
      ])
      .then(Axios.spread((venues, reasons) => {
        this.setState({
          venues: venues.data.results,
          reasons: reasons.data.results,
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
    const { cars, fleet, venue } = this.state;
    if (!cars.length) {
      swal('Solicitud', 'No se han agregado vehículos para crear la solicitud.', 'error');
    } else {
      this.api
        .createRequest({
          cars,
          fleet,
          venue
        })
        .then((response: AxiosResponse): void => {
          swal('Solicitud', 'Se ha creado satisfactoriamente.', 'success').then(() => {
            this.props.history.push('/requests/');
          });
        })
        .catch((err: AxiosError): void => {
          this.api.errorHandler(err);
        });
    }
  }

  private cancel(): void {
    this.props.history.push('/requests/');
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
