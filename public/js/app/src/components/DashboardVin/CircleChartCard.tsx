import * as React from 'react';
import {RouteComponentProps} from "react-router";
import {Dispatch} from "redux";
import {DashboardReduxAction, IDashboardState} from "../../actions/dashboard.actions";
import {HTMLProps} from "react";

interface IPropsType extends HTMLProps<HTMLDivElement>{
  value: number;
  title: string;
  onClickMethod?: () => void;
  showLoading?: boolean;
  bordered? :boolean;
}

interface IStateType {
  error: Error | null;
}

class CircleChartCard extends React.Component<IPropsType, IStateType>{
  readonly state : IStateType = {
    error: null
  };

  circleChart: echarts.ECharts;
  private chartRef: React.RefObject<HTMLDivElement>;

  constructor(props: IPropsType) {
    super(props);
    this.chartRef = React.createRef();
    this.drawChart = this.drawChart.bind(this);
  }


  componentDidUpdate(prevProps: IPropsType, prevState: IStateType): void {
    if (!this.props.showLoading) {
      this.circleChart = echarts.init(this.chartRef.current!);
      this.drawChart();
    }
  }


  public componentWillMount() {
    window.addEventListener('resize', this.resizeCharts, false);
  }

  public componentWillUnmount() {
    window.removeEventListener('resize', this.resizeCharts, false);
  }

  private drawChart(){
    const {value, showLoading} = this.props;
    if (showLoading){
      return
    }
    const option: echarts.EChartOption = {
      color: ['#00aa51', '#f1392c'],
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: true,
          label: {
            show: false,
          },
          data: [
            value,
            100-value,
          ]
        }
      ]
    };

    this.circleChart.setOption(option, true);
  }

  private resizeCharts() {
    if (this.circleChart) {
      setTimeout(() => {
        this.circleChart.resize();
      }, 400);
    }
  }

  public render(): React.ReactElement<IPropsType> {
    const {title, value, onClickMethod, showLoading, bordered} = this.props;
    return (
      <div className={`${this.props.className}  ${onClickMethod ? "pointer" : ""}`} onClick={() => {if (onClickMethod) onClickMethod();}}>
        {showLoading ? <i className="fa fa-spinner fa-spin"/> :
        <div className={`info-box ${bordered ? "bordered" : ""}`}>
          <div className="row">
            <div className="col-sm-4">
              <div ref={this.chartRef} style={{minHeight: '150px', maxWidth: '100%'}}/>
            </div>
            <div className="col-sm-8">
              <span className="info-box-text">{title}</span>
              <span className="info-box-number count font-32">{value.toFixed(0)}%</span>
              {this.props.children}
            </div>
          </div>
        </div>
        }
      </div>);
  }
}

export default CircleChartCard;



