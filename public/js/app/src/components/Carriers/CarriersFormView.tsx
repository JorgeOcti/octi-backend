import * as React from 'react';
import {connect} from 'react-redux';
import {
  IBaseCarrier
} from '../../../../../../src/app/interfaces/carrier.interface';
import {
  CarrierReduxAction,
  changeTempCarrierAction,
  ICarriersState
} from '../../actions/carriers.actions';

interface IPropsType {
  carriers?: ICarriersState;
  update?: boolean;
  changeTempCarrierAction?: (carrier: IBaseCarrier, delay?: boolean) => CarrierReduxAction;
}

interface IStateType {
  error: Error | null;
}

class CarriersFormView extends React.Component<IPropsType, IStateType> {

  render(): React.ReactElement<IPropsType> | null {
    if (this.props.carriers && this.props.changeTempCarrierAction) {
      const {tempCarrier} = this.props.carriers;
      const {changeTempCarrierAction} = this.props;
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
                value={tempCarrier ? tempCarrier.name : ''}
                onChange={
                  (e: React.ChangeEvent<HTMLInputElement>) => changeTempCarrierAction({
                    ...tempCarrier,
                    name: e.target.value
                  })
                }
              />
            </div>
          </div>
        </div>
      );
    }
    return null;
  }
}

const mapStateToProps = (state: { carriers: ICarriersState }) => {
  return {
    carriers: state.carriers
  };
};

const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    changeTempCarrierAction: (carrier: IBaseCarrier, delay?: boolean) => dispatch(changeTempCarrierAction(carrier, delay))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(CarriersFormView);
