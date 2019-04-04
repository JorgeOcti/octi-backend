// <reference path="../../../node_modules/sweetalert/typings/sweetalert.d.ts"/>
// import * as PropTypes from 'prop-types';
import * as moment from 'moment';
import * as Raven from 'raven-js';
import {ErrorInfo} from 'react';
import * as React from 'react';
import {RefObject} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import * as XLSX from 'xlsx';
import {AlertReduxAction, IAlertsState} from '../../actions/alerts.actions';
import {loadDataAction, ModalReduxAction} from '../../actions/modal.actions';
import AppContainer from '../../container/AppContainer';
import ApiService from '../../utils/axios';
import {getExtension, getIconFromExtension} from '../../utils/common';
import Checkbox from '../Utils/CheckBox';
import VenueDetail from './VenueDetail';

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
  file: File | null;
  backupFile: File | null;
  backupUri: string;
}

class InventoryCreateView extends React.Component<IPropsType, IStateType> {

  // static propTypes = {
  //   dispatch: PropTypes.func.isRequired
  // };

  readonly inputFile: RefObject<HTMLInputElement>;
  readonly inputBackup: RefObject<HTMLInputElement>;

  readonly state = {
    error: null,
    canDrop: false,
    loadingSettings: false,
    carsByVenue: [],
    notification: true,
    name: `Inventario del ${moment().format('DD-MM-YYYY')}`,
    sending: false,
    file: null,
    backupFile: null,
    backupUri: ''
  };

  constructor(props: IPropsType) {
    super(props);
    this.clickUploadFile = this.clickUploadFile.bind(this);
    this.clickUploadBackup = this.clickUploadBackup.bind(this);
    this.processSettings = this.processSettings.bind(this);
    this.deleteVenue = this.deleteVenue.bind(this);
    this.handleChangeInputFile = this.handleChangeInputFile.bind(this);
    this.handleChangeInputBackup = this.handleChangeInputBackup.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.dragOverHandler = this.dragOverHandler.bind(this);
    this.dragEndHandler = this.dragEndHandler.bind(this);
    this.clearBackup = this.clearBackup.bind(this);
    this.dragLeaveHandler = this.dragLeaveHandler.bind(this);
    this.sendCreate = this.sendCreate.bind(this);
    this.handleChangeName = this.handleChangeName.bind(this);
    this.handleChangeNotification = this.handleChangeNotification.bind(this);
    this.inputFile = React.createRef();
    this.inputBackup = React.createRef();
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

  public componentDidUpdate(prevProps: Readonly<IPropsType>, prevState: Readonly<IStateType>, snapshot?: any): void {
    $('[data-toggle="tooltip"]').tooltip();
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public render(): React.ReactElement<IPropsType> {
    const {loadingSettings, carsByVenue, name, sending, notification, backupFile, backupUri} = this.state;
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
                              <VenueDetail index={index} venue={venue} key={venue.name} deleteVenue={this.deleteVenue} />
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
                    <div className="col-md-12">
                      <div className="form-group" style={{marginBottom: '0px'}}>
                        <label>Archivo de respaldo</label>
                      </div>
                      <div className="preview-files">
                        {
                          backupFile && backupUri ?
                            <div className="file">
                              <i className="fa fa-minus-circle text-red pointer" onClick={this.clearBackup}/>
                              <a href={backupUri} data-toggle="lightbox">
                                <img
                                  src={backupUri}
                                />
                              </a>
                            </div>
                            : backupFile ?
                            <div className="file">
                              <i className="fa fa-minus-circle text-red pointer" onClick={this.clearBackup}/>
                              <div className={`icon type-${getIconFromExtension(getExtension((backupFile as File).name))}`}/>
                              <div className="name-file">{(backupFile as File).name}</div>
                            </div>
                            : <div
                              className="add-file"
                              onClick={this.clickUploadBackup}
                            >
                              <i className="fa fa-plus"/>
                              AGREGAR ARCHIVO
                            </div>
                        }
                      </div>
                      <input
                        type="file"
                        onChange={this.handleChangeInputBackup}
                        style={{display: 'None'}}
                        ref={this.inputBackup}
                      />
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
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={this.downloadTemplate}
                      >
                        <i className="fa fa-fw fa-download"/> Descargar Formato
                      </button>
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
                      <Checkbox
                        active={notification}
                        action={this.handleChangeNotification}
                        classes="icheck-in-checkbox"
                        style={{marginTop: '-4px', marginRight: '5px'}}
                      />
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
              sending || loadingSettings ?
                <div className="overlay">
                  <i className="fa fa-spinner fa-spin text-purple"/>
                </div> : null
            }
          </div>
        </section>
      </AppContainer>
    );
  }

  private deleteVenue(venueName: string): void {
    const {carsByVenue} = this.state;
    swal({
      title: '¿Estás seguro?',
      text: `Vas a eliminar la sucursal "${venueName}"`,
      icon: 'warning',
      dangerMode: true,
      buttons: {
        cancel: 'Cancelar' as any,
        confirm: {
          text: 'Sí'
        }
      }
    }).then((willDelete) => {
      if (willDelete) {
        this.setState({
          carsByVenue: carsByVenue.filter((venue: any) => venue.name !== venueName)
        });
      }
    });
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

  private clickUploadBackup(): void {
    if (this.inputBackup.current) {
      this.inputBackup.current.click();
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
          const workbook: XLSX.WorkBook = XLSX.read(data, {
            type: rABS ? 'binary' : 'array'
          });
          const excelData = workbook.Sheets.hasOwnProperty('Autos') ? XLSX.utils.sheet_to_json(workbook.Sheets.Autos) : [];
          const carsByVenue: any = {};
          if (excelData.length >= 1) {
            excelData.forEach((item: any) => {
              if (item.hasOwnProperty('vin') && item.vin && item.hasOwnProperty('sucursal') && item.sucursal) {
                const vinWarning = item.vin.length < 17;
                const patentWarning = item.patente && item.patente.length < 6;
                const car = {
                  vin: item.vin,
                  internalNumber: item.NInterno,
                  color: item.color,
                  denomination: item.denominacion,
                  brand: item.marca,
                  patent: item.patente,
                  hasWarnings: vinWarning || patentWarning,
                  warning: {
                    vin: vinWarning,
                    patent: patentWarning
                  }
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
                /* tslint:disable:no-console */
                console.log('Error en linea:');
                console.log(item.__rowNum__);
              }
            });
            const carsByVenueArray: any[] = [];
            for (const cv in carsByVenue) {
              if (carsByVenue.hasOwnProperty(cv)) {
                carsByVenueArray.push({
                  name: cv,
                  cars: carsByVenue[cv].cars.sort((x: any, y: any) => {
                    return (x.hasWarnings === y.hasWarnings) ? 0 : x.hasWarnings ? -1 : 1;
                  })
                });
              }
            }
            this.setState({
              file,
              carsByVenue: carsByVenueArray,
              loadingSettings: false
            });
          } else {
            swal(
              'Importador de configuración',
              `"${file.name}" no cumple con los requisitos mínimos o no tiene autos.`,
              'error'
            );
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

  private validateSize(size: number) {
    const maxSize = Math.pow(1024, 2) * 10; // 10MB
    return size <= maxSize;
  }

  private clearBackup() {
    this.setState({
      backupFile: null,
      backupUri: ''
    });
  }

  private handleChangeInputBackup(e: React.ChangeEvent<HTMLInputElement>): void {
    const {files} = e.target;
    if (files && files.length) {
      const file = files[0];
      if (!this.validateSize(file.size)) {
        swal('Envió inventario', 'El archivo excede los 10Mb permitios.', 'error');
      } else {
        if (new RegExp('\\bimage\\b').test(file.type)) {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target) {
              this.setState({
                backupFile: file,
                backupUri: (e.target as any).result
              });
            }
          };
          reader.readAsDataURL(file);
        } else {
          this.setState({
            backupFile: file,
            backupUri: ''
          });
        }
      }
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
    const {carsByVenue, name, notification, file, backupFile} = this.state;
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
    } else if (file) {
      const api = new ApiService({
        'Content-Type': 'multipart/form-data'
      });
      api.getSource();
      api
        .createInventory(carsByVenue, name, notification, file, backupFile)
        .then((response: any) => {
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
