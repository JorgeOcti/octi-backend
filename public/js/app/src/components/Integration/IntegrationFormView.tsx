import * as React from "react";
import {Field, InjectedFormProps, reduxForm} from 'redux-form'
import {RouteComponentProps} from "react-router";
import {IUsersState, UserReduxAction} from "../../actions/users.actions";
import {connect} from "react-redux";
import InputField from "../../formComponents/InputField";
import {Dispatch} from "redux";
import {inputStringRequired} from "../../utils/formValidations";
import BootstrapSelectField from "../../formComponents/BootstrapSelectFields";

interface IPropsType extends InjectedFormProps, RouteComponentProps<{}> {
  dispatch: Dispatch<UserReduxAction>;
  users: IUsersState;
}

interface IStateType {
  error: Error | null;
}

class Form extends React.Component<IPropsType, IStateType> {
  public render(): React.ReactElement<IPropsType> {
    const {companies} = this.props.users;
    return (
      <React.Fragment>
        <ul className="nav nav-tabs" style={{marginBottom: '15px'}}>
          <li className="active"><a data-toggle="tab" href="#general">General</a></li>
          {/*{*/}
          {/*  window.user.isAdmin ?*/}
          {/*    <li><a data-toggle="tab" href="#permissions">Permisos</a></li>*/}
          {/*    : null*/}
          {/*}*/}
          {/*<li><a data-toggle="tab" href="#access">Accesos</a></li>*/}
        </ul>
        <div className="tab-content">
          <div id="general" className="tab-pane fade in active">
            <div className="row">
              <div className="col-md-12">
                <Field
                  name={`firstName`}
                  label="Nombre"
                  type="text"
                  validate={[inputStringRequired]}
                  component={InputField}
                />
              </div>
              <div className="col-md-12">
                <Field
                  name={`company`}
                  label="Empresa"
                  options={companies.map((company: any) => ({
                    value: company._id,
                    text: company.name
                  }))}
                  autoClouse={true}
                  search={true}
                  multi={false}
                  noneSelectedText={"Seleccione una empresa."}
                  component={BootstrapSelectField}
                  validate={[inputStringRequired]}
                 />
              </div>
            </div>
          </div>
        </div>
      </React.Fragment>
    )
  }
}

const IntegrationFormView = reduxForm({
  form: "integrationForm",
})(Form);

// const selector = formValueSelector("sitiesForm");

const mapStateToProps = (state: { users: IUsersState }) => {
  // const venue = selector(state, 'venue');
  return {
    users: state.users
  };
};
const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch,
  };
};

export default connect<{}, {}, any | IPropsType>(mapStateToProps, mapDispatchToProps)(IntegrationFormView);
