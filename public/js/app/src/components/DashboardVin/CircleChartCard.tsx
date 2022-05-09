import * as React from 'react';
import {HTMLProps} from 'react';
import NumberFormat from "react-number-format";

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
    this.resizeCharts = this.resizeCharts.bind(this);
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
      grid: {
        width: "100%",
        height: "100%",
        // top: 30,
        // bottom: 100,
        // left
        left: 0,
        right: 0,
        containLabel: true
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: true,
          label: {
            show: false
          },
          data: [
            value,
            100-value
          ]
        }
      ]
    };

    this.circleChart.setOption(option, true);
  }

  private resizeCharts() {
    if (this.circleChart) {
      this.circleChart.resize();
      setTimeout(() => {
        this.circleChart.resize();
      }, 400);
    }
  }

  public render(): React.ReactElement<IPropsType> {
    const {title, value, onClickMethod, bordered} = this.props;
    return (
      <div className={`${this.props.className}  ${onClickMethod ? 'pointer' : ''}`} onClick={() => {if (onClickMethod) onClickMethod();}}>
        <div className={`${bordered ? 'bordered' : ''}`}>
          <div className="row justify-content-center">
            <div className="col-sm-4 col-xs-12">
              <div ref={this.chartRef} style={{minHeight: '160px', maxWidth: '100%'}}/>
            </div>
            <div className="col-sm-8 col-xs-12" style={{padding: '15px'}}>
              <span className="info-box-text xs-center-text text-wrap">{title}</span>
              <span className="info-box-number count font-32 xs-center-text">
                <NumberFormat
                  value={value}
                  displayType={'text'}
                  thousandSeparator={'.'}
                  decimalScale={0}
                  decimalSeparator={','}
                  suffix="%"/>
              </span>
              {this.props.children}
            </div>
          </div>
        </div>
      </div>);
  }
}

export default CircleChartCard;



