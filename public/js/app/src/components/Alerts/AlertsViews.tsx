///<reference path="../../../node_modules/sweetalert/typings/sweetalert.d.ts"/>
// import {AxiosError} from 'axios';
import * as PropTypes from 'prop-types';
import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import {IAlert} from '../../../../../../src/interfaces/alert.interface';
import {AlertReduxAction, deleteAlertAction, IAlertsState, loadAlertsDataAction} from '../../actions/alerts';
// import * as io from 'socket.io-client';
import {loadDataAction, ModalReduxAction} from '../../actions/modal';
import AppContainer from '../../container/AppContainer';
// import {IWindow} from '../../interfaces/window';
import ModalView from '../Modal/ModalView';

// declare let window: IWindow;

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  alerts: IAlertsState;
  dispatch: Dispatch<AlertReduxAction>;
  loadDataAction(title: string, body: JSX.Element, footer: JSX.Element): ModalReduxAction;
  loadAlertsDataAction(): ModalReduxAction;

  deleteAlertAction(id: string): ModalReduxAction;
}

interface IStateType {
  error: Error | null;
}

class AlertsViews extends React.Component<IPropsType, IStateType> {

  static propTypes = {
    alerts: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired
  };

  state = {
    error: null
  };

  constructor(props: IPropsType) {
    super(props);
    this.deleteAlert = this.deleteAlert.bind(this);
  }

  public componentWillMount() {
    this.props.loadAlertsDataAction();
    // set the title of the page
    document.title = 'OSA Andes | Alertas';
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
      <AppContainer title="" cMenu="2" cSubMenu="2.3">
        <section className="content">
          <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">Alertas</h3>
              <div className="pull-right box-tools">
                <button className="btn btn-sm btn-success">Agregar</button>
              </div>
            </div>
            <div className="box-body">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Menor igual que</th>
                    <th>Mayor igual que</th>
                    <th>Usuarios</th>
                    <th className="width-10" />
                    <th className="width-10" />
                  </tr>
                </thead>
                <tbody>
                {
                  alerts.map((alert) => {
                    return (
                      <tr key={alert._id} id={`alert-${alert._id}`}>
                        <td>{alert.name}</td>
                        <td>{alert.lte !== 0 ? alert.lte : '-'}</td>
                        <td>{alert.gte !== 0 ? alert.gte : '-'}</td>
                        <td>{alert.users.length}</td>
                        <td className="text-blue pointer" onClick={undefined}><i className="fa fa-pencil"/></td>
                        <td className="text-red pointer" onClick={() => this.deleteAlert(alert)}><i className="fa fa-minus-circle"/></td>
                      </tr>
                    );
                  })
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

  // private createAlert(){
  //
  // }
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
    loadAlertsDataAction: () => dispatch(loadAlertsDataAction()),
    deleteAlertAction: (id: string) => dispatch(deleteAlertAction(id))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(AlertsViews);
