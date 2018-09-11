///<reference path="../../../node_modules/sweetalert/typings/sweetalert.d.ts"/>
// import * as PropTypes from 'prop-types';
import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import {AlertReduxAction, IAlertsState} from '../../actions/alerts.action';
import {loadDataAction, ModalReduxAction} from '../../actions/modal.action';
import AppContainer from '../../container/AppContainer';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  alerts: IAlertsState;
  dispatch: Dispatch<AlertReduxAction>;
  loadDataAction(title: string, body: JSX.Element, footer: JSX.Element): ModalReduxAction;
}

interface IStateType {
  error: Error | null;
}

class InventoryListView extends React.Component<IPropsType, IStateType> {

  // static propTypes = {
  //   dispatch: PropTypes.func.isRequired
  // };

  state = {
    error: null
  };

  constructor(props: IPropsType) {
    super(props);
    this.create = this.create.bind(this);
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
      <AppContainer title="" cMenu="2" cSubMenu="2.1">
        <section className="content">
          <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">Gestión de inventarios</h3>
              <div className="pull-right box-tools">
                <button className="btn btn-sm btn-success" onClick={this.create}>Nuevo</button>
              </div>
            </div>
            <div className="box-body">
              <div className="row">
                <div className="col-md-12">
                  <div className="inventory" style={{border: '1px solid #cccccc4d', padding: '10px', marginBottom: '10px'}}>
                    <div className="row">
                      <div className="col-md-6">
                        <h4 className={'text-primary'} style={{marginTop: '3px', marginBottom: '10px'}}>Inventario de prueba</h4>
                      </div>
                      <div className="col-md-6 text-right">
                        <span className="label label-warning">En progreso</span>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-2 col-xs-12 text-muted">
                        <p style={{marginTop: '20px'}}>Creado el 4 de septiembre por Gonzalo Muñoz</p>
                      </div>
                      <div className="col-md-8">
                        <div className="row">
                          <div className="col-md-4 col-xs-4 text-center text-success" style={{borderRight: '1px solid #cccccc4d'}}>
                            <strong>Encontrados</strong>
                            <h2>10</h2>
                          </div>
                          <div className="col-md-4 col-xs-4 text-center text-danger" style={{borderRight: '1px solid #cccccc4d'}}>
                            <strong>Faltantes</strong>
                            <h2>50</h2>
                          </div>
                          <div className="col-md-4 col-xs-4 text-center text-primary">
                            <strong>Sobrantes</strong>
                            <h2>20</h2>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-2 text-right">
                        <div className="btn-group btn-group-sm" style={{marginTop: '10px'}}>
                          <button type="button" className="btn btn-default">Ver progreso</button>
                          <button type="button" className="btn btn-default dropdown-toggle" data-toggle="dropdown">
                            <span className="caret" />
                            <span className="sr-only">Toggle Dropdown</span>
                          </button>
                          <ul className="dropdown-menu pull-right" role="menu">
                            <li><a href="#">Finalizar</a></li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="inventory" style={{border: '1px solid #cccccc4d', padding: '10px', marginBottom: '10px'}}>
                    <div className="row">
                      <div className="col-md-6">
                        <h4 className={'text-primary'} style={{marginTop: '3px', marginBottom: '10px'}}>Inventario de prueba 2</h4>
                      </div>
                      <div className="col-md-6 text-right">
                        <span className="label label-success">Finalizado</span>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-2 text-muted">
                        <p style={{marginTop: '20px'}}>Creado el 1 de septiembre por Gonzalo Muñoz</p>
                      </div>
                      <div className="col-md-8">
                        <div className="row">
                          <div className="col-md-4 col-xs-4 text-center text-success" style={{borderRight: '1px solid #cccccc4d'}}>
                            <strong>Encontrados</strong>
                            <h2>20</h2>
                          </div>
                          <div className="col-md-4 col-xs-4 text-center text-danger" style={{borderRight: '1px solid #cccccc4d'}}>
                            <strong>Faltantes</strong>
                            <h2>50</h2>
                          </div>
                          <div className="col-md-4 col-xs-4 text-center text-primary">
                            <strong>Sobrantes</strong>
                            <h2>30</h2>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-2 text-right">
                        <div className="btn-group btn-group-sm" style={{marginTop: '10px'}}>
                          <button type="button" className="btn btn-default">Ver reporte</button>
                          <button type="button" className="btn btn-default dropdown-toggle" data-toggle="dropdown">
                            <span className="caret" />
                            <span className="sr-only">Toggle Dropdown</span>
                          </button>
                          <ul className="dropdown-menu pull-right" role="menu">
                            <li><a href="#">Borrar</a></li>
                          </ul>
                        </div>
                      </div>
                    </div>
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

  private create() {
    this.props.history.push('/inventory/create/');
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

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(InventoryListView);
