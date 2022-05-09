import { RouteComponentProps } from 'react-router';
import { Dispatch } from 'redux';
import TrackingBasePage from '../Utils/TrackingBasePage';
import AppContainer from '../../container/AppContainer';
import * as React from 'react';
import { ErrorInfo } from 'react';
import * as Raven from 'raven-js';
import { connect } from 'react-redux';
import {
  changeTempStudioAction,
  createStudioAction,
  deleteStudioAction,
  editStudioAction,
  getStudiosAction,
  IStatsDashboardState,
  ITempStudio,
  loadStudioUsersAction,
  StatsDashboardReducerAction
} from '../../actions/statsDashboard.actions';
import { DashboardTypesDictionary, StatsDashboardTypes } from '../../../../../../src/stats/models/studio.types';
import { IStudio } from '../../../../../../src/stats/interfaces/studio.interface';
import { hasPermission } from '../../utils/common';
import * as moment from 'moment';
import Paginator from '../Utils/Paginator';
import ModalView from '../Modal/ModalView';
import { IWindow } from '../../interfaces/window';
import { loadDataAction, ModalReduxAction } from '../../actions/modal.actions';
import * as swal from 'sweetalert';
import StudioFormView from './StudioFormView';

interface IPropsType extends RouteComponentProps<{ }> {
  dispatch: Dispatch<StatsDashboardReducerAction>;
  dashboard: IStatsDashboardState;
  getStudiosAction(type?: StatsDashboardTypes | null): void;
  loadStudioUsers(): void;
  loadDataAction(title: string, body: JSX.Element, footer: JSX.Element): ModalReduxAction;
  changeTempStudioAction(studio: ITempStudio): void;
  deleteStudio(studio: IStudio): void;
  processCreateStudio(): void;
  processEditStudio(): void;
}

interface IStateType {
  error: Error | null;
  type: StatsDashboardTypes | null;
}

declare let window: IWindow;

class DashboardStatsListView extends TrackingBasePage<IPropsType, IStateType> {
  title: string;
  state = {
    error: null,
    type: null,
  };

  constructor(props: IPropsType) {
    super(props);
    this.title = "Configuración de Studios";

    this.processEditStudio = this.processEditStudio.bind(this);
    this.createStudio = this.createStudio.bind(this);
    this.processCreateStudio = this.processCreateStudio.bind(this);
    this.deleteStudio = this.deleteStudio.bind(this);
  }

  public componentDidMount(): void {
    super.componentDidMount();
    this.props.getStudiosAction(this.state.type);
    this.props.loadStudioUsers();
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  private showStudioModal(studio?: IStudio): void {
    this.props.changeTempStudioAction(studio ?? {
      name: "",
      team: window.user.team._id,
      _id: '',
      embedURL: '',
      type: '',
      users: []
    });
    setTimeout(() => {
      this.props.loadDataAction(
        studio ? 'Editar Studio' : 'Agregar Studio',
        <StudioFormView
          changeTempStudioAction={this.props.changeTempStudioAction}
          users={this.props.dashboard.users}
          types={Object.keys(DashboardTypesDictionary).map(key => {
            return {id: key, name: DashboardTypesDictionary[key]}
          })}
          dashboard={this.props.dashboard}
        />,
        <React.Fragment>
          <button type="button" className="btn btn-sm btn-default" data-dismiss="modal">Cancelar</button>
          <button type="button" className="btn btn-sm btn-primary" onClick={studio ? this.processEditStudio : this.processCreateStudio}>Grabar</button>
        </React.Fragment>
      );
    }, 400);
  }

  public createStudio(studio: IStudio){

  }

  private processCreateStudio(): void {
    const {tempStudio} = this.props.dashboard;
    if (!tempStudio.name || !tempStudio.name.trim()) {
      swal('Agregar Studio', 'El nombres es requerido', 'error');
    } else if (!tempStudio.embedURL || !tempStudio.embedURL.trim()){
      swal('Agregar Studio', 'El URL es requerido', 'error');
    } else {
      this.props.processCreateStudio();
    }
  }

  private processEditStudio(): void {
    const {tempStudio} = this.props.dashboard;
    if (!tempStudio.name || !tempStudio.name.trim()) {
      swal('Editar Studio', 'El nombres es requerido', 'error');
    } else if (!tempStudio.embedURL || !tempStudio.embedURL.trim()){
      swal('Editar Studio', 'El URL es requerido', 'error');
    } else {
      this.props.processEditStudio();
    }
  }

  private deleteStudio(studio: IStudio) {
    swal({
      title: '¿Estás seguro?',
      text: `Vas a eliminar el Dashboard: ${studio.name || ''}`,
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
        this.props.deleteStudio(studio);
      }
    });
  }

  private changePage(page: number): void {
  }


  public render(): React.ReactElement<IPropsType> {
    const {studios, loading, pagination} = this.props.dashboard;

    return (
      <AppContainer title="" cMenu="10" cSubMenu="10.11" cAction="Listado">
        <section className="content">
          <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">Studios <small>{pagination.count}</small></h3>
              <div className="box-tools pull-right">
                {
                  hasPermission(window.user, 'addStatsDashboard') ?
                    <button className="btn btn-sm btn-success" onClick={() => this.showStudioModal()}><i className="fa fa-plus" />  Agregar</button>
                    : null
                }
              </div>
            </div>
            <div className="box-body no-padding">
              <table className="table table-andes table-striped">
                <thead>
                <tr>
                  <th style={{width: '30%'}} className="middle">Nombre</th>
                  <th style={{width: '30%'}} className="middle">Tipo</th>
                  <th style={{width: '20%'}} className="middle hidden-xs">Modificado</th>
                  {
                    hasPermission(window.user, 'changeStatsDashboard') ?
                      <th style={{width: '1%'}} className="width-10"/> : null
                  }
                  {
                    hasPermission(window.user, 'deleteStatsDashboard') ?
                      <th style={{width: '1%'}} className="width-10"/> : null
                  }
                </tr>
                </thead>
                <tbody>
                {
                  !loading && !studios.length?
                    <tr>
                      <td
                        colSpan={2 + (hasPermission(window.user, 'deleteStatsDashboard') ? 1 : 0) +( hasPermission(window.user, 'changeStatsDashboard') ? 1 : 0)}
                      >
                        No se han creado análisis estadisticos
                      </td>
                    </tr>
                    :null
                }
                {
                  studios.map((studio: IStudio) => {
                    return (
                      <tr
                        key={studio._id}
                        id={`studio-${studio._id}`}
                        className={'background-transition'}
                      >
                        <td className="middle">{studio.name}</td>
                        <td className="middle">{DashboardTypesDictionary[studio.type]}</td>
                        <td className="middle hidden-xs">{moment(studio.updatedAt).format('LLL')}</td>
                        {
                          hasPermission(window.user, 'changeStatsDashboard') ?
                            <td
                              className="middle text-blue pointer"
                              onClick={() => this.showStudioModal(studio)}
                            >
                              <i className="fa fa-pencil"/>
                            </td> : null
                        }
                        {
                          hasPermission(window.user, 'deleteStatsDashboard') ?
                            <td
                              className={'middle text-red pointer'}
                              onClick={() => this.deleteStudio(studio)}
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
      </AppContainer>)
  }
}

const mapStateToProps = (state: { statsDashboard: IStatsDashboardState }) => {
  return {
    dashboard: state.statsDashboard,
  };
};

const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    getStudiosAction: (type?: StatsDashboardTypes) => dispatch(getStudiosAction(type)),
    changeTempStudioAction: (studio: ITempStudio) => dispatch(changeTempStudioAction(studio)),
    loadDataAction: (title: string, body: JSX.Element, footer: JSX.Element) => dispatch(loadDataAction(title, body, footer)),
    deleteStudio: (studio: IStudio) => dispatch(deleteStudioAction(studio._id)),
    loadStudioUsers: () => dispatch(loadStudioUsersAction()),
    processCreateStudio: () => dispatch(createStudioAction()),
    processEditStudio: () => dispatch(editStudioAction()),
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(DashboardStatsListView);

