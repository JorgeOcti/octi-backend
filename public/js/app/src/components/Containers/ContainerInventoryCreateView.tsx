import {RouteComponentProps} from "react-router";
import {AlertReduxAction, IAlertsState} from "../../actions/alerts.actions";
import {Dispatch} from "redux";
import {loadDataAction, ModalReduxAction} from "../../actions/modal.actions";
import TrackingBasePage from "../Utils/TrackingBasePage";
import * as React from 'react';
import {RefObject} from "react";
import AppContainer from "../../container/AppContainer";
import Checkbox from "../Utils/CheckBox";
import * as XLSX from "xlsx";
import * as swal from 'sweetalert';
import ApiService from "../../utils/axios";
import {connect} from "react-redux";
import * as moment from "moment/moment";

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  alerts: IAlertsState;
  dispatch: Dispatch<AlertReduxAction>;
  loadDataAction(
    title: string,
    body: JSX.Element,
    footer: JSX.Element
  ): ModalReduxAction;
}

interface IStateType {
  error: Error | null;
  canDrop: boolean;
  notification: boolean;
  loadingSettings: boolean;
  carsByVenue: any;
  venues: any[];
  loading: boolean;
  name: string;
  sending: boolean;
  file: File | null;
  backupFile: File | null;
  backupUri: string;
  manualPhoto: number;
  reportPhoto: number;
}

class ContainerInventoryCreateView extends TrackingBasePage<IPropsType, IStateType> {
  title: string;

  readonly state = {
    error: null,
    canDrop: false,
    loadingSettings: false,
    carsByVenue: [],
    venues: [],
    loading: true,
    notification: true,
    name: `Inventario del ${moment().format('DD-MM-YYYY')}`,
    sending: false,
    file: null,
    backupFile: null,
    backupUri: '',
    manualPhoto: 1,
    reportPhoto: 1
  };

  readonly inputFile: RefObject<HTMLInputElement>;
  readonly inputBackup: RefObject<HTMLInputElement>;

  constructor(props: IPropsType) {
    super(props);

    this.inputFile = React.createRef();
    this.inputBackup = React.createRef();
  }

  componentDidMount() {
    this.title = "Crear inventario container";
  }

  private sendCreate(): void {
    const {
      carsByVenue,
      name,
      notification,
      file,
      backupFile,
      manualPhoto,
      reportPhoto
    } = this.state;
    const { history } = this.props;
    this.setState({
      sending: true
    });
    if (!name.trim().length) {
      swal!(
        'Envió inventario',
        'El nombre del inventario es obligatorio.',
        'error'
      );
      this.setState({
        sending: false
      });
    } else if (!carsByVenue.length) {
      swal!(
        'Envió inventario',
        'No se ha importado la configuración o no contiene sucursales.',
        'error'
      );
      this.setState({
        sending: false
      });
    } else if (file) {
      const api = new ApiService({
        'Content-Type': 'multipart/form-data'
      });
      api.getSource();
      api
        .createInventory({
          carsByVenue,
          name,
          notification,
          file,
          backupFile,
          manualPhoto,
          reportPhoto
        })
        .then((response: any) => {
          const { message } = response.data;
          swal!('Envió inventario', message, 'success');
          setTimeout(() => {
            this.setState({
              sending: false
            });
            swal.close();
            history.push('/inventory/');
          }, 2000);
        })
        .catch((e) => {
          console.log('e', e);
          swal!(
            'Envió inventario',
            'Se produjo un error al crear el inventario.',
            'error'
          );
          this.setState({
            sending: false
          });
        });
    }
  }

  private processSettings(file: File): void {
    const { venues } = this.state;
    this.setState({
      loadingSettings: true
    });
    if (
      [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ].includes(file.type)
    ) {
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
          const excelData = workbook.Sheets.hasOwnProperty('Autos')
            ? XLSX.utils.sheet_to_json(workbook.Sheets.Autos)
            : [];
          const carsByVenue: any = {};
          if (excelData.length >= 1) {
            excelData.forEach((item: any) => {
              if (
                item.hasOwnProperty('vin') &&
                item.vin &&
                item.hasOwnProperty('sucursal') &&
                item.sucursal
              ) {
                const vinWarning = item.vin.length < 17;
                const patentWarning = item.patente && item.patente.length < 6;
                const car = {
                  vin: item.vin.trim(),
                  internalNumber: item.NInterno ? item.NInterno.trim() : '',
                  color: item.color ? item.color.trim() : '',
                  denomination: item.denominacion
                    ? item.denominacion.trim()
                    : '',
                  brand: item.marca ? item.marca.trim() : '',
                  patent: item.patente ? item.patente.trim() : '',
                  property: item.propiedad
                    ? item.propiedad.trim().toUpperCase()
                    : '',
                  type: item.tipo ? item.tipo.trim() : '',
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
                // swal!('Error en archivo de configuracion', `Revise la linea ${item.__rowNum__}`, 'error');
                console.log('Error en linea:');
                console.log(item.__rowNum__);
                return;
              }
            });
            const carsByVenueArray: any[] = [];
            const venuesNotFound: string[] = [];
            for (const cv in carsByVenue) {
              if (carsByVenue.hasOwnProperty(cv)) {
                const existVenue = venues.some((venue: any) => {
                  return (
                    venue.name.trim().toLowerCase() === cv.trim().toLowerCase()
                  );
                });
                if (!existVenue && !venuesNotFound.includes(cv.toLocaleUpperCase())) {
                  venuesNotFound.push(cv.toLocaleUpperCase());
                }
                carsByVenueArray.push({
                  name: cv.trim(),
                  warningNoExist: !existVenue,
                  cars: carsByVenue[cv].cars.sort((x: any, y: any) => {
                    return x.hasWarnings === y.hasWarnings
                      ? 0
                      : x.hasWarnings
                        ? -1
                        : 1;
                  })
                });
              }
            }
            if (venuesNotFound.length > 0) {
              swal!('Sucursales no configuradas', `No se encontraron las siguientes sucursales:\n\n - ${venuesNotFound.join("\n- ")}\n\n Estas sucursales no existen o no tienes acceso a ellas.\n\nVuelve a subir el archivo con las sucursales correctas, o solicita la configuración de una nueva sucursal o acceso a una existente escribiéndonos a  soporte@osacontrol.com`, 'error');
              this.setState({
                loadingSettings: false
              });
            } else {
              this.setState({
                file,
                carsByVenue: carsByVenueArray,
                loadingSettings: false
              });
            }
          } else {
            swal!(
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
      swal!(
        'Importador de configuración',
        'Este archivo no cumple con los requisitos mínimos o no tiene autos.',
        'error'
      );
      this.setState({
        loadingSettings: false
      });
    }
  }

  private handleChangeInputFile(e: React.ChangeEvent<HTMLInputElement>): void {
    const { files } = e.target;
    if (files && files.length) {
      this.processSettings(files[0]);
    }
  }

  private clickUploadFile(): void {
    if (this.inputFile.current) {
      this.inputFile.current.click();
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

  private downloadTemplate(): void {
    /* headers worksheet */
    const data = [
      {
        sucursal: '',
        NInterno: '',
        vin: '',
        marca: '',
        patente: '',
        denominacion: '',
        color: '',
        propiedad: '',
        tipo: ''
      }
    ];
    /* make the worksheet */
    const ws = XLSX.utils.json_to_sheet(data);
    /* add to workbook */
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Autos');
    /* generate an XLSX file */
    XLSX.writeFile(wb, 'template_inventory_settings.xlsx');
  }

  private handleChangeNotification() {
    this.setState({
      notification: !this.state.notification
    });
  }

  render() {
    const {
      loadingSettings,
      carsByVenue,
      name,
      sending,
      notification,
      backupFile,
      backupUri,
      loading
    } = this.state;

    return (
      <AppContainer title="" cMenu="2" cSubMenu="2.1" cAction="Creación">
        <section className="content">
          <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">Cargando Inventario de Containers</h3>
            </div>
            <div className="box-body margin">
              <div className="row">
                <div className="col col-md-6">
                  <div className="form-group">
                    <label htmlFor="name">Nombre</label>
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      value={name}
                      onChange={(e) => this.setState({ name: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              { false ? null
              // {carsByVenue.length ?
              //   (
              //   <div className="row">
              //     <div className="col-md-12">
              //       <div className="form-group">
              //         <label>Configuración cargada</label>
              //         <div
              //           className="box-group"
              //           id="accordion"
              //           style={{ margin: '2px 0 10px 0' }}>
              //           {carsByVenue.map((venue: any, index) => {
              //             carsInSettings += venue.cars.length;
              //             return (
              //               <VenueDetail
              //                 index={index}
              //                 venue={venue}
              //                 key={venue.name}
              //                 deleteVenue={this.deleteVenue}
              //               />
              //             );
              //           })}
              //         </div>
              //       </div>
              //     </div>
              //     <div className="col-md-6">
              //       <p>
              //         <strong>Total de sucursales:</strong> {carsByVenue.length}
              //       </p>
              //       <p>
              //         <strong>Total de unidades:</strong> {carsInSettings}
              //       </p>
              //     </div>
              //     <div className="col-md-6 text-right">
              //       <button
              //         className="btn btn-sm btn-primary"
              //         onClick={this.downloadTemplate}>
              //         <i className="fa fa-fw fa-download" /> Descargar Formato
              //       </button>
              //       <button
              //         className="btn btn-sm btn-default"
              //         onClick={this.clickUploadFile}
              //         style={{ marginLeft: '5px' }}>
              //         <i className="fa fa-fw fa-cogs" /> Cambiar configuración
              //       </button>
              //     </div>
              //     <div className="col-md-12">
              //       <div className="form-group" style={{ marginBottom: '0px' }}>
              //         <label>Archivo de respaldo</label>
              //       </div>
              //       <div className="preview-files">
              //         {backupFile && backupUri ? (
              //           <div className="file">
              //             <i
              //               className="fa fa-minus-circle text-red pointer"
              //               onClick={this.clearBackup}
              //             />
              //             <a
              //               href={backupUri}
              //               className="zoom-in"
              //               data-toggle="lightbox"
              //               data-title={`Vista previa de la imagen`}
              //               data-footer={(backupFile as unknown as File).name}>
              //               <img
              //                 src={backupUri}
              //                 data-toggle="tooltip"
              //                 data-placement="bottom"
              //                 title={(backupFile as unknown as File).name}
              //               />
              //             </a>
              //           </div>
              //         ) : backupFile ? (
              //           <div className="file">
              //             <i
              //               className="fa fa-minus-circle text-red pointer"
              //               onClick={this.clearBackup}
              //             />
              //             <div
              //               className={`icon type-${getIconFromExtension(
              //                 getExtension((backupFile as unknown as File).name)
              //               )}`}
              //             />
              //             <div
              //               className="name-file"
              //               data-toggle="tooltip"
              //               data-placement="bottom"
              //               title={(backupFile as unknown as File).name}>
              //               {(backupFile as unknown as File).name}
              //             </div>
              //           </div>
              //         ) : (
              //           <div
              //             className="add-file"
              //             onClick={this.clickUploadBackup}>
              //             <i className="fa fa-plus" />
              //             AGREGAR ARCHIVO
              //           </div>
              //         )}
              //       </div>
              //       <input
              //         type="file"
              //         onChange={this.handleChangeInputBackup}
              //         style={{ display: 'None' }}
              //         ref={this.inputBackup}
              //       />
              //     </div>
              //   </div>
              // )
                :
                (
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
                          border: this.state.canDrop
                            ? '1px solid #979797'
                            : '1px dashed #979797',
                          padding: '40px 20px',
                          color: this.state.canDrop ? '#aebccb' : '#6e7a89',
                          borderRadius: '5px'
                        }}>
                        <i className="fa fa-2x fa-cloud-upload" />
                        <br />
                        Prueba soltando el excel aquí, o haz click para
                        seleccionar el excel a cargar.
                      </div>
                    </div>
                  </div>
                  <div className="col-md-12 text-right">
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={this.downloadTemplate}>
                      <i className="fa fa-fw fa-download" /> Descargar Formato
                    </button>
                  </div>
                </div>
              )}

              <input
                type="file"
                onChange={this.handleChangeInputFile}
                style={{ display: 'None' }}
                ref={this.inputFile}
                accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              />
              <div className="row">
                <div className="col-md-12">
                  <div
                    className="form-group"
                    style={{ marginBottom: '0px', marginTop: '10px' }}>
                    <label>Configuraciones</label>
                  </div>
                </div>
                <div className="col-md-12 no-padding">
                  <div className="col-sm-12 col-md-8 col-lg-6">
                    <div className="form-horizontal">
                      <div
                        className="form-group"
                        style={{ marginRight: '0', marginLeft: '0' }}>
                        <div className="col-sm-6 col-md-8 col-lg-8 no-padding">
                          <span
                            className="control-label"
                            style={{
                              paddingLeft: '0',
                              textAlign: 'left',
                              fontWeight: 600
                            }}>
                            Nº imágenes al inventariar
                          </span>
                          <br />
                          <span className={'text-sm text-muted'}>
                            Cantidad de fotografías solicitadas al ingresar
                            unidad digitando el VIN.
                          </span>
                        </div>
                        <input
                          id="manual-photo"
                          type="text"
                          className="col-sm-6 col-md-4 col-lg-4 form-control"
                        />
                      </div>
                    </div>
                    {/*<div className="checkbox">*/}
                    {/*  <label style={{paddingLeft: '0'}} onClick={this.handleChangeManualPhoto}>*/}
                    {/*    <Checkbox*/}
                    {/*      active={manualPhoto === 1}*/}
                    {/*      action={this.handleChangeManualPhoto}*/}
                    {/*      classes="icheck-in-checkbox"*/}
                    {/*      style={{marginTop: '-4px', marginRight: '5px'}}*/}
                    {/*    />*/}
                    {/*    Solicitar foto en modo manual*/}
                    {/*  </label>*/}
                    {/*</div>*/}
                  </div>
                </div>
                <div className="col-sm-12 col-md-8 col-lg-6">
                  <div className="form-horizontal">
                    <div
                      className="form-group"
                      style={{ marginRight: '0', marginLeft: '0' }}>
                      <div className="col-sm-6 col-md-8 col-lg-8 no-padding">
                        <span
                          className="control-label"
                          style={{
                            paddingLeft: '0',
                            textAlign: 'left',
                            fontWeight: 600
                          }}>
                          Nº imágenes al reportar
                        </span>
                        <br />
                        <span className={'text-sm text-muted'}>
                          Cantidad de fotografías solicitadas al reportar una
                          unidad.
                        </span>
                      </div>
                      <input
                        id="report-photo"
                        type="text"
                        className="col-sm-6 col-md-4 col-lg-4 form-control"
                      />
                    </div>
                  </div>
                  {/*<input*/}
                  {/*  type="text"*/}
                  {/*  id="report-photo"*/}
                  {/*  className="input-sm form-control"*/}
                  {/*  style={{*/}
                  {/*    width: '35px'*/}
                  {/*  }}*/}
                  {/*/>*/}
                  {/*<span>Cantidad de imágenes al reportar</span>*/}
                </div>
                <div className="col-md-8 col-sm-12">
                  <div className="checkbox">
                    <label
                      style={{ paddingLeft: '0', fontWeight: 600 }}
                      onClick={this.handleChangeNotification}>
                      <Checkbox
                        active={notification}
                        action={this.handleChangeNotification}
                        classes="icheck-in-checkbox"
                        style={{ marginTop: '-4px', marginRight: '5px' }}
                      />
                      Enviar notificaciones push
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="box-footer text-right">
              <button
                className="btn btn-sm btn-default"
                onClick={() => this.props.history.push('/inventory/')}>
                Cancelar
              </button>
              <button
                className="btn btn-sm btn-primary"
                style={{ marginLeft: '5px' }}
                onClick={this.sendCreate}
                // disabled={sending}
              >
                Crear
                {/*{sending || loading ? (*/}
                {/*  <React.Fragment>*/}
                {/*    <i className="fa fa-fw fa-spin fa-spinner" /> Creando...*/}
                {/*  </React.Fragment>*/}
                {/*) : (*/}
                {/*  'Crear'*/}
                {/*)}*/}
              </button>
            </div>
            {/*{sending || loading || loadingSettings ? (*/}
            {/*  <div className="overlay">*/}
            {/*    <i className="fa fa-spinner fa-spin text-purple" />*/}
            {/*  </div>*/}
            {/*) : null}*/}
          </div>
        </section>
      </AppContainer>
    );
  }
}

const mapStateToProps = (state: { alerts: IAlertsState }) => {
  return {
    alerts: state.alerts
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch,
    loadDataAction: (title: string, body: JSX.Element, footer: JSX.Element) =>
      dispatch(loadDataAction(title, body, footer))
  };
};

export default connect<{}, {}, IPropsType>(
  mapStateToProps,
  mapDispatchToProps
)(ContainerInventoryCreateView);
