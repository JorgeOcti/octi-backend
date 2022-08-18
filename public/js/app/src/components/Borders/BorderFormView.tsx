import {BorderReduxAction, changeTempBorderAction, IBorderState} from "../../actions/borders.actions";
import {IBaseBorder} from "../../../../../../src/app/interfaces/border.interface";
import * as React from "react";
import BootstrapSelect from "../Utils/BootstrapSelect";
import {connect} from "react-redux";

interface IPropsType {
  borderState?: IBorderState;
  changeTempBorderAction?: (border: IBaseBorder) => BorderReduxAction
}

interface IStateType {
  error: Error | null;
}

class BorderFormView extends React.Component<IPropsType, IStateType>{
  constructor(props: IPropsType) {
    super(props);
  }

  render(): React.ReactElement<IPropsType> | null {
    if (this.props.borderState && this.props.changeTempBorderAction) {
      const {changeTempBorderAction} = this.props;
      const {tempBorder, companies} = this.props.borderState;

      return (
        <React.Fragment>
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
                      value={tempBorder.name}
                      onChange={
                        (e: React.ChangeEvent<HTMLInputElement>) => changeTempBorderAction({
                          ...tempBorder,
                          name: e.target.value
                        })
                      }
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Latitud</label>
                    <input
                      type="number"
                      name="lng"
                      step="any"
                      className="form-control"
                      maxLength={50}
                      value={tempBorder.lat}
                      onChange={
                        (e: React.ChangeEvent<HTMLInputElement>) => changeTempBorderAction({
                          ...tempBorder,
                          lat: parseFloat(e.target.value)
                        })
                      }
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Longitud</label>
                    <input
                      type="number"
                      name="lng"
                      className="form-control"
                      maxLength={50}
                      value={tempBorder.lng}
                      onChange={
                        (e: React.ChangeEvent<HTMLInputElement>) => changeTempBorderAction({
                          ...tempBorder,
                          lng: parseFloat(e.target.value)
                        })
                      }
                    />
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="form-group">
                    <label htmlFor="id-company">Empresa</label>
                    <BootstrapSelect
                      noneSelectedText="Seleccione"
                      search={true}
                      options={
                        companies
                          .map((company) => ({
                            value: company._id,
                            text: company.name
                          }))
                      }
                      selected={tempBorder.company ? [tempBorder.company._id] : []}
                      autoClouse={true}
                      onClick={(value: string) => changeTempBorderAction({
                        ...tempBorder,
                        company: companies.find((company) => (company._id === value))
                      })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </React.Fragment>
      );
    } else {
      return null;
    }
  }
}

const mapStateToProps = (state: { border: IBorderState }) => {
  return {
    borderState: state.border
  };
};

const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    changeTempBorderAction: (border: IBaseBorder) => dispatch(changeTempBorderAction(border)),
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(BorderFormView);
