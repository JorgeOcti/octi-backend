import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {IBaseVenue} from '../../../../../../src/interfaces/venue.interface';
import {changeTempVenueAction, IVenuesState, VenueReduxAction} from '../../actions/venues.actions';
import {updateTooltip} from '../../utils/common';
import Checkbox from '../CheckBox';

interface IPropsType {
  venues?: IVenuesState;
  changeTempVenueAction?: (venue: IBaseVenue) => VenueReduxAction;
}

interface IStateType {
  error: Error | null;
}

class VenueFormView extends React.Component<IPropsType, IStateType> {

  constructor(props: IPropsType) {
    super(props);
    this.changeTypeAction = this.changeTypeAction.bind(this);
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

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  render(): React.ReactElement<IPropsType> | null {
    if (this.props.venues && this.props.changeTempVenueAction) {
      const {changeTempVenueAction} = this.props;
      const {tempVenue, companies} = this.props.venues;
      return (
        <div className="row">
          <div className="col-md-12">
            <div className="form-group">
              <label>Nombre</label>
              <input
                type="text"
                name="fistName"
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
              <label htmlFor="id-venue">Empresa</label>
              <select
                className="chosen-select form-control"
                id="id-company"
                name="company"
                defaultValue={tempVenue && tempVenue.company ? tempVenue.company._id : undefined}
                data-placeholder={'Seleccione Empresa'}
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
          </div>
          <div className="col col-md-6">
            <div className="checkbox">
              <label style={{paddingLeft: '0'}} onClick={this.changeTypeAction} >
                <Checkbox active={tempVenue.type === 'distributor'} action={this.changeTypeAction} classes="icheck-in-checkbox"/>
                Distribuidor <i className="fa fa-info-circle" data-toggle="tooltip" data-placement="top" title="Activa funcionalidades a la sucursal."/>
              </label>
            </div>
          </div>
        </div>
      );
    } else {
      return null;
    }
  }

  private changeTypeAction() {
    if (this.props.venues && this.props.changeTempVenueAction) {
      const {changeTempVenueAction} = this.props;
      const {tempVenue} = this.props.venues;
      changeTempVenueAction({
        ...tempVenue,
        type: tempVenue.type === 'receiver' ? 'distributor' : 'receiver'
      });
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
    changeTempVenueAction: (venue: IBaseVenue) => dispatch(changeTempVenueAction(venue))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(VenueFormView);
