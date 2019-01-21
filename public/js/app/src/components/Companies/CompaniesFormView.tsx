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
}

class CompaniesFormView extends React.Component<IPropsType, IStateType> {

  constructor(props: IPropsType) {
    super(props);
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
          </div>
        </div>
      );
    } else {
      return null;
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
