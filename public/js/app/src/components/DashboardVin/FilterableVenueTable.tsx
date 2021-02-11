import * as React from 'react';
import {RouteComponentProps} from "react-router";
import {Dispatch} from "redux";
import {connect} from 'react-redux';
import {
  DashboardReduxAction, getVenuesStats, IDashboardState,
} from "../../actions/dashboard.actions";
import AppContainer from "../../container/AppContainer";
import InfoCard, {CardColors} from "./InfoCard";
import CircleChartCard from "./CircleChartCard";
import {ChangeEvent, HTMLProps} from "react";
import * as moment from "moment";
import {IParticipant} from "../../../../../../src/interfaces/participant.interface";
import {connect} from "react-redux";
import {disableConsoleAlerts} from "raven";

interface IPropsType extends RouteComponentProps<{ }>, HTMLProps<HTMLDivElement>  {
  dispatch: Dispatch<DashboardReduxAction>;
  dashboard: IDashboardState;
  getVenuesStats(from: number, to: number): void;
}

export enum TimePeriods {
  MONTH = "MES",
  WEEK = "SEMANA",
  YEAR = "AÑO",
  DAY = "DIA",
}

interface IStateType {
  error: Error | null;
  from: number;
  to: number;
  timeControl: TimePeriods
  minValue: number | null;
}

class FilterableVenueTable extends React.Component<IPropsType, IStateType> {
  readonly state: IStateType = {
    error: null,
    from: moment().startOf("month").unix(),
    to: moment().endOf("month").unix(),
    timeControl: TimePeriods.WEEK,
    minValue: null
  };

  componentDidMount() {
    const {from, to} = this.state;
    this.props.getVenuesStats(from, to);
  }

  onValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({[e.currentTarget.name]: e.currentTarget.value});
  }

  onTimePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    let from : number, to : number;
    this.onValueChange(e as React.ChangeEvent<HTMLInputElement>);

    switch (TimePeriods[e.target.value]){
      case TimePeriods.MONTH:
        from = moment().startOf("month").unix();
        to = moment().endOf("month").unix();
        break;
      case TimePeriods.WEEK:
        from = moment().startOf("week").unix();
        to = moment().endOf("week").unix();
        break;
      case TimePeriods.DAY:
        from = moment().startOf("day").unix();
        to = moment().endOf("day").unix();
        break;
      default:
        from = moment().startOf("year").unix();
        to = moment().endOf("year").unix();
        break;
    }

    this.setState({from, to}, () => {
      this.props.getVenuesStats(from, to)
    });
  }

  public render() {
    const {minValue} = this.state;
    let venuesInfo = this.props.dashboard.venueStats ?? [];
    if (minValue){
      venuesInfo = venuesInfo.filter(v => (v.total ?? 0) < minValue);
    }
    return (
      <div className={`${this.props.className}`}>
        <div className="row">
          <div className="col-sm-6">
            <span className="font-14">
              SUCURSALES BAJO:
            </span>
            <input
              className="font-12"
              style={{width: "60px", marginLeft: "5px"}}
              name="minValue"
              min={1}
              value={this.state.minValue ?? ""}
              onChange={this.onValueChange}
              type="number"
            />
          </div>
          <div className="col-sm-6">
            <div>
              <span className="font-14" >REVISIONES ESTE:</span>
              <select
                className="font-12"
                style={{width:"90px", marginLeft: "5px"}}
                name="timeControl"
                value={this.state.timeControl.toString()}
                onChange={this.onTimePeriodChange}>
                {Object.keys(TimePeriods).map( p =>
                  <option key={p} value={p}>{TimePeriods[p].toString()}</option>
                )}
              </select>
            </div>
          </div>
        </div>
        <div className="row" style={{overflowY: "scroll", maxHeight: "110px"}}>
          <table className="table table-striped">
            <thead>
            <tr>
              <th className="">Sucursal</th>
              <th style={{width: "100px"}}># Revisiones</th>
            </tr>
            </thead>
            <tbody>
            {venuesInfo
              .sort((a,b) => b.total-a.total)
              .map(venueStats =>
              <tr key={venueStats._id}>
                <td>{venueStats.name}</td>
                <td>{venueStats.total ?? 0}</td>
              </tr>
            )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state: { dashboard: IDashboardState }) => {
  return {
    dashboard: state.dashboard
  };
};

const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    getVenuesStats: (from: number, to: number) => dispatch(getVenuesStats(from, to))
  };
};


export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(FilterableVenueTable);
