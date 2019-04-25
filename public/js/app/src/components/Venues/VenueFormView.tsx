import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {IBaseVenue} from '../../../../../../src/interfaces/venue.interface';
import {changeTempVenueAction, IVenuesState, VenueReduxAction} from '../../actions/venues.actions';
import {updateTooltip} from '../../utils/common';
import BootstrapSelect from '../Utils/BootstrapSelect';
import Checkbox from '../Utils/CheckBox';

interface IPropsType {
  venues?: IVenuesState;
  update?: boolean;
  changeTempVenueAction?: (venue: IBaseVenue, noDelay?: boolean) => VenueReduxAction;
}

interface IStateType {
  error: Error | null;
}

class VenueFormView extends React.Component<IPropsType, IStateType> {

  constructor(props: IPropsType) {
    super(props);
    this.changeTypeAction = this.changeTypeAction.bind(this);
    this.handleSelectVenues = this.handleSelectVenues.bind(this);
  }

  public componentDidMount(): void {
    const chosenOptions = {
      no_results_text: 'Sin resultados para:'
    };
    updateTooltip();
    ($('#id-company') as any).chosen(chosenOptions).change((e: React.ChangeEvent<HTMLSelectElement>) => {
      if (this.props.changeTempVenueAction && this.props.venues) {
        const {tempVenue, companies} = this.props.venues;
        this.props.changeTempVenueAction({
          ...tempVenue,
          company: companies.find((company) => (company._id === e.target.value))
        });
      }
    });
  }

  public componentDidUpdate(): void {
    updateTooltip();
    $('#id-company').trigger('chosen:updated');
  }

  public componentWillReceiveProps(nextProps: Readonly<IPropsType>, nextContext: any): void {
    if (nextProps.venues) {
      const {tempVenue} = nextProps.venues;
      $('#id-company').val(tempVenue && tempVenue.company ? tempVenue.company._id : '').trigger('chosen:updated');
    }
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
      const {tempVenue, companies} = this.props.venues;
      let {allVenues} = this.props.venues;
      if (update) {
        allVenues = allVenues.filter((venue) => venue._id !== tempVenue._id);
      }
      return (
        <div className="row">
          <div className="col-md-12">
            <div className="form-group">
              <label>Nombre</label>
              <input
                type="text"
                name="name"
                className="form-control"
                maxLength={50}
                defaultValue={tempVenue ? tempVenue.name : ''}
                onChange={
                  (e: React.ChangeEvent<HTMLInputElement>) => changeTempVenueAction({
                    ...tempVenue,
                    name: e.target.value.trim()
                  })
                }
              />
            </div>
          </div>
          <div className="col-md-12">
            <div className="form-group">
              <label htmlFor="id-company">Empresa</label>
              <select
                className="chosen-select form-control"
                id="id-company"
                name="company"
                defaultValue={tempVenue && tempVenue.company ? tempVenue.company._id : undefined}
                data-placeholder={'Seleccione empresa'}
                onChange={undefined}
              >
                <option value="" />
                {
                  companies.map((company) => (
                    <option key={company._id} value={company._id}>{company.name}</option>
                  ))
                }
              </select>
            </div>
            {
              update ?
                <div className="alert alert-warning alert-dismissible">
                  Si se modifica la empresa, los usuarios asignados a esta sucursal también se verán afectados.
                </div> : null
            }
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
                selectedText="sucursales seleccionadas."
                selected={tempVenue.sendTo.map((venue) => venue._id)}
                allOption={true}
                selectAll={(value: boolean) => this.handleSelectVenues('sendTo', true, value)}
                options={allVenues.map((venue: any) => ({
                  value: venue._id,
                  text: venue.name
                }))}
                onClick={(value: string) => this.handleSelectVenues('sendTo', false, value)}
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
                selectedText="sucursales seleccionadas."
                selected={tempVenue.receiveFrom.map((venue) => venue._id)}
                allOption={true}
                selectAll={(value: boolean) => this.handleSelectVenues('receiveFrom', true, value)}
                options={allVenues.map((venue: any) => ({
                  value: venue._id,
                  text: venue.name
                }))}
                onClick={(value: string) => this.handleSelectVenues('receiveFrom', false, value)}
              />
            </div>
          </div>
          <div className="col col-md-12">
            <div className="checkbox">
              <label style={{paddingLeft: '0'}} onClick={this.changeTypeAction} >
                <Checkbox active={tempVenue.type === 'distributor'} action={this.changeTypeAction} classes="icheck-in-checkbox"/>
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
      );
    } else {
      return null;
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
    changeTempVenueAction: (venue: IBaseVenue, noDelay?: boolean) => dispatch(changeTempVenueAction(venue, noDelay))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(VenueFormView);
