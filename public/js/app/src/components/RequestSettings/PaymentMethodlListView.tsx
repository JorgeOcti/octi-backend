import * as Raven from 'raven-js';
import * as React from 'react';
import { ErrorInfo } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import { Dispatch } from 'redux';
import { FormAction, submit } from 'redux-form';
import * as swal from 'sweetalert';
import { IPaymentMethod } from '../../../../../../src/request/interfaces/paymentMethod.interface';
import { loadDataAction, ModalReduxAction } from '../../actions/modal.actions';
import { IPaymentMethodState, PaymentMethodReduxActions } from '../../actions/paymentMethod.types';
import {
  createPaymentMethodThunkAction,
  deletePaymentMethodItemThunkAction,
  getPaymentMethodThunkAction,
  updatePaymentMethodThunkAction
} from '../../actions/paymentMethod.actions';
import AppContainer from '../../container/AppContainer';
import { IWindow } from '../../interfaces/window';
import { hasPermission, showModal, statusFooterButttonsModal } from '../../utils/common';
import ModalView from '../Modal/ModalView';
import Paginator from '../Utils/Paginator';
import TrackingBasePage from '../Utils/TrackingBasePage';
import ChannelForm from './ChannelForm';
import ShowIf from '../Utils/ShowIf';
import { io } from 'socket.io-client';
import { Socket } from 'socket.io-client/build/esm/socket';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<PaymentMethodReduxActions | FormAction>;
  paymentMethod: IPaymentMethodState;

  getPaymentMethodThunkAction(nextPage: number, orderBy: string, orderType: string, hideLoading?: boolean): PaymentMethodReduxActions;
  createPaymentMethodThunkAction(paymentMethod: IPaymentMethod): PaymentMethodReduxActions;
  updatePaymentMethodThunkAction(paymentMethod: IPaymentMethod): PaymentMethodReduxActions;
  deletePaymentMethodThunkAction(paymentMethod: IPaymentMethod): PaymentMethodReduxActions;
  loadDataAction(title: string, body: JSX.Element, footer: JSX.Element): ModalReduxAction;
}

interface IStateType {
  error: Error | null;
  exporing: boolean;
}

declare let window: IWindow;

class PaymentMethodListView extends TrackingBasePage<IPropsType, IStateType> {
  title: string;

  private socket: Socket;
  readonly state = {
    error: null,
    exporing: false
  };

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Listado de Canales';
    this.changePage = this.changePage.bind(this);
    this.createPaymentMethod = this.createPaymentMethod.bind(this);
    this.processCreatePaymentMethod = this.processCreatePaymentMethod.bind(this);
    this.updateReaon = this.updateReaon.bind(this);
    this.processUpdatePaymentMethod = this.processUpdatePaymentMethod.bind(this);
    this.deletePaymentMethod = this.deletePaymentMethod.bind(this);
  }

  public componentWillMount(): void {
    const { pagination } = this.props.paymentMethod;
    const { orderBy, orderType } = this.props.paymentMethod.options;
    this.props.getPaymentMethodThunkAction(pagination.page, orderBy, orderType);

    // socket
    this.socket = io(`${location.protocol}//${location.host}`, {
      secure: location.protocol === 'https:',
      transports: ['websocket'],
      reconnection: true,
      query: { token: (window.user as any).token }
    });
    this.socket.on('connect', () => {
      this.socket.emit('join', { room: `payment-method-list-${window.user.team._id}` });
    });
    this.socket.on('REFRESH', (data: any): void => {
      if (data.update) {
        const { pagination } = this.props.paymentMethod;
        const { orderBy, orderType } = this.props.paymentMethod.options;
        this.props.getPaymentMethodThunkAction(pagination.page, orderBy, orderType, true);
      }
    });
  }


  public componentDidUpdate(prevProps: Readonly<IPropsType>, prevState: Readonly<IStateType>, snapshot?: any): void {
    if (this.props.paymentMethod.pagination !== prevProps.paymentMethod.pagination) {
      window.scrollTo(0, 0);
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error });
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public componentWillUnmount(): void {
    // cancel request if component is inmounted
    if (this.props.paymentMethod.source) {
      this.props.paymentMethod.source.cancel('Operation canceled by the user.');
    }
    this.socket.disconnect();
  }

  public render(): React.ReactElement<IPropsType> {
    const { loading, paymentMethods, pagination } = this.props.paymentMethod;
    const canEdit = hasPermission(window.user, 'adminRequest');
    const canDelete = hasPermission(window.user, 'adminRequest');
    let cols = 1;
    if(canDelete){
      cols++;
    }
    if(canEdit){
      cols++;
    }
    return (
      <AppContainer title="" cMenu="3" cSubMenu="3.3" cAction="Métodos de pago">
        <section className="content">
          <div className="row">
            <div className="col-md-3">
              <div className="list-group">
                <Link to="/requests/settings/reasons/" className="list-group-item">
                  Motivos
                </Link>
                <Link to="/requests/settings/channels/" className="list-group-item">
                  Canales
                </Link>
                <Link to="/requests/settings/status/" className="list-group-item ">
                  Estados
                </Link>
                <Link to="/requests/settings/operations-type/" className="list-group-item ">
                  Tipos de operación
                </Link>
                <Link to="/requests/settings/payment-methods/" className="list-group-item active">
                  Métodos de pago
                </Link>
                <ShowIf condition={window.user.isAdmin}>
                  <Link to='/transmittals/settings/milestone-type/' className='list-group-item'>
                    Tipos de hitos
                  </Link>
                </ShowIf>
                <ShowIf condition={window.user.isAdmin}>
                  <Link to='/transmittals/settings/milestone/' className='list-group-item'>
                    Hitos
                  </Link>
                </ShowIf>
              </div>
            </div>
            <div className="col-md-9">
              <div className="box">
                <div className="box-header with-border">
                  <h3 className="box-title">Métodos de pago <small>{pagination.count}</small></h3>
                  <div className="box-tools pull-right">
                    {
                      hasPermission(window.user, 'addVenue') ?
                        <button className="btn btn-sm btn-success"
                          onClick={this.createPaymentMethod}
                        ><i className="fa fa-plus" />  Crear hito</button>
                        : null
                    }
                  </div>
                </div>
                <div className="box-body table-responsive no-padding">
                  <table className="table table-andes table-striped">
                    <thead>
                      <tr>
                        <th style={{ width: '98%' }} className="middle">Nombre</th>
                        {
                          canEdit ?
                            <th style={{ width: '1%' }} className="width-10" /> : null
                        }
                        {
                          canDelete ?
                            <th style={{ width: '1%' }} className="width-10" /> : null
                        }
                      </tr>
                    </thead>
                    <tbody>
                      <ShowIf condition={!paymentMethods.length}>
                        <tr>
                          <td colSpan={cols}>No se han creado métodos de pago.</td>
                        </tr>
                      </ShowIf>
                      {
                        paymentMethods.map((item) => {
                          return (
                            <tr key={item._id}>
                              <td className="middle"><strong className='text-primary'>{item.name}</strong></td>
                              {
                                canEdit ?
                                  <td
                                    className="middle text-blue pointer"
                                    onClick={() => this.updateReaon(item)}
                                  >
                                    <i className="fa fa-pencil" />
                                  </td> : null
                              }
                              {
                                canDelete ?
                                  <td
                                    className={canDelete ? 'middle text-red pointer' : 'middle text-muted not-allowed'}
                                    // className={'middle text-red pointer'}
                                    onClick={canDelete ? () => this.deletePaymentMethod(item) : undefined}
                                  >
                                    <i className="fa fa-minus-circle" />
                                  </td> : null
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
                    <Paginator changePage={this.changePage} page={pagination.page} pages={pagination.pages} />
                  </div>
                }
                {
                  loading &&
                  <div className="overlay">
                    <i className="fa fa-spinner fa-spin text-purple" />
                  </div>
                }
              </div>
            </div>
          </div>
          <ModalView />
        </section>
      </AppContainer>
    );
  }

  private createPaymentMethod(): void {
    this.props.loadDataAction(
      'Agregar método de pago',
      <ChannelForm
        initialValues={{ update: false }}
        onSubmit={this.processCreatePaymentMethod}
      />,
      <React.Fragment>
        <button type="button" className="btn btn-sm btn-default" data-dismiss="modal">Cancelar</button>
        <button type="button" className="btn btn-sm btn-primary" onClick={() => this.props.dispatch(submit('channelForm'))}>Grabar</button>
      </React.Fragment>
    );
  }

  private processCreatePaymentMethod(paymentMethod: any): void {
    statusFooterButttonsModal(true);
    this.props.createPaymentMethodThunkAction(paymentMethod);
    statusFooterButttonsModal(false);
    showModal(false);
  }

  private updateReaon(reason: any): void {
    this.props.loadDataAction(
      'Editar método de pago',
      <ChannelForm
        initialValues={{ update: false, ...reason }}
        onSubmit={this.processUpdatePaymentMethod}
      />,
      <React.Fragment>
        <button type="button" className="btn btn-sm btn-default" data-dismiss="modal">Cancelar</button>
        <button type="button" className="btn btn-sm btn-primary" onClick={() => this.props.dispatch(submit('channelForm'))}>Editar</button>
      </React.Fragment>
    );
  }

  private processUpdatePaymentMethod(paymentMethod: any): void {
    statusFooterButttonsModal(true);
    this.props.updatePaymentMethodThunkAction(paymentMethod);
    statusFooterButttonsModal(false);
    showModal(false);
  }

  private deletePaymentMethod(paymentMethod: IPaymentMethod): void {
    // ask if you are sure that you are going to delete the user?
    swal({
      title: '¿Estás seguro?',
      text: `Vas a eliminar el canal: ${paymentMethod.name} `,
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
        this.props.deletePaymentMethodThunkAction(paymentMethod);
      }
    });
  }

  private changePage(page: number): void {
    // change the page
    const { orderBy, orderType } = this.props.paymentMethod.options;
    this.props.getPaymentMethodThunkAction(page, orderBy, orderType);
  }
}

const mapStateToProps = (state: { paymentMethod: IPaymentMethodState }) => {
  return {
    paymentMethod: state.paymentMethod
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch,
    getPaymentMethodThunkAction: (nextPage: number, orderBy: string, orderType: string, hideLoading?: boolean) => dispatch(getPaymentMethodThunkAction(nextPage, orderBy, orderType, hideLoading)),
    createPaymentMethodThunkAction: (paymentMethod: IPaymentMethod) => dispatch(createPaymentMethodThunkAction(paymentMethod)),
    updatePaymentMethodThunkAction: (paymentMethod: IPaymentMethod) => dispatch(updatePaymentMethodThunkAction(paymentMethod)),
    deletePaymentMethodThunkAction: (paymentMethod: IPaymentMethod) => dispatch(deletePaymentMethodItemThunkAction(paymentMethod)),
    loadDataAction: (title: string, body: JSX.Element, footer: JSX.Element) => dispatch(loadDataAction(title, body, footer))
  };
};

export default connect<{ paymentMethod: IPaymentMethodState }, { dispatch: any }, IPropsType>(mapStateToProps, mapDispatchToProps)(PaymentMethodListView);
