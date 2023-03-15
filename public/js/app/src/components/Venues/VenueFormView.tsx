import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {IBaseVenue, IVenue} from '../../../../../../src/app/interfaces/venue.interface';
import {changeTempVenueAction, getVenueUsersAction, IVenuesState, VenueReduxAction} from '../../actions/venues.actions';
import {updateTooltip} from '../../utils/common';
import BootstrapSelect from '../Utils/BootstrapSelect';
import Checkbox from '../Utils/CheckBox';
import {IVenueDay} from '../../../../../../src/app/interfaces/venueDay.interface';

interface IPropsType {
  venues?: IVenuesState;
  update?: boolean;
  changeTempVenueAction?: (venue: IBaseVenue, noDelay?: boolean) => VenueReduxAction;
  getVenueUsersAction? : (page:number, venue: IVenue) => VenueReduxAction;
}

interface IStateType {
  error: Error | null;
}

class VenueFormView extends React.Component<IPropsType, IStateType> {

  constructor(props: IPropsType) {
    super(props);
    this.changeTypeAction = this.changeTypeAction.bind(this);
    this.handleSelectVenues = this.handleSelectVenues.bind(this);
    this.handleSelectResponsible = this.handleSelectResponsible.bind(this);
  }

  public componentDidMount(): void {
    const chosenOptions = {
      no_results_text: 'Sin resultados para:'
    };
    updateTooltip();
  }

  public componentDidUpdate(prevProps:Readonly<IPropsType>, prevState:Readonly<IStateType>, snapshot?:any): void {
    updateTooltip();
    if (prevProps.venues?.tempVenue._id != this.props.venues?.tempVenue._id)
        this.props.getVenueUsersAction?.(1, this.props.venues?.tempVenue as IVenue)
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  render(): React.ReactElement<IPropsType> | null {
    if (this.props.venues && this.props.changeTempVenueAction) {
      const {changeTempVenueAction, update} = this.props;
      const {tempVenue, companies, carriers, regions, users} = this.props.venues;
      let {allVenues} = this.props.venues;
      if (update) {
        allVenues = allVenues.filter((venue) => venue._id !== tempVenue._id);
      }
      return (
        <React.Fragment>
          <ul className="nav nav-tabs" style={{marginBottom: '15px'}}>
            <li className="active"><a data-toggle="tab" href="#general">General</a></li>
            {tempVenue.sendToDays.length > 0 ? <li><a data-toggle="tab" href="#diasSucursales">Tiempos de despacho</a></li> : null}
          </ul>
          <div className="tab-content">
            <div id="general" className="tab-pane fade in active">
              <div className="row">
                <div className="col-md-12">
                  <div className="form-group">
                    <label>Nombre</label>
                    <input
                      type="text"
                      className="form-control"
                      maxLength={50}
                      value={tempVenue.name}
                      onChange={
                        (e: React.ChangeEvent<HTMLInputElement>) => changeTempVenueAction({
                          ...tempVenue,
                          name: e.target.value
                        }, true)
                      }
                    />
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="form-group">
                    <label>Código</label>
                    <input
                      type="text"
                      className="form-control"
                      maxLength={50}
                      value={tempVenue.code}
                      onChange={
                        (e: React.ChangeEvent<HTMLInputElement>) => changeTempVenueAction({
                          ...tempVenue,
                          code: e.target.value
                        }, true)
                      }
                    />
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="form-group">
                    <label>Abreviación</label>
                    <input
                      type="text"
                      name="abbreviation"
                      step="any"
                      className="form-control"
                      maxLength={10}
                      value={tempVenue.abbreviation || ''}
                      onChange={
                        (e: React.ChangeEvent<HTMLInputElement>) => changeTempVenueAction({
                          ...tempVenue,
                          abbreviation: e.target.value.toUpperCase()
                        }, true)
                      }
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Latitud</label>
                    <input
                      type="number"
                      name="lng"
                      step="any"
                      className="form-control"
                      maxLength={50}
                      value={tempVenue.lat}
                      onChange={
                        (e: React.ChangeEvent<HTMLInputElement>) => changeTempVenueAction({
                          ...tempVenue,
                          lat: parseFloat(e.target.value)
                        }, true)
                      }
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Longitud</label>
                    <input
                      type="number"
                      name="lng"
                      className="form-control"
                      maxLength={50}
                      value={tempVenue.lng}
                      onChange={
                        (e: React.ChangeEvent<HTMLInputElement>) => changeTempVenueAction({
                          ...tempVenue,
                          lng: parseFloat(e.target.value)
                        }, true)
                      }
                    />
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="form-group">
                    <label htmlFor="id-company">Empresa</label>
                    <BootstrapSelect
                      noneSelectedText="Seleccione"
                      search={true}
                      options={
                        companies
                          .map((company) => ({
                            value: company._id,
                            text: company.name
                          }))
                      }
                      selected={tempVenue.company ? [tempVenue.company._id] : []}
                      autoClouse={true}
                      onClick={(value: string) => changeTempVenueAction({
                        ...tempVenue,
                        company: companies.find((company) => (company._id === value))
                      }, true)}
                    />
                  </div>
                  {
                    update ?
                      <div className="alert alert-warning alert-dismissible">
                        Si se modifica la empresa, los usuarios asignados a esta sucursal también se verán afectados.
                      </div> : null
                  }
                </div>
                {update? <div className="col-md-12">
                  <div className="form-group">
                    <label htmlFor="venues" className="control-label">
                      Encargados de local
                    </label>
                    <BootstrapSelect
                      noneSelectedText="Seleccione"
                      displayItems={2}
                      search={true}
                      selectedText="Usuarios seleccionados."
                      selected={tempVenue.responsible.map((user) => user._id)}
                      allOption={true}
                      selectAll={(value: boolean) => this.handleSelectResponsible(true, value)}
                      options={users.map((user: any) => ({
                        value: user._id,
                        text: `${user.firstName} ${user.lastName}`
                      }))}
                      onClick={(value: string) => this.handleSelectResponsible(false, value)}
                    />
                  </div>
                </div> : null }
                <div className="col-md-12">
                  <div className="form-group">
                    <label htmlFor="id-company">Región</label>
                    <BootstrapSelect
                      noneSelectedText="Seleccione"
                      options={
                        regions
                          .map((region) => ({
                            value: region._id,
                            text: region.name
                          }))
                      }
                      selected={tempVenue.region ? [tempVenue.region._id] : []}
                      autoClouse={true}
                      onClick={(value: string) => changeTempVenueAction({
                        ...tempVenue,
                        region: regions.find((region) => (region._id === value))
                      }, true)}
                    />
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="form-group">
                    <label htmlFor="venues" className="control-label">
                      Envia <i
                      className="fa fa-info-circle text-black"
                      data-toggle="tooltip" data-placement="top"
                      title="Usuarios asignados a esta sucursal, pueden enviar a estas sucursales."
                    />
                    </label>
                    <BootstrapSelect
                      noneSelectedText="Seleccione"
                      displayItems={2}
                      search={true}
                      selectedText="sucursales seleccionadas."
                      selected={tempVenue.sendToDays.map((venueDay) => venueDay.venue._id)}
                      allOption={true}
                      selectAll={(value: boolean) => this.handleSelectVenuesSendToDays( true, value)}
                      options={allVenues.map((venue: any) => ({
                        value: venue._id,
                        rend: <><strong>{venue.company.name.toUpperCase()}</strong> {venue.name.toUpperCase()}</>,
                        text: `${venue.company.name.toUpperCase()} ${venue.name.toUpperCase()}`
                      }))}
                      onClick={(value: string) => this.handleSelectVenuesSendToDays(false, value)}
                    />
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="form-group">
                    <label htmlFor="venues" className="control-label">
                      Transportistas de envio <i
                      className="fa fa-info-circle text-black"
                      data-toggle="tooltip" data-placement="top"
                      title="Usuarios asignados a esta sucursal pueden enviar de estos transportista."
                    />
                    </label>
                    <BootstrapSelect
                      noneSelectedText="Seleccione"
                      displayItems={2}
                      search={true}
                      selectedText="transportistas seleccionadas."
                      selected={tempVenue.shippingCarriers.map((carrier) => carrier._id)}
                      allOption={true}
                      selectAll={(value: boolean) => this.handleSelectCarriers('shippingCarriers', true, value)}
                      options={carriers.map((carrier: any) => ({
                        value: carrier._id,
                        text: carrier.name
                      }))}
                      onClick={(value: string) => this.handleSelectCarriers('shippingCarriers', false, value)}
                    />
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="form-group">
                    <label htmlFor="venues" className="control-label">
                      Recibe <i
                      className="fa fa-info-circle text-black"
                      data-toggle="tooltip"
                      data-placement="top"
                      title="Usuarios asignados a esta sucursal, pueden recepcionar de estas sucursales."
                    />
                    </label>
                    <BootstrapSelect
                      noneSelectedText="Seleccione"
                      displayItems={2}
                      search={true}
                      selectedText="sucursales seleccionadas."
                      selected={tempVenue.receiveFrom.map((venue) => venue._id)}
                      allOption={true}
                      selectAll={(value: boolean) => this.handleSelectVenues('receiveFrom', true, value)}
                      options={allVenues.map((venue: any) => ({
                        value: venue._id,
                        rend: <><strong>{venue.company.name.toUpperCase()}</strong> {venue.name.toUpperCase()}</>,
                        text: `${venue.company.name.toUpperCase()} ${venue.name.toUpperCase()}`
                      }))}
                      onClick={(value: string) => this.handleSelectVenues('receiveFrom', false, value)}
                    />
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="form-group">
                    <label htmlFor="venues" className="control-label">
                      Transportistas de recepción <i
                      className="fa fa-info-circle text-black"
                      data-toggle="tooltip" data-placement="top"
                      title="Usuarios asignados a esta sucursal pueden recepcionar de estos transportistas."
                    />
                    </label>
                    <BootstrapSelect
                      noneSelectedText="Seleccione"
                      displayItems={2}
                      search={true}
                      selectedText="transportistas seleccionadas."
                      selected={tempVenue.receptionCarriers.map((carrier) => carrier._id)}
                      allOption={true}
                      selectAll={(value: boolean) => this.handleSelectCarriers('receptionCarriers', true, value)}
                      options={carriers.map((carrier: any) => ({
                        value: carrier._id,
                        text: carrier.name
                      }))}
                      onClick={(value: string) => this.handleSelectCarriers('receptionCarriers', false, value)}
                    />
                  </div>
                </div>
                <div className="col col-md-12">
                  <div className="checkbox">
                    <label style={{paddingLeft: '0'}} onClick={this.changeTypeAction}>
                      <Checkbox active={tempVenue.type === 'distributor'} action={this.changeTypeAction}
                                classes="icheck-in-checkbox"/>
                      <span
                        style={{
                          paddingLeft: '5px',
                          top: '2px',
                          position: 'relative'
                        }}
                      >
                        Distribuidor <i
                        className="fa fa-info-circle"
                        data-toggle="tooltip"
                        data-placement="top"
                        title="Activa funcionalidades a la sucursal."
                      />
                </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            { tempVenue.sendToDays.length > 0 ? <div id="diasSucursales" className="tab-pane fade">
              { tempVenue.sendToDays.map( (venueDay: IVenueDay) => {
                const venueIndex = tempVenue.sendToDays.findIndex(v => v.venue._id === venueDay.venue._id);
                  return <div className="row" key={venueDay.venue._id}>
                    <div className="col-md-12">
                      <div className="form-group">
                        <label>{tempVenue.name} - {venueDay.venue.name}</label>
                        <input
                          type="number"
                          name={venueDay.venue._id}
                          step="any"
                          className="form-control"
                          min={1}
                          value={venueDay.shippingMaxDays || ''}
                          onChange={
                            (e: React.ChangeEvent<HTMLInputElement>) => {
                              tempVenue.sendToDays[venueIndex].shippingMaxDays = parseInt(e.target.value);
                              changeTempVenueAction(tempVenue, true);
                            }
                          }
                        />
                      </div>
                    </div>
                  </div>;
                }
              )}
            </div> : null}
          </div>
        </React.Fragment>
      );
    } else {
      return null;
    }
  }

  private handleSelectVenuesSendToDays(all: boolean, value: string | boolean){
    if (this.props.changeTempVenueAction && this.props.venues) {
      const {tempVenue, allVenues} = this.props.venues;
      let values : IVenueDay[]= [];
      if (all) {
        values = value ? allVenues.map((venue: IVenue) => {
          return {_id: null, shippingMaxDays : undefined, venue};}) :
          [];
      } else {
        const add = tempVenue.sendToDays.find((venueDay : IVenueDay) => venueDay.venue._id === value) === undefined;
        const venueDay : IVenueDay = {
          _id: null,
          venue:allVenues.find((venue) => venue._id === value)!,
          shippingMaxDays: undefined
        };
        if (add) {
          values = [...tempVenue.sendToDays, venueDay];
        } else {
          values = tempVenue.sendToDays.filter((venueDay) => venueDay.venue._id !== value);
        }
      }
      this.props.changeTempVenueAction({
        ...tempVenue,
        sendToDays: values
      }, true);
    }

  }
  private handleSelectResponsible(all: boolean, value: string | boolean) {
    if (this.props.changeTempVenueAction && this.props.venues) {
      const {tempVenue, users} = this.props.venues;
      if (all) {
        this.props.changeTempVenueAction({
          ...tempVenue,
          responsible: value ? users : []
        }, true);
      } else {
        let new_user = users.find(u => u._id === value)
        if (new_user)
          this.props.changeTempVenueAction({
            ...tempVenue,
            responsible: tempVenue.responsible.concat([new_user])
          }, true);
      }
    }
  }

  private handleSelectVenues(where: 'receiveFrom' | 'sendTo', all: boolean, value: string | boolean) {
    if (this.props.changeTempVenueAction && this.props.venues) {
      const {tempVenue, allVenues} = this.props.venues;
      let values = [];
      if (all) {
        values = value ? allVenues : [];
      } else {
        const add = tempVenue[where].find((venue) => venue._id === value) === undefined;
        const venue = allVenues.find((venue) => venue._id === value);
        if (add) {
          values = [...tempVenue[where], venue];
        } else {
          values = tempVenue[where].filter((venue) => venue._id !== value);
        }
      }
      this.props.changeTempVenueAction({
        ...tempVenue,
        [where]: values
      }, true);
    }
  }
  private handleSelectCarriers(where: 'shippingCarriers' | 'receptionCarriers', all: boolean, value: string | boolean) {
    if (this.props.changeTempVenueAction && this.props.venues) {
      const {tempVenue, carriers} = this.props.venues;
      let values = [];
      if (all) {
        values = value ? carriers : [];
      } else {
        const add = tempVenue[where].find((carrier) => carrier._id === value) === undefined;
        const carrier = carriers.find((carrier) => carrier._id === value);
        if (add) {
          values = [...tempVenue[where], carrier];
        } else {
          values = tempVenue[where].filter((carrier) => carrier._id !== value);
        }
      }
      this.props.changeTempVenueAction({
        ...tempVenue,
        [where]: values
      }, true);
    }
  }

  private changeTypeAction() {
    if (this.props.venues && this.props.changeTempVenueAction) {
      const {changeTempVenueAction} = this.props;
      const {tempVenue} = this.props.venues;
      changeTempVenueAction({
        ...tempVenue,
        type: tempVenue.type === 'receiver' ? 'distributor' : 'receiver'
      }, true);
    }
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
    changeTempVenueAction: (venue: IBaseVenue, noDelay?: boolean) => dispatch(changeTempVenueAction(venue, noDelay)),
    getVenueUsersAction: (page: number, venue: IVenue) => dispatch(getVenueUsersAction(page, venue))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(VenueFormView);
