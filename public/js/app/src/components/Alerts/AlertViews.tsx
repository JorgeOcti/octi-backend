///<reference path="../../../node_modules/sweetalert/typings/sweetalert.d.ts"/>
import * as PropTypes from 'prop-types';
import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import {IAlert} from '../../../../../../src/interfaces/alert.interface';
import {AlertReduxAction, createAlertAction, deleteAlertAction, getAlertsAction, IAlertsState} from '../../actions/alerts';
import {loadDataAction, ModalReduxAction} from '../../actions/modal';
import AppContainer from '../../container/AppContainer';
import {statusFooterButttonsModal} from '../../utils/common';
import ModalView from '../Modal/ModalView';
import AlertFormView from './AlertFormView';
// import {IWindow} from '../../interfaces/window';

// declare let window: IWindow;

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  alerts: IAlertsState;
  dispatch: Dispatch<AlertReduxAction>;
  loadDataAction(title: string, body: JSX.Element, footer: JSX.Element): ModalReduxAction;
  getAlertsAction(): ModalReduxAction;

  deleteAlertAction(id: string): ModalReduxAction;
  createAlertAction(alert: ITempAlert): ModalReduxAction;
}

interface ITempAlert {
  name: string;
  gte: number;
  lte: number;
  users: string[];
  type: string;
}

interface IStateType {
  error: Error | null;
  tempAlert: ITempAlert;
}

class AlertViews extends React.Component<IPropsType, IStateType> {

  static propTypes = {
    alerts: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired
  };

  state = {
    error: null,
    tempAlert: {
      name: '',
      type: 'gte',
      gte: 0,
      lte: 0,
      users: []
    }
  };

  constructor(props: IPropsType) {
    super(props);
    this.changeTempAlert = this.changeTempAlert.bind(this);

    this.addAlert = this.addAlert.bind(this);
    this.processAddAlert = this.processAddAlert.bind(this);

    this.deleteAlert = this.deleteAlert.bind(this);
  }

  public componentWillMount() {
    this.props.getAlertsAction();
    // set the title of the page
    document.title = 'OSA Andes | Listado de alertas';
  }

  public componentWillUnmount() {
    // cancel request if component is inmounted
    if (this.props.alerts.source) {
      this.props.alerts.source.cancel('Operation canceled by the user.');
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public render(): React.ReactElement<IPropsType> {
    const {alerts, loading} = this.props.alerts;
    return (
      <AppContainer title="" cMenu="2" cSubMenu="2.1">
        <section className="content">
          <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">Alertas <small>{alerts.length}</small></h3>
              <div className="pull-right box-tools">
                <button className="btn btn-sm btn-success" onClick={this.addAlert}>Agregar</button>
              </div>
            </div>
            <div className="box-body">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th style={{width: '20%'}} className="middle">Nombre</th>
                    <th style={{width: '20%'}} className="middle text-center">Menor igual que</th>
                    <th style={{width: '20%'}} className="middle text-center">Mayor igual que</th>
                    <th style={{width: '40%'}} className="middle">Usuarios</th>
                    {/*<th className="width-10" />*/}
                    <th className="middle width-10" />
                  </tr>
                </thead>
                <tbody>
                {
                  alerts.length ?
                    alerts.map((alert) => {
                      return (
                        <tr key={alert._id} id={`alert-${alert._id}`}>
                          <td className="middle">{alert.name}</td>
                          <td className="middle text-center">{alert.lte !== 0 ? alert.lte : '-'}</td>
                          <td className="middle text-center">{alert.gte !== 0 ? alert.gte : '-'}</td>
                          <td>
                            {
                              alert.users.map((user) => {
                                return (
                                  <p key={user._id} style={{margin: 0}}>{`${user.firstName} ${user.lastName} <${user.email}>`}</p>
                                );
                              })
                            }
                          </td>
                          {/*<td className="text-blue pointer" onClick={undefined}><i className="fa fa-pencil"/></td>*/}
                          <td className="text-red pointer" onClick={() => this.deleteAlert(alert)}><i className="fa fa-minus-circle"/></td>
                        </tr>
                      );
                    }) : <tr>
                      <td colSpan={5}>Aún no se han ingresado alertas</td>
                    </tr>
                }
                </tbody>
              </table>
            </div>
            {
              loading &&
                <div className="overlay">
                  <i className="fa fa-spinner fa-spin text-purple"/>
                </div>
            }
          </div>
          <ModalView />
        </section>
      </AppContainer>
    );
  }

  private deleteAlert(alert: IAlert) {
    // ask if you are sure that you are going to delete the alert?
    swal({
      title: '¿Estás seguro?',
      text: `Vas a eliminar la alerta ${alert.name}`,
      icon: 'warning',
      dangerMode: true,
      buttons: {
        cancel: 'Cancelar' as any,
        confirm: {
          text: 'Sí'
        }
      }
    }).then((willDelete) => {
      if (willDelete) {
        this.props.deleteAlertAction(alert._id);
      }
    });
  }

  private addAlert() {
    const {users} = this.props.alerts;
    this.props.loadDataAction(
      'Agregar Alerta',
        <AlertFormView users={users} changeTempAlert={this.changeTempAlert} />
      ,
      <React.Fragment>
        <button type="button" className="btn btn-default" data-dismiss="modal">Cancelar</button>
        <button type="button" className="btn btn-primary" onClick={this.processAddAlert}>Grabar</button>
      </React.Fragment>
    );
  }

  private changeTempAlert(tempAlert: ITempAlert) {
    this.setState({
      tempAlert
    });
  }

  private processAddAlert() {
    const {tempAlert} = this.state;
    const value = (tempAlert as any)[tempAlert.type];
    if (tempAlert.name.trim().length === 0) {
      swal('Agregar alerta', 'El campo nombre es requerido.', 'error');
    } else if (tempAlert.users.length === 0) {
      swal('Agregar alerta', 'Debe seleccionar al menos un usuario para notificar.', 'error');
    } else if (!value || value === 0) {
      swal('Agregar alerta', 'El valor para notificar debe ser entre 1 y 100.', 'error');
    } else {
      statusFooterButttonsModal(true);
      this.props.createAlertAction(tempAlert);
      // console.log('tempAlert', tempAlert);
    }
  }
}

const mapStateToProps = (state: { alerts: IAlertsState }) => {
  return {
    alerts: state.alerts
  };
};

const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    loadDataAction: (title: string, body: JSX.Element, footer: JSX.Element) => dispatch(loadDataAction(title, body, footer)),
    getAlertsAction: () => dispatch(getAlertsAction()),
    deleteAlertAction: (id: string) => dispatch(deleteAlertAction(id)),
    createAlertAction: (alert: ITempAlert) => dispatch(createAlertAction(alert))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(AlertViews);
