import * as Raven from 'raven-js';
import * as React from 'react';
import { ErrorInfo } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { Dispatch } from 'redux';
import { FormAction, submit } from 'redux-form';
import { IColor } from '../../../../../../src/app/interfaces/color.interface';
import { loadDataAction, ModalReduxAction } from '../../actions/modal.actions';
import { ColorReduxActions, IColorState } from '../../actions/color.types';
import { createColorThunkAction, deleteColorThunkAction, getColorsThunkAction, updateColorThunkAction } from '../../actions/color.actions';
import AppContainer from '../../container/AppContainer';
import { IWindow } from '../../interfaces/window';
import { hasPermission } from '../../utils/common';
import TrackingBasePage from '../Utils/TrackingBasePage';
import Paginator from '../Utils/Paginator';
import ColorForm from './ColorsFormView';
import ModalView from '../Modal/ModalView';
import * as moment from 'moment';
import * as swal from 'sweetalert';
import { io } from "socket.io-client";
import { Socket } from 'socket.io-client/build/esm/socket';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<ColorReduxActions | FormAction>;
  colors: IColorState;

  getColorThunkAction(colorType: string, nextPage: number, orderBy: string, orderType: string, hideLoading?: boolean): ColorReduxActions;

  createColorThunkAction(color: IColor): ColorReduxActions;
  updateColorThunkAction(color: IColor): ColorReduxActions;
  deleteColorThunkAction(color: IColor): ColorReduxActions;

  loadDataAction(title: string, body: JSX.Element, footer: JSX.Element): ModalReduxAction;
}

interface IStateType {
  error: Error | null;
  exporing: boolean;
}

declare let window: IWindow;

class ColorListView extends TrackingBasePage<IPropsType, IStateType> {
  private socket: Socket;

  public title: string;
  readonly state = {
    error: null,
    colorType: '',
    exporing: false
  };

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Listado Colores';
    this.changePage = this.changePage.bind(this);
    this.createColor = this.createColor.bind(this);
    this.processCreateColor = this.processCreateColor.bind(this);
    this.updateColor = this.updateColor.bind(this);
    this.processUpdateColor = this.processUpdateColor.bind(this);
    this.deleteColor = this.deleteColor.bind(this);
  }

  public componentWillMount(): void {
    const { pagination } = this.props.colors;
    const { orderBy, orderType } = this.props.colors.options;
    const { colorType } = this.state;
    this.props.getColorThunkAction(colorType, pagination.page, orderBy, orderType);

    // socket
    this.socket = io(`${location.protocol}//${location.host}`, {
      secure: location.protocol === 'https:',
      transports: ['websocket'],
      reconnection: true,
      query: { token: (window.user as any).token }
    });
    this.socket.on('connect', () => {
      this.socket.emit('join', { room: `color-list-${window.user.team._id}` });
    });
    this.socket.on('REFRESH', (data: any): void => {
      if (data.update) {
        const { pagination } = this.props.colors;
        const { orderBy, orderType } = this.props.colors.options;
        const { colorType } = this.state;
        this.props.getColorThunkAction(colorType, pagination.page, orderBy, orderType, true);
      }
    });
  }

  public componentDidUpdate(prevProps: Readonly<IPropsType>, prevState: Readonly<IStateType>, snapshot?: any): void {
    if (this.props.colors.pagination !== prevProps.colors.pagination) {
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
    if (this.props.colors.source) {
      this.props.colors.source.cancel('Operation canceled by the user.');
    }
    this.socket.disconnect();
  }

  public render(): React.ReactElement<IPropsType> {
    const { loading, colors, pagination } = this.props.colors;
    // const isDevelopment = process.env.NODE_ENV === 'development';
    const isDevelopment = false;
    const canCreate = hasPermission(window.user, 'addColor') || isDevelopment;
    const canUpdate = hasPermission(window.user, 'changeColor') || isDevelopment;
    const canDelete = hasPermission(window.user, 'deleteColor') || isDevelopment;
    return (
      <AppContainer title='' cMenu='10' cSubMenu='10.10' cAction='Colors'>
        <section className="content">
          <div className="box">
            <div className="box-header with-border"><h3 className="box-title">Colores <small>{pagination.count}</small></h3>
              {
                canCreate ?
                  <div className="box-tools pull-right">
                    <button className="btn btn-sm btn-success" onClick={this.createColor}><i className="fa fa-plus" /> Crear color</button>
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
                      canUpdate ?
                        <th style={{width: '1%'}} className="width-10"/> : null
                    }
                    {
                      canDelete ?
                        <th style={{width: '1%'}} className="width-10"/> : null
                    }
                  </tr>
                </thead>
                <tbody>
                {
                  !loading && !colors.length ?
                    <tr>
                      <td
                        colSpan={2 + (canUpdate ? 1 : 0) + (canDelete ? 1 : 0)}
                      >
                        No se han creado colores
                      </td>
                    </tr>
                    : null
                }
                {
                  colors.map((color)=>{
                    return (
                      <tr
                          key={color._id}
                          id={`color-${color._id}`}
                          className={'background-transition'}
                        >
                        <td className="middle">{color.name}</td>
                        <td className='middle hidden-xs'>{moment(color.updatedAt).format('LLL')}</td>
                        {
                          canUpdate ?
                            <td
                              className='middle text-blue pointer'
                              onClick={() => this.updateColor(color)}
                            >
                              <i className='fa fa-pencil' />
                            </td> : null
                        }
                        {
                          canDelete ?
                            <td
                              className={'middle text-red pointer'}
                              onClick={() => this.deleteColor(color)}
                            ><i className='fa fa-minus-circle' /></td> : null
                        }
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
                  <Paginator changePage={this.changePage} page={pagination.page} pages={pagination.pages} />
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

  private createColor(): void {
    this.props.loadDataAction(
      'Agregar Color',
      <ColorForm
        onSubmit={this.processCreateColor}
      />,
      <React.Fragment>
        <button type='button' className='btn btn-sm btn-default' data-dismiss='modal'>Cancelar</button>
        <button
          type='button' className='btn btn-sm btn-primary'
          onClick={() => this.props.dispatch(submit('colorForm'))}
        >
          Grabar
        </button>
      </React.Fragment>
    );
  }

  private processCreateColor(color: any){
    this.props.createColorThunkAction(color);
  }

  private updateColor(color: any): void {
    this.props.loadDataAction(
      'Editar Color',
      <ColorForm
        initialValues={color}
        onSubmit={this.processUpdateColor}
      />,
      <React.Fragment>
        <button type='button' className='btn btn-sm btn-default' data-dismiss='modal'>Cancelar</button>
        <button
          type='button' className='btn btn-sm btn-primary'
          onClick={() => this.props.dispatch(submit('colorForm'))}
        >
          Grabar
        </button>
      </React.Fragment>
    );
  }

  private processUpdateColor(color: any): void {
    this.props.updateColorThunkAction(color);
  }

  private deleteColor(color: any): void {
    swal({
      title: '¿Estás seguro?',
      text: `Vas a eliminar el color ${color.name} `,
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
        this.props.deleteColorThunkAction(color);
      }
    });
    // this.props.updateColorThunkAction(color);
  }


  private changePage(page: number): void {
    // change the page
    const { orderBy, orderType } = this.props.colors.options;
    const { colorType } = this.state;
    this.props.getColorThunkAction(colorType, page, orderBy, orderType);
  }
}

const mapStateToProps = (state: { colors: IColorState }) => {
  return {
    colors: state.colors
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch,
    getColorThunkAction: (colorType: string, nextPage: number, orderBy: string, orderType: string, hideLoading?: boolean) => dispatch(getColorsThunkAction(colorType, nextPage, orderBy, orderType, hideLoading)),
    createColorThunkAction: (color: IColor) => dispatch(createColorThunkAction(color)),
    updateColorThunkAction: (color: IColor) => dispatch(updateColorThunkAction(color)),
    deleteColorThunkAction: (color: IColor) => dispatch(deleteColorThunkAction(color)),
    loadDataAction: (title: string, body: JSX.Element, footer: JSX.Element) => dispatch(loadDataAction(title, body, footer))
  };
};

export default connect<{ colors: IColorState }, { dispatch: any }, IPropsType>(mapStateToProps, mapDispatchToProps)(ColorListView);
