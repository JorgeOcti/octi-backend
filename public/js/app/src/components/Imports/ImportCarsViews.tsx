///<reference path="../../../node_modules/sweetalert/typings/sweetalert.d.ts"/>
import * as PropTypes from 'prop-types';
import * as XLSX from 'xlsx';
import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import AppContainer from "../../container/AppContainer";
import {IUsersState, UserReduxAction} from "../../actions/users";
import ModalView from "../Modal/ModalView";
import {RefObject} from "react";

interface IImportCar {
  vin: string;
  brand: string;
  denomination: string;
  color: string;
}
interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<UserReduxAction>;
}

interface IStateType {
  error: Error | null;
  cars: IImportCar[];
}

class ImportCarsView extends React.Component<IPropsType, IStateType> {

  private inputFile: RefObject<HTMLInputElement>;

  state = {
    error: null,
    cars:[]
  };

  static propTypes = {
    users: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
  };

  constructor(props: IPropsType) {
    super(props);
    this.clickUploadFile = this.clickUploadFile.bind(this);
    this.handleChangeInputFile = this.handleChangeInputFile.bind(this);
    this.inputFile = React.createRef();
  }

  public componentWillMount(){
    // set the title of the page
    document.title = 'OSA Andes | Importar autos';
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public render(): React.ReactElement<IPropsType> {
    const {cars} = this.state;
    return (
      <AppContainer title='' cMenu='2' cSubMenu='2.2'>
        <section className="content">
          <div className="box">
            <div className="box-header with-border"><h3 className="box-title">Importar autos</h3>
            </div>
            <div className="box-body">
              <div className="row">
                <div className="col-md-12">
                  <input type="file"  ref={this.inputFile} style={{display: 'none'}} onChange={this.handleChangeInputFile} />
                  <button className="btn btn btn-primary" onClick={this.downloadTemplate}>Descargar Formato</button>
                  <button className="btn btn btn-primary" onClick={this.clickUploadFile}>Subir excel</button>
                </div>
              </div>
              {
                cars.length ?
                  <div className="row">
                    <div className="col-md-12">
                    <h4>Vas a cargar {cars.length} vehiculos</h4>
                      <table className="table">
                        <thead>
                        <tr>
                          <th>VIN</th>
                          <th>Marca</th>
                          <th>Denominación</th>
                          <th>Color</th>
                        </tr>
                        </thead>
                        <tbody>
                        {
                          cars.map((car: IImportCar, index) => {
                            return (
                              <tr key={index}>
                                <td>{car.vin}</td>
                                <td>{car.brand}</td>
                                <td>{car.denomination}</td>
                                <td>{car.color}</td>
                              </tr>
                            )
                          })
                        }
                        </tbody>
                      </table>
                    </div>
                  </div> : null
              }
            </div>
          </div>
          <ModalView />
        </section>
      </AppContainer>
    );
  }

  private clickUploadFile(){
    if(this.inputFile.current){
      this.inputFile.current.click();
    }
  }

  private downloadTemplate(){
    const data = [
      {"vin": "", "brand": "", "denomination":"", "color": ""},
    ];
    /* make the worksheet */
    const ws = XLSX.utils.json_to_sheet(data);

    /* add to workbook */
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Autos");
    /* generate an XLSX file */
    XLSX.writeFile(wb, "template_import_cars_v1.xlsx");
  }

  private handleChangeInputFile(e: React.ChangeEvent<HTMLInputElement>){
    const {files} = e.target;
    if(files && files.length){
      const file = files[0];
      if(['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(file.type)){
        const reader = new FileReader();
        const rABS = !!reader.readAsBinaryString;
        console.log('rAB', rABS);
        reader.onload =  (e: FileReaderProgressEvent) => {
          if (e.target) {
            let data = e.target.result;
            if (!rABS) data = new Uint8Array(data);
            const workbook = XLSX.read(data, {
              type: rABS ? 'binary' : 'array'
            });
            this.setState({
              cars: XLSX.utils.sheet_to_json(workbook.Sheets['Autos'])
            });
            console.log(XLSX.utils.sheet_to_json(workbook.Sheets['Autos']))
          }
        };
        if(rABS) reader.readAsBinaryString(file); else reader.readAsArrayBuffer(file);
      }
    }
  }
}

const mapStateToProps = (state: { users: IUsersState }) => {
  return {
    users: state.users
  };
};

const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(ImportCarsView);

