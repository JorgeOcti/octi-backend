import {RouteComponentProps} from "react-router";
import {Dispatch} from "redux";
import {ITransmittalActionTypes} from "../../../actions/transmittal.types";
import * as React from "react";

export interface dataPoint {
  value: number;
  upperValues: string[];
  lowerValues: string[];
  title: string;
  color: string;
}

interface IPropsType {
  circles: dataPoint[],
  circleSize: number;
  lineColor: string;
}

interface IStateType {
  error: Error | null;

}

export default class TransmittalLineChartComponent extends React.Component<IPropsType, IStateType>{

  render() {
    let {circles, circleSize, lineColor} = this.props;
    let circles_n = circles.length;
    let circle_width = circleSize;
    let label_length = 50;
    let line_diff = circles_n * circle_width + label_length;
    let lines_n = circles_n - 1;
    return <div className="row" style={{display: 'flex', alignItems: 'center', marginLeft: '20px', marginRight: '20px', marginBottom: '40px'}} >

      <div style={{paddingRight: '10px', width:`${label_length}px`}} key='0'>
        <div style={{marginBottom: '16px', marginTop:'20px'}}>
          <p style={{fontSize: '16px', marginTop: '45px', marginBottom: '0px'}}><i className="fa fa-fw fa-clock-o" /></p>
        </div>
        <div className="no-margin" style={{height: `${circle_width}px`}} />
        <div style={{marginTop: '5px'}}>
          <p style={{fontSize: '16px'}}><i className="fa fa-fw fa-car" /></p>
          <p style={{fontSize: '16px'}}><i className="fa fa-fw fa-truck" /></p>
        </div>
      </div>

      { circles.map((circle, index) => {
        if (index === 0)
          return <div key={`circle-${index}`} style={{display: "inline-block", width: `${circle_width}px`}}>
            <div style={{marginTop: '10px'}}>
              <p style={{paddingLeft: '20%', fontSize: '18px', fontWeight: 510, whiteSpace: 'nowrap'}}>{circle.title}</p>
              {circle.upperValues.map(value => <p key={value} style={{paddingLeft: '20%', fontSize: '16px', fontWeight: 510, whiteSpace: 'nowrap'}}>{value}</p>)}
            </div>
            <div className="no-margin" style={{height: `${circle_width}px`, width: `${circle_width}px`, borderRadius: '50%', backgroundColor: circle.color}} />
            <div style={{marginTop: '10px'}}>
              {circle.lowerValues.map(value => <p key={value} style={{paddingLeft: '20%', fontSize: '16px', fontWeight: 510, whiteSpace: 'nowrap'}} >{value}</p>)}
            </div>
          </div>;
        else
          return <React.Fragment key={index}>
            <div key={`line-${index}`} style={{display: "inline-block", height: '100%', width: `calc((95% - ${line_diff}px)/${lines_n})`, marginTop:'10px'}}>
              <div style={{height: '10px', backgroundColor: lineColor}} />
            </div>
            <div key={`circle-${index}`} style={{display: "inline-block", width: `${circle_width}px`}}>
              <div style={{marginTop: '10px'}}>
                <p style={{paddingLeft: '20%', fontSize: '18px', fontWeight: 510, whiteSpace: 'nowrap'}} >{circle.title}</p>
                {circle.upperValues.map(value => <p key={value} style={{paddingLeft: '20%', fontSize: '16px', fontWeight: 510, whiteSpace: 'nowrap'}} >{value}</p>)}
              </div>
              <div className="no-margin" style={{height: `${circle_width}px`, width: `${circle_width}px`, borderRadius: '50%', backgroundColor: circle.color}} />
              <div>
                {circle.lowerValues.map( (value, index) => <p key={index} style={{paddingLeft: '20%', fontSize: '16px', fontWeight: 510, whiteSpace: 'nowrap'}}>{value}</p>)}
              </div>
            </div>
          </React.Fragment>;
      })}

    </div>;
  }

}
