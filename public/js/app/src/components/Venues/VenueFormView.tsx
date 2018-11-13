import * as React from 'react';
import {connect} from 'react-redux';
import {IBaseVenue} from '../../../../../../src/interfaces/venue.interface';
import {changeTempVenueAction, IVenuesState, VenueReduxAction} from '../../actions/venues.actions';

interface IPropsType {
  venues?: IVenuesState;
  changeTempVenueAction?: (venue: IBaseVenue) => VenueReduxAction;
}

interface IStateType {
  error: Error | null;
}

class VenueFormView extends React.Component<IPropsType, IStateType> {
  render() {
    if (this.props.venues && this.props.changeTempVenueAction) {
      const {changeTempVenueAction} = this.props;
      const {tempVenue} = this.props.venues;
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
                    _id: tempVenue._id,
                    name: e.target.value
                  })
                }
              />
            </div>
          </div>
        </div>
      );
    } else {
      return null;
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
    changeTempVenueAction: (venue: IBaseVenue) => dispatch(changeTempVenueAction(venue)),
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(VenueFormView);
