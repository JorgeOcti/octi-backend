import {AxiosError} from 'axios';
import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo, RefObject} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import * as swal from 'sweetalert';
import * as uuid from 'uuid';
import * as XLSX from 'xlsx';
import {IUsersState, UserReduxAction} from '../../actions/users.actions';
import AppContainer from '../../container/AppContainer';
import ApiService from '../../utils/axios';
import ModalView from '../Modal/ModalView';
import TrackingBasePage from "../Utils/TrackingBasePage";

enum carStatus {
  Error,
  Pending,
  Finish
}

interface IImportCar {
  id?: string;
  NInterno: string;
  vin: string;
  marca: string;
  denominacion: string;
  patente: string;
  color: string;
  destino: string;
  status: number;
}

interface ICarObject {
  [key: string]: IImportCar;
}

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<UserReduxAction>;
}

interface IStateType {
  error: Error | null;
  loadFile: boolean;
  cars: IImportCar[];
  carsObj: ICarObject;
  canDrop: boolean;
}

class ImportCarsView extends TrackingBasePage<IPropsType, IStateType> {
  title : string;

  // static propTypes = {
  //   users: PropTypes.object.isRequired,
  //   dispatch: PropTypes.func.isRequired
  // };

  state = {
    error: null,
    loadFile: false,
    cars: [],
    canDrop: false,
    carsObj: {}
  };

  readonly inputFile: RefObject<HTMLInputElement>;
  // private socket: Socket;

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Importar autos';
    this.clickUploadFile = this.clickUploadFile.bind(this);
    this.handleChangeInputFile = this.handleChangeInputFile.bind(this);
    this.startLoad = this.startLoad.bind(this);
    this.processSettings = this.processSettings.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.dragOverHandler = this.dragOverHandler.bind(this);
    this.dragEndHandler = this.dragEndHandler.bind(this);
    this.dragLeaveHandler = this.dragLeaveHandler.bind(this);
    this.inputFile = React.createRef();
  }

 componentDidMount() {
   super.componentDidMount();
 }

  public componentWillUnmount() {
    // this.socket.disconnect();
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public render(): React.ReactElement<IPropsType> {
    const {cars, loadFile} = this.state;
    return (
      <AppContainer title="" cMenu="10" cSubMenu="10.2"  cAction="Importar">
        <section className="content">
          <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">Importar autos</h3>
              <div className="pull-right box-tools">
                <button
                  className="btn btn-sm btn-primary"
                  onClick={this.downloadTemplate}
                  style={{marginRight: '5px'}}>
                  <i className="fa fa-fw fa-download" /> Descargar Formato
                </button>
                {
                  cars.length >= 1 ? <button
                    className="btn btn-sm btn-default"
                    onClick={this.clickUploadFile}>
                    <i className="fa fa-fw fa-cloud-upload"/> {cars.length >= 1 ? 'Cargar otro excel' : 'Subir excel'}
                  </button> : null
                }
              </div>
            </div>
            <div className="box-body margin">
              <div className="row">
                <div className="col-md-12">
                  <input
                    type="file"
                    ref={this.inputFile}
                    style={{display: 'none'}}
                    onChange={this.handleChangeInputFile}
                    accept=".xlsx, .xls"
                  />
                </div>
              </div>
              {
                cars.length ?
                  <div className="row">
                    <div className="col-md-12">
                      {
                        loadFile ? <div>
                          Cargando...
                        </div> :
                          <div className="pull-right">
                            <button className="btn btn-sm btn-flat btn-success" onClick={this.startLoad}>
                              <i className="fa fa-fw fa-play" /> Iniciar carga
                            </button>
                          </div>
                      }
                      <table className="table">
                        <thead>
                        <tr>
                          <th>Nº Interno</th>
                          <th>VIN</th>
                          <th>Patente</th>
                          <th>Marca</th>
                          <th>Denominación</th>
                          <th>Color</th>
                          <th>Destino</th>
                        </tr>
                        </thead>
                        <tbody>
                        {
                          cars.map((car: IImportCar) => {
                            let classTR = '';
                            if (car.status === carStatus.Finish) {
                              classTR = 'success';
                            } else if (car.status === carStatus.Error) {
                              classTR = 'danger';
                            }
                            return (
                              <tr key={car.id} className={classTR}>
                                <td>{car.NInterno}</td>
                                <td>{car.vin}</td>
                                <td>{car.patente}</td>
                                <td>{car.marca}</td>
                                <td>{car.denominacion}</td>
                                <td>{car.color}</td>
                                <td>{car.destino}</td>
                              </tr>
                            );
                          })
                        }
                        </tbody>
                      </table>
                    </div>
                  </div> : <div
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
                    borderRadius: '5px',
                    marginBottom: '10px'
                  }}>
                  <i className="fa fa-2x fa-cloud-upload"/><br/>
                  Prueba soltando el excel aquí, o haz click para seleccionar el excel a cargar.
                </div>
              }
            </div>
            {
              loadFile &&
                <div className="overlay">
                  <i className="fa fa-spinner fa-spin text-purple"/>
                </div>
            }
          </div>
          <ModalView />
        </section>
      </AppContainer>
    );
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

  private startLoad() {
    const {cars} = this.state;
    swal({
      title: '¿Estás seguro?',
      text: `Vas a cargar ${cars.length} autos, recuerda que puedes revisar que los datos estén correctos en la pre visualización del Excel.`,
      icon: 'warning',
      buttons: true,
      dangerMode: true
    } as any)
      .then((willDelete) => {
        if (willDelete) {
          const api: ApiService = new ApiService();
          this.setState({
            loadFile: true
          });
          api
            .getSource();
          api
            .sendImportCars({cars})
            .then(() => {
              swal('Importador de autos', 'La carga a finalizado exitosamente.', 'success');
              this.setState({
                loadFile: false,
                cars: this.state.cars.map((car: IImportCar) => {
                  car.status = carStatus.Finish;
                  return car;
                })
              });
            })
            .catch((err: AxiosError) => {
              api.errorHandler(err);
            });
        }
      });

  }

  private clickUploadFile() {
    if (this.inputFile.current) {
      this.inputFile.current.click();
    }
  }

  private downloadTemplate() {
    /* headers worksheet */
    const data = [{
     NInterno: '',
      vin: '',
      marca: '',
      patente: '',
      denominacion: '',
      color: '',
      propiedad: '',
      tipo: ''
      // motor: '',
      // destino: ''
    }];
    /* make the worksheet */
    const ws = XLSX.utils.json_to_sheet(data);
    /* add to workbook */
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Autos');
    /* generate an XLSX file */
    XLSX.writeFile(wb, 'template_import_cars_v1.1.xlsx');
  }

  private handleChangeInputFile(e: React.ChangeEvent<HTMLInputElement>) {
    const {files} = e.target;
    if (files && files.length) {
      const file = files[0];
      this.processSettings(file);
    }
  }

  private processSettings(file: File): void {
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
          const cars: IImportCar[] = workbook.Sheets.hasOwnProperty('Autos') ? XLSX.utils.sheet_to_json(workbook.Sheets.Autos) : [];
          if (cars.length >= 1) {
            this.setState({
              cars: cars.map((car) => {
                car.id = uuid.v1();
                car.status = carStatus.Pending;
                return car;
              })
            });
          } else {
            swal('Importador de autos', 'Este excel no cumple con los requisitos mínimos o no tiene autos.', 'error');
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
    }
  }
}

const mapStateToProps = (state: { users: IUsersState }) => {
  return {
    users: state.users
  };
};

const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(ImportCarsView);
