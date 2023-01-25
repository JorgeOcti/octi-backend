import * as React from "react";
import {RouteComponentProps} from "react-router";
import {Dispatch} from "redux";
import {
  IStatsDashboardState, ITempStudio,
} from "../../actions/statsDashboard.actions";
import {IWindow} from "../../interfaces/window";
import {IUser} from "../../../../../../src/app/interfaces/user.interface";
import {IBaseVenue, IVenue} from "../../../../../../src/app/interfaces/venue.interface";
import {IStudio} from "../../../../../../src/stats/interfaces/studio.interface";
import {ErrorInfo} from "react";
import * as Raven from "raven-js";
import {connect} from "react-redux";

interface IPropsType {
  dashboard: IStatsDashboardState;
  users: IUser[];
  types: any[];
  changeTempStudioAction(studio: ITempStudio): void;
}

interface IStateType {
  error: Error | null;
}

declare let window: IWindow;

class StudioFormView extends React.Component<IPropsType, IStateType>{

  readonly state = {
    error: null,
    selectedUsers: []
  };

  constructor(props: IPropsType) {
    super(props);
  }


  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public componentDidMount() {
    const chosenOptions = {
      no_results_text: 'Sin resultados para:'
    };

    ($('#id-types') as any).chosen(chosenOptions).change((e: React.ChangeEvent<HTMLSelectElement>) => {
      this.chooseType(e.target.value);
    });

    ($('#id-users') as any).chosen(chosenOptions)
      .change((e: React.ChangeEvent<HTMLSelectElement>) => {
        this.addUser(e.target.value);
      });
  }



  componentDidUpdate() {
    $('#id-users').trigger('chosen:updated');
    $('#id-types').trigger('chosen:updated');
  }

  private chooseType(type: string) {
    const {changeTempStudioAction} = this.props;
    const {tempStudio} = this.props.dashboard;
    changeTempStudioAction({...tempStudio, type});
  }

  private addUser(id: string) {
    let user = this.props.users.find((user: IUser) => user._id === id);
    const {tempStudio} = this.props.dashboard;
    let {users} = tempStudio;
    if (user != undefined && !users.find((u: IUser) => u._id === user!!._id)) {
      users.push(user);
      this.props.changeTempStudioAction({
          ...tempStudio,
          users
        }
      )
    }
  }

  private deleteUser(user: IUser){
    const {tempStudio} = this.props.dashboard;
    this.props.changeTempStudioAction({
      ...tempStudio,
      users: tempStudio.users.filter((u: IUser) => u._id !== user._id)
      }
    )
  }

  public render() {
    const { changeTempStudioAction, users, types } = this.props;
    const { tempStudio } = this.props.dashboard;

    return (
      <React.Fragment>
        <ul className="nav nav-tabs" style={{marginBottom: '15px'}}>
          <li className="active"><a data-toggle="tab" href="#general">General</a></li>
        </ul>
        <div className="tab-content">
          <div id="general" className="tab-pane fade in active">
            <div className="row">
              <div className="col-md-12">
                <div className="form-group">
                  <label>Nombre</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    maxLength={50}
                    defaultValue={tempStudio ? tempStudio.name : undefined}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => changeTempStudioAction({
                      ...tempStudio,
                      name: e.target.value})}
                  />
                </div>
              </div>
              <div className="col-md-12">
                <div className="form-group">
                  <label>URL</label>
                  <input
                    type="text"
                    name="embedURL"
                    className="form-control"
                    defaultValue={tempStudio ? tempStudio.embedURL : undefined}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => changeTempStudioAction({
                      ...tempStudio,
                      embedURL: e.target.value})}
                  />
                </div>
              </div>
              <div className="col-md-12">
                <div className="form-group">
                  <label htmlFor="id-types">Tipo</label>
                  <select
                    className="chosen-select form-control"
                    id="id-types"
                    name="type"
                    defaultValue={tempStudio ? tempStudio.type : undefined}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => changeTempStudioAction({
                      ...tempStudio,
                      type: e.target.value})}
                    data-placeholder={'Seleccione...'}
                  >
                    <option value="" />
                    {
                      types.map((type) => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))
                    }
                  </select>
                </div>
              </div>
              <div className="col-md-12">
                <div className="form-group">
                  <label htmlFor="id-users">Usuarios</label>
                  <select
                    id="id-users"
                    className="chosen-select form-control"
                    style={{minWidth: '200px'}}
                    onChange={undefined}
                    data-placeholder={'Seleccione...'}
                  >
                    <option value="" />
                    {
                      users.filter(user => !tempStudio.users.find(u => u._id == user._id)).map((user) => {
                        return (
                          <option key={user._id} value={user._id}>{user.firstName} {user.lastName}</option>
                        );
                      })
                    }
                  </select>
                </div>
              </div>
              <div className="col-md-12">
                <table className="table table-striped">
                  <thead>
                  <tr>
                    <th style={{width: '90%'}}>Name</th>
                    <th style={{width: '10%'}}/>
                  </tr>
                  </thead>
                  <tbody>
                  {
                    tempStudio.users.length ? tempStudio.users.map((user: IUser) => {
                        return (
                          <tr key={user._id}>
                            <td>{user.firstName} {user.lastName}</td>
                            <td
                              className="text-center text-red pointer"
                              onClick={() => this.deleteUser(user)}
                            >
                              <i className="fa fa-minus-circle"/>
                            </td>
                          </tr>
                        );
                      }) :
                      <tr>
                        <td colSpan={2}>Aún no se han seleccionado usuarios.</td>
                      </tr>
                  }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}


const mapStateToProps = (state: { statsDashboard: IStatsDashboardState }) => {
  return {
    dashboard: state.statsDashboard
  };
};

const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(StudioFormView);
