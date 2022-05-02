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
import Axios, { AxiosError, AxiosResponse } from 'axios';
import { IRequestSetting } from '../../../../../../src/app/interfaces/teamSetting.interface';
import { IRequestItem } from '../../../../../../src/request/interfaces/requestItem.interface';
import { submit } from 'redux-form';
import { requestSettings } from './defaults';
import filterFactory from 'react-bootstrap-table2-filter';
import paginationFactory from 'react-bootstrap-table2-paginator';
import BootstrapTable from 'react-bootstrap-table-next';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  requestItems: IRequestItemsState;
  dispatch: Dispatch<any>;
}

enum itemStatus {
  PENDING,
  IN_PROCESS,
  READY,
  ERROR
}

interface IRequestItemMassAllocation extends IRequestItem {
  processStatus: itemStatus;
  errors: string[]
}

interface IStateType {
  error: Error | null;
  canDrop: boolean;
  loading: boolean;
  sending: boolean;
  requestItems: IRequestItemMassAllocation[];
  requestSettings: IRequestSetting;
  countItemsByStatus: any
}

declare let window: IWindow;

class RequestImportVINSView extends TrackingBasePage<IPropsType, IStateType> {
  public title: string;
  readonly inputFile: RefObject<HTMLInputElement>;
  readonly apiService: ApiService;

  private paginationOption: any = {
    paginationSize: 4,
    showTotal: true,
    paginationTotalRenderer: this.customTotal,
    sizePerPageList: [{
      text: '20', value: 20
    },{
      text: '50', value: 50
    }, {
      text: '100', value: 100
    }, {
      text: '200', value: 200
    }],
    // onPageChange: () => {
    //   window.scrollTo(0, 0);
    //   setTimeout(() => {
    //     $('[data-toggle="tooltip"]').tooltip();
    //   }, 200);
    // }
  };

  readonly defaultSorted = [{
    dataField: 'errors.length',
    order: 'desc'
  }];

  readonly columns: any[] = [];

  readonly state: IStateType = {
    error: null,
    canDrop: false,
    loading: true,
    sending: false,
    requestItems: [],
    countItemsByStatus: {
      [itemStatus.PENDING]: 0,
      [itemStatus.IN_PROCESS]: 0,
      [itemStatus.READY]: 0,
      [itemStatus.ERROR]: 0,
    },
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
    this.processSettings = this.processSettings.bind(this);
    this.sendCreate = this.sendCreate.bind(this);
    this.checkSameVenue = this.checkSameVenue.bind(this);
    this.customTotal = this.customTotal.bind(this);
    this.checkItems = this.checkItems.bind(this);
    this.itemsByStatus = this.itemsByStatus.bind(this);
    this.updateItemStatusByID = this.updateItemStatusByID.bind(this);
    this.statusFormatter = this.statusFormatter.bind(this);
    this.apiService = new ApiService();
    this.columns = [{
      dataField: 'processStatus',
      text: '',
      formatter: this.statusFormatter,
      classes: 'middle-center',
      headerClasses: 'middle-center pointer'
    },{
      dataField: 'code',
      text: 'CODIGO',
      classes: 'middle',
      headerClasses: 'middle pointer',
      sort: true
    }, {
      dataField: 'vin',
      text: 'VIN',
      classes: 'middle',
      headerClasses: 'middle pointer',
      sort: true
    }, {
      dataField: 'car.brand',
      text: 'Marca',
      classes: 'middle',
      headerClasses: 'middle pointer',
      sort: true
    }, {
      dataField: 'car.denomination',
      text: 'Modelo',
      classes: 'middle',
      headerClasses: 'middle pointer',
      sort: true
    }, {
      dataField: 'car.material',
      text: 'Material',
      classes: 'middle',
      headerClasses: 'middle pointer',
      sort: true
    }, {
      dataField: 'errors.length',
      text: 'Problemas',
      formatter: this.errorsFormatter,
      classes: 'middle',
      headerClasses: 'middle pointer',
      sort: true
    }];
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
        this.apiService.getTeamSettings()
      ])
      .then(Axios.spread((
        teamSettings
      ) => {
        this.setState({
          requestSettings: teamSettings.data.request,
          loading: false
        });
      }))
      .catch((err: AxiosError) => {
        api.errorHandler(err);
      });
  }

  public componentDidUpdate(prevProps: Readonly<IPropsType>, prevState: Readonly<IStateType>, snapshot?: any) {
    $('.react-bootstrap-table-pagination')
      .css({padding: '3px 15px'});
    $('.react-bootstrap-table-pagination div')
      .removeClass('col-xs-6')
      .addClass('col-xs-12')
      .css({padding: '3px 15px'});
    $('.react-bootstrap-table-pagination div:last-child')
      .removeClass('text-right')
      .addClass('text-right');
    $('#pageDropDown')
      .removeClass('btn-sm')
      .addClass('btn-sm');
    $('.bs-searchbox input')
      .removeClass('input-sm')
      .addClass('input-sm');
    $('.pagination')
      .removeClass('pagination-sm')
      .addClass('pagination-sm')
      .css({margin: 0});
  }

  public render(): React.ReactElement<IPropsType> {
    const {
      loading, sending, requestItems,countItemsByStatus
    } = this.state;
    // @ts-ignore
    return (
      <AppContainer title='' cMenu='3' cSubMenu='3.2' cAction='Asignador masivo de vehículos'>
        <section className='content'>
          <div className='box'>
            <div className='box-header with-border'>
              <h3 className='box-title'>Asignador masivo de vehículos</h3>
              <div className='pull-right box-tools'>
                <ShowIf condition={!requestItems.length}>
                  <button
                    className='btn btn-sm btn-primary'
                    onClick={this.downloadTemplate}
                    style={{ marginRight: '5px' }}>
                    <i className='fa fa-fw fa-download' /> Descargar Formato
                  </button>
                </ShowIf>
                <ShowIf condition={!!requestItems.length}>
                  <button
                    className='btn btn-sm btn-default'
                    onClick={this.clickUploadFile}
                    // disabled={true}
                  >
                    <i className='fa fa-fw fa-cogs' /> Cambiar archivo
                  </button>
                  <button
                    className="btn btn-sm btn-primary"
                    style={{marginLeft: '5px'}}
                    disabled={true}
                  >
                    <i className="fa fa-fw fa-spin fa-spinner"/> Asignar
                  </button>
                </ShowIf>
              </div>
            </div>
            <div className={`box-body ${requestItems.length ? 'no-padding' : 'margin'}`}>
              <ul>
                <li>Pendiente: {countItemsByStatus[itemStatus.PENDING]}</li>
                <li>En proceso: {countItemsByStatus[itemStatus.IN_PROCESS]}</li>
                <li>Listos: {countItemsByStatus[itemStatus.READY]}</li>
                <li>Error: {countItemsByStatus[itemStatus.ERROR]}</li>
              </ul>
              {
                requestItems.length ?
                  <>
                    <div className='mass-allocate-requests'>
                      <BootstrapTable
                        keyField='_id'
                        data={requestItems}
                        columns={this.columns}
                        filter={filterFactory()}
                        pagination={paginationFactory(this.paginationOption)}
                        defaultSorted={this.defaultSorted}
                      />
                    </div>
                  </>
                  :
                  <div className='row'>
                    <div className='col col-md-12'>
                      <div className='form-group'>
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
              <ShowIf condition={false}>
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
    XLSX.utils.book_append_sheet(wb, ws, 'Solicitudes');
    /* generate an XLSX file */
    XLSX.writeFile(wb, 'template_request_settings.xlsx');
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
        let data = e.target.result;
        if (!rABS) {
          data = new Uint8Array(data);
        }
        const workbook: XLSX.WorkBook = XLSX.read(data, {
          type: rABS ? 'binary' : 'array',
          cellDates: true
        });
        const excelData: any [] = 'Solicitudes' in workbook.Sheets
          ? XLSX.utils.sheet_to_json(workbook.Sheets.Solicitudes)
          : [];
        if (excelData.length >= 1) {
          const data: any[] = [];
          const vinByCode: any = {};
          for (const item of excelData) {
            const code = item.hasOwnProperty('CODIGO') ? item['CODIGO'] : null;
            const vin = item.hasOwnProperty('VIN/ID') ? item['VIN/ID'] : null;
            if(code?.length){
              vinByCode[code] = {
                vin,
                count: vinByCode[code]?.count ? vinByCode[code].count + 1 : 1
              };
              data.push({
                code,
                vin
              });
            }
          }
          this.apiService
            .preMassAllocation({ items: data })
            .then((response: any) => {
              this.setState({
                requestItems: response.data.results.map((item: any) => {
                  return {
                    ...item,
                    processStatus: itemStatus.PENDING,
                    errors: [],
                    car:{
                      ...item.car,
                      vin: vinByCode[item.code].vin,
                    },
                    vin: vinByCode[item.code].vin,
                    checked: false
                  };
                }),
                countItemsByStatus: {
                  [itemStatus.PENDING]: response.data.results.length,
                  [itemStatus.IN_PROCESS]: 0,
                  [itemStatus.READY]: 0,
                  [itemStatus.ERROR]: 0
                },
                loading: false
              }, ()=>{
                this.checkItems();
              });
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
    this.apiService.getSource();
    this.apiService
      .importRequests(data)
      .then((response: any) => {
        const { message } = response.data;
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
          swal!('Asignador masivo de vehículos', error.data.message, 'error');
        } else {
          this.apiService.errorHandler(error);
        }
        this.setState({
          sending: false
        });
      });
  }

  private customTotal(from: any, to: any, size: any) {
    return(
      <span className="react-bootstrap-table-pagination-total text-ellipsis" style={{fontSize: '14px'}}>
        &nbsp;&nbsp;Mostrando registros del {from} al {to} de {size} registros.
      </span>
    );
  }

  private checkItems(){
    const pendings = this.itemsByStatus(itemStatus.PENDING);
    if (pendings.length) {
      let item =  pendings[0];
      item = this.updateItemStatusByID(item, itemStatus.IN_PROCESS);
      this.apiService
        .checkItemMassAllocation({ item })
        .then((response: AxiosResponse) => {
          console.log(response.data);
          this.updateItemStatusByID({
              ...item,
              errors: response.data.errors
            },
            response.data.errors.length ? itemStatus.ERROR : itemStatus.READY,
            this.checkItems
          );
        })
        .catch((error) => {
        if (error.status === 400) {
          swal!('Asignador masivo de vehículos', error.data.message, 'error');
        } else {
          this.apiService.errorHandler(error);
        }
        this.setState({
          sending: false
        });
      });
    }
  }

  private updateItemStatusByID(item: IRequestItemMassAllocation, processStatus: itemStatus, callback?: () => void): any {
    const { requestItems, countItemsByStatus } = this.state;
    this.setState({
      countItemsByStatus: {
        ...countItemsByStatus,
        [processStatus]: countItemsByStatus[processStatus] + 1,
        [item.processStatus]: countItemsByStatus[item.processStatus] - 1
      },
      requestItems: requestItems.map((requestItem) => {
        if (requestItem._id === item._id) {
          return {
            ...item,
            processStatus
          };
        }
        return requestItem;
      })
    }, callback);
    return { ...item, processStatus };
  }


  private itemsByStatus(processStatus: itemStatus) {
    const { requestItems } = this.state;
    return requestItems
      .filter((item)=> item.processStatus === processStatus);
  }

  private errorsFormatter(_: string, row: any) {
    return row.errors.length > 0 ? JSON.stringify(row.errors) : "-";
  }

  private statusFormatter(_: string, row: any) {
    if([itemStatus.READY, itemStatus.ERROR].includes(row.processStatus)){
      return row.errors.length > 0 ? <i className={'fa fa-ban red'} /> : <i className={'fa fa-check-circle green'} />;
    }
    return ''
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

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(RequestImportVINSView);
