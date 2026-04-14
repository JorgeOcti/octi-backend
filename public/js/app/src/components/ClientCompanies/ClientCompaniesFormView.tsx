import * as React from 'react';
import {connect} from 'react-redux';
import {IBaseCompany} from '../../../../../../src/app/interfaces/company.interface';
import {
  changeTempClientCompanyAction,
  ClientCompaniesReduxAction,
  IClientCompaniesState
} from '../../actions/clientCompanies.actions';
import ImageLazyLoad from '../Utils/ImageLazyLoad';

interface IPropsType {
  clientCompanies?: IClientCompaniesState;
  changeTempClientCompanyAction?: (company: IBaseCompany) => ClientCompaniesReduxAction;
}

interface IStateType {
  error: Error | null;
  canDrop: boolean;
}

class ClientCompaniesFormView extends React.Component<IPropsType, IStateType> {

  readonly state = {
    error: null,
    canDrop: false
  };
  readonly inputImage: React.RefObject<HTMLInputElement>;

  constructor(props: IPropsType) {
    super(props);
    this.clickUploadFile = this.clickUploadFile.bind(this);
    this.handleChangeInputFile = this.handleChangeInputFile.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.dragOverHandler = this.dragOverHandler.bind(this);
    this.dragEndHandler = this.dragEndHandler.bind(this);
    this.dragLeaveHandler = this.dragLeaveHandler.bind(this);
    this.inputImage = React.createRef();
  }

  render(): React.ReactElement<IPropsType> | null {
    if (this.props.clientCompanies && this.props.changeTempClientCompanyAction) {
      const {tempCompany} = this.props.clientCompanies;
      const {changeTempClientCompanyAction} = this.props;
      return (
        <React.Fragment>
          <ul className="nav nav-tabs" style={{marginBottom: '15px'}}>
            <li className="active"><a data-toggle="tab" href="#general">General</a></li>
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
                      className="form-control"
                      maxLength={50}
                      defaultValue={tempCompany ? tempCompany.name : ''}
                      onChange={
                        (e: React.ChangeEvent<HTMLInputElement>) => changeTempClientCompanyAction({
                          ...tempCompany,
                          name: e.target.value.trim()
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Razón social</label>
                    <input
                      type="text"
                      className="form-control"
                      maxLength={50}
                      defaultValue={tempCompany ? tempCompany.businessName : ''}
                      onChange={
                        (e: React.ChangeEvent<HTMLInputElement>) => changeTempClientCompanyAction({
                          ...tempCompany,
                          businessName: e.target.value.trim()
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>RUT</label>
                    <input
                      type="text"
                      className="form-control"
                      maxLength={50}
                      defaultValue={tempCompany ? tempCompany.rut : ''}
                      onChange={
                        (e: React.ChangeEvent<HTMLInputElement>) => changeTempClientCompanyAction({
                          ...tempCompany,
                          rut: e.target.value.trim()
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
            <div id="customizations" className="tab-pane fade">
              <div className="row">
                <div className="col-md-12">
                  <div className="form-group">
                    <label>Logo</label>
                    {
                      tempCompany.imageURI ?
                        <div
                          className="change-image-wrapper text-center"
                          style={{display: 'table', width: '100%', color: '#2776b8'}}
                          onClick={this.clickUploadFile}
                        >
                          <ImageLazyLoad
                            url={tempCompany.imageURI}
                            height={'200px'}
                            style={{maxWidth: '100%', maxHeight: '200px'}}
                          />
                          <div className="text-layer pointer">
                            <p className="text">
                              <i className="fa fa-2x fa-cloud-upload"/> <br/>Haz click aquí para cambiar el logo.
                            </p>
                          </div>
                        </div> :
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
                          Prueba soltando la imagen aquí, o haz click para seleccionar la imagen a cargar.
                        </div>
                    }
                    <input
                      type="file"
                      accept="image/*"
                      ref={this.inputImage}
                      style={{display: 'none'}}
                      onChange={this.handleChangeInputFile}
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

  private clickUploadFile() {
    if (this.inputImage.current) {
      this.inputImage.current.click();
    }
  }

  private handleDrop(e: React.DragEvent<HTMLDivElement>): void {
    e.preventDefault();
    const dt = e.dataTransfer;
    if (dt.items) {
      if (dt.items.length) {
        const file: File | null = dt.items[0].getAsFile();
        if (file) {
          this.processFile(file);
        }
      }
    } else {
      if (dt.files.length) {
        this.processFile(dt.files[0]);
      }
    }
  }

  private handleChangeInputFile(e: React.ChangeEvent<HTMLInputElement>) {
    const {files} = e.target;
    if (files && files.length) {
      this.processFile(files[0]);
    }
  }

  private dragOverHandler(e: React.DragEvent<HTMLDivElement>): void {
    e.preventDefault();
    this.setState({canDrop: true});
  }

  private dragLeaveHandler(): void {
    this.setState({canDrop: false});
  }

  private dragEndHandler(e: React.DragEvent<HTMLDivElement>): void {
    const dt = e.dataTransfer;
    if (dt.items) {
      for (let i = 0; i < dt.items.length; i++) {
        dt.items.remove(i);
      }
    } else {
      e.dataTransfer.clearData();
    }
  }

  private processFile(file: File): void {
    if (file && this.props.clientCompanies && this.props.changeTempClientCompanyAction) {
      const {tempCompany} = this.props.clientCompanies;
      const reader: FileReader = new FileReader();
      reader.onload = (e: ProgressEvent) => {
        if (e.target) {
          this.props.changeTempClientCompanyAction!({
            ...tempCompany,
            imageURI: (e.target as any).result,
            image: file
          });
        }
      };
      reader.readAsDataURL(file);
    }
  }
}

const mapStateToProps = (state: { clientCompanies: IClientCompaniesState }) => {
  return { clientCompanies: state.clientCompanies };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch,
    changeTempClientCompanyAction: (company: IBaseCompany) => dispatch(changeTempClientCompanyAction(company))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(ClientCompaniesFormView);
