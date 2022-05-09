import * as moment from 'moment';
import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import * as swal from 'sweetalert';
import {IBaseRegion, IRegion} from '../../../../../../src/app/interfaces/region.interface';

import {loadDataAction, ModalReduxAction} from '../../actions/modal.actions';
import AppContainer from '../../container/AppContainer';
import {IWindow} from '../../interfaces/window';
import {hasPermission} from '../../utils/common';
import ModalView from '../Modal/ModalView';
import Paginator from '../Utils/Paginator';
import RegionsFormView from './RegionsFormView';
import {
  changeTempRegionAction,
  createRegionAction,
  deleteRegionAction,
  getRegionsAction,
  IRegionsState,
  RegionReduxAction,
  updateRegionAction
} from "../../actions/regions.actions";
import TrackingBasePage from "../Utils/TrackingBasePage";

interface IPropsType extends RouteComponentProps<{ region: string }> {
  dispatch: Dispatch<RegionReduxAction>;
  regions: IRegionsState;

  createRegionAction(): RegionReduxAction;
  updateRegionAction(): RegionReduxAction;

  deleteRegionAction(id: string): RegionReduxAction;
  changeTempRegionAction(region: IBaseRegion, delay?: boolean): RegionReduxAction;
  getRegionsAction(page: number): RegionReduxAction;
  loadDataAction(title: string, body: JSX.Element, footer: JSX.Element): ModalReduxAction;
}

interface IStateType {
  error: Error | null;
}

declare let window: IWindow;

class RegionsListView extends TrackingBasePage<IPropsType, IStateType> {
  title : string;


  constructor(props: IPropsType) {
    super(props);
    this.title = 'Listado de regiones';
    this.createRegion = this.createRegion.bind(this);
    this.processCreateRegion = this.processCreateRegion.bind(this);
    this.updateRegion = this.updateRegion.bind(this);
    this.processUpdateRegion = this.processUpdateRegion.bind(this);
    this.deleteRegion = this.deleteRegion.bind(this);
  }

  public componentWillMount(): void {
    const {pagination} = this.props.regions;
    this.props.getRegionsAction(pagination.page);
  }

  componentDidMount() {
    super.componentDidMount();
  }

  public componentWillUnmount(): void {
    // cancel request if component is inmounted
    if (this.props.regions.source) {
      this.props.regions.source.cancel('Operation canceled by the user.');
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public render(): React.ReactElement<IPropsType> {
    const {loading, regions, pagination} = this.props.regions;
    return (
      <AppContainer title="" cMenu="10" cSubMenu="10.9" cAction="Listado">
        <section className="content">
          <div className="box">
            <div className="box-header with-border"><h3 className="box-title">Regiones <small>{pagination.count}</small></h3>
              {
                hasPermission(window.user, 'addRegion') ?
                  <div className="box-tools pull-right">
                    <button className="btn btn-sm btn-success" onClick={this.createRegion}>Agregar</button>
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
                      hasPermission(window.user, 'changeRegion') ?
                        <th style={{width: '1%'}} className="width-10"/> : null
                    }
                    {
                      hasPermission(window.user, 'deleteRegion') ?
                        <th style={{width: '1%'}} className="width-10"/> : null
                    }
                  </tr>
                </thead>
                <tbody>
                  {
                    !loading && !regions.length?
                      <tr>
                        <td
                          colSpan={2 + (hasPermission(window.user, 'deleteRegion') ? 1 : 0) +( hasPermission(window.user, 'deleteRegion') ? 1 : 0)}
                        >
                          No se han creado regiones
                        </td>
                      </tr>
                    :null
                  }
                  {
                    regions.map((region: IRegion) => {
                      return (
                        <tr
                          key={region._id}
                          id={`region-${region._id}`}
                          className={'background-transition'}
                        >
                          <td className="middle">{region.name}</td>
                          <td className="middle hidden-xs">{moment(region.updatedAt).format('LLL')}</td>
                          {
                            hasPermission(window.user, 'changeRegion') ?
                              <td
                                className="middle text-blue pointer"
                                onClick={() => this.updateRegion(region)}
                              >
                                <i className="fa fa-pencil"/>
                              </td> : null
                          }
                          {
                            hasPermission(window.user, 'deleteRegion') ?
                              <td
                                className={'middle text-red pointer'}
                                onClick={() => this.deleteRegion(region)}
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
                  <Paginator changePage={this.props.getRegionsAction} page={pagination.page} pages={pagination.pages} />
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

  private createRegion(): void {
    this.props.changeTempRegionAction({
      _id: '',
      name: '',
      code: ''
    });
    this.props.loadDataAction(
      'Agregar Region',
      <RegionsFormView/>,
      <React.Fragment>
        <button type="button" className="btn btn-sm btn-default" data-dismiss="modal">Cancelar</button>
        <button type="button" className="btn btn-sm btn-primary" onClick={this.processCreateRegion}>Grabar</button>
      </React.Fragment>
    );
  }

  private processCreateRegion(): void {
    const {tempRegion} = this.props.regions;
    if (!tempRegion.name || !tempRegion.name.trim()) {
      swal('Agregar Region', 'El nombres es requerido', 'error');
    } else {
      this.props.createRegionAction();
    }
  }

  private updateRegion(region: IRegion): void {
    const {_id, name, code} = region;
    this.props.changeTempRegionAction({_id, name, code});
    this.props.loadDataAction(
      'Editar Region',
      <RegionsFormView update={true}/>,
      <React.Fragment>
        <button type="button" className="btn btn-sm btn-default" data-dismiss="modal">Cancelar</button>
        <button type="button" className="btn btn-sm btn-primary" onClick={this.processUpdateRegion}>Editar</button>
      </React.Fragment>
    );
  }

  private processUpdateRegion(): void {
    const {tempRegion} = this.props.regions;
    if (!tempRegion.name || !tempRegion.name.trim()) {
      swal('Editar Region', 'El nombres es requerido', 'error');
    } else {
      this.props.updateRegionAction();
    }
  }

  private deleteRegion(region: IRegion): void {
     // ask if you are sure that you are going to delete the region?
    swal({
      title: '¿Estás seguro?',
      text: `Vas a eliminar la región ${region.name} `,
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
        this.props.deleteRegionAction(region._id);
      }
    });
  }
}

const mapStateToProps = (state: { regions: IRegionsState }) => {
  return {
    regions: state.regions
  };
};

const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    getRegionsAction: (page: number) => dispatch(getRegionsAction(page)),
    createRegionAction: () => dispatch(createRegionAction()),
    updateRegionAction: () => dispatch(updateRegionAction()),
    deleteRegionAction: (id: string) => dispatch(deleteRegionAction(id)),
    changeTempRegionAction: (region: IBaseRegion, delay?: boolean) => dispatch(changeTempRegionAction(region, delay)),
    loadDataAction: (title: string, body: JSX.Element, footer: JSX.Element) => dispatch(loadDataAction(title, body, footer))
  };
};

export default connect<{regions: IRegionsState}, {dispatch: any}, IPropsType>(mapStateToProps, mapDispatchToProps)(RegionsListView);
