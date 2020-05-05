import * as React from "react";
import {RouteComponentProps} from "react-router";
import {Dispatch} from "redux";
import {connect} from "react-redux";
import AppContainer from "../../container/AppContainer";
import ModalView from "../Modal/ModalView";
import {IPlanningState, PlanningReduxAction} from "../../actions/planning.action";
import {IWindow} from "../../interfaces/window";
import {ErrorInfo, RefObject} from "react";
import * as Raven from "raven-js";
import * as XLSX from "xlsx";
import * as moment from "moment";
import * as swal from 'sweetalert';
import slugify from "slugify";
import ApiService from "../../utils/axios";

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<PlanningReduxAction>;
  planning: IPlanningState;
}

interface IStateType {
  error: Error | null;
  carsByDate: any[];
  canDrop: boolean;
  sending: boolean;
  loadingSettings: boolean;
}

declare let window: IWindow;

class PlanningImportView extends React.Component<IPropsType, IStateType> {

  readonly inputFile: RefObject<HTMLInputElement>;

  readonly state = {
    error: null,
    canDrop: false,
    sending: false,
    carsByDate: [],
    loadingSettings: false
  };

  constructor(props: IPropsType) {
    super(props);
    this.inputFile = React.createRef();
    this.clickUploadFile = this.clickUploadFile.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.dragOverHandler = this.dragOverHandler.bind(this);
    this.dragEndHandler = this.dragEndHandler.bind(this);
    this.dragLeaveHandler = this.dragLeaveHandler.bind(this);
    this.handleChangeInputFile = this.handleChangeInputFile.bind(this);
    this.downloadTemplate = this.downloadTemplate.bind(this);
    this.processSettings = this.processSettings.bind(this);
    this.sendCreate = this.sendCreate.bind(this);
  }

  public componentWillMount(): void {
    // set the title of the page
    document.title = 'OSA Andes | Importar planificación';
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public componentDidMount(): void {
    window.scrollTo(0, 0);
  }

  public componentWillUnmount(): void {
    // cancel request if component is inmounted
    if (this.props.planning.source) {
      this.props.planning.source.cancel('Operation canceled by the user.');
    }
  }

  public render(): React.ReactElement<IPropsType> {
    const {
      loadingSettings, carsByDate, sending
    } = this.state;
    return (
      <AppContainer title="" cMenu="3" cSubMenu="3.2">
        <section className="content">
          <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">Importar planificación</h3>
              <div className="pull-right box-tools">
                {
                  !carsByDate.length?
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={this.downloadTemplate}
                      style={{marginRight: '5px'}}>
                      <i className="fa fa-fw fa-download" /> Descargar Formato
                    </button>
                    :null
                }
              </div>
            </div>
            <div className="box-body margin">
              {
                carsByDate.length?
                  <div className="row">
                    <div className="col col-md-12">
                      <div className="form-group">
                        <label>Días que serán importardos</label>
                        {
                          carsByDate.map((carByDate: any) => (
                            <div className="panel box box-default" style={{borderTopWidth: '2px', marginBottom: "5px"}} key={carByDate.key}>
                              <div className="box-header with-border" style={{padding: '6px'}}>
                                <h4 className="box-title" style={{
                                  fontSize: '15px',
                                  display: 'block'
                                }}>
                                  <a data-toggle="collapse"
                                   data-parent="#accordion"
                                   href={`#${slugify(carByDate.key, {remove: /[*+~.()'"!:@]/g})}`}
                                   aria-expanded="false"
                                   className="collapsed">
                                  {`${moment(carByDate.key, "YYYYMMDD").format('dddd, DD MMMM YYYY')} (${carByDate.cars.length} Vehículos)`}
                                  </a>
                                </h4>
                              </div>
                              <div id={`${slugify(carByDate.key, {remove: /[*+~.()'"!:@]/g})}`} className="panel-collapse collapse"
                                   aria-expanded="false">
                                <div className="box-body no-padding">
                                  <table className="table table-striped">
                                    <thead>
                                    <tr>
                                      <th style={{width: '10%'}}>Nº Interno</th>
                                      <th style={{width: '15%'}}>VIN</th>
                                      <th style={{width: '5%'}}>PATENTE</th>
                                      <th style={{width: '10%'}}>MARCA</th>
                                      <th style={{width: '30%'}}>DENOMINACIÓN</th>
                                      <th style={{width: '30%'}}>COLOR</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {
                                      carByDate.cars.map((car: any) => (
                                        <tr key={car.vin}>
                                          <td>{car.NInterno}</td>
                                          <td>{car.vin}</td>
                                          <td>{car.patente}</td>
                                          <td>{car.marca}</td>
                                          <td>{car.denominacion}</td>
                                          <td>{car.color}</td>
                                        </tr>
                                      ))
                                    }
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                    <div className="col col-md-6">
                      <strong>Total de vehículos:</strong> {carsByDate.reduce((total, x: any) => (total + x.cars.length), 0)}
                    </div>
                    <div className="col-md-6 text-right">
                      <button className="btn btn-sm btn-primary" onClick={this.downloadTemplate}>
                        <i className="fa fa-fw fa-download" /> Descargar Formato
                      </button>
                      <button className="btn btn-sm btn-default" onClick={this.clickUploadFile} style={{marginLeft: '5px'}}>
                        <i className="fa fa-fw fa-cogs" /> Cambiar configuración
                      </button>
                    </div>
                  </div>
                  :
                  <div className="row">
                    <div className="col col-md-12">
                      <div className="form-group">
                        {/*<label>Días que serán importardos</label>*/}
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
                            borderRadius: '5px',
                            marginBottom: '10px'
                          }}>
                          <i className="fa fa-2x fa-cloud-upload"/><br/>
                          Prueba a soltanto el excel aquí, o haz click para seleccionar el excel a cargar.
                        </div>
                      </div>
                    </div>
                  </div>
              }
              <input
                type="file"
                onChange={this.handleChangeInputFile}
                style={{display: 'None'}}
                ref={this.inputFile} accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              />
            </div>
            <div className="box-footer text-right">
              <button
                className="btn btn-sm btn-default"
                onClick={() => this.props.history.push('/planning/')}
              >
                Cancelar
              </button>
              {carsByDate.length ? <button className="btn btn-sm btn-primary" style={{marginLeft: '5px'}} onClick={this.sendCreate} disabled={sending}>
                {
                  sending ?
                    <React.Fragment>
                      <i className="fa fa-fw fa-spin fa-spinner"/> Importando...
                    </React.Fragment>
                    : 'Importar'
                }
              </button> : null}
            </div>
            {
              loadingSettings || sending &&
                <div className="overlay">
                  <i className="fa fa-spinner fa-spin text-purple"/>
                </div>
            }
          </div>
          <ModalView/>
        </section>
      </AppContainer>
    );
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

  private handleChangeInputFile(e: React.ChangeEvent<HTMLInputElement>): void {
    const {files} = e.target;
    if (files && files.length) {
      this.processSettings(files[0]);
    }
  }

  private dragOverHandler(e: React.DragEvent<HTMLDivElement>): void {
    e.preventDefault();
    this.setState({
      canDrop: true
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

  private dragLeaveHandler(): void {
    this.setState({
      canDrop: false
    });
  }

  private downloadTemplate(): void {
    /* make the worksheet */
    const ws = XLSX.utils.json_to_sheet([{
      NInterno: '',
      vin: '',
      marca: '',
      patente: '',
      denominacion: '',
      color: '',
      propiedad: '',
      tipo: '',
      fecha: ''
    }]);
    /* add to workbook */
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Autos');
    /* generate an XLSX file */
    XLSX.writeFile(wb, 'template_planning_settings.xlsx');
  }

  private processSettings(file: File): void {
    this.setState({
      loadingSettings: true
    });
    if (['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(file.type)) {
      const reader = new FileReader();
      const rABS = !!reader.readAsBinaryString;
      reader.onload = (e: any) => {
        let data = e.target.result;
        if (!rABS) {
          data = new Uint8Array(data);
        }
        const workbook: XLSX.WorkBook = XLSX.read(data, {
          type: rABS ? 'binary' : 'array',
          cellDates: true
        });
        const excelData = workbook.Sheets.hasOwnProperty('Autos') ? XLSX.utils.sheet_to_json(workbook.Sheets.Autos) : [];
        const carsByDate: any = {};
        if (excelData.length >= 1) {
          excelData.forEach((item: any, index: number) => {
            const date = moment(workbook.Sheets.Autos[`I${index + 2}`].v);
            if(date.isValid()){
              const key: string = date.format("YYYYMMDD");
              if (!carsByDate.hasOwnProperty(key)) {
                carsByDate[key] = {
                  key,
                  cars: []
                }
              }
              carsByDate[key].cars.push({
                NInterno: item.NInterno,
                vin: item.vin,
                marca: item.marca,
                patente: item.patente,
                denominacion: item.denominacion,
                color: item.color,
                propiedad: item.propiedad,
                tipo: item.tipo,
                date
              })
            }
          });
          this.setState({
            loadingSettings: false,
            carsByDate: Object.keys(carsByDate)
              .map((key) => ({key, ...carsByDate[key]}))
              .sort((a, b) => {
                if (a.key < b.key) return 1;
                if (a.key > b.key) return -1;
                return 0
              })
              .reverse()
          });
        } else {
          !swal(
            'Importador de configuración',
            `"${file.name}" no cumple con los requisitos mínimos o no tiene autos.`,
            'error'
          );
          this.setState({
            loadingSettings: false
          });
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

  private sendCreate(): void {
    const {carsByDate} = this.state;
    const { history } = this.props;
    this.setState({
      sending: true
    });
    const api = new ApiService();
    api.getSource();
    api
      .importPlanning({
        carsByDate
      })
      .then((response: any) => {
        const {message} = response.data;
        setTimeout(() => {
          swal('Envió planificación', message, 'success');
        }, 200);
        history.push('/planning/');
        this.setState({
          sending: false
        });
      })
      .catch((e) => {
        console.log('e', e);
        swal('Envió planificación', 'Se produjo un error al importar la planificación.', 'error');
        this.setState({
          sending: false
        });
      });

  }

}

const mapStateToProps = (state: { planning: IPlanningState }) => {
  return {
    planning: state.planning
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch,
  };
};

export default connect<{ planning: IPlanningState }, { dispatch: any }, IPropsType>(mapStateToProps, mapDispatchToProps)(PlanningImportView);
