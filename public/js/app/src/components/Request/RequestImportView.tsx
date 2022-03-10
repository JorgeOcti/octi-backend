import * as Raven from 'raven-js';
import * as React from 'react';
import { ErrorInfo, RefObject } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { Dispatch } from 'redux';
import * as swal from 'sweetalert';
import * as XLSX from 'xlsx';
import { IRequestItemsState } from '../../actions/requestItems.types';
import AppContainer from '../../container/AppContainer';
import { IWindow } from '../../interfaces/window';
import ApiService from '../../utils/axios';
import ModalView from '../Modal/ModalView';
import TrackingBasePage from '../Utils/TrackingBasePage';
import ShowIf from '../Utils/ShowIf';
import Axios, { AxiosError } from 'axios';
import { IRequestSetting } from '../../../../../../src/app/interfaces/teamSetting.interface';
import { ISalesChannel } from '../../../../../../src/request/interfaces/salesChannel.interface';
import { IOperationType } from '../../../../../../src/request/interfaces/operationType.interface';
import { IReason } from '../../../../../../src/request/interfaces/reason.interface';
import { IVenue } from '../../../../../../src/app/interfaces/venue.interface';
import RequestImportForm from './RequestImportForm/RequestImportForm';
import { submit } from 'redux-form';
import { requestSettings } from './defaults';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  requestItems: IRequestItemsState;
  dispatch: Dispatch<any>;
}

interface IStateType {
  error: Error | null;
  requests: any[];
  canDrop: boolean;
  loading: boolean;
  sending: boolean;
  venues: IVenue[];
  reasons: IReason[];
  channels: ISalesChannel[];
  operationTypes: IOperationType[];
  requestSettings: IRequestSetting;
}

declare let window: IWindow;

class RequestUpdaterView extends TrackingBasePage<IPropsType, IStateType> {
  public title: string;
  readonly inputFile: RefObject<HTMLInputElement>;
  readonly api: ApiService;

  readonly state: IStateType = {
    error: null,
    canDrop: false,
    loading: true,
    sending: false,
    requests: [],
    venues: [],
    reasons: [],
    channels: [],
    operationTypes: [],
    requestSettings
  };

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Importador de solicitudes';
    this.inputFile = React.createRef();
    this.clickUploadFile = this.clickUploadFile.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.dragOverHandler = this.dragOverHandler.bind(this);
    this.dragEndHandler = this.dragEndHandler.bind(this);
    this.dragLeaveHandler = this.dragLeaveHandler.bind(this);
    this.handleChangeInputFile = this.handleChangeInputFile.bind(this);
    this.downloadTemplate = this.downloadTemplate.bind(this);
    this.parseRequestItem = this.parseRequestItem.bind(this);
    this.processSettings = this.processSettings.bind(this);
    this.sendCreate = this.sendCreate.bind(this);
    this.checkSameVenue = this.checkSameVenue.bind(this);
    this.api = new ApiService();
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error });
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public componentDidMount(): void {
    super.componentDidMount();
    window.scrollTo(0, 0);
    const api: ApiService = new ApiService();
    Axios
      .all([
        this.api.getOperationTypes({ page: 1, pageSize: 200 }),
        this.api.getVenues({ page: 1, pageSize: 200, noPopulate: true }),
        this.api.getSalesChannel({ page: 1, pageSize: 200 }),
        this.api.getReasons({ page: 1, pageSize: 200 }),
        this.api.getTeamSettings()
      ])
      .then(Axios.spread((
        operationTypes,
        venues,
        channels,
        reasons,
        teamSettings
      ) => {
        this.setState({
          requestSettings: teamSettings.data.request,
          venues: venues.data.results,
          reasons: reasons.data.results,
          channels: channels.data.results,
          operationTypes: operationTypes.data.results,
          loading: false
        });
      }))
      .catch((err: AxiosError) => {
        api.errorHandler(err);
      });
  }

  public componentWillUnmount(): void {
    // cancel request if component is inmounted
    if (this.props.requestItems.source) {
      this.props.requestItems.source.cancel('Operation canceled by the user.');
    }
  }

  public render(): React.ReactElement<IPropsType> {
    const {
      loading, requests, sending, channels, operationTypes, reasons, venues
    } = this.state;
    return (
      <AppContainer title='' cMenu='3' cSubMenu='3.2' cAction='Importador de solicitudes'>
        <section className='content'>
          <div className='box'>
            <div className='box-header with-border'>
              <h3 className='box-title'>Importador de solicitudes</h3>
              <div className='pull-right box-tools'>
                <ShowIf condition={!requests.length}>
                  <button
                    className='btn btn-sm btn-primary'
                    onClick={this.downloadTemplate}
                    style={{ marginRight: '5px' }}>
                    <i className='fa fa-fw fa-download' /> Descargar Formato
                  </button>
                </ShowIf>
              </div>
            </div>
            <div className='box-body margin'>
              {
                requests.length ?
                  <>
                    <RequestImportForm
                      channels={channels}
                      operationTypes={operationTypes}
                      reasons={reasons}
                      venues={venues}
                      onSubmit={this.sendCreate}
                      initialValues={{
                        requests: requests
                      }}
                    />
                    <div className='row'>
                      <div className='col col-md-6'>
                        {/*  <strong>Total de :</strong> {requests.length}*/}
                      </div>
                      <div className='col-md-6 text-right'>
                        <button className='btn btn-sm btn-primary' onClick={this.downloadTemplate}>
                          <i className='fa fa-fw fa-download' /> Descargar Formato
                        </button>
                        <button className='btn btn-sm btn-default' onClick={this.clickUploadFile} style={{ marginLeft: '5px' }}>
                          <i className='fa fa-fw fa-cogs' /> Cambiar configuración
                        </button>
                      </div>
                    </div>
                  </>
                  :
                  <div className='row'>
                    <div className='col col-md-12'>
                      <div className='form-group'>
                        {/*<label>Días que serán importardos</label>*/}
                        <div
                          className='upload-file text-center pointer'
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
                          <i className='fa fa-2x fa-cloud-upload' /><br />
                          Prueba a soltanto el excel aquí, o haz click para seleccionar el excel a cargar.
                        </div>
                      </div>
                    </div>
                  </div>
              }
              <input
                type='file'
                onChange={this.handleChangeInputFile}
                style={{ display: 'None' }}
                ref={this.inputFile}
                accept='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel'
              />
            </div>
            <div className='box-footer text-right'>
              <button
                className='btn btn-sm btn-default'
                onClick={() => this.props.history.push('/requests/vehicles/')}
              >
                Cancelar
              </button>
              <ShowIf condition={!!requests.length}>
                <button
                  className='btn btn-sm btn-primary'
                  style={{ marginLeft: '5px' }}
                  onClick={() => this.props.dispatch(submit('requestImportForm'))}
                  disabled={sending}
                >
                  <ShowIf condition={sending} alternative={'Actualizar'}>
                    <React.Fragment>
                      <i className='fa fa-fw fa-spin fa-spinner' /> Actualizando...
                    </React.Fragment>
                  </ShowIf>
                </button>
              </ShowIf>
            </div>
            <ShowIf condition={loading || sending}>
              <div className='overlay'>
                <i className='fa fa-spinner fa-spin text-purple' />
              </div>
            </ShowIf>
          </div>
          <ModalView />
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
    const { files } = e.target;
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
      ['Numero solicitud']: '',
      ['Partida']: '',
      ['Tipo operacion']: '',
      ['Canal']: '',
      ['Motivo']: '',
      ['Vendedor']: '',
      ['Cliente']: '',
      ['Origen']: '',
      ['Destino']: '',
      ['Factura']: '',
      ['BL']: '',
      ['Chasis']: '',
      ['Motor']: '',
      ['Marca']: '',
      ['Modelo']: '',
      ['Color']: '',
      ['Tipo']: '',
      ['Cilindrada']: '',
      ['Traccion']: '',
      ['Ano Comercial']: '',
      ['Ano Fabricacion']: '',
      ['Monto']: '',
      ['Seguro']: '',
      ['Peso']: '',
      ['Gas']: '',
      ['AP']: '',
      ['Pais Origen']: '',
      ['Observacion']: ''
    }]);
    /* add to workbook */
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Propiedades');
    /* generate an XLSX file */
    XLSX.writeFile(wb, 'template_request_settings.xlsx');
  }

  private parseRequestItem(requestItem: any) {
    const { venues, reasons } = this.state;
    return {
      ['reason']: reasons.find((reason) => {
        return reason.name?.trim().toLowerCase() === requestItem['Motivo']?.trim().toLowerCase();
      })?._id,
      ['vin']: requestItem['Chasis'],
      ['engineNumber']: requestItem['Motor'],
      ['brand']: requestItem['Marca'],
      ['denomination']: requestItem['Modelo'],
      ['color']: requestItem['Color'],
      ['type']: requestItem['Tipo'],
      ['client']: requestItem['Cliente'],
      ['entry']: requestItem['Partida'],
      ['invoice']: requestItem['Factura'],
      ['origin']: venues.find((venue) => {
        return this.checkSameVenue(venue, requestItem['Origen']);
        // return venue.name?.trim().toLowerCase() === requestItem['Origen']?.trim().toLowerCase();
      })?._id,
      ['destination']: venues.find((venue) => {
        return this.checkSameVenue(venue, requestItem['Destino']);
        // return venue.name?.trim().toLowerCase() === requestItem['Destino']?.trim().toLowerCase();
      })?._id,
      ['bl']: requestItem['BL'],
      ['engineSize']: requestItem['Cilindrada'],
      ['driveType']: requestItem['Traccion'],
      ['businessYear']: requestItem['Ano Comercial'],
      ['manufacturingYear']: requestItem['Ano Fabricacion'],
      ['price']: requestItem['Monto'],
      ['insurancePrice']: requestItem['Seguro'],
      ['weight']: requestItem['Peso'],
      ['gas']: requestItem['Gas'],
      ['ap']: requestItem['AP'],
      ['countryOrigin']: requestItem['Pais Origen'],
      ['observation']: requestItem['Observacion']
    };
  }

  private checkSameVenue(venueA: any, venueB: any){
    const sameName = venueA.name?.trim().toLowerCase() === venueB?.trim().toLowerCase();
    const foundCode = venueB?.length && (venueA.code?.trim().toLowerCase() === venueB?.trim().toLowerCase());
    return sameName || foundCode
  }

  private processSettings(file: File): void {
    this.setState({
      loading: true
    });
    if (['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(file.type)) {
      const reader = new FileReader();
      const rABS = !!reader.readAsBinaryString;
      reader.onload = (e: any) => {
        const { channels, operationTypes } = this.state;
        let data = e.target.result;
        if (!rABS) {
          data = new Uint8Array(data);
        }
        const workbook: XLSX.WorkBook = XLSX.read(data, {
          type: rABS ? 'binary' : 'array',
          cellDates: true
        });
        const excelData = 'Propiedades' in workbook.Sheets
          ? XLSX.utils.sheet_to_json(workbook.Sheets.Propiedades)
          : [];
        if (excelData.length >= 1) {
          const requestByNumber = excelData.reduce<any>((acc: any, cur: any) => {
            const key = cur['Numero solicitud'];
            if (!acc.hasOwnProperty(key)) {
              acc[key] = {
                ['number']: key,
                ['sellerText']: cur['Vendedor'],
                ['channel']: channels.find((channel) => {
                  return channel.name?.trim().toLowerCase() === cur['Canal']?.trim().toLowerCase();
                })?._id,
                ['operationType']: operationTypes.find((operationType) => {
                  return operationType.name?.trim().toLowerCase() === cur['Tipo operacion']?.trim().toLowerCase();
                })?._id,
                cars: [this.parseRequestItem(cur)]
              };
            } else {
              acc[key] = {
                ...acc[key],
                cars: [...acc[key].cars, this.parseRequestItem(cur)]
              };
            }
            return acc;
          }, {});

          this.setState({
            loading: false,
            requests: Object.values(requestByNumber)
              .sort((a: any, b: any) => {
                return a['number'].localeCompare(b['number'], 'en', { numeric: true });
              })
          }, () => {
            console.log('this.state.requests', this.state.requests);
          });
        } else {
          swal!(
            'Importador de configuración',
            `"${file.name}" no cumple con los requisitos mínimos o no tiene unidades.`,
            'error'
          );
          this.setState({
            loading: false
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

  private sendCreate(data: any): void {
    const { history } = this.props;
    this.setState({
      sending: true
    });
    const api = new ApiService();
    api.getSource();
    api
      .importRequests(data)
      .then((response: any) => {
        const { message } = response.data;
        console.log('message', message);
        history.push('/requests/vehicles/');
        setTimeout(() => {
          swal!('Importador de solicitudes', message, 'success');
        }, 200);
        this.setState({
          sending: false
        });
      })
      .catch((error) => {
        if (error.status === 400) {
          swal!('Importador de solicitudes', error.data.message, 'error');
        } else {
          api.errorHandler(error);
        }
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
