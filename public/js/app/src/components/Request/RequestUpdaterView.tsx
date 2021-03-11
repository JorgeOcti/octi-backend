import * as Raven from 'raven-js';
import * as React from 'react';
import { ErrorInfo, RefObject } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { Dispatch } from 'redux';
import * as swal from 'sweetalert';
import * as XLSX from 'xlsx';
import { IRequestItemsState, RequestItemsReduxActions } from '../../actions/requestItems.types';
import AppContainer from '../../container/AppContainer';
import { IWindow } from '../../interfaces/window';
import ApiService from '../../utils/axios';
import ModalView from '../Modal/ModalView';
import TrackingBasePage from '../Utils/TrackingBasePage';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  requestItems: IRequestItemsState;
  dispatch: Dispatch<RequestItemsReduxActions>;
}

interface IStateType {
  error: Error | null;
  properties: any[];
  canDrop: boolean;
  sending: boolean;
  loadingSettings: boolean;
}

declare let window: IWindow;

class RequestUpdaterView extends TrackingBasePage<IPropsType, IStateType> {
  title : string;

  readonly inputFile: RefObject<HTMLInputElement>;

  readonly state = {
    error: null,
    canDrop: false,
    sending: false,
    properties: [],
    loadingSettings: false
  };

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Actualización masiva';
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


  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public componentDidMount(): void {
    super.componentDidMount();
    window.scrollTo(0, 0);
  }

  public componentWillUnmount(): void {
    // cancel request if component is inmounted
    if (this.props.requestItems.source) {
      this.props.requestItems.source.cancel('Operation canceled by the user.');
    }
  }

  public render(): React.ReactElement<IPropsType> {
    const {
      loadingSettings, properties, sending
    } = this.state;
    return (
      <AppContainer title="" cMenu="3" cSubMenu="3.2" cAction="Actualización masiva">
        <section className="content">
          <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">Actualización masiva</h3>
              <div className="pull-right box-tools">
                {
                  !properties.length?
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
                properties.length?
                  <div className="row">
                    <div className="col col-md-12">
                      <table className="table table-striped">
                        <thead>
                          <tr>
                            <th>Propiedad</th>
                            <th>Marca</th>
                          </tr>
                        </thead>
                        <tbody>
                          {
                            properties.map((property: any) => {
                              return (
                                <tr key={property.key}>
                                  <td>{property.key}</td>
                                  <td>
                                    {
                                      property.brands.map((brand: string) => (
                                        <React.Fragment key={brand}>- {brand}<br /></React.Fragment>)
                                      )
                                    }
                                  </td>
                                </tr>
                              );
                            })
                          }
                        </tbody>
                      </table>
                    </div>
                    <div className="col col-md-6">
                      {/* <strong>Total de :</strong> {properties.reduce((total, x: any) => (total + x.cars.length), 0)} */}
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
                onClick={() => this.props.history.push('/requests/vehicles/')}
              >
                Cancelar
              </button>
              {properties.length ? <button className="btn btn-sm btn-primary" style={{marginLeft: '5px'}} onClick={this.sendCreate} disabled={sending}>
                {
                  sending ?
                    <React.Fragment>
                      <i className="fa fa-fw fa-spin fa-spinner"/> Actualizando...
                    </React.Fragment>
                    : 'Actualizar'
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
      propiedad: '',
      marca: ''
    }]);
    /* add to workbook */
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Propiedades');
    /* generate an XLSX file */
    XLSX.writeFile(wb, 'template_request_settings.xlsx');
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
        const excelData = workbook.Sheets.hasOwnProperty('Propiedades') ? XLSX.utils.sheet_to_json(workbook.Sheets.Propiedades) : [];
        const brandByProperty: any = {};
        if (excelData.length >= 1) {
          excelData.forEach((item: any, index: number) => {
            const key =  item.propiedad;
            if (!brandByProperty.hasOwnProperty(key)) {
              brandByProperty[key] = {
                brands: []
              };
            }
            brandByProperty[key].brands.push(item.marca);
          });
          this.setState({
            loadingSettings: false,
            properties: Object.keys(brandByProperty)
              .map((key) => ({key, ...brandByProperty[key]}))
              .sort((a, b) => {
                if (a.key < b.key) return 1;
                if (a.key > b.key) return -1;
                return 0;
              })
              .reverse()
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
    const { properties } = this.state;
    const { history } = this.props;
    this.setState({
      sending: true
    });
    const api = new ApiService();
    api.getSource();
    api
      .updateMassiveRequest({
        properties
      })
      .then((response: any) => {
        const { message } = response.data;
        history.push('/requests/vehicles/');
        setTimeout(() => {
          swal('Actualización masiva', message, 'success');
        }, 200);
        this.setState({
          sending: false
        });
      })
      .catch((e) => {
        swal('Actualización masiva', 'Se produjo un error al actualizar.', 'error');
        this.setState({
          sending: false
        });
      });
  }

}

const mapStateToProps = (state: { requestItems: IRequestItemsState }) => {
  return {
    requestItems: state.requestItems
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(RequestUpdaterView);
