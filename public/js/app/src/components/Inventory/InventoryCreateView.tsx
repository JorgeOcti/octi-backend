///<reference path="../../../node_modules/sweetalert/typings/sweetalert.d.ts"/>
// import * as PropTypes from 'prop-types';
import * as moment from 'moment';
import * as Raven from 'raven-js';
import {ErrorInfo} from 'react';
import * as React from 'react';
import {RefObject} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import slugify from 'slugify';
import * as XLSX from 'xlsx';
import {AlertReduxAction, IAlertsState} from '../../actions/alerts.actions';
import {loadDataAction, ModalReduxAction} from '../../actions/modal.actions';
import AppContainer from '../../container/AppContainer';
import ApiService from '../../utils/axios';
import Checkbox from '../CheckBox';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  alerts: IAlertsState;
  dispatch: Dispatch<AlertReduxAction>;
  loadDataAction(title: string, body: JSX.Element, footer: JSX.Element): ModalReduxAction;
}

interface IStateType {
  error: Error | null;
  canDrop: boolean;
  notification: boolean;
  loadingSettings: boolean;
  carsByVenue: any;
  name: string;
  sending: boolean;
}

class InventoryCreateView extends React.Component<IPropsType, IStateType> {

  // static propTypes = {
  //   dispatch: PropTypes.func.isRequired
  // };

  readonly inputFile: RefObject<HTMLInputElement>;

  state = {
    error: null,
    canDrop: false,
    loadingSettings: false,
    carsByVenue: [],
    notification: true,
    name: `Inventario del ${moment().format('YYMMDD')}`,
    sending: false
  };

  constructor(props: IPropsType) {
    super(props);
    this.clickUploadFile = this.clickUploadFile.bind(this);
    this.processSettings = this.processSettings.bind(this);
    this.handleChangeInputFile = this.handleChangeInputFile.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.dragOverHandler = this.dragOverHandler.bind(this);
    this.dragEndHandler = this.dragEndHandler.bind(this);
    this.dragLeaveHandler = this.dragLeaveHandler.bind(this);
    this.sendCreate = this.sendCreate.bind(this);
    this.handleChangeName = this.handleChangeName.bind(this);
    this.handleChangeNotification = this.handleChangeNotification.bind(this);
    this.inputFile = React.createRef();
  }

  public componentWillMount() {
    // set the title of the page
    document.title = 'OSA Andes | Crear Inventario';
  }

  public componentWillUnmount() {
    // cancel request if component is inmounted
    // if (this.props.alerts.source) {
    //   this.props.alerts.source.cancel('Operation canceled by the user.');
    // }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public render(): React.ReactElement<IPropsType> {
    // const {alerts, loading} = this.props.alerts;
    const {loadingSettings, carsByVenue, name, sending, notification} = this.state;
    let carsInSettings = 0;
    return (
      <AppContainer title="" cMenu="2" cSubMenu="2.1" cAction="Creación">
        <section className="content">
          <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">Creando auditoria de inventario</h3>
            </div>
            <div className="box-body margin">
              <div className="row">
                <div className="col col-md-6">
                  <div className="form-group">
                    <label htmlFor="name">Nombre</label>
                    <input type="text" className="form-control" id="name" value={name} onChange={this.handleChangeName} />
                  </div>
                </div>
              </div>
              {
                carsByVenue.length ?
                  <div className="row">
                    <div className="col-md-12">
                      <div className="box-group" id="accordion" style={{margin: '10px 0'}}>
                        {
                          carsByVenue.map((venue: any, index) => {
                            carsInSettings += venue.cars.length;
                            return (
                              <div className="panel box box-default" key={index}>
                                <div className="box-header with-border" style={{padding: '6px'}}>
                                  <h4 className="box-title">
                                    <a data-toggle="collapse"
                                       data-parent="#accordion"
                                       href={`#${slugify(venue.name.toLowerCase())}`}
                                       aria-expanded="false"
                                       style={{fontSize: '15px'}}
                                       className="collapsed">
                                      {index + 1} {venue.name} ({venue.cars.length} Vehiculos)
                                    </a>
                                  </h4>
                                </div>
                                <div id={`${slugify(venue.name.toLowerCase())}`} className="panel-collapse collapse" aria-expanded="false">
                                  <div className="box-body">
                                    <strong>Vehiculos</strong>
                                    <table className="table table-striped">
                                      <thead>
                                      <tr>
                                        <th>VIN</th>
                                        <th>PATENTE</th>
                                        <th>MARCA</th>
                                        <th>DENOMINACION</th>
                                      </tr>
                                      </thead>
                                      <tbody>
                                      {
                                        venue.cars.map((car: any, index: any) => {
                                          return (
                                            <tr key={index}>
                                              <td>{car.vin}</td>
                                              <td>{car.patent}</td>
                                              <td>{car.brand}</td>
                                              <td>{car.denomination}</td>
                                            </tr>
                                          );
                                        })
                                      }
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        }
                      </div>
                      <p><strong>Total de sucursales:</strong> {carsByVenue.length}</p>
                      <p><strong>Total de vehiculos:</strong> {carsInSettings}</p>
                    </div>
                    <div className="col-md-12 text-right">
                      <button className="btn btn-sm btn-primary" onClick={this.downloadTemplate}><i className="fa fa-fw fa-download" /> Descargar Formato</button>
                      <button className="btn btn-sm btn-default" onClick={this.clickUploadFile} style={{marginLeft: '5px'}}><i className="fa fa-fw fa-cogs" /> Cambiar configuración</button>
                    </div>
                  </div> :
                  <div className="row">
                    <div className="col col-md-12">
                      <div className="form-group">
                        <label>Importar configuración</label>
                        <div
                          className="upload-file text-center pointer"
                          onClick={this.clickUploadFile}
                          onDrop={this.handleDrop}
                          onDragOver={this.dragOverHandler}
                          onDragEnd={this.dragEndHandler}
                          onDragLeave={this.dragLeaveHandler}
                          style={{
                            backgroundColor: '#EEEEEE',
                            border: this.state.canDrop ? '1px solid #979797' : '1px dashed #979797',
                            padding: '40px 20px',
                            color: this.state.canDrop ? '#aebccb' : '#6e7a89',
                            borderRadius: '5px'
                          }}>
                          <i className="fa fa-2x fa-cloud-upload"/><br/>
                          Prueba a soltanto el excel aquí, o haz click para seleccionar el excel a cargar.
                        </div>
                      </div>
                    </div>
                    <div className="col-md-12 text-right">
                      <button className="btn btn-sm btn-primary" onClick={this.downloadTemplate}><i className="fa fa-fw fa-download"/> Descargar Formato</button>
                    </div>
                  </div>
              }
              <input
                type="file"
                onChange={this.handleChangeInputFile}
                style={{display: 'None'}}
                ref={this.inputFile} accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              />
              <div className="row">
                <div className="col col-md-6">
                  <div className="checkbox">
                    <label style={{paddingLeft: '0'}} onClick={this.handleChangeNotification}>
                      <Checkbox active={notification} action={this.handleChangeNotification} classes="icheck-in-checkbox"/>
                      Enviar notificaciones push
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="box-footer text-right">
              <button className="btn btn-sm btn-default" onClick={() => this.props.history.push('/inventory/')}>Cancelar</button>
              <button className="btn btn-sm btn-primary" style={{marginLeft: '5px'}} onClick={this.sendCreate} disabled={sending}>{
                sending ?
                  <React.Fragment><i className="fa fa-fw fa-spin fa-spinner"/> Creando...</React.Fragment>
                  :
                  'Crear'
              }
              </button>
            </div>
            {
              loadingSettings &&
              <div className="overlay">
                <i className="fa fa-spinner fa-spin text-purple"/>
              </div>
            }
          </div>
        </section>
      </AppContainer>
    );
  }

  private handleChangeNotification() {
    this.setState({
      notification: !this.state.notification
    });
  }

  private clickUploadFile(): void {
    if (this.inputFile.current) {
      this.inputFile.current.click();
    }
  }

  private handleChangeName(e: React.ChangeEvent<HTMLInputElement>): void {
    const {value} = e.target;
    this.setState({
      name: value
    });
  }

  private downloadTemplate(): void {
    /* headers worksheet */
    const data = [{
      sucursal: '',
      NInterno: '',
      vin: '',
      marca: '',
      patente: '',
      denominacion: '',
      color: ''
    }];
    /* make the worksheet */
    const ws = XLSX.utils.json_to_sheet(data);
    /* add to workbook */
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Autos');
    /* generate an XLSX file */
    XLSX.writeFile(wb, 'template_inventory_settings.xlsx');
  }

  private processSettings(file: File): void {
    this.setState({
      loadingSettings: true
    });
    if (['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(file.type)) {
      const reader = new FileReader();
      const rABS = !!reader.readAsBinaryString;
      reader.onload = (e: any) => {
        if (e.target) {
          let data = e.target.result;
          if (!rABS) {
            data = new Uint8Array(data);
          }
          const workbook = XLSX.read(data, {
            type: rABS ? 'binary' : 'array'
          });
          const excelData = workbook.Sheets.hasOwnProperty('Autos') ? XLSX.utils.sheet_to_json(workbook.Sheets.Autos) : [];
          // const cars: any[] = [];
          // const venues: any[] = [];
          const carsByVenue: any = {};
          if (excelData.length >= 1) {
            excelData.forEach((item: any) => {
              if (item.hasOwnProperty('vin') && item.vin && item.hasOwnProperty('sucursal') && item.sucursal) {
                const car = {
                  vin: item.vin,
                  internalNumber: item.NInterno,
                  color: item.color,
                  denomination: item.denominacion,
                  brand: item.marca,
                  patent: item.patente
                };
                if (!carsByVenue.hasOwnProperty(item.sucursal)) {
                  // venues.push(item.sucursal);
                  carsByVenue[item.sucursal] = {
                    cars: []
                  };
                }
                carsByVenue[item.sucursal].cars.push(car);
                // cars.push(car);
              } else {
                // @ts-ignore: Unreachable code error
                console.log('Error en linea:');
                // @ts-ignore: Unreachable code error
                console.log(item.__rowNum__);
              }
            });
            const carsByVenueArray: any[] = [];
            for (const cv in carsByVenue) {
              if (carsByVenue.hasOwnProperty(cv)) {
                carsByVenueArray.push({
                  name: cv,
                  cars: carsByVenue[cv].cars
                });
              }
            }
            this.setState({
              carsByVenue: carsByVenueArray,
              loadingSettings: false
            });
          } else {
            swal('Importador de configuración', 'Este excel no cumple con los requisitos mínimos o no tiene autos.', 'error');
            this.setState({
              loadingSettings: false
            });
          }
        }
      };
      if (rABS) {
        reader.readAsBinaryString(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
      if (this.inputFile.current) {
        this.inputFile.current.value = '';
      }
    } else {
      swal('Importador de configuración', 'Este archivo no cumple con los requisitos mínimos o no tiene autos.', 'error');
      this.setState({
        loadingSettings: false
      });
    }
  }

  private handleChangeInputFile(e: React.ChangeEvent<HTMLInputElement>): void {
    const {files} = e.target;
    if (files && files.length) {
      this.processSettings(files[0]);
    }
  }

  private handleDrop(e: React.DragEvent<HTMLDivElement>): void {
    e.preventDefault();
    const dt = e.dataTransfer;
    if (dt.items) {
      if (dt.items.length) {
        const file: File | null = dt.items[0].getAsFile();
        if (file) {
          this.processSettings(file);
        }
      }
    } else {
      if (dt.files.length) {
        const file = dt.files[0];
        this.processSettings(file);
      }
    }
  }

  private dragOverHandler(e: React.DragEvent<HTMLDivElement>): void {
    e.preventDefault();
    this.setState({
      canDrop: true
    });
  }

  private dragLeaveHandler(): void {
    this.setState({
      canDrop: false
    });
  }

  private dragEndHandler(e: React.DragEvent<HTMLDivElement>): void {
    const dt = e.dataTransfer;
    if (dt.items) {
      // Use DataTransferItemList interface to remove the drag data
      for (let i = 0; i < dt.items.length; i++) {
        dt.items.remove(i);
      }
    } else {
      // Use DataTransfer interface to remove the drag data
      e.dataTransfer.clearData();
    }
  }

  private sendCreate(): void {
    const {carsByVenue, name, notification} = this.state;
    const { history } = this.props;
    this.setState({
      sending: true
    });
    if (!name.trim().length) {
      swal('Envió inventario', 'El nombre del inventario es obligatorio.', 'error');
      this.setState({
        sending: false
      });
    } else if (!carsByVenue.length) {
      swal('Envió inventario', 'No se ha importado la configuración o no contiene sucursales.', 'error');
      this.setState({
        sending: false
      });
    } else {
      const api = new ApiService();
      api.getSource();
      api
        .createInventory(carsByVenue, name, notification)
        .then((response) => {
          const { message } = response.data;
          setTimeout(() => {
            swal('Envió inventario', message, 'success');
          }, 200);
          history.push('/inventory/');
          this.setState({
            sending: false
          });
        })
        .catch((e) => {
          console.log('e', e);
          swal('Envió inventario', 'Se produjo un error al crear el inventario.', 'error');
          this.setState({
            sending: false
          });
        });
    }
  }
}

const mapStateToProps = (state: { alerts: IAlertsState }) => {
  return {
    alerts: state.alerts
  };
};

const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    loadDataAction: (title: string, body: JSX.Element, footer: JSX.Element) => dispatch(loadDataAction(title, body, footer))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(InventoryCreateView);
