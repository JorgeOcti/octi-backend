import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo, RefObject} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import * as swal from 'sweetalert';
import * as XLSX from 'xlsx';
import {loadDataAction, ModalReduxAction} from '../../actions/modal.actions';
import AppContainer from '../../container/AppContainer';
import ApiService from '../../utils/axios';
import {AxiosError, AxiosResponse} from "axios";
import {
  getStockAction,
  IStockState,
  StockReducerAction
} from "../../actions/stock.actions";
import ShowIf from "../Utils/ShowIf";
import StockVenueDetail from "./StockVenueDetail";

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<StockReducerAction>;
  stock: IStockState;
  getStockAction(): StockReducerAction;
  loadDataAction(title: string, body: JSX.Element, footer: JSX.Element): ModalReduxAction;
}

interface IStateType {
  error: Error | null;
  canDrop: boolean;
  loadingSettings: boolean;
  carsByVenue: any[];
  totalCars: number;
  createdCard: number;
  deletedCard: number;
  venues: any[];
  loading: boolean;
  sending: boolean;
  file: File | null;
}

class StockImportView extends React.Component<IPropsType, IStateType> {

  readonly inputFile: RefObject<HTMLInputElement>;

  readonly state = {
    error: null,
    canDrop: false,
    loadingSettings: false,
    carsByVenue:[],
    venues: [],
    totalCars: 0,
    createdCard: 0,
    deletedCard: 0,
    loading: false,
    sending: false,
    file: null,
  };

  constructor(props: IPropsType) {
    super(props);
    this.clickUploadFile = this.clickUploadFile.bind(this);
    this.getVenues = this.getVenues.bind(this);
    this.processSettings = this.processSettings.bind(this);
    this.deleteVenue = this.deleteVenue.bind(this);
    this.handleChangeInputFile = this.handleChangeInputFile.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.dragOverHandler = this.dragOverHandler.bind(this);
    this.dragEndHandler = this.dragEndHandler.bind(this);
    this.dragLeaveHandler = this.dragLeaveHandler.bind(this);
    this.sendCreate = this.sendCreate.bind(this);
    this.inputFile = React.createRef();
  }

  public componentWillMount() {
    // set the title of the page
    document.title = 'OSA Andes | Importar Stock';
    this.getVenues();
    this.props.getStockAction();
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
    const {
      loadingSettings, sending, loading, carsByVenue, totalCars, createdCard, deletedCard
    } = this.state;
    return (
      <AppContainer title="" cMenu="2" cSubMenu="2.4" cAction="Importar">
        <section className="content">
          <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">Importar stock</h3>
              <div className="pull-right box-tools">
                <button
                  className="btn btn-sm btn-primary"
                  onClick={this.downloadTemplate}
                >
                  <i className="fa fa-fw fa-download"/> Descargar Formato
                </button>
              </div>
            </div>
            <div className="box-body margin">
              {
                carsByVenue.length ?
                  <div className="row">
                    <div className="col-md-12">
                      <div
                      style={{
                        backgroundColor: "#f0f0f0",
                        padding: "10px 10px 2px  10px",
                        marginBottom: "10px"
                      }}>
                        <p className="text-green">
                          <i className="fa fa-fw fa-plus-circle"/> Se {createdCard > 1 ? "agregarán" : "agregará"} {createdCard} {createdCard > 1 ? "unidades" : "unidad"} al stock.
                        </p>
                        <p className="text-red">
                          <i className="fa fa-fw fa-minus-circle" /> Se {deletedCard > 1 ? "eliminarán" : "eliminará"} {deletedCard} {deletedCard > 1 ? "unidades" : "unidad"} del stock.
                        </p>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="form-group">
                        <label>Configuración cargada</label>
                        <div className="box-group" id="accordion" style={{margin: '2px 0 10px 0'}}>
                          {
                            carsByVenue.map((venue: any, index) => {
                              return (
                                <StockVenueDetail
                                  index={index}
                                  venue={venue}
                                  key={venue.name}
                                  deleteVenue={this.deleteVenue}
                                />
                              );
                            })
                          }
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <p><strong>Total de sucursales:</strong> {carsByVenue.length}</p>
                      <p><strong>Total de unidades:</strong> {totalCars}</p>
                    </div>
                    <div className="col-md-6 text-right">
                      {/*<button className="btn btn-sm btn-default" onClick={this.clickUploadFile}>*/}
                      {/*  <i className="fa fa-fw fa-cogs" /> Cambiar configuración*/}
                      {/*</button>*/}
                    </div>
                  </div> :
                  <div className="row">
                    <div className="col col-md-12">
                      <div className="form-group">
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
                            padding: '100px 20px',
                            color: this.state.canDrop ? '#aebccb' : '#6e7a89',
                            borderRadius: '10px'
                          }}>
                          <i className="fa fa-2x fa-cloud-upload"/><br/>
                          Prueba soltando el excel aquí, o haz click para seleccionar el excel a cargar.
                        </div>
                      </div>
                    </div>
                  </div>
              }
              <input
                type="file"
                onChange={this.handleChangeInputFile}
                style={{display: 'None'}}
                ref={this.inputFile}
                accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              />
            </div>
            <ShowIf condition={carsByVenue.length > 0}>
              <div className="box-footer text-right">
                <button
                  className="btn btn-sm btn-default"
                  onClick={() => this.props.history.push('/stock/')}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-sm btn-primary"
                  style={{marginLeft: '5px'}}
                  onClick={this.sendCreate}
                  disabled={sending}
                >
                  {
                    sending || loading ?
                      <React.Fragment>
                        <i className="fa fa-fw fa-spin fa-spinner"/> Creando...
                      </React.Fragment>
                      : 'Crear'
                  }
                </button>
              </div>
            </ShowIf>
            {
              sending || loading || loadingSettings ?
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

  private clickUploadFile(): void {
    if (this.inputFile.current) {
      this.inputFile.current.click();
    }
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
      color: '',
      propiedad: '',
      tipo: ''
    }];
    /* make the worksheet */
    const ws = XLSX.utils.json_to_sheet(data);
    /* add to workbook */
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Autos');
    /* generate an XLSX file */
    XLSX.writeFile(wb, 'template_stock_settings.xlsx');
  }

  private processSettings(file: File): void {
    const {vinInStock} = this.props.stock;
    const {venues} = this.state;
    let createdCard = 0;
    let totalCars = 0;
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
                totalCars++;
                const vinWarning = item.vin.length < 17;
                const patentWarning = item.patente && item.patente.length < 6;
                const inStock = vinInStock.hasOwnProperty(item.vin.trim());
                if(!inStock){
                  createdCard++;
                }
                const car = {
                  vin: item.vin.trim(),
                  internalNumber: item.NInterno ? item.NInterno.trim() : '',
                  color: item.color ? item.color.trim() : '',
                  denomination: item.denominacion ? item.denominacion.trim() : '',
                  brand: item.marca ? item.marca.trim() : '',
                  patent: item.patente ? item.patente.trim() : '',
                  property: item.propiedad ? item.propiedad.trim().toUpperCase() : '',
                  type: item.tipo ? item.tipo.trim() : '',
                  hasWarnings: vinWarning || patentWarning,
                  created: !inStock,
                  warning: {
                    vin: vinWarning,
                    patent: patentWarning
                  }
                };
                if (!carsByVenue.hasOwnProperty(item.sucursal)) {
                  carsByVenue[item.sucursal] = {
                    cars: []
                  };
                }
                carsByVenue[item.sucursal].cars.push(car);
              } else {
                /* tslint:disable:no-console */
                console.log('Error en linea:');
                console.log(item.__rowNum__);
              }
            });
            const carsByVenueArray: any[] = [];
            for (const cv in carsByVenue) {
              if (carsByVenue.hasOwnProperty(cv)) {
                const existVenue = venues.length ? venues.some((venue: any) => {
                  return venue.name.trim().toLowerCase() === cv.trim().toLowerCase()
                }) : false;
                carsByVenueArray.push({
                  name: cv.trim(),
                  warningNoExist: !existVenue,
                  cars: carsByVenue[cv].cars.sort((x: any, y: any) => {
                    return (x.hasWarnings === y.hasWarnings) ? 0 : x.hasWarnings ? -1 : 1;
                  })
                });
              }
            }
            this.setState({
              file,
              createdCard,
              deletedCard: (Object.keys(vinInStock).length  - (totalCars- createdCard)),
              totalCars,
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

  private getVenues(){
    this.setState({loading: true});
    const api: ApiService = new ApiService();
    api.getVenues(1, 200)
      .then((response: AxiosResponse):void =>{
        this.setState({
          venues: response.data.results,
          loading: false
        });
      })
    .catch((err: AxiosError): void => {
      api.errorHandler(err);
    });
  }

  private sendCreate(): void {
    const {carsByVenue, totalCars, file} = this.state;
    const { history } = this.props;
    this.setState({
      sending: true
    });
    if (!totalCars) {
      swal('Importación de stock', 'No se ha importado la configuración o no contiene sucursales.', 'error');
      this.setState({
        sending: false
      });
    } else if (file) {
      const api = new ApiService();
      api.getSource();
      api
        .loadStock({
          carsByVenue
        })
        .then((response: any) => {
          const { message } = response.data;
          setTimeout(() => {
            swal('Importación de stock', message, 'success');
          }, 200);
          history.push('/stock/');
          this.setState({
            sending: false
          });
        })
        .catch((e) => {
          console.log('e', e);
          swal('Importación de stock', 'Se produjo un error al cargar el stock.', 'error');
          this.setState({
            sending: false
          });
        });
    }
  }
}

const mapStateToProps = (state: { stock: IStockState }) => {
  return {
    stock: state.stock
  };
};

const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    getStockAction: () => dispatch(getStockAction()),
    loadDataAction: (title: string, body: JSX.Element, footer: JSX.Element) => dispatch(loadDataAction(title, body, footer))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(StockImportView);
