import * as React from 'react';
import {connect} from 'react-redux';
import {IBaseCompany} from '../../../../../../src/interfaces/company.interface';
import {changeTempCompanyAction, CompaniesReduxAction, ICompaniesState} from '../../actions/companies.actions';
import ImageLazyLoad from '../Utils/ImageLazyLoad';

interface IPropsType {
  companies?: ICompaniesState;
  changeTempCompanyAction?: (company: IBaseCompany) => CompaniesReduxAction;
}

interface IStateType {
  error: Error | null;
  canDrop: boolean;
}

class CompaniesFormView extends React.Component<IPropsType, IStateType> {

  readonly state = {
    error: null,
    canDrop: false
  };
  readonly inputFile: React.RefObject<HTMLInputElement>;

  constructor(props: IPropsType) {
    super(props);
    this.clickUploadFile = this.clickUploadFile.bind(this);
    this.handleChangeInputFile = this.handleChangeInputFile.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.dragOverHandler = this.dragOverHandler.bind(this);
    this.dragEndHandler = this.dragEndHandler.bind(this);
    this.dragLeaveHandler = this.dragLeaveHandler.bind(this);
    this.inputFile = React.createRef();
  }

  render(): React.ReactElement<IPropsType> | null {
    if (this.props.companies && this.props.changeTempCompanyAction) {
      const {tempCompany} = this.props.companies;
      const {changeTempCompanyAction} = this.props;
      return (
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
            <div className="form-group">
              <label>Imágen</label>
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
                      style={{maxWidth: '100%'}}
                    />
                    <div className="text-layer pointer">
                      <p className="text"><i className="fa fa-2x fa-cloud-upload" /> <br/>Haz click aquí para cambiar la imágen.</p>
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
                    Prueba a soltanto la imágen aquí, o haz click para seleccionar la imágen a cargar.
                  </div>
              }
              <input
                type="file"
                accept="image/*"
                ref={this.inputFile}
                style={{display: 'none'}}
                onChange={this.handleChangeInputFile}
              />
            </div>
          </div>
        </div>
      );
    } else {
      return null;
    }
  }

  private clickUploadFile() {
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
          this.processFile(file);
        }
      }
    } else {
      if (dt.files.length) {
        const file = dt.files[0];
        this.processFile(file);
      }
    }
  }

  private handleChangeInputFile(e: React.ChangeEvent<HTMLInputElement>) {
    const {files} = e.target;
    if (files && files.length) {
      const file = files[0];
      this.processFile(file);
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

  private processFile(file: File): void {
    if (file && this.props.companies && this.props.changeTempCompanyAction) {
      const {tempCompany} = this.props.companies;
      const {changeTempCompanyAction} = this.props;
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target) {
          changeTempCompanyAction({
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
