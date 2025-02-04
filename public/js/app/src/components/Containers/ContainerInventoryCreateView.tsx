import {RouteComponentProps} from "react-router";
import {AlertReduxAction, IAlertsState} from "../../actions/alerts.actions";
import {Dispatch} from "redux";
import {loadDataAction, ModalReduxAction} from "../../actions/modal.actions";
import TrackingBasePage from "../Utils/TrackingBasePage";
import * as React from 'react';
import {RefObject} from "react";
import AppContainer from "../../container/AppContainer";
import Checkbox from "../Utils/CheckBox";
import * as XLSX from "xlsx-color";
import * as swal from 'sweetalert';
import ApiService from "../../utils/axios";
import {connect} from "react-redux";
import * as moment from "moment/moment";
import { hasPermission } from '../../utils/common';
import DataTable from 'react-data-table-component';

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
  loadingSettings: boolean;
  carsByContainer: any;
  loading: boolean;
  name: string;
  sending: boolean;
  file: File | null;
  backupFile: File | null;
  backupUri: string;
}

const dataTableStyle = {
  expanderCell: {
    style: {
      // this is to put expander button at the end of the row
      order: 1,
    }
  }
};

const paginationComponentOptions = {
  rowsPerPageText: 'Filas por página',
  rangeSeparatorText: 'de',
  selectAllRowsItem: true,
  selectAllRowsItemText: 'Todos',
};

class ContainerInventoryCreateView extends TrackingBasePage<IPropsType, IStateType> {
  title: string;

  readonly state = {
    error: null,
    canDrop: false,
    loadingSettings: false,
    carsByContainer: {},
    loading: true,
    name: `Inventario del ${moment().format('DD-MM-YYYY')}`,
    sending: false,
    file: null,
    backupFile: null,
    backupUri: '',
  };

  readonly inputFile: RefObject<HTMLInputElement>;
  readonly inputBackup: RefObject<HTMLInputElement>;

  readonly mandatoryHeaders = [
    "BIC",
    "VIN",
    "Marca",
    "Modelo",
    "Color",
    "Cliente Razón Social",
    "RUT Cliente",
    "Manifiesto",
    "N° BL",
    "Nave",
    "N° Viaje",
    "Sello IN",
    "Puerto Origen",
    "Peso",
    "Emplazamiento",
  ]

  readonly excelHeaders = [
    "BIC",
    "VIN",
    "Marca",
    "Modelo",
    "Color",
    "Cliente Razón Social",
    "RUT Cliente",
    "Manifiesto",
    "N° BL",
    "Emplazamiento",
    "Año DR",
    "N° DR",
    "Item",
    "Mes",
    "Contenedor",
    "Tipo CTR",
    "Tamaño CTR",
    "Ubicación",
    "Zona",
    "Origen",
    "Tipo Retiro",
    "RUT Asociado",
    "Cliente Asoc. Razón Social",
    "Forwarder",
    "Agencia",
    "N° Destinación",
    "Fecha Destinación",
    "Línea Operadora",
    "St.CTR IN",
    "St.CTR OUT",
    "Nave",
    "N° Viaje",
    "Tráfico",
    "N° Booking IN",
    "N° Booking OUT",
    "Sello IN",
    "Sello OUT",
    "N° TATC",
    "Puerto Origen",
    "Doc.Pta IN",
    "N° Doc.Pta IN",
    "Doc.Pta OUT",
    "N° Doc.Pta OUT",
    "Estado",
    "Fch.Inicio Alm.",
    "F. Recep .Efec.",
    "Fch. Provid.",
    "Fch. Descon.",
    "F. Sol. Retiro",
    "F. Aut. Salida",
    "F. Carga Camión",
    "Tº Espera",
    "Fch.Salida AEP",
    "Días Alm.",
    "Peso",
    "Tipo IMO",
    "N° UN",
    "Patente IN",
    "Patente OUT",
    "Consignatario",
    "Notificado",
  ]

  readonly containerHeaders = {
      "vin": (data : any) => data.BIC.replaceAll(' ', '').replaceAll('-', '').replaceAll('_', ''),
      "vin2": (data : any) => data.BIC.replaceAll(' ', '').replaceAll('-', '').replaceAll('_', '').slice(-7),
      "isContainer": (data: any) => true,
      "client": (data : any) => `${data["Cliente Razón Social"]} - ${data["RUT Cliente"]}`,
      "bl": (data: any) => data["N° BL"]
  }
  readonly carHeaders = {
      "vin": (data : any) => data.VIN.replaceAll(' ', '').replaceAll('-', '').replaceAll('_', ''),
      "vin2": (data : any) => data.VIN.replaceAll(' ', '').replaceAll('-', '').replaceAll('_', '').slice(6),
      "brand": (data : any) => data.Marca,
      "denomination": (data : any) => data.Modelo,
      "isContainer": (data: any) => false,
      "color": (data : any) => data.Color,
      "client": (data : any) => `${data["Cliente Razón Social"]} - ${data["RUT Cliente"]}`,
      "bl": (data: any) => data["N° BL"]
    }

  constructor(props: IPropsType) {
    super(props);

    this.inputFile = React.createRef();
    this.inputBackup = React.createRef();

    this.clickUploadFile = this.clickUploadFile.bind(this);
    this.validateRow = this.validateRow.bind(this);
    this.processDataRow = this.processDataRow.bind(this);
    this.dragOverHandler = this.dragOverHandler.bind(this);
    this.dragLeaveHandler = this.dragLeaveHandler.bind(this);
    this.dragEndHandler = this.dragEndHandler.bind(this);
    this.downloadTemplate = this.downloadTemplate.bind(this);
    this.handleChangeInputFile = this.handleChangeInputFile.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.processSettings = this.processSettings.bind(this);
    this.sendCreate = this.sendCreate.bind(this);

  }

  componentDidMount() {
    this.title = "Crear inventario container";
  }

  private sendCreate(): void {
    const {
      carsByContainer,
      name,
      file,
      backupFile,
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
    } else if (!Object.keys(carsByContainer).length) {
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
        .createContainerInventory({
          carsByContainer,
          name,
          file,
          backupFile,
        })
        .then((response: any) => {
          const { message } = response.data;
          swal!('Envió inventario', message, 'success');
          setTimeout(() => {
            this.setState({
              sending: false
            });
            swal.close();
            history.push('/inventory/containers/');
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

  private validateRow(data: any){
    for (let header of this.mandatoryHeaders){
      if (!data[header]){
        console.log("Error", header, data)
        return false
      }
    }
    return true
  }



  private processDataRow(data: any): any|null {
    if (this.validateRow(data)){
      let extra : any = {}
      this.excelHeaders.forEach((header: string) => {
        let value = data[header]
        if (value){
          extra[header] = value
        }
      })
      let container: any = {extra}
      let car: any = {extra}
      Object.keys(this.containerHeaders).forEach((key: string) => {
        let getter: (data: any) => any = this.containerHeaders[key as keyof typeof this.containerHeaders];
        container[key] = getter(data)
      })
      Object.keys(this.carHeaders).forEach((key: string) => {
        let getter: (data: any) => any = this.carHeaders[key as keyof typeof this.carHeaders];
        car[key] = getter(data)
      })
      return {container, car}
    }
    return null
  }

  private processSettings(file: File): void {
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
          const excelData = workbook.Sheets.hasOwnProperty('Planilla OSA')
            ? XLSX.utils.sheet_to_json(workbook.Sheets['Planilla OSA'])
            : [];
          const carsByContainer: any = {};
          if (excelData.length >= 1) {
            excelData.forEach((item: any) => {
              let datum = this.processDataRow(item)
              if (!datum){
                /* tslint:disable:no-console */
                // swal!('Error en archivo de configuracion', `Revise la linea ${item.__rowNum__}`, 'error');
                console.log('Error en linea:');
                console.log(item.__rowNum__);
                return;
              }
              const car = datum.car;
              const container = datum.container;
              if (!carsByContainer.hasOwnProperty(container.vin)){
                carsByContainer[container.vin] = {
                  container,
                  cars: []
                }
              }
              carsByContainer[container.vin].cars.push(car);
            });
            this.setState({
              file,
              carsByContainer: carsByContainer,
              loadingSettings: false
            });

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

    /* make the worksheet */
    const ws = XLSX.utils.aoa_to_sheet([this.excelHeaders]);

    this.excelHeaders.forEach((header: string, index: number) => {
      let style: any = {
        font: {bold: true}
      }
      if (this.mandatoryHeaders.includes(header)){
        style = {
          font: {bold: true},
          fill: {fgColor: {rgb: "95dcf7"}}
        }
      }
      ws[XLSX.utils.encode_cell({c: index, r: 0})].s = style;
    });

    /* add to workbook */
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Planilla OSA');
    /* generate an XLSX file */
    XLSX.writeFile(wb, 'template_container_inventory_settings.xlsx');
  }

  private columns = [
    {
      name: 'Contenedor',
      selector: (row: any) => row.container.vin,
      sortable: true
    },
    {
      name: 'BL',
      selector: (row: any) => row.container.extra["N° BL"],
    },
    {
      name: 'Puerto origen',
      selector: (row: any) => row.container.extra["Emplazamiento"],
    },
    {
      name: 'Nave',
      selector: (row: any) => row.container.extra["Nave"],
    },
    {
      name: 'Cliente',
      selector: (row: any) => {
        return row.container.extra["Cliente Razón Social"];
      },
      cell: (row: any) => {
        return <div>{row.container.extra["Cliente Razón Social"]}</div>
      }
    },
    {
      name: 'Ubicación',
      selector: (row: any) => {
        return row.container.extra["Ubicación"];
      }
    }
  ];

  private ExpandedRowElement = ({ data }: {data: any}) => {
    return <div className='container-fluid box-body table-responsive request-list'>
      <div className="row request bg-primary">
        <div className='col-sm-1 col-xs-1 col-md-1 col-lg-1 center'>
          <strong>VIN</strong>
        </div>
        <div className='col-sm-2 col-xs-2 col-md-2 col-lg-2 center'>
          <strong>Marca</strong>
        </div>
        <div className='col-sm-2 col-xs-2 col-md-2 col-lg-2 center'>
          <strong>Color</strong>
        </div>
      </div>
      { data.cars.map((car: any, index: number) => {
        let className = `${car.status}Class`;
        return (
          <div key={index} className='row request bg-request-title background-transition'>
            <div className='col-sm-1 col-xs-1 col-md-1 col-lg-1 center'>
              <strong>{car.vin}</strong>
            </div>
            <div className='col-sm-2 col-xs-2 col-md-2 col-lg-2 center'>
              {car.brand} - {car.denomination}
            </div>
            <div className='col-sm-2 col-xs-2 col-md-2 col-lg-2 center'>
              <strong>{car.color}</strong>
            </div>
          </div>
        )
      })
      }
    </div>
  }

  render() {
    const {
      loadingSettings,
      carsByContainer,
      name,
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
              {Object.keys(carsByContainer).length > 0 ?
                <div className="box">
                  <div className="box-header with-border flex flex-space-between">
                    <h3 className="box-title">
                      Containers ({Object.keys(carsByContainer).length})
                    </h3>
                  </div>
                  <DataTable
                    columns={this.columns}
                    data={Object.values(carsByContainer)}
                    customStyles={dataTableStyle}
                    expandableRows
                    expandableRowsComponent={this.ExpandedRowElement}
                    expandOnRowClicked={true}
                    pagination
                    paginationComponentOptions={paginationComponentOptions}
                  />
                </div> :
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
