import * as React from 'react';
import {connect} from 'react-redux';
import {IBaseCompany} from '../../../../../../src/interfaces/company.interface';
import {
  changeTempCompanyAction,
  CompaniesReduxAction,
  ICompaniesState
} from '../../actions/companies.actions';
import ImageLazyLoad from '../Utils/ImageLazyLoad';
import BootstrapSwitch from "../Utils/BootstrapSwitch";
import * as uuid from 'uuid';

interface IPropsType {
  companies?: ICompaniesState;
  changeTempCompanyAction?: (company: IBaseCompany) => CompaniesReduxAction;
}

interface IStateType {
  error: Error | null;
  canDrop: boolean;
  tmpReceiver: any;
}

class CompaniesFormView extends React.Component<IPropsType, IStateType> {

  readonly state = {
    error: null,
    canDrop: false,
    tmpReceiver:{
      name: '',
      email: ''
    }
  };
  readonly inputImage: React.RefObject<HTMLInputElement>;
  readonly inputMarker: React.RefObject<HTMLInputElement>;

  constructor(props: IPropsType) {
    super(props);
    this.clickUploadFile = this.clickUploadFile.bind(this);
    this.handleChangeInputFile = this.handleChangeInputFile.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.handleAddReceiver = this.handleAddReceiver.bind(this);
    this.handleRemoveReceiver = this.handleRemoveReceiver.bind(this);
    this.dragOverHandler = this.dragOverHandler.bind(this);
    this.dragEndHandler = this.dragEndHandler.bind(this);
    this.dragLeaveHandler = this.dragLeaveHandler.bind(this);
    this.inputImage = React.createRef();
    this.inputMarker = React.createRef();
  }

  render(): React.ReactElement<IPropsType> | null {
    if (this.props.companies && this.props.changeTempCompanyAction) {
      const {tempCompany} = this.props.companies;
      const {changeTempCompanyAction} = this.props;
      const {tmpReceiver} = this.state;
      return (
        <React.Fragment>
          <ul className="nav nav-tabs" style={{marginBottom: '15px'}}>
            <li className="active"><a data-toggle="tab" href="#general">General</a></li>
            <li><a data-toggle="tab" href="#billing">Billing</a></li>
            <li><a data-toggle="tab" href="#customizations">Personalizaciones</a></li>
          </ul>
          <div className="tab-content">
            <div id="general" className="tab-pane fade in active">
              <div className="row">
                <div className="col-md-12">
                  <div className="form-group">
                    <label>Nombre</label>
                    <input
                      type="text"
                      name="fistName"
                      className="form-control"
                      maxLength={50}
                      defaultValue={tempCompany ? tempCompany.name : ''}
                      onChange={
                        (e: React.ChangeEvent<HTMLInputElement>) => changeTempCompanyAction({
                          ...tempCompany,
                          name: e.target.value.trim()
                        })
                      }
                    />
                  </div>
                  <div className="form-group-switch">
                    <BootstrapSwitch
                      checked={tempCompany.billing.active}
                      color="blue"
                      onChange={() => {
                        changeTempCompanyAction({
                          ...tempCompany,
                          billing: {
                            ...tempCompany.billing,
                            active: !tempCompany.billing.active
                          }
                        });
                      }}/>
                    <label className="switch-label">Activar billing</label>
                  </div>
                </div>
              </div>
            </div>
            <div id="billing" className="tab-pane fade">
              <div className="row">
                <div className="col-md-12">
                  <div className="form-group">
                    <label>Precio Inventario</label>
                    <input
                      type="number"
                      name="fistName"
                      className="form-control"
                      maxLength={50}
                      defaultValue={tempCompany ? tempCompany.billing.inventoryPrice : '0.0'}
                      onChange={
                        (e: React.ChangeEvent<HTMLInputElement>) => changeTempCompanyAction({
                          ...tempCompany,
                          billing: {
                            ...tempCompany.billing,
                            inventoryPrice: parseFloat(e.target.value.trim())
                          }
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Precio Checklist</label>
                    <input
                      type="number"
                      name="fistName"
                      className="form-control"
                      maxLength={50}
                      defaultValue={tempCompany ? tempCompany.billing.checklistPrice : '0.0'}
                      onChange={
                        (e: React.ChangeEvent<HTMLInputElement>) => changeTempCompanyAction({
                          ...tempCompany,
                          billing: {
                            ...tempCompany.billing,
                            checklistPrice: parseFloat(e.target.value.trim())
                          }
                        })
                      }
                    />
                  </div>
                </div>
                <div className="col-md-12">
                  <strong style={{color: "#2372bb"}}>Notificaciones</strong>
                  <table className="table table-striped">
                    <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th/>
                    </tr>
                    </thead>
                    <tbody>
                    {
                      !tempCompany.notifications.length ?
                        <tr>
                          <td colSpan={3} className={"text-center"}>
                            <strong>No se han agregado destinatarios</strong>
                          </td>
                        </tr> :
                        null
                    }
                    {
                      tempCompany.notifications.map((notification) => (
                        <tr key={notification._id ? notification._id : notification.tempID}>
                          <td width={"45%"}>{notification.name}</td>
                          <td width={"45%"}>{notification.email}</td>
                          <td
                            className={"text-center"}
                          >
                            <i
                              className="fa fa-minus-circle text-red"
                              onClick={() => this.handleRemoveReceiver(notification._id || notification.tempID)}
                            />
                          </td>
                        </tr>
                      ))
                    }
                    </tbody>
                  </table>
                  {/*<div className="alert alert-info alert-dismissible">*/}
                  {/*  <p>Estos son los destinatarios que recibiran un correo mensual con el informe de billing.</p>*/}
                  {/*</div>*/}
                </div>
                <div className="col-md-5">
                  <div className="form-group">
                    <label>Nombre</label>
                    <input
                      type="text"
                      name="receiverName"
                      className="form-control"
                      maxLength={50}
                      value={tmpReceiver.name}
                      onChange={
                        (e: React.ChangeEvent<HTMLInputElement>) => this.setState({
                          tmpReceiver: {
                            ...this.state.tmpReceiver,
                            name: e.target.value
                          }
                        })
                      }
                    />
                  </div>
                </div>
                <div className="col-md-7">
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="text"
                      name="receiverEmail"
                      className="form-control"
                      maxLength={50}
                      value={tmpReceiver.email}
                      onChange={
                        (e: React.ChangeEvent<HTMLInputElement>) => this.setState({
                          tmpReceiver: {
                            ...this.state.tmpReceiver,
                            email: e.target.value.trim()
                          }
                        })
                      }
                    />
                  </div>
                </div>
                <div className="col-md-12 text-right">
                  <button
                    className="btn btn-sm btn-success"
                    onClick={this.handleAddReceiver}
                  >
                    Agregar Destinatario
                  </button>
                </div>
              </div>
            </div>
            <div id="customizations" className="tab-pane fade">
              <div className="row">
                <div className="col-md-12">
                  <div className="form-group">
                    <label>Imagen</label>
                    {
                      tempCompany.imageURI ?
                        <div
                          className="change-image-wrapper text-center"
                          style={{display: 'table', width: '100%', color: '#2776b8'}}
                          onClick={() => this.clickUploadFile("inputImage")}
                        >
                          <ImageLazyLoad
                            url={tempCompany.imageURI}
                            height={'200px'}
                            style={{
                              maxWidth: '100%',
                              maxHeight: "200px"
                            }}
                          />
                          <div className="text-layer pointer">
                            <p className="text">
                              <i className="fa fa-2x fa-cloud-upload"/> <br/>Haz click aquí para cambiar la imágen.
                            </p>
                          </div>
                        </div> :
                        <div
                          className="upload-file text-center pointer"
                          onClick={() => this.clickUploadFile("inputImage")}
                          onDrop={(e) => this.handleDrop(e, "image")}
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
                          Prueba a soltanto la imágen aquí, o haz click para seleccionar la imágen a cargar.
                        </div>
                    }
                    <input
                      type="file"
                      accept="image/*"
                      ref={this.inputImage}
                      style={{display: 'none'}}
                      onChange={(e) => this.handleChangeInputFile(e, "image")}
                    />
                  </div>
                  <div className="form-group">
                    <label>Marcador de Mapa</label>
                    {
                      tempCompany.markerURI ?
                        <div
                          className="change-image-wrapper text-center"
                          style={{display: 'table', width: '100%', color: '#2776b8'}}
                          onClick={() => this.clickUploadFile("inputMarker")}
                        >
                          <ImageLazyLoad
                            url={tempCompany.markerURI}
                            height={'100px'}
                            style={{
                              maxWidth: '100px'
                            }}
                          />
                          <div className="text-layer pointer">
                            <p className="text">
                              <i className="fa fa-2x fa-cloud-upload"/> <br/>Haz click aquí para cambiar la imágen.
                            </p>
                          </div>
                        </div> :
                        <div
                          className="upload-file text-center pointer"
                          onClick={() => this.clickUploadFile("inputMarker")}
                          onDrop={(e) => this.handleDrop(e, "marker")}
                          onDragOver={this.dragOverHandler}
                          onDragEnd={this.dragEndHandler}
                          onDragLeave={this.dragLeaveHandler}
                          style={{
                            backgroundColor: '#EEEEEE',
                            border: this.state.canDrop ? '1px solid #979797' : '1px dashed #979797',
                            padding: '24px 20px',
                            color: this.state.canDrop ? '#aebccb' : '#6e7a89',
                            borderRadius: '5px',
                            marginBottom: '10px',
                            height: '100px'
                          }}>
                          <i className="fa fa-2x fa-cloud-upload"/><br/>
                          Prueba a soltanto la imágen aquí, o haz click para seleccionar la imágen a cargar.
                        </div>
                    }
                    <input
                      type="file"
                      accept="image/*"
                      ref={this.inputMarker}
                      style={{display: 'none'}}
                      onChange={(e) => this.handleChangeInputFile(e, "marker")}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </React.Fragment>
      );
    }
    return null;
  }

  private handleAddReceiver(){
    const {tmpReceiver} = this.state;
    this.props.changeTempCompanyAction!({
      ...this.props.companies!.tempCompany,
      notifications: [...this.props.companies!.tempCompany.notifications!, {
        ...tmpReceiver,
        tempID: uuid.v1()
      }]
    });
    this.setState({
      tmpReceiver: {
        name: "",
        email: ""
      }
    })
  }

  private handleRemoveReceiver(id: any) {
    this.props.changeTempCompanyAction!({
      ...this.props.companies!.tempCompany,
      notifications: this.props.companies!.tempCompany.notifications!.filter((notification) => {
        return notification._id !== id && notification.tempID !== id
      })
    });
  }

  private clickUploadFile(input: "inputImage" | "inputMarker") {
    console.log('input', input);;
    console.log('this[input]', this[input]);
    if (this[input].current) {
      this[input].current!.click();
    }
  }

  private handleDrop(e: React.DragEvent<HTMLDivElement>, input: "marker" | "image"): void {
    e.preventDefault();
    const dt = e.dataTransfer;
    if (dt.items) {
      if (dt.items.length) {
        const file: File | null = dt.items[0].getAsFile();
        if (file) {
          this.processFile(file, input);
        }
      }
    } else {
      if (dt.files.length) {
        const file = dt.files[0];
        this.processFile(file, input);
      }
    }
  }

  private handleChangeInputFile(e: React.ChangeEvent<HTMLInputElement>, input: "marker" | "image" ) {
    const {files} = e.target;
    if (files && files.length) {
      const file = files[0];
      this.processFile(file, input);
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

  private processFile(file: File, input: "marker" | "image"): void {
    if (file && this.props.companies && this.props.changeTempCompanyAction) {
      const {tempCompany} = this.props.companies;
      const {changeTempCompanyAction} = this.props;
      const reader: FileReader = new FileReader();
      reader.onload = (e: ProgressEvent) => {
        if (e.target) {
          changeTempCompanyAction({
            ...tempCompany,
            [`${input}URI`]: (e.target as any).result,
            [input]: file
          });
        }
      };
      reader.readAsDataURL(file);
    }
  }
}

const mapStateToProps = (state: { companies: ICompaniesState }) => {
  return {
    companies: state.companies
  };
};

const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    changeTempCompanyAction: (company: IBaseCompany) => dispatch(changeTempCompanyAction(company))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(CompaniesFormView);
