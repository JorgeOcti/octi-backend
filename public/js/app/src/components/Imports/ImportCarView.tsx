///<reference path="../../../node_modules/sweetalert/typings/sweetalert.d.ts"/>
import {AxiosError} from 'axios';
import * as PropTypes from 'prop-types';
import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo, RefObject} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
// import * as io from 'socket.io-client';
import * as uuid from 'uuid';
import * as XLSX from 'xlsx';
import {IUsersState, UserReduxAction} from '../../actions/users';
import AppContainer from '../../container/AppContainer';
// import {IWindow} from '../../interfaces/window';
import ApiService from '../../utils/axios';
import ModalView from '../Modal/ModalView';

// declare let window: IWindow;

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
}

class ImportCarsView extends React.Component<IPropsType, IStateType> {

  static propTypes = {
    users: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired
  };

  state = {
    error: null,
    loadFile: false,
    cars: [],
    carsObj: {}
  };

  readonly inputFile: RefObject<HTMLInputElement>;
  // private socket: SocketIOClient.Socket;

  constructor(props: IPropsType) {
    super(props);
    this.clickUploadFile = this.clickUploadFile.bind(this);
    this.handleChangeInputFile = this.handleChangeInputFile.bind(this);
    this.startLoad = this.startLoad.bind(this);
    this.inputFile = React.createRef();

    // socket
    /*this.socket = io.connect(`${location.protocol}//${location.host}`, {
      secure: location.protocol === 'https:',
      reconnection: true,
      query: {token: (window.user as any).token}
    });
    this.socket.on('STATUS-CARS', (data: any): void => {
      if (data.hasOwnProperty('newCar')) {
        this.setState({
          carsObj: {
            ...this.state.carsObj,
            [data.newCar.vin]: {
              ...(this.state.carsObj as any)[data.newCar.vin],
              status: carStatus.Finish
            }
          }
        });
      }
    });
    this.socket.on('FINISH-IMPORT', (data: any): void => {
      swal('Importador de autos', 'La carga a finalizado exitosamente.', 'success');
      this.setState({
        loadFile: false,
        cars: this.state.cars.map((car: IImportCar) => {
          car.status = carStatus.Finish;
          return car;
        })
      });
    });*/
  }

  public componentWillMount() {
    // set the title of the page
    // set the title of the page
    document.title = 'OSA Andes | Importar autos';
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
      <AppContainer title="" cMenu="2" cSubMenu="2.2"  cAction="Importar">
        <section className="content">
          <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">Importar autos</h3>
              <div className="pull-right box-tools">
                <button
                  className="btn btn-sm btn-primary"
                  onClick={this.downloadTemplate}
                  style={{marginRight: '5px'}}>
                  Descargar Formato
                </button>
                <button
                  className="btn btn-sm btn-success"
                  onClick={this.clickUploadFile}>
                  {cars.length > 1 ? 'Cargar otro excel' : 'Subir excel'}
                </button>
              </div>
            </div>
            <div className="box-body">
              <div className="row">
                <div className="col-md-12">
                  <input type="file" ref={this.inputFile} style={{display: 'none'}} onChange={this.handleChangeInputFile} />
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
                            <button className="btn btn-success" onClick={this.startLoad}>Iniciar carga</button>
                          </div>
                      }
                      <table className="table">
                        <thead>
                        <tr>
                          <th>Nº Interno</th>
                          <th>VIN</th>
                          <th>Marca</th>
                          <th>Denominación</th>
                          <th>Color</th>
                          <th>Destino</th>
                        </tr>
                        </thead>
                        <tbody>
                        {
                          cars.map((car: IImportCar, index) => {
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
                  </div> : <div className="row">
                    <div className="col-md-12">
                      <p>Seleccione un archivo para cargar.</p>
                    </div>
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
            .sendImportCars(cars)
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
      denominacion: '',
      color: '',
      destino: ''
    }];
    /* make the worksheet */
    const ws = XLSX.utils.json_to_sheet(data);
    /* add to workbook */
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Autos');
    /* generate an XLSX file */
    XLSX.writeFile(wb, 'template_import_cars_v1.xlsx');
  }

  private handleChangeInputFile(e: React.ChangeEvent<HTMLInputElement>) {
    const {files} = e.target;
    if (files && files.length) {
      const file = files[0];
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
            if (cars.length > 1) {
              this.setState({
                cars: cars.map((car) => {
                  car.id = uuid.v1();
                  car.status = carStatus.Pending;
                  return car;
                })
                // carsObj: cars.reduce((acc: any, cur: any) => {
                //   acc[cur.vin] = cur;
                //   return acc;
                // }, {})
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
