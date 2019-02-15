///<reference path="../../../node_modules/sweetalert/typings/sweetalert.d.ts"/>
import * as moment from 'moment';
import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import * as io from 'socket.io-client';
import {
  deleteInventoryAction,
  finishInventoryAction,
  getInventoriesAction,
  IInventoryState,
  InventoryReduxAction
} from '../../actions/inventory.actions';
import AppContainer from '../../container/AppContainer';
import {IWindow} from '../../interfaces/window';
import Row from '../Utils/Row';
import {hasPermission} from "../../utils/common";

declare let window: IWindow;

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  inventories: IInventoryState;
  dispatch: Dispatch<InventoryReduxAction>;
  getInventoriesAction(loading: boolean): void;
  finishInventoryAction(id: string): void;
  deleteInventoryAction(id: string): void;
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
  private socket: SocketIOClient.Socket;

  constructor(props: IPropsType) {
    super(props);
    this.create = this.create.bind(this);
    this.labelStatus = this.labelStatus.bind(this);
    this.finishInventoryAction = this.finishInventoryAction.bind(this);
    this.deleteInventoryAction = this.deleteInventoryAction.bind(this);
    this.goToDetail = this.goToDetail.bind(this);
  }

  public componentWillMount(): void {
    // set the title of the page
    document.title = 'OSA Andes | Inventarios';
    window.scrollTo(0, 0);

    // get data
    this.props.getInventoriesAction(true);

    // socket
    this.socket = io.connect(`${location.protocol}//${location.host}`, {
      secure: location.protocol === 'https:',
      reconnection: true,
      query: {token: (window.user as any).token}
    });
    this.socket.on('connect', () => {
      this.socket.emit('join', {room: `inventory-list-${window.user.team}`});
    });
    this.socket.on('REFRESH', (data: any): void => {
      if (data.update) {
        this.props.getInventoriesAction(false);
      }
    });
  }

  public componentDidMount(): void {
    window.scrollTo(0, 0);
  }

  public componentWillUnmount(): void {
    // cancel request if component is inmounted
    if (this.props.inventories.source) {
      this.props.inventories.source.cancel('Operation canceled by the user.');
    }
    this.socket.disconnect();
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public render(): React.ReactElement<IPropsType> {
    const {inventories, loading} = this.props.inventories;
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
              <Row>
                <div className="col-md-12">
                  {
                    !inventories.length && !loading ? 'Aún no se han creado inventarios.' : null
                  }
                  {
                    inventories.map((inventory: any) => {
                      return (
                        <div className="inventory" key={inventory._id} id={`inventory-${inventory._id}`}>
                          <Row>
                            <div className="col-md-8 col-xs-8">
                              <h4 className="text-primary pointer" onClick={() => this.goToDetail(inventory._id)}>{inventory.name}</h4>
                            </div>
                            <div className="col-md-4 col-xs-4 text-right">
                              {this.labelStatus(inventory.status)}
                            </div>
                          </Row>
                          <Row>
                            <div className="col-lg-3 col-md-4 col-xs-12 text-muted text-detail-user">
                              <p>
                                <i className="fa fa-fw fa-clock-o text-success"/>Creado el {moment(inventory.createdAt).format('LLL')}<br/>
                                {
                                  inventory.createdBy ?
                                    <React.Fragment><i className="fa fa-fw fa-user"/>Por {inventory.createdBy.fullName}<br/></React.Fragment>
                                    : null
                                }
                                {
                                  inventory.finalizedAt ?
                                    <React.Fragment>
                                      <i className="fa fa-fw fa-clock-o text-danger"/>Finalizado el {moment(inventory.finalizedAt).format('LLL')}<br/>
                                      {inventory.finalizedBy ? <React.Fragment><i className="fa fa-fw fa-user"/>Por {inventory.finalizedBy.fullName}</React.Fragment> : null}
                                    </React.Fragment>
                                    : null
                                }
                              </p>
                            </div>
                            <div className="col-lg-7 col-md-8">
                              <div className="row right-border">
                                <div className="col-md-5th-1 col-xs-3 text-center text-green">
                                  <strong style={{fontSize: '80%'}}>Encontrados</strong>
                                  <h2 style={{marginTop: '10px'}}>{inventory.results.found}</h2>
                                </div>
                                <div className="col-md-5th-1 col-xs-3 text-center text-yellow">
                                  <strong style={{fontSize: '80%'}}>Sobrantes</strong>
                                  <h2 style={{marginTop: '10px'}}>{inventory.results.leftover}</h2>
                                </div>
                                <div className="col-md-5th-1 col-xs-3 text-center text-red">
                                  <strong style={{fontSize: '80%'}}>Faltantes</strong>
                                  <h2 style={{marginTop: '10px'}}>{inventory.results.missing}</h2>
                                </div>
                                <div className="col-md-5th-1 col-xs-3 text-center text-aqua no-right-border-mobile">
                                  <strong style={{fontSize: '80%'}}>Pendientes</strong>
                                  <h2 style={{marginTop: '10px'}}>{inventory.results.pending}</h2>
                                </div>
                                <div className="col-md-5th-1 text-center text-muted hidden-xs hidden-sm">
                                  <strong style={{fontSize: '80%'}}>Reportados</strong>
                                  <h2 style={{marginTop: '10px'}}>{inventory.results.reported}</h2>
                                </div>
                              </div>
                            </div>
                            <div className="col-lg-2 col-md-12 text-right">
                              <div className="btn-group btn-group-sm">
                                {
                                  inventory.status === 'inProcess' ?
                                    <button type="button" className="btn btn-default" onClick={() => this.goToDetail(inventory._id)}>
                                      <i className="fa fa-fw fa-area-chart"/> Ver Progreso
                                    </button>
                                    :
                                    <button type="button" className="btn btn-default" onClick={() => this.goToDetail(inventory._id)}>
                                      <i className="fa fa-fw fa-area-chart"/> Ver Reporte
                                    </button>
                                }
                                <button type="button" className="btn btn-default dropdown-toggle" data-toggle="dropdown">
                                  <span className="caret" />
                                  <span className="sr-only">Toggle Dropdown</span>
                                </button>
                                <ul className="dropdown-menu pull-right" role="menu">
                                  <li>
                                    <a href="javascript:void(0);" onClick={() => this.goToDetail(inventory._id, true)}>
                                      <i className="fa fa-fw fa-table" />Ver Detalle
                                    </a>
                                  </li>
                                  {
                                    inventory.status === 'inProcess' && hasPermission(window.user, 'finishInventory') ?
                                        <li>
                                          <a href="javascript:void(0);" onClick={() => this.finishInventoryAction(inventory)}>
                                            <i className="fa fa-fw fa-stop" />Finalizar
                                          </a>
                                        </li>
                                      : null
                                  }
                                  {
                                    hasPermission(window.user, 'finishInventory') ?
                                      <li>
                                        <a href="javascript:void(0);" onClick={() => this.deleteInventoryAction(inventory)}>
                                          <i className="fa fa-fw fa-close" />Eliminar
                                        </a>
                                      </li>
                                      : null
                                  }
                                </ul>
                              </div>
                            </div>
                          </Row>
                        </div>
                      );
                    })
                  }
                </div>
              </Row>
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

  private goToDetail(id: string, detail?: boolean): void {
    const {history} = this.props;
    history.push(`/inventory/${id}/${detail ? 'detail/' : ''}`);
  }

  private finishInventoryAction(inventory: any): void {
    const {finishInventoryAction} = this.props;
    // ask if you are sure that you are going to finish the inventory?
    swal({
      title: '¿Estás seguro?',
      text: `Vas a finalizar "${inventory.name}".`,
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
        finishInventoryAction(inventory._id);
      }
    });
  }

  private deleteInventoryAction(inventory: any): void {
    const {deleteInventoryAction} = this.props;
    // ask if you are sure that you are going to delete the inventory?
    swal({
      title: '¿Estás seguro?',
      text: `Vas a eliminar "${inventory.name}".`,
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
        deleteInventoryAction(inventory._id);
      }
    });
  }

  private labelStatus(option: string): React.ReactElement<IPropsType> {
    if (option === 'finalized') {
      return <span className="label label-success"><i className="fa fa-fw fa-check"/> Finalizado</span>;
    } else if (option === 'inProcess') {
      return <span className="label label-primary"><i className="fa fa-fw fa-spin fa-spinner"/> En progreso</span>;
    } else {
      return <span className="label label-warning">Pendiente</span>;
    }
  }

  private create(): void {
    this.props.history.push('/inventory/create/');
  }
}

const mapStateToProps = (state: { inventories: IInventoryState }) => {
  return {
    inventories: state.inventories
  };
};

const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    getInventoriesAction: (loading: boolean) => dispatch(getInventoriesAction(loading)),
    finishInventoryAction: (id: string) => dispatch(finishInventoryAction(id)),
    deleteInventoryAction: (id: string) => dispatch(deleteInventoryAction(id))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(InventoryListView);
