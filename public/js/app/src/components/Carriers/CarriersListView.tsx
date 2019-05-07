import * as moment from 'moment';
import * as Raven from 'raven-js';
import {ErrorInfo} from 'react';
import * as React from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import * as swal from 'sweetalert';
import {
  IBaseCarrier, ICarrier
} from '../../../../../../src/interfaces/carrier.interface';
import {
  CarrierReduxAction,
  changeTempCarrierAction,
  createCarrierAction, deleteCarrierAction,
  getCarriersAction,
  ICarriersState,
  updateCarrierAction
} from '../../actions/carriers.actions';
import {loadDataAction, ModalReduxAction} from '../../actions/modal.actions';
import AppContainer from '../../container/AppContainer';
import {IWindow} from '../../interfaces/window';
import {hasPermission} from '../../utils/common';
import ModalView from '../Modal/ModalView';
import Paginator from '../Utils/Paginator';
import CarriersFormView from './CarriersFormView';

interface IPropsType extends RouteComponentProps<{ carrier: string }> {
  dispatch: Dispatch<CarrierReduxAction>;
  carriers: ICarriersState;

  createCarrierAction(): CarrierReduxAction;
  updateCarrierAction(): CarrierReduxAction;

  deleteCarrierAction(id: string): CarrierReduxAction;
  changeTempCarrierAction(carrier: IBaseCarrier, delay?: boolean): CarrierReduxAction;
  getCarriersAction(page: number): CarrierReduxAction;
  loadDataAction(title: string, body: JSX.Element, footer: JSX.Element): ModalReduxAction;
}

interface IStateType {
  error: Error | null;
}

declare let window: IWindow;

class CarriersListView extends React.Component<IPropsType, IStateType> {

  constructor(props: IPropsType) {
    super(props);
    this.createCarrier = this.createCarrier.bind(this);
    this.processCreateCarrier = this.processCreateCarrier.bind(this);
    this.updateCarrier = this.updateCarrier.bind(this);
    this.processUpdateCarrier = this.processUpdateCarrier.bind(this);
    this.deleteCarrier = this.deleteCarrier.bind(this);
  }

  public componentWillMount(): void {
    const {pagination} = this.props.carriers;
    // set the title of the page
    document.title = 'OSA Andes | Listado de transportistas';
    this.props.getCarriersAction(pagination.page);
  }

  public componentWillUnmount(): void {
    // cancel request if component is inmounted
    if (this.props.carriers.source) {
      this.props.carriers.source.cancel('Operation canceled by the user.');
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public render(): React.ReactElement<IPropsType> {
    const {loading, carriers, pagination} = this.props.carriers;
    return (
      <AppContainer title="" cMenu="10" cSubMenu="10.6" cAction="Listado">
        <section className="content">
          <div className="box">
            <div className="box-header with-border"><h3 className="box-title">Transportistas <small>{pagination.count}</small></h3>
              {
                hasPermission(window.user, 'addCarrier') ?
                  <div className="box-tools pull-right">
                    <button className="btn btn-sm btn-success" onClick={this.createCarrier}>Agregar</button>
                  </div>
                  : null
              }
            </div>
            <div className="box-body no-padding">
              <table className="table table-andes table-striped">
                <thead>
                  <tr>
                    <th style={{width: '60%'}} className="middle">Nombre</th>
                    <th style={{width: '20%'}} className="middle hidden-xs">Modificado</th>
                    {
                      hasPermission(window.user, 'changeCarrier') ?
                        <th style={{width: '1%'}} className="width-10"/> : null
                    }
                    {
                      hasPermission(window.user, 'deleteCarrier') ?
                        <th style={{width: '1%'}} className="width-10"/> : null
                    }
                  </tr>
                </thead>
                <tbody>
                  {
                    carriers.map((carrier: ICarrier) => {
                      return (
                        <tr
                          key={carrier._id}
                          id={`carrier-${carrier._id}`}
                          className={'background-transition'}
                        >
                          <td className="middle">{carrier.name}</td>
                          <td className="middle hidden-xs">{moment(carrier.updatedAt).format('LLL')}</td>
                          {
                            hasPermission(window.user, 'changeCarrier') ?
                              <td
                                className="middle text-blue pointer"
                                onClick={() => this.updateCarrier(carrier)}
                              >
                                <i className="fa fa-pencil"/>
                              </td> : null
                          }
                          {
                            hasPermission(window.user, 'deleteCarrier') ?
                              <td
                                className={'middle text-red pointer'}
                                onClick={() => this.deleteCarrier(carrier)}
                              ><i className="fa fa-minus-circle"/></td> : null
                          }
                        </tr>
                      );
                    })
                  }
                </tbody>
              </table>
            </div>
            {
              pagination.pages > 1 &&
                <div className="box-footer text-right">
                  <Paginator changePage={this.props.getCarriersAction} page={pagination.page} pages={pagination.pages} />
                </div>
            }
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

  private createCarrier(): void {
    this.props.changeTempCarrierAction({
      _id: '',
      name: ''
    });
    this.props.loadDataAction(
      'Agregar Transportista',
      <CarriersFormView/>,
      <React.Fragment>
        <button type="button" className="btn btn-sm btn-default" data-dismiss="modal">Cancelar</button>
        <button type="button" className="btn btn-sm btn-primary" onClick={this.processCreateCarrier}>Grabar</button>
      </React.Fragment>
    );
  }

  private processCreateCarrier(): void {
    const {tempCarrier} = this.props.carriers;
    if (!tempCarrier.name || !tempCarrier.name.trim()) {
      swal('Agregar Transportista', 'El nombres es requerido', 'error');
    } else {
      this.props.createCarrierAction();
    }
  }

  private updateCarrier(carrier: ICarrier): void {
    const {_id, name} = carrier;
    this.props.changeTempCarrierAction({_id, name});
    this.props.loadDataAction(
      'Editar Transportista',
      <CarriersFormView update={true}/>,
      <React.Fragment>
        <button type="button" className="btn btn-sm btn-default" data-dismiss="modal">Cancelar</button>
        <button type="button" className="btn btn-sm btn-primary" onClick={this.processUpdateCarrier}>Editar</button>
      </React.Fragment>
    );
  }

  private processUpdateCarrier(): void {
    const {tempCarrier} = this.props.carriers;
    if (!tempCarrier.name || !tempCarrier.name.trim()) {
      swal('Editar Transportista', 'El nombres es requerido', 'error');
    } else {
      this.props.updateCarrierAction();
    }
  }

  private deleteCarrier(carrier: ICarrier): void {
     // ask if you are sure that you are going to delete the user?
    swal({
      title: '¿Estás seguro?',
      text: `Vas a eliminar al transportista ${carrier.name} `,
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
        this.props.deleteCarrierAction(carrier._id);
      }
    });
  }
}

const mapStateToProps = (state: { carriers: ICarriersState }) => {
  return {
    carriers: state.carriers
  };
};

const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    getCarriersAction: (page: number) => dispatch(getCarriersAction(page)),
    createCarrierAction: () => dispatch(createCarrierAction()),
    updateCarrierAction: () => dispatch(updateCarrierAction()),
    deleteCarrierAction: (id: string) => dispatch(deleteCarrierAction(id)),
    changeTempCarrierAction: (carrier: IBaseCarrier, delay?: boolean) => dispatch(changeTempCarrierAction(carrier, delay)),
    loadDataAction: (title: string, body: JSX.Element, footer: JSX.Element) => dispatch(loadDataAction(title, body, footer))
  };
};

export default connect<{carriers: ICarriersState}, {dispatch: any}, IPropsType>(mapStateToProps, mapDispatchToProps)(CarriersListView);
