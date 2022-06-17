import {RouteComponentProps} from "react-router";
import {Dispatch} from "redux";
import {ITransmittalActionTypes} from "../../../actions/transmittal.types";
import * as React from "react";

export interface dataPoint {
  value: number;
  upperValues: string[];
  lowerValues: string[];
  title: string;
}

interface IPropsType {
  circles: dataPoint[],
  circleSize: number;
}

interface IStateType {
  error: Error | null;

}

export default class TransmittalLineChartComponent extends React.Component<IPropsType, IStateType>{

  render() {
    return <div></div>;
  }

}
