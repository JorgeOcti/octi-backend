import * as React from 'react';
import { ErrorInfo } from 'react';
import { IWindow } from '../../interfaces/window';
import { RouteComponentProps } from 'react-router';
import { Dispatch } from 'redux';
import {
  createIntegrationAction,
  deleteIntegrationAction,
  getUsersAction,
  IUsersState,
  updateIntegrationAction,
  UserReduxAction
} from '../../actions/users.actions';
import { connect } from 'react-redux';
import * as Raven from 'raven-js';
import AppContainer from '../../container/AppContainer';
import { loadDataAction, ModalReduxAction } from '../../actions/modal.actions';
import { IUser } from '../../../../../../src/app/interfaces/user.interface';
import IntegrationFormView from './IntegrationFormView';
import { submit } from 'redux-form';
import ModalView from '../Modal/ModalView';
import Paginator from '../Utils/Paginator';
import * as swal from 'sweetalert';
import CopyText from '../Utils/CopyText';
import { Socket } from 'socket.io-client/build/esm/socket';
import { io } from 'socket.io-client';
import { UserTypes } from '../../../../../../src/app/models/user.model.types';

interface IPropsType extends RouteComponentProps<{}> {
  dispatch: Dispatch<UserReduxAction>;
  users: IUsersState;

  submitForm(form: string): UserReduxAction;
  createIntegrationAction(user: any): UserReduxAction;
  deleteIntegrationAction(id: string): UserReduxAction;
  updateIntegrationAction(user: any): UserReduxAction;
  getUsersAction(nextPage: number, type: UserTypes, search?: string): UserReduxAction;
  loadDataAction(title: string, body: JSX.Element, footer: JSX.Element): ModalReduxAction;
}
interface IStateType {
  error: Error | null;
}
declare let window: IWindow;

class IntegrationListView extends React.Component<IPropsType, IStateType> {
  readonly state = {
    error: null
  };

  private socket: Socket;

  constructor(props: IPropsType) {
    super(props);
    this.showToken = this.showToken.bind(this);
    this.createIntegration = this.createIntegration.bind(this);
    this.updateIntegration = this.updateIntegration.bind(this);
    this.deleteIntegration = this.deleteIntegration.bind(this);
    this.changePage = this.changePage.bind(this);
  }

  public componentWillMount(): void {
    const {pagination} = this.props.users;
    // set the title of the page
    document.title = 'Listado de integraciones | OSA Andes';
    this.props.getUsersAction(1, UserTypes.integration);

    // socket
    this.socket = io(`${location.protocol}//${location.host}`, {
      secure: location.protocol === 'https:',
      transports: ['websocket'],
      reconnection: true,
      query: {
        token: (window.user as any).token
      }
    });
    this.socket.on('connect', () => {
      this.socket.emit('join', {room: `integration-list-${window.user.team}`});
    });
    this.socket.on('REFRESH', (data: any): void => {
      if (data.update && data.updatedBy !== window.user._id) {
        const {pagination} = this.props.users;
        this.props.getUsersAction(pagination.page, UserTypes.integration);
      }
    });
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public render(): React.ReactElement<IPropsType> {
    const {users, loading, pagination} = this.props.users;
    return (
      <AppContainer title="" cMenu="200" cSubMenu="200.1" cAction="Listado">
        <section className="content">
          <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">Integraciones <small>{pagination.count}</small></h3>
              <div className="box-tools pull-right">
                <button
                  className="btn btn-sm btn-success"
                  onClick={this.createIntegration}
                >
                  Agregar
                </button>
              </div>
            </div>
            <div className="box-body no-padding">
              <table className="table table-andes table-striped">
                <thead>
                  <tr>
                    <th className="middle" style={{width: '25%'}}>Nombre</th>
                    <th className="middle" style={{width: '25%'}}>Empresa</th>
                    <th className="middle" style={{width: '40%'}}>Token</th>
                    <th className="middle-center" style={{width: '7%'}}>Estado</th>
                    <th style={{width: '1%'}} className="width-10"/>
                    <th style={{width: '1%'}} className="width-10"/>
                    <th style={{width: '1%'}} className="width-10"/>
                  </tr>
                </thead>
                <tbody>
                  {
                    !loading && users.length === 0 && users ? <tr>
                      <td colSpan={6}>No se han encontrado resultados.</td>
                    </tr> : null
                  }
                  {
                    users.map((user: IUser) => {
                      return (
                        <tr
                          key={user._id}
                          id={`user-${user._id}`}
                          className={'background-transition'}
                        >
                          <td className="middle">{user.firstName}</td>
                          <td className="middle">{user.company?.name}</td>
                          <td className="middle">••••••••••••••••••••• <button
                            onClick={()=> this.showToken(user)}
                            className={"btn btn-xs btn-default"}
                          >
                            <i className="fa fa fa-eye" /></button>
                          </td>
                          <td className="middle-center">
                            <i className="fa fa-check-circle text-green" />
                          </td>
                          <td
                            className="middle-center pointer"
                            onClick={()=> this.updateIntegration(user)}
                          >
                            <i className="fa fa-pencil text-blue"/>
                          </td>
                          <td
                            className="middle-center pointer"
                            onClick={() => this.deleteIntegration(user)}
                          >
                            <i className="fa fa-minus-circle text-red"/>
                          </td>
                        </tr>
                      )
                    })
                  }
                </tbody>
              </table>
            </div>
            {
              pagination.pages > 1 &&
              <div className="box-footer text-right">
                <Paginator changePage={this.changePage} page={pagination.page} pages={pagination.pages}/>
              </div>
            }
            {
              loading &&
              <div className="overlay">
                <i className="fa fa-spinner fa-spin text-purple"/>
              </div>
            }
          </div>
          <ModalView/>
        </section>
      </AppContainer>
    )
  }

  private showToken(user: IUser): void {
    this.props.loadDataAction(
      `Token de ${user.firstName} `,
      <div className="row">
        <div className="col-md-12">
          <p
            style={{
              wordBreak: "break-all"
            }}
          ><CopyText value={user.token}><strong>Token:</strong> {user.token}</CopyText></p>
        </div>
      </div>,
      <React.Fragment>
        <button type="button" className="btn btn-sm btn-default" data-dismiss="modal">Cerrar</button>
      </React.Fragment>
    );
  }

  private createIntegration(): void {
    this.props.loadDataAction(
      'Agregar Integración',
      <IntegrationFormView onSubmit={this.props.createIntegrationAction}/>,
      <React.Fragment>
        <button type="button" className="btn btn-sm btn-default" data-dismiss="modal">Cancelar</button>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={() => this.props.submitForm("integrationForm")}
        >
          Grabar
        </button>
      </React.Fragment>
    );
  }

  private updateIntegration(user: IUser): void {
    this.props.loadDataAction(
      `Editando ${user.firstName} `,
      <IntegrationFormView
        onSubmit={this.props.updateIntegrationAction}
        initialValues={{
          _id: user._id,
          firstName: user.firstName,
          company: user.company?._id
        }}
      />,
      <React.Fragment>
        <button type="button" className="btn btn-sm btn-default" data-dismiss="modal">Cancelar</button>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={() => this.props.submitForm("integrationForm")}
        >
          Grabar
        </button>
      </React.Fragment>
    );
  }

  private deleteIntegration(user: IUser) {
    // ask if you are sure that you are going to delete the integration?
    swal({
      title: '¿Estás seguro?',
      text: `Vas a eliminar la integración ${user.firstName || ''}`,
      icon: 'warning',
      dangerMode: true,
      buttons: {
        cancel: 'Cancelar' as any,
        confirm: {
          text: 'Sí'
        }
      }
    }).then((willDelete: any) => {
      if (willDelete) {
        this.props.deleteIntegrationAction(user._id);
      }
    });
  }

  private changePage(page: number): void {
    // change the page
    this.props.getUsersAction(page, UserTypes.integration);
  }
}

const mapStateToProps = (state: { users: IUsersState }) => {
  return {
    users: state.users
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch,
    submitForm: (form: string) => dispatch(submit(form)),
    createIntegrationAction: (user: any) => dispatch(createIntegrationAction(user)),
    deleteIntegrationAction: (id: string) => dispatch(deleteIntegrationAction(id)),
    updateIntegrationAction: (user: IUser) => dispatch(updateIntegrationAction(user)),
    loadDataAction: (title: string, body: JSX.Element, footer: JSX.Element) => dispatch(loadDataAction(title, body, footer)),
    getUsersAction: (nextPage: number, type: UserTypes, search?: string) => dispatch(getUsersAction(nextPage, type, search)),
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(IntegrationListView);
