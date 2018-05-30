///<reference path="../../../node_modules/sweetalert/typings/sweetalert.d.ts"/>
import * as PropTypes from 'prop-types';
import * as Raven from 'raven-js';
import * as React from 'react';
import * as moment from 'moment';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import AppContainer from "../../container/AppContainer";
import {
  IUsersState,
  UserReduxAction,
  getUsersAction,
  deleteUserAction
} from "../../actions/users";


interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<UserReduxAction>;
  users: IUsersState;

  getUsersAction(page?: number): UserReduxAction;
  deleteUserAction(id?: string): UserReduxAction;
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

  constructor(props: IPropsType) {
    super(props);
    this.changePage = this.changePage.bind(this);
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public componentWillUnmount(){
    // cancel request if component is inmounted
    if(this.props.users.source){
      this.props.users.source.cancel('Operation canceled by the user.');
    }
  }

  deleteUser(user: any) {
    swal({
      title: "¿Estás seguro?",
      text: `Vas a eliminar el usuario ${user.name || ''} ${user.lastName || ''}`,
      icon: "warning",
      dangerMode: true,
      buttons: (true as any),
    }).then((willDelete) => {
      if (willDelete) {
        this.props.deleteUserAction(user._id);
      }
    });
  }

  componentWillMount(){
    document.title = 'OSA Andes | Listado de usuarios';
    this.props.getUsersAction();
  }

  changePage(page:number){
    this.props.getUsersAction(page);
  }

  render() {
    const {loading, users, pagination} = this.props.users;
    return (
      <AppContainer title='' cMenu='2' cSubMenu='2.1' cAction='Listado'>
        <section className="content">
          <div className="box">
            <div className="box-header with-border"><h3 className="box-title">Usuarios <small>{pagination.count}</small></h3>
              <div className="box-tools pull-right">
                <button className="btn btn-sm btn-success">Agregar</button>
              </div>
            </div>
            <div className="box-body">
              {/*<div className="pull-right">*/}
                {/*<div className="input-group text-right max-width-300">*/}
                  {/*<input type="text" className="form-control" placeholder="Buscar"/>*/}
                  {/*<span className="input-group-addon input-group-primary"><i className="fa fa-search" /></span>*/}
                {/*</div>*/}
              {/*</div>*/}
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Apellido</th>
                    <th className="hidden-xs">Email</th>
                    <th className="hidden-xs">Modificado</th>
                    <th className="width-10" />
                    <th className="width-10" />
                  </tr>
                </thead>
                <tbody>
                  {
                    users.map((user: any) => {
                      return (
                        <tr key={user._id}>
                          <td>{user.name}</td>
                          <td>{user.lastName}</td>
                          <td className="hidden-xs">{user.email}</td>
                          <td className="hidden-xs">{moment(user.updatedAt).format('LLL')}</td>
                          <td className="text-blue pointer"><i className="fa fa-pencil"/></td>
                          <td className="text-red pointer" onClick={() => this.deleteUser(user)}><i className="fa fa-minus-circle"/></td>
                        </tr>
                      )
                    })
                  }
                </tbody>
              </table>
            </div>
            <div className="box-footer text-right">
                <ul className="pagination">
                  {/*<li className="page-item disabled">*/}
                    {/*<a className="page-link" href="#">Previous</a>*/}
                  {/*</li>*/}
                  {
                    new Array(pagination.pages).fill(1).map((item, index) => {
                      const idPagination = index + 1;
                      const onClick = idPagination !== pagination.page ? () => this.changePage(idPagination) : () => {};
                      return (
                        <li className={`page-item ${idPagination === pagination.page ? 'active' : ''}`} key={idPagination}>
                          <a className="page-link" href="javascript:void(0)" onClick={onClick}>{idPagination}</a>
                        </li>
                      )
                    })
                  }
                  {/*<li className="page-item">*/}
                    {/*<a className="page-link" href="#">Next</a>*/}
                  {/*</li>*/}
                </ul>
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
    getUsersAction: (page?: number) => dispatch(getUsersAction(page)),
    deleteUserAction: (id: string) => dispatch(deleteUserAction(id))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(UsersListView);

