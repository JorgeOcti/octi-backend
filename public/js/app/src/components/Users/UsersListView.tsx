import * as PropTypes from 'prop-types';
import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import AppContainer from "../../container/AppContainer";
import {IUsersState, UserReduxAction, getUsersAction} from "../../actions/users";

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<UserReduxAction>;
  users: IUsersState;

  getUsersAction(): UserReduxAction;
}

interface IStateType {
  error: Error | null;
  comment: string;
}

class UsersListView extends React.Component<IPropsType, IStateType> {

  static propTypes = {
    users: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    getUsersAction: PropTypes.func.isRequired,
  };

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  componentWillMount(){
    document.title = 'OSA Andes | Listado de usuarios';
    this.props.getUsersAction();
  }

  render() {
    const {loading, users} = this.props.users;
    return (
      <AppContainer title='' cMenu='2' cSubMenu='2.1' cAction='Listado'>
        <section className="content">
          <div className="box">
            <div className="box-header with-border"><h3 className="box-title">Usuarios</h3>
              <div className="box-tools pull-right">
                <button className="btn btn-sm btn-success">Agregar</button>
              </div>
            </div>
            <div className="box-body">
              <div className="pull-right">
                <div className="input-group text-right max-width-300">
                  <input type="text" className="form-control" placeholder="Buscar"/>
                  <span className="input-group-addon input-group-primary"><i className="fa fa-search" /></span>
                </div>
              </div>
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Firstname</th>
                    <th>Lastname</th>
                    <th>Email</th>
                    <th className="width-10" />
                    <th className="width-10" />
                  </tr>
                </thead>
                <tbody>
                  {
                    users.map((user:any)=>{
                      return (
                        <tr key={user._id}>
                          <td>{user.name}</td>
                          <td>{user.lastName}</td>
                          <td>{user.email}</td>
                          <td className="text-blue pointer"><i className="fa fa-pencil" /></td>
                          <td className="text-red pointer"><i className="fa fa-minus-circle" /></td>
                        </tr>
                      )
                    })
                  }
                </tbody>
              </table>
            </div>
            <div className="box-footer text-right">
              <nav aria-label="...">
                <ul className="pagination">
                  <li className="page-item disabled">
                    <a className="page-link" href="#">Previous</a>
                  </li>
                  <li className="page-item active"><a className="page-link" href="#">1</a></li>
                  <li className="page-item">
                    <a className="page-link" href="#">2</a>
                  </li>
                  <li className="page-item"><a className="page-link" href="#">3</a></li>
                  <li className="page-item">
                    <a className="page-link" href="#">Next</a>
                  </li>
                </ul>
              </nav>
            </div>
            {
              loading &&
                <div className="overlay">
                  <i className="fa fa-spinner fa-spin text-purple"/>
                </div>
            }
          </div>
        </section>
      </AppContainer>
    );
  }
}

const mapStateToProps = (state: { users: IUsersState }) => {
  return {
    users: state.users
  };
};

// const mapDispatchToProps = (dispatch: Dispatch<UserReduxAction> ) => {
const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    getUsersAction: () => dispatch(getUsersAction())
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(UsersListView);

