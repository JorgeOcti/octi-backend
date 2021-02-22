import * as React from 'react';
import {RouteComponentProps} from "react-router";
import {Dispatch} from "redux";
import {connect} from 'react-redux';
import {
  DashboardReduxAction, getVenuesStats, IDashboardState,
} from "../../actions/dashboard.actions";
import * as moment from "moment";

interface IPropsType {
  className?: string;
  dispatch?: Dispatch<DashboardReduxAction>;
  dashboard?: IDashboardState;
  getVenuesStats(from: number, to: number): void;
  bordered? : boolean;
}

export enum TimePeriods {
  MONTH = "MES",
  WEEK = "SEMANA",
  YEAR = "AÑO",
  DAY = "DÍA",
}

interface IStateType {
  error: Error | null;
  from: number;
  to: number;
  timeControl: string;
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

  onValueChange = (e: any) => {
    this.setState({
      minValue: e.currentTarget.value
    });
  }

  onTimePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    let from : number, to : number;
    let value : string = e.target.value;

    switch (value) {
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

    this.setState({from, to, timeControl: value}, () => {
      this.props.getVenuesStats(from, to)
    });
  }

  public render() {
    const minValue = this.state.minValue ?? null;
    let venuesInfo = this.props.dashboard ? this.props.dashboard.venueStats ?? [] : [];
    if (minValue){
      venuesInfo = venuesInfo.filter(v => (v.total ?? 0) < minValue);
    }
    return (
      <div className={`${this.props.className}`} >
        <div className={`col ${this.props.bordered ? 'bordered' : ''}`} style={{padding: "5px"}} >
          <div className='row' >
            <div className="col-xs-6">
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
            <div className="col-xs-6">
              <div>
                <span className="font-14" >REVISIONES ESTE:</span>
                <select
                  className="font-12"
                  style={{width:"90px", marginLeft: "5px"}}
                  name="timeControl"
                  value={this.state.timeControl}
                  onChange={this.onTimePeriodChange}>
                  {Object.keys(TimePeriods).map( (p : string) =>
                    <option key={p} value={(TimePeriods as any)[p].toString()}>{(TimePeriods as any)[p].toString()}</option>
                  )}
                </select>
              </div>
            </div>
          </div>
          <div className="row" style={{overflowY: "scroll", maxHeight: "122px", margin: "0px"}}>
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


export default connect<{}, {}, IPropsType | any>(mapStateToProps, mapDispatchToProps)(FilterableVenueTable);
