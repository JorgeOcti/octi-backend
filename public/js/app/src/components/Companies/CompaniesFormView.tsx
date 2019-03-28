import * as React from 'react';
import {connect} from 'react-redux';
import {IBaseCompany} from '../../../../../../src/interfaces/company.interface';
import {changeTempCompanyAction, CompaniesReduxAction, ICompaniesState} from '../../actions/companies.actions';

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
                    className="change-image-wrapper"
                    onClick={this.clickUploadFile}
                  >
                    <img
                      src={tempCompany.imageURI}
                      className="pointer"
                      style={{maxWidth: '100%'}}
                    />
                    <div className="text-layer pointer">
                      <p className="text"><i className="fa fa-2x fa-cloud-upload" /> <br/>Haz click aquí para cambiar la imágen.</p>
                    </div>
                  </div> :
                  <div
                    className="upload-file text-center pointer"
                    onClick={this.clickUploadFile}
                    // onDrop={this.handleDrop}
                    // onDragOver={this.dragOverHandler}
                    // onDragEnd={this.dragEndHandler}
                    // onDragLeave={this.dragLeaveHandler}
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

  private handleChangeInputFile(e: React.ChangeEvent<HTMLInputElement>) {
    const {files} = e.target;
    if (files && files.length && this.props.companies && this.props.changeTempCompanyAction) {
      const {tempCompany} = this.props.companies;
      const {changeTempCompanyAction} = this.props;
      const file = files[0];
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
