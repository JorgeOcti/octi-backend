///<reference path="../../../node_modules/sweetalert/typings/sweetalert.d.ts"/>
import * as moment from 'moment';
import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import {IVenue} from '../../../../../../src/interfaces/venue.interface';
import {IBaseVenue} from '../../../../../../src/interfaces/venue.interface';
import {
  loadDataAction,
  ModalReduxAction
} from '../../actions/modal.actions';
import {
  addVenueAction,
  changeTempVenueAction,
  deleteVenueAction, editVenueAction,
  getVenuesAction,
  IVenuesState,
  VenueReduxAction
} from '../../actions/venues.actions';
import AppContainer from '../../container/AppContainer';
import {IWindow} from '../../interfaces/window';
import {
  hasPermission, showModal, statusFooterButttonsModal
} from '../../utils/common';
import ModalView from '../Modal/ModalView';
import Paginator from '../Paginator';
import VenueFormView from './VenueFormView';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<VenueReduxAction>;
  venues: IVenuesState;

  getVenuesAction(page: number): VenueReduxAction;
  deleteVenueAction(id?: string): VenueReduxAction;
  changeTempVenueAction(venue: IBaseVenue): VenueReduxAction;
  loadDataAction(title: string, body: JSX.Element, footer: JSX.Element): ModalReduxAction;
  editVenueAction(): ModalReduxAction;
  addVenueAction(): ModalReduxAction;
}

interface IStateType {
  error: Error | null;
}

declare let window: IWindow;

class VenuesListView extends React.Component<IPropsType, IStateType> {

  constructor(props: IPropsType) {
    super(props);
    this.changePage = this.changePage.bind(this);
    this.addVenue = this.addVenue.bind(this);
    this.processAddVenue = this.processAddVenue.bind(this);
    this.editVenue = this.editVenue.bind(this);
    this.processEditVenue = this.processEditVenue.bind(this);
    this.deleteVenue = this.deleteVenue.bind(this);
  }

  public componentWillMount(): void {
    const {pagination} = this.props.venues;
    // set the title of the page
    document.title = 'OSA Andes | Listado de sucursales';
    this.props.getVenuesAction(pagination.page);
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public componentWillUnmount(): void {
    // cancel request if component is inmounted
    if (this.props.venues.source) {
      this.props.venues.source.cancel('Operation canceled by the user.');
    }
  }

  public render(): React.ReactElement<IPropsType> {
    const {loading, venues, pagination} = this.props.venues;
    return (
      <AppContainer title="" cMenu="10" cSubMenu="10.4" cAction="Listado">
        <section className="content">
          <div className="box">
            <div className="box-header with-border"><h3 className="box-title">Sucursales <small>{pagination.count}</small></h3>
              {
                hasPermission(window.user, 'addVenue') ?
                  <div className="box-tools pull-right">
                    <button className="btn btn-sm btn-success" onClick={this.addVenue}>Agregar</button>
                  </div>
                  : null
              }
            </div>
            <div className="box-body no-padding">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th style={{width: '60%'}} className="middle">Nombre</th>
                    <th style={{width: '20%'}} className="middle">Asignaciones</th>
                    <th style={{width: '20%'}} className="middle hidden-xs">Modificado</th>
                    {
                      hasPermission(window.user, 'changeVenue') ?
                        <th style={{width: '1%'}} className="width-10"/> : null
                    }
                    {
                      hasPermission(window.user, 'deleteVenue') ?
                        <th style={{width: '1%'}} className="width-10"/> : null
                    }
                  </tr>
                </thead>
                <tbody>
                  {
                    venues.map((venue: IVenue) => {
                      const canDelete = venue.users && venue.users.length === 0 && venue.participants && venue.participants.length === 0;
                      return (
                        <tr key={venue._id} id={`venue-${venue._id}`}>
                          <td className="middle">{venue.name}</td>
                          <td className="text-sm">
                            Usuarios: {venue.users ? venue.users.length : 0}<br/>
                            Revisiones: {venue.participants ? venue.participants.length : 0}<br/>
                          </td>
                          <td className="middle hidden-xs">{moment(venue.updatedAt).format('LLL')}</td>
                          {
                            hasPermission(window.user, 'changeVenue') ?
                              <td
                                className="middle text-blue pointer"
                                onClick={() => this.editVenue(venue)}>
                                <i className="fa fa-pencil"/>
                              </td> : null
                          }
                          {
                            hasPermission(window.user, 'deleteVenue') ?
                              <td
                                className={canDelete ? 'middle text-red pointer' : 'middle text-muted not-allowed'}
                                onClick={canDelete ? () => this.deleteVenue(venue) : undefined}
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
      </AppContainer>
    );
  }

  private addVenue(): void {
    this.props.changeTempVenueAction({
      _id: '',
      name: ''
    });
    setTimeout(() => {
      this.props.loadDataAction(
        'Agregar Sucursal',
        <VenueFormView />,
        <React.Fragment>
          <button type="button" className="btn btn-default" data-dismiss="modal">Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={this.processAddVenue}>Grabar</button>
        </React.Fragment>
      );
    }, 200);
  }

  private processAddVenue(): void {
    const {tempVenue} = this.props.venues;
    if (!tempVenue.name || !tempVenue.name.trim()) {
      swal('Agregar sucursal', 'El nombres es requerido', 'error');
    } else {
     this.props.addVenueAction();
    }
  }

  private editVenue(venue: IVenue): void {
    this.props.changeTempVenueAction({
      _id: venue._id,
      name: venue.name
    });
    setTimeout(() => {
      this.props.loadDataAction(
        'Editar Sucursal',
        <VenueFormView />,
        <React.Fragment>
          <button type="button" className="btn btn-default" data-dismiss="modal">Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={this.processEditVenue}>Editar</button>
        </React.Fragment>
      );
    }, 200);
  }

  private processEditVenue(): void {
    const {tempVenue} = this.props.venues;
    if (!tempVenue.name || !tempVenue.name.trim()) {
      swal('Editar sucursal', 'El nombres es requerido', 'error');
    } else {
      this.props.editVenueAction();
    }
  }

  private deleteVenue(venue: IVenue) {
    // ask if you are sure that you are going to delete the user?
    swal({
      title: '¿Estás seguro?',
      text: `Vas a eliminar la sucursal ${venue.name} `,
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
        this.props.deleteVenueAction(venue._id);
      }
    });
  }

  private changePage(page: number): void {
    // change the page
    this.props.getVenuesAction(page);
  }
}

const mapStateToProps = (state: { venues: IVenuesState }) => {
  return {
    venues: state.venues
  };
};

const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    getVenuesAction: (page: number) => dispatch(getVenuesAction(page)),
    deleteVenueAction: (id: string) => dispatch(deleteVenueAction(id)),
    changeTempVenueAction: (venue: IBaseVenue) => dispatch(changeTempVenueAction(venue)),
    loadDataAction: (title: string, body: JSX.Element, footer: JSX.Element) => dispatch(loadDataAction(title, body, footer)),
    editVenueAction: () => dispatch(editVenueAction()),
    addVenueAction: () => dispatch(addVenueAction())
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(VenuesListView);
