import * as React from 'react';
import {connect} from 'react-redux';
import {
  IBaseRegion
} from '../../../../../../src/app/interfaces/region.interface';
import {
  RegionReduxAction,
  changeTempRegionAction,
  IRegionsState
} from '../../actions/regions.actions';


interface IPropsType {
  regions?: IRegionsState;
  update?: boolean;
  changeTempRegionAction?: (carrier: IBaseRegion, delay?: boolean) => RegionReduxAction;
}

interface IStateType {
  error: Error | null;
}

class RegionsFormView extends React.Component<IPropsType, IStateType> {

  render(): React.ReactElement<IPropsType> | null {
    if (this.props.regions && this.props.changeTempRegionAction) {
      const {tempRegion} = this.props.regions;
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
                value={tempRegion ? tempRegion.name : ''}
                onChange={
                  (e: React.ChangeEvent<HTMLInputElement>) => this.props.changeTempRegionAction!({
                    ...tempRegion,
                    name: e.target.value.trim()
                  })
                }
              />
            </div>
            <div className="form-group">
              <label>Código</label>
              <input
                type="text"
                name="code"
                className="form-control"
                maxLength={50}
                value={tempRegion ? tempRegion.code : ''}
                onChange={
                  (e: React.ChangeEvent<HTMLInputElement>) => this.props.changeTempRegionAction!({
                    ...tempRegion,
                    code: e.target.value.trim()
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

const mapStateToProps = (state: { regions: IRegionsState }) => {
  return {
    regions: state.regions
  };
};

const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    changeTempRegionAction: (carrier: IBaseRegion, delay?: boolean) => dispatch(changeTempRegionAction(carrier, delay))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(RegionsFormView);
