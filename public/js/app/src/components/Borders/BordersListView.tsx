import {BorderReduxAction, IBorderState} from "../../actions/borders.actions";
import {IBaseBorder} from "../../../../../../src/app/interfaces/border.interface";
import {VenueReduxAction} from "../../actions/venues.actions";
import {ModalReduxAction} from "../../actions/modal.actions";
import {IWindow} from "../../interfaces/window";
import {RouteComponentProps} from "react-router";
import TrackingBasePage from "../Utils/TrackingBasePage";
import Row from "../Utils/Row";
import {hasPermission} from "../../utils/common";
import * as React from "react";
import {IVenue} from "../../../../../../src/app/interfaces";
import CopyText from "../Utils/CopyText";
import * as moment from "moment";
import Paginator from "../Utils/Paginator";
import ModalView from "../Modal/ModalView";
import AppContainer from "../../container/AppContainer";

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  borderState?: IBorderState;
  changeTempBorder?: (border: IBaseBorder) => BorderReduxAction;
  getCompaniesAction(): BorderReduxAction;
  getBordersAction(page: number): BorderReduxAction;
  createBorderAction(): BorderReduxAction;
  updateBorderAction(): BorderReduxAction;
  deleteBorderAction(id?: string): BorderReduxAction;
  changeSearchAction(searchText: string): BorderReduxAction;
  loadDataAction(title: string, body: JSX.Element, footer: JSX.Element): ModalReduxAction;
}


interface IStateType {
  error: Error | null;
}

declare let window: IWindow;

class BordersListView extends TrackingBasePage<IPropsType, IStateType> {
  title: string = "Administrador de pasos de frontera";

  private state: IStateType = {
    error: null
  }

  constructor(props: IPropsType) {
    super(props);
  }

  public render(): React.ReactElement<IPropsType> {
    const { exporting, tab } = this.state;
    const { loading, venues, pagination, searchText } = this.props.venues;
    return (
      <AppContainer title='' cMenu='10' cSubMenu='10.4' cAction='Listado'>
    <section className='content'>
    <Row>
      <div className='col-md-12 col-lg-12'>
    <div className='box box-solid'>
    <ul className='nav nav-pills nav-justified no-padding'>
    <li className={tab === 'list' ? 'no-margin active' : 'no-margin'}>
    <a
      href='javascript:void(0);'
    className={tab === 'list' ? 'background-transition' : ''}
    style={{ borderTop: '0', marginBottom: '0' }}
    onClick={() => this.changeTab('list')}
  >Sucursales</a>
    </li>
    <li className={tab === 'map' ? 'no-margin active' : 'no-margin'}>
    <a
      className={tab === 'map' ? 'background-transition' : ''}
    href='javascript:void(0);'
    style={{ borderTop: '0', marginBottom: '0' }}
    onClick={() => this.changeTab('map')}
  >Mapa</a>
    </li>
    </ul>
    </div>
    </div>
    </Row>

    <div className={`box ${tab === 'list' ? '' : 'hidden'}`}>
    <div className='box-header with-border'>
    <h3 className='box-title'>Sucursales <small>{pagination.count}</small></h3>
    <div className='box-tools pull-right'>
      {
        hasPermission(window.user, 'addVenue') ?
      <button className='btn btn-sm btn-success' onClick={this.createVenue}><i className='fa fa-plus' /> Crear sucursal</button>
  : null
  }
    <button
      className='btn btn-sm btn-primary  hidden-xs'
    onClick={this.exportExcel}
    disabled={exporting}
    style={{ marginLeft: '5px' }}
  >
    {
      exporting ?
        <React.Fragment>
          <i className='fa fa-spin fa-spinner' /> Exportando
          </React.Fragment>
        : <React.Fragment>
          <i className='fa fa-fw fa-download' /> Exportar
          </React.Fragment>
    }
    </button>
    </div>
    </div>
    <div className='box-body no-padding'>
    <div className='row'>
    <div className='col-md-12'>
    <div className='input-group input-group-sm'
    style={{ padding: '10px' }}
  >
    <input
      type='text'
    value={searchText}
    className='form-control pull-right'
    onChange={this.onChangeSearch}
    placeholder='Buscar' />
    <div className='input-group-btn'>
    <button className='btn btn-default'><i className='fa fa-search' /></button>
      </div>
      </div>
      </div>
      </div>
      <div className='box-body no-padding'>
    <table className='table table-andes table-striped'>
    <thead>
      <tr>
        <th style={{ width: '40%' }} className='middle'>Nombre</th>
      <th style={{ width: '10%' }} className='middle hidden-xs'>Código</th>
      <th style={{ width: '10%' }} className='middle-center hidden-xs'>Distribuidor</th>
      <th style={{ width: '10%' }} className='middle hidden-xs'>Asignaciones</th>
      <th style={{ width: '10%' }} className='middle-center hidden-xs'>Ubicación</th>
      <th style={{ width: '15%' }} className='middle hidden-xs'>Modificado</th>
    {
      hasPermission(window.user, 'changeVenue') ?
        <th style={{ width: '1%' }} className='width-10' /> : null
    }
    {
      hasPermission(window.user, 'deleteVenue') ?
        <th style={{ width: '1%' }} className='width-10' /> : null
    }
    </tr>
    </thead>
    <tbody>
    {
      venues.map((venue: IVenue) => {
        const canDelete = venue.users && venue.users.length === 0 && venue.participants && venue.participants.length === 0;
        return (
          <tr
            key={venue._id}
        id={`venue-${venue._id}`}
        className={'background-transition'}
        >
        <td className='middle'>
        <CopyText value={`${venue.name?.toUpperCase()}`}>
        <strong className='text-primary'>
          {venue.name?.toUpperCase()}
          </strong>
          </CopyText>
          <br />
          {
            venue.company ? <span className={'text-sm text-muted'}>{venue.company.name?.toUpperCase()}</span> : null
          }
          </td>
          <td className='middle text-sm text-muted  hidden-xs'>{venue.code}</td>
          <td className='middle-center hidden-xs'>
          {
            venue.type === 'distributor' ?
              <i className='fa fa-check-circle text-green' />
              : <i className='fa fa-times-circle text-blue' />
          }
          </td>
          <td className='middle text-sm text-muted  hidden-xs'>
          Usuarios: {venue.users ? venue.users.length : 0}<br />
        Revisiones: {venue.participants ? venue.participants.length : 0}<br />
        </td>
        <td className='middle text-sm text-muted hidden-xs'>
          lat: {venue.lat}<br />lng: {venue.lng}</td>
        <td className='middle hidden-xs text-sm text-muted'>
          {
            moment(venue.updatedAt).format('LLL')
      }
        </td>
        {
          hasPermission(window.user, 'changeVenue') ?
            <td
              className='middle text-blue pointer'
            onClick={() => this.updateVenue(venue)}>
          <i className='fa fa-pencil' />
            </td> : null
        }
        {
          hasPermission(window.user, 'deleteVenue') ?
            <td
              className={canDelete ? 'middle text-red pointer' : 'middle text-muted not-allowed'}
            onClick={canDelete ? () => this.deleteVenue(venue) : undefined}
            >
            <i className='fa fa-minus-circle' />
              </td> : null
        }
        </tr>
      );
      })
    }
    </tbody>
    </table>
    </div>
    </div>
    {
      pagination.pages > 1 &&
      <div className='box-footer text-right'>
      <Paginator changePage={this.changePage} page={pagination.page} pages={pagination.pages} />
    </div>
    }
    {
      loading &&
      <div className='overlay'>
      <i className='fa fa-spinner fa-spin text-purple' />
        </div>
    }
    </div>

    <div className={`box ${tab === 'map' ? '' : 'hidden'}`}>
    <div className='box-header with-border'>
    <h3 className='box-title'>Sucursales <small>{pagination.count}</small></h3>
    <div className='box-tools pull-right'>
    <button
      className='btn btn-sm btn-primary  hidden-xs'
    onClick={this.exportExcel}
    disabled={exporting}
    style={{ marginLeft: '5px' }}
  >
    {
      exporting ?
        <React.Fragment>
          <i className='fa fa-spin fa-spinner' /> Exportando
          </React.Fragment>
        : <React.Fragment>
          <i className='fa fa-fw fa-download' /> Exportar
          </React.Fragment>
    }
    </button>
    </div>
    </div>
    <div className='box-body no-padding'>
    <div
      id='map'
    style={{
      position: 'relative',
        width: '100%',
        height: '70vh'
    }}
    />
    </div>
    </div>
    <ModalView />
    </section>
    </AppContainer>
  );
  }


}
