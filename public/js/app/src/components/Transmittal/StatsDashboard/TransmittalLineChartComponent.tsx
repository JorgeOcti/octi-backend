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
    let circles_n = 3;
    let circle_width = 40;
    let label_length = 50;
    let line_diff = circles_n * circle_width + label_length;
    let lines_n = circles_n - 1;
    console.log(`calc((95% - ${line_diff}px)/${lines_n})`)

    return <div className="row no-margin" style={{width: '95%', display: 'flex', alignItems: 'center'}} >

      <div style={{paddingRight: '10px', width:`${label_length}px`}}>
        <div>
          <p>Hola</p>
          <p>Hola</p>
        </div>
        <div className="no-margin" style={{height: `${circle_width}px`}} />
        <div>
          <p>Hola</p>
          <p>Hola</p>
        </div>
      </div>

      <div style={{display: "inline-block", width: `${circle_width}px`}}>
        <div>
          <p>Hola</p>
          <p>Hola</p>
        </div>
        <div className="no-margin" style={{height: `${circle_width}px`, width: `${circle_width}px`, borderRadius: '50%', backgroundColor: '#000'}} />
        <div>
          <p>Hola</p>
          <p>Hola</p>
        </div>
      </div>

      <div style={{display: "inline-block", height: '100%', width: `calc((95% - ${line_diff}px)/${lines_n})`}}>
        <div style={{height: '10px', backgroundColor: '#000'}} />
      </div>

      <div style={{display: "inline-block", width: `${circle_width}px`}}>
        <div>
          <p>Hola</p>
          <p>Hola</p>
        </div>
        <div className="no-margin" style={{height: `${circle_width}px`, width: `${circle_width}px`, borderRadius: '50%', backgroundColor: '#000'}} />
        <div>
          <p>Hola</p>
          <p>Hola</p>
        </div>
      </div>

      <div style={{display: "inline-block", height: '100%', width: `calc((95% - ${line_diff}px)/${lines_n})`}}>
        <div style={{height: '10px', backgroundColor: '#000'}} />
      </div>

      <div style={{display: "inline-block", width: `${circle_width}px`}}>
        <div>
          <p>Hola</p>
          <p>Hola</p>
        </div>
        <div className="no-margin" style={{height: `${circle_width}px`, width: `${circle_width}px`, borderRadius: '50%', backgroundColor: '#000'}} />
        <div>
          <p>Hola</p>
          <p>Hola</p>
        </div>
      </div>


    </div>;
  }

}
