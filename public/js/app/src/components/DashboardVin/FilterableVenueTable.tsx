import * as React from 'react';
import {RouteComponentProps} from "react-router";
import {Dispatch} from "redux";
import {DashboardReduxAction, IDashboardState} from "../../actions/dashboard.actions";
import AppContainer from "../../container/AppContainer";
import InfoCard, {CardColors} from "./InfoCard";
import CircleChartCard from "./CircleChartCard";
import {HTMLProps} from "react";
import * as moment from "moment";

interface IPropsType extends RouteComponentProps<{ }>, HTMLProps<HTMLDivElement>  {
  dispatch: Dispatch<DashboardReduxAction>;
  dashboard: IDashboardState;
  getRevisionsVenueResume(): void;
}

interface IStateType {
  error: Error | null;
  loading: boolean;
}

class FilterableVenueTable extends React.Component<IPropsType, IStateType> {
  readonly state: IStateType = {
    error: null,
    loading: false,
  };

  constructor(props : IPropsType) {
    super(props);
  }

  public render() {
    const {loading} = this.state;
    return (
      <div className={`${this.props.className}`}>
        <div className="row">

        </div>
        <div className="row">
          <table className="table table-striped">
            <thead>
            <tr>
              <th></th>
              <th className="width-10"/>
              <th className="width-10"/>
            </tr>
            </thead>
            <tbody>
            <tr>
              <td>Nissan Disan Puerto Montt</td>
              <td>PUERTO MONTT</td>
              <td>4</td>
            </tr>
            <tr>
              <td>Nissan Disan Puerto Montt</td>
              <td>PUERTO MONTT</td>
              <td>4</td>
            </tr>
            <tr>
              <td>Nissan Disan Puerto Montt</td>
              <td>PUERTO MONTT</td>
              <td>4</td>
            </tr>
            <tr>
              <td>Nissan Disan Puerto Montt</td>
              <td>PUERTO MONTT</td>
              <td>4</td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }

}

export default FilterableVenueTable;
