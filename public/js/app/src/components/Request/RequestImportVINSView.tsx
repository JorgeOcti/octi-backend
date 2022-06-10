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
import { requestSettings } from './defaults';
import filterFactory from 'react-bootstrap-table2-filter';
import paginationFactory from 'react-bootstrap-table2-paginator';
import BootstrapTable from 'react-bootstrap-table-next';
import { ICar } from '../../../../../../src/app/interfaces';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  requestItems: IRequestItemsState;
  dispatch: Dispatch<any>;
}

enum itemStatus {
  PENDING = 'PENDING',
  IN_PROCESS = 'IN_PROCESS',
  READY = 'READY',
  ERROR = 'ERROR',
  UPDATED = 'UPDATED'
}

interface IExcelData {
  code: string | null;
  vin: string | null;
  material: string | null;
  count: number;
}

interface IIntegrationData {
  brand: string;
  color: string;
  denomination: string;
  material: string;
  vin: string;
}

interface IAndesData {
  _id: string;
  code: string;
  car: Partial<ICar>;
}

interface preMassAllocationResponse {
  results: IAndesData[];
}

interface IRequestItemStore {
  _id: string;
  processStatus: itemStatus;
  andesData: IAndesData;
  excelData: IExcelData;
  integrationData?: IIntegrationData;
  errors: string[];
  checked: boolean;
}

interface IStateType {
  error: Error | null;
  canDrop: boolean;
  loading: boolean;
  sending: boolean;
  requestItems: IRequestItemStore[];
  requestSettings: IRequestSetting;
  countItemsByStatus: any;
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
    }, {
      text: '50', value: 50
    }, {
      text: '100', value: 100
    }, {
      text: '200', value: 200
    }]
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
      [itemStatus.ERROR]: 0
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
    this.customTotal = this.customTotal.bind(this);
    this.checkItems = this.checkItems.bind(this);
    this.itemsByStatus = this.itemsByStatus.bind(this);
    this.updateItemStatusByID = this.updateItemStatusByID.bind(this);
    this.statusFormatter = this.statusFormatter.bind(this);
    this.vinFormatter = this.vinFormatter.bind(this);
    this.codeFormatter = this.codeFormatter.bind(this);
    this.requestedVehicle = this.requestedVehicle.bind(this);
    this.assignVehicle = this.assignVehicle.bind(this);
    this.processItems = this.processItems.bind(this);
    this.answerProcessitems = this.answerProcessitems.bind(this);
    this.apiService = new ApiService();
    this.columns = [{
      dataField: 'processStatus',
      text: '',
      formatter: this.statusFormatter,
      classes: 'middle-center',
      headerClasses: 'middle-center pointer',
      style: {
        width: '40px'
      }
    }, {
      dataField: 'andesData.code',
      text: 'CODIGO',
      classes: 'middle-center',
      formatter: this.codeFormatter,
      headerClasses: 'middle-center pointer',
      style: {
        width: '90px',
        miWidth: '90px'
      },
      sort: true
    }, {
      dataField: 'excelData.vin',
      text: 'VIN',
      classes: 'middle',
      formatter: this.vinFormatter,
      headerClasses: 'middle pointer',
      style: {
        width: '24%',
        miWidth: '24%'
      },
      sort: true
    }, {
      dataField: 'andesData.car.brand',
      text: 'Solicitud',
      classes: 'middle',
      formatter: this.requestedVehicle,
      headerClasses: 'middle pointer',
      style: {
        width: '24%',
        miWidth: '24%'
      }
      // sort: true
    }, {
      dataField: 'car.denomination',
      text: 'Asignación',
      classes: 'middle',
      formatter: this.assignVehicle,
      headerClasses: 'middle pointer',
      style: {
        width: '24%',
        miWidth: '24%'
      }
      // sort: true
    }, {
      dataField: 'errors.length',
      text: 'Problemas',
      formatter: this.errorsFormatter,
      classes: 'middle',
      headerClasses: 'middle pointer',
      // style: {
      //   width: '100px',
      //   miWidth: '100px'
      // },
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
      .css({ padding: '3px 15px' });
    $('.react-bootstrap-table-pagination div')
      .removeClass('col-xs-6')
      .addClass('col-xs-12')
      .css({ padding: '3px 15px' });
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
      .css({ margin: 0 });
  }

  public render(): React.ReactElement<IPropsType> {
    const {
      loading, sending, requestItems
    } = this.state;
    const pendings = this.itemsByStatus(itemStatus.PENDING);
    return (
      <AppContainer title='' cMenu='3' cSubMenu='3.2' cAction='Asignación masiva de unidades'>
        <section className='content'>
          <div className='box'>
            <div className='box-header with-border'>
              <h3 className='box-title'>Asignación masiva de unidades</h3>
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
                  <div className='btn-group btn-group-sm'>
                    <button
                      className='btn btn-sm btn-default'
                      onClick={!sending ? this.clickUploadFile : undefined}
                      disabled={sending}
                    >
                      <i className='fa fa-fw fa-cogs' /> Cambiar archivo
                    </button>
                    <button
                      className='btn btn-sm btn-success'
                      disabled={!!pendings.length || sending}
                      onClick={!!pendings.length || sending ? undefined : this.answerProcessitems}
                    >
                      <ShowIf condition={sending} alternative={<>
                        {pendings.length || sending?<i className='fa fa-fw fa-spinner fa-spin ' />:<i className='fa fa-fw fa-check-circle-o' />} Confirmar asignación
                      </>
                      }>
                        <>
                          <i className='fa fa-fw fa-spin fa-spinner' /> Actualizando...
                        </>
                      </ShowIf>
                    </button>
                  </div>
                </ShowIf>
              </div>
            </div>
            <div className={`box-body ${requestItems.length ? 'no-padding' : 'margin'}`}>
              {/*<ul>*/}
              {/*  <li>Pendiente: {countItemsByStatus[itemStatus.PENDING]}</li>*/}
              {/*  <li>En proceso: {countItemsByStatus[itemStatus.IN_PROCESS]}</li>*/}
              {/*  <li>Listos: {countItemsByStatus[itemStatus.READY]}</li>*/}
              {/*  <li>Error: {countItemsByStatus[itemStatus.ERROR]}</li>*/}
              {/*</ul>*/}
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
                          Prueba soltando el excel aquí, o haz click para seleccionar el excel a cargar.
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
              <div className='btn-group btn-group-sm'>
                <button
                  className='btn btn-sm btn-default'
                  onClick={() => this.props.history.push('/requests/vehicles/')}
                >
                  Cancelar
                </button>
                <ShowIf condition={!!requestItems.length}>
                  <button
                    className='btn btn-sm btn-success'
                    disabled={!!pendings.length || sending}
                    onClick={!!pendings.length || sending ? undefined : this.answerProcessitems}
                  >
                    <ShowIf condition={sending} alternative={<>
                      {pendings.length || sending?<i className='fa fa-fw fa-spinner fa-spin ' />:<i className='fa fa-fw fa-check-circle-o' />} Confirmar asignación</>}
                    >
                      <>
                        <i className='fa fa-fw fa-spin fa-spinner' /> Actualizando...
                      </>
                    </ShowIf>
                  </button>
                </ShowIf>
              </div>
            </div>
            <ShowIf condition={loading}>
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
      ['CODIGO']: '',
      ['VIN/ID']: '',
      ['MATERIAL']: ''
    }]);
    /* add to workbook */
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Solicitudes');
    /* generate an XLSX file */
    XLSX.writeFile(wb, 'template_mass_allocation_request.xlsx');
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
          const items: any[] = [];
          const excelDataItemByCode: Dictionary<IExcelData> = {};
          for (const item of excelData) {
            const code = item.hasOwnProperty('CODIGO') ? item['CODIGO'].trim().toUpperCase() : null;
            const vin = item.hasOwnProperty('VIN/ID') ? item['VIN/ID'].trim().toUpperCase() : null;
            const material = item.hasOwnProperty('MATERIAL') ? item['MATERIAL'].trim().toUpperCase() : null;
            if (code?.length) {
              excelDataItemByCode[code] = {
                code,
                vin,
                material,
                count: excelDataItemByCode[code]?.count ? excelDataItemByCode[code].count + 1 : 1
              };
              items.push({
                code,
                material,
                vin
              });
            }
          }
          this.apiService
            .preMassAllocation({ items })
            .then((response: AxiosResponse<preMassAllocationResponse>) => {
              const { results } = response.data;
              if (!results.length) {
                this.setState({
                  loading: false
                });
                swal!(
                  'Asignador masivo de unidades',
                  `No se han encontrado unidades.`,
                  'error'
                );
              } else {
                const requestItems: IRequestItemStore[] = results.map((item) => {
                  return {
                    _id: item._id,
                    processStatus: itemStatus.PENDING,
                    andesData: item,
                    excelData: {
                      vin: excelDataItemByCode[item.code].vin,
                      material: excelDataItemByCode[item.code].material,
                      code: excelDataItemByCode[item.code].code,
                      count: 0
                    },
                    errors: [],
                    checked: false
                  };
                });
                this.setState({
                  requestItems,
                  countItemsByStatus: {
                    [itemStatus.PENDING]: results.length,
                    [itemStatus.IN_PROCESS]: 0,
                    [itemStatus.READY]: 0,
                    [itemStatus.ERROR]: 0
                  },
                  loading: false
                }, () => {
                  this.checkItems();
                });
              }
            });
        } else {
          this.setState({
            loading: false
          });
          swal!(
            'Importador de configuración',
            `"${file.name}" no cumple con los requisitos mínimos o no tiene unidades.`,
            'error'
          );
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

  private checkItems() {
    const pendings = this.itemsByStatus(itemStatus.PENDING);
    if (pendings.length) {
      let item = pendings[0];
      item = this.updateItemStatusByID(item, itemStatus.IN_PROCESS);
      this.apiService
        .checkItemMassAllocation(item)
        .then((response: AxiosResponse) => {
          const { data: integrationData, errors } = response.data;
          this.updateItemStatusByID({
              ...item,
              integrationData,
              errors
            },
            response.data.errors.length ? itemStatus.ERROR : itemStatus.READY,
            this.checkItems
          );
        })
        .catch((error) => {
          if (error.status === 400) {
            swal!('Asignador masivo de unidades', error.data.message, 'error');
          } else {
            this.apiService.errorHandler(error);
          }
        });
    }
  }

  private customTotal(from: any, to: any, size: any) {
    return (
      <span className='react-bootstrap-table-pagination-total text-ellipsis' style={{ fontSize: '14px' }}>
        &nbsp;&nbsp;Mostrando registros del {from} al {to} de {size} registros.
      </span>
    );
  }

  private answerProcessitems() {
    const hasErrors = this.itemsByStatus(itemStatus.ERROR);
    if (hasErrors.length) {
      swal({
        title: '¿Estás seguro que deseas continuar?',
        text: `Hay ${hasErrors.length} unidades con errores, solo se procesarán los que no tienen ningún problema. `,
        icon: 'warning',
        dangerMode: true,
        buttons: {
          cancel: 'Cancelar' as any,
          confirm: {
            text: 'Sí'
          }
        }
      }).then((accept) => {
        if (accept) {
          this.processItems();
        }
      });
    } else {
      this.processItems();
    }
  }

  private processItems() {
    const toProcess = this.itemsByStatus(itemStatus.READY);
    if (toProcess.length) {
      let item = toProcess[0];
      this.setState({
        sending: true
      });
      // item = this.updateItemStatusByID(item, itemStatus.IN_PROCESS);
      this.apiService
        .processItemMassAllocation({ item })
        // .then((response: AxiosResponse) => {
        .then(() => {
          this.updateItemStatusByID({
              ...item
            },
            itemStatus.UPDATED,
            this.processItems
          );
          if (toProcess.length === 1) {
            swal({
              title: 'Asignador masivo de unidades',
              text: 'Se completo satisfactoriamente el proceso de asignación, ¿Deseas cargar otro archivo?',
              icon: 'success',
              // dangerMode: true,
              buttons: {
                cancel: 'Volver a solicitudes' as any,
                confirm: {
                  text: 'Sí'
                }
              }
            }).then((accept) => {
              if (accept) {
                this.setState({
                  requestItems: []
                });
              } else {
                const { history } = this.props;
                history.push('/requests/vehicles/');
              }
            });
          }
        })
        .catch((error) => {
          if (error.status === 400) {
            swal!('Asignador masivo de unidades', error.data.message, 'error');
          } else {
            this.apiService.errorHandler(error);
          }
          this.setState({
            sending: false
          });
        });
    } else {
      this.setState({
        sending: false
      });
    }
  }

  private updateItemStatusByID(item: IRequestItemStore, processStatus: itemStatus, callback?: () => void): any {
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
      .filter((item) => item.processStatus === processStatus);
  }

  private errorsFormatter(_: string, row: any) {
    if ([itemStatus.UPDATED].includes(row.processStatus)) {
      return <div className={'text-green'} style={{ fontSize: '12px' }}>
        Asignación procesada.
      </div>;
    }
    return row.errors.length > 0
      ?
      <div> {
        row.errors.map((error: any, index: any) => (
          <div key={index} className={'text-red'} style={{ fontSize: '12px' }}>
            {error.message}
          </div>
        ))
      }</div>
      : <div className={'text-green'} style={{ fontSize: '12px' }}>
        {
          [itemStatus.READY].includes(row.processStatus) ? <>{'Sin errores.'}</> : ''
        }</div>;
  }

  private statusFormatter(_: string, row: any) {
    if ([itemStatus.READY, itemStatus.ERROR].includes(row.processStatus)) {
      return row.errors.length > 0
        ? <i className={'fa fa-circle text-red'} />
        : <i className={'fa fa-circle text-green'} />;
    }
    if ([itemStatus.UPDATED].includes(row.processStatus)) {
      return <i className={'fa fa-check-circle text-green'} />;
    }
    return '';
  }

  private requestedVehicle(_: string, row: IRequestItemStore) {
    return (
      <div className='text-muted text-sm'>
        <div><strong>VIN </strong> <strong className={'text-primary'}>{row.andesData.car.vin}</strong></div>
        <div><strong>MATERIAL </strong>
          <ShowIf
            condition={!!row.excelData?.material?.length}
            alternative={<strong className={'text-primary'}>{row.andesData.car.material}</strong>}
          >
            {row.andesData.car.material} <i className={'fa fa-fw fa-angle-double-right'} /> <strong
            className={'text-primary'}>{row.excelData?.material}</strong>
          </ShowIf>
        </div>
        <div><strong>MARCA </strong>{row.andesData.car.brand}</div>
        <div><strong>MODELO </strong>{row.andesData.car.denomination}</div>
      </div>
    );
  }

  private assignVehicle(_: string, row: IRequestItemStore) {
    return (
      <div className='text-muted text-sm'>
        <div><strong>VIN </strong>
          <ShowIf condition={!!row.excelData.vin?.length}>
            <strong className={'text-primary'}>
              {row.integrationData?.vin ?? row.andesData.car.vin}
            </strong>
          </ShowIf>
        </div>
        <div>
          <strong>MATERIAL </strong>
          <strong className={'text-primary'}>{row.integrationData?.material ?? row.andesData.car.material}</strong>
        </div>
        <div><strong>MARCA </strong>{row.integrationData?.brand ?? row.andesData.car.brand}</div>
        <div><strong>MODELO </strong>{row.integrationData?.denomination ?? row.andesData.car.denomination}</div>
      </div>
    );
  }

  private codeFormatter(_: string, row: IRequestItemStore) {
    return (
      <div className={`${row.errors.length ? 'text-red' : 'text-muted'}`}>
        <strong>
          {row.excelData.code}
        </strong>
      </div>
    );
  }

  private vinFormatter(_: string, row: IRequestItemStore) {
    // console.log(row);
    if (row.errors.length) {
      return (
        <div>
          <span className={'text-red'}>{row.andesData.car.vin?.length ? row.andesData.car.vin : '-'}</span>
          <div className='text-sm text-muted'><i className='fa fa-fw fa-info-circle' /> No se realizará ningun cambio</div>
        </div>
      );
    }
    if (row.andesData.car?.vin) {
      if (!row.excelData.vin?.length) {
        return (
          <div>
            <span className={'text-red'} style={{ textDecoration: 'line-through' }}>{row.andesData.car.vin}</span>
            <ShowIf condition={!row.errors.length}>
              <div className='text-sm text-muted'><i className='fa fa-fw fa-info-circle' /> Elimina VIN de la unidad</div>
            </ShowIf>
          </div>
        );
      }
      return (
        <div>
          <span
            className={row.excelData.vin === row.andesData.car.vin && !row.errors.length ? 'text-muted' : 'text-red'}>{row.andesData.car.vin}</span>
          <i
            className={'fa fa-fw fa-angle-double-right'} /> <span
          className={!row.errors.length ? 'text-green' : 'text-red'}>{row.excelData.vin}</span>
          <ShowIf condition={!row.errors.length}>
            <div className='text-sm text-muted'><i
              className='fa fa-fw fa-info-circle' /> {row.excelData.vin === row.andesData.car.vin ? 'No se detectaron cambios' : 'Cambia VIN de la unidad'}
            </div>
          </ShowIf>
        </div>
      );
    }
    if (!row.excelData.vin?.length) {
      return (
        <div>
          <span className={'text-muted'}>{row.excelData.vin?.length ? row.excelData.vin : '-'}&nbsp;</span>
          <div className='text-sm text-muted'><i className='fa fa-fw fa-info-circle' /> No se ingreso VIN</div>
        </div>
      );
    }
    return (
      <div className={!row.errors.length ? 'text-green' : 'text-red'}>
        {row.excelData.vin}
        <ShowIf condition={!row.errors.length}>
          <div className='text-sm text-muted'><i className='fa fa-fw fa-info-circle' /> Asigna VIN de la unidad</div>
        </ShowIf>
      </div>
    );
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
