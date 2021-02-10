import * as React from 'react';
import {RouteComponentProps} from "react-router";
import {Dispatch} from "redux";
import {DashboardReduxAction, IDashboardState} from "../../actions/dashboard.actions";
import {HTMLProps} from "react";

export enum CardColors {
  AQUA = "bg-aqua",
  GREEN = "bg-green",
  YELLOW = "bg-yellow",
  RED = "bg-red",
  GRAY = "bg-gray-dark",
}

interface IPropsType extends HTMLProps<HTMLDivElement>{
  title: string
  value: number,
  percentageValue?: number;
  color?: CardColors;
  iconBackgroundColor?: CardColors;
  icon: string;
  onClickMethod?: () => void;
  showLoading?: boolean;
  showProgressBar?: boolean;
  bordered? :boolean;
}

interface IStateType {
  error: Error | null;
}

class InfoCard extends React.Component<IPropsType, IStateType>{
  readonly state : IStateType = {
    error: null
  }

  constructor(props: IPropsType) {
    super(props);
  }

  public render(): React.ReactElement<IPropsType> {
    const {title, value, color, icon, onClickMethod, percentageValue, showLoading, showProgressBar, iconBackgroundColor, bordered} = this.props;
    return (
      <div className={`${this.props.className}  ${onClickMethod ? "pointer" : ""}`} onClick={() => {if (onClickMethod) onClickMethod();}}>
        <div className={`info-box ${color ? color.toString() : ""} ${bordered ? "bordered" : ""}`}>
          <span className={`info-box-icon ${iconBackgroundColor}`} >
            <i className={`fa ${icon}`}/>
          </span>
          <div className="info-box-content">
            <span className="info-box-text">{title}</span>
            <span className="info-box-number count">
              {!showLoading ? value :
                      <i className="fa fa-spinner fa-spin"/>}
              {this.props.children}
            </span>

            {!showLoading && showProgressBar ?
              <>
              <div className="progress">
                <div className="progress-bar" style={{
                  width: `${percentageValue}%`,
                  transition: 'width .6s ease'
                }}/>
              </div>
              <span className="progress-description">
                    {`${percentageValue?.toFixed(1)}% ${title.toLowerCase()}.`}
              </span>
              </>
            : null }
          </div>
        </div>
      </div>
    );
  }
}

export default InfoCard;



