///<reference path="../../../node_modules/sweetalert/typings/sweetalert.d.ts"/>
import * as PropTypes from 'prop-types';
import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import {AlertReduxAction, IAlertsState} from '../../actions/alerts';
import {loadDataAction, ModalReduxAction} from '../../actions/modal';
import AppContainer from '../../container/AppContainer';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  alerts: IAlertsState;
  dispatch: Dispatch<AlertReduxAction>;
  loadDataAction(title: string, body: JSX.Element, footer: JSX.Element): ModalReduxAction;
}

interface IStateType {
  error: Error | null;
}

class InventoryCreateView extends React.Component<IPropsType, IStateType> {

  static propTypes = {
    dispatch: PropTypes.func.isRequired
  };

  state = {
    error: null
  };

  constructor(props: IPropsType) {
    super(props);
  }

  public componentWillMount() {
    // this.props.getAlertsAction();
    // set the title of the page
    document.title = 'OSA Andes | Inventarios';
  }

  public componentWillUnmount() {
    // cancel request if component is inmounted
    // if (this.props.alerts.source) {
    //   this.props.alerts.source.cancel('Operation canceled by the user.');
    // }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public render(): React.ReactElement<IPropsType> {
    // const {alerts, loading} = this.props.alerts;
    return (
      <AppContainer title="" cMenu="2" cSubMenu="2.1" cAction="Creación">
        <section className="content">
          <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">Creando auditoria de inventario</h3>
            </div>
            <div className="box-body">
              <div className="row">
                <div className="col col-md-6">
                  <div className="form-group">
                    <label htmlFor="name">Nombre</label>
                    <input type="text" className="form-control" id="name" />
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col col-md-12">
                  <div className="form-group">
                    <label>Importar configuración</label>
                    <div className="upload-file text-center"
                         style={{backgroundColor: '#eee', border: '1px dashed #979797', padding: '20px', color: '#6e7a89'}}>
                      <i className="fa fa-2x fa-cloud-upload" /><br />
                      Prueba a soltanto el excel aquí, o haz clic para seleccionar el excel para cargar.
                    </div>
                  </div>
                </div>
                <div className="col-md-12 text-right">
                  <button className="btn btn-sm btn-primary">Descargar Formato</button>
                </div>
              </div>
              <div className="row">
                <div className="col col-md-6">
                  <div className="checkbox">
                    <label>
                      <input type="checkbox" defaultChecked={true} /> Enviar notificaciones push
                    </label>
                  </div>
                </div>
              </div>
            </div>
            {
              false &&
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

const mapStateToProps = (state: { alerts: IAlertsState }) => {
  return {
    alerts: state.alerts
  };
};

const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    loadDataAction: (title: string, body: JSX.Element, footer: JSX.Element) => dispatch(loadDataAction(title, body, footer))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(InventoryCreateView);
