// import * as PropTypes from 'prop-types';
import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import {DashboardReduxAction} from '../../actions/dashboard.actions';
import {getDashboardDamagesPerVenue, IDashboardDamagesState} from '../../actions/dashboardDamages.actions';
import AppContainer from '../../container/AppContainer';
import Row from '../Utils/Row';
import * as io from "socket.io-client";
import {IWindow} from "../../interfaces/window";

declare let window: IWindow;

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<DashboardReduxAction>;
  dashboard: IDashboardDamagesState;

  getDashboardDamagesPerVenue(update?: boolean): void;
}

interface IStateType {
  error: Error | null;
  detail: boolean;
  detailName: string;
}

class DashboardDamagesView extends React.Component<IPropsType, IStateType> {

  readonly state: IStateType = {
    error: null,
    detail: false,
    detailName: ''
  };
  protected damagesPerVenueChart: echarts.ECharts;
  private socket: SocketIOClient.Socket;

  constructor(props: IPropsType) {
    super(props);
    this.resizeCharts = this.resizeCharts.bind(this);
    this.showdetail = this.showdetail.bind(this);
    this.back = this.back.bind(this);
    this.updateDamagesPerVenueChart = this.updateDamagesPerVenueChart.bind(this);
  }

  public componentWillMount(): void {
    // set the title of the page
    document.title = 'OSA Andes | Reportería de daños';
    // get data
    this.props.getDashboardDamagesPerVenue(true);
    // add listeners
    window.addEventListener('resize', this.resizeCharts, false);

    // socket
    this.socket = io.connect(`${location.protocol}//${location.host}`, {
      secure: location.protocol === 'https:',
      transports: ['websocket'],
      reconnection: true,
      query: {
        token: (window.user as any).token
      }
    });
    this.socket.on('connect', () => {
      this.socket.emit('join', {room: `dashboard-vin-view-${window.user.team}`});
    });
    this.socket.on('REFRESH', (data: any): void => {
      if (data.update) {
        this.props.getDashboardDamagesPerVenue();
      }
    });
  }

  public componentDidMount(): void {
    const $damagesPerVenue = document.getElementById('damages-per-venue') as HTMLDivElement;
    this.damagesPerVenueChart = echarts.init($damagesPerVenue);
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public componentDidUpdate(prevProps: IPropsType, prevState: IStateType): void {
    this.updateDamagesPerVenueChart();
  }

  public componentWillUnmount() {
    // remove listeners
    window.removeEventListener('resize', this.resizeCharts, false);
    this.socket.disconnect();
  }

  public render(): React.ReactElement<IPropsType> {
    const {loading} = this.props.dashboard;
    const {detail, detailName} = this.state;
    return (
      <AppContainer title="" cMenu="1" cSubMenu="1.3">
        <section className="content">
          <Row>
            <div className="col-md-12">
              <div className="box">
                <div className="box-header with-border"><h3 className="box-title">Dashboard de daños</h3>
                  <div className="box-tools pull-right">
                  </div>
                </div>
                <div className="box-body">
                  {
                    detail ?
                      <div className="text-center">
                        <h4 className="text-muted" style={{margin: '0 5px'}}>Detalle del {detailName}</h4>
                        <p className="text-muted">Para volver al detalle por día haz <a
                          href="javascript:void(0)"
                          onClick={this.back}
                        >click aquí</a></p>
                      </div> :
                      <div className="text-center">
                        <h4 className="text-muted" style={{margin: '0 5px'}}>Detalle de daños por día</h4>
                        <p className="text-muted">Haz click sobre una barra para ver el detalle por sucursales</p>
                      </div>
                  }
                  <div id="damages-per-venue" style={{height: '70vh', maxWidth: '100%'}}/>

                </div>
                {
                  loading &&
                  <div className="overlay">
                    <i className="fa fa-spinner fa-spin text-purple"/>
                  </div>
                }
              </div>
            </div>
          </Row>
        </section>
      </AppContainer>
    );
  }

  private updateDamagesPerVenueChart() {
    const {loading} = this.props.dashboard;
    if (!loading) {
      const {data} = this.props.dashboard;
      const {detail, detailName} = this.state;
      const damages = [],
            undamages = [];
      let category = Object.keys(data).reverse();
      if (detail) {
        let detailData = [];
        for(const key in data[detailName]){
          if ( data[detailName].hasOwnProperty(key) && !['damaged', 'undamaged'].includes(key)) {
            const venue = data[detailName][key];
            detailData.push(venue)
          }
        }
        detailData = detailData.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
        const detailCategories = [];
        for (const venue of detailData) {
            detailCategories.push(venue.name);
            damages.push(venue.damaged);
            undamages.push(venue.undamaged);
        }
        category = detailCategories;
      } else {
        for (const key in data) {
          if (data.hasOwnProperty(key)) {
            const day = data[key];
            damages.push(day.damaged);
            undamages.push(day.undamaged);
          }
        }
      }

      const option: echarts.EChartOption = {
        color: ['#00aa51', '#f1392c'],
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          data: ['Sin daños', 'Con daños'],
          x: 'center',
          bottom: 50,
        },
        xAxis: {
          type: 'category',
          axisTick: {show: false},
          data: category,
          axisLine: {
            lineStyle: {
              color: 'rgba(0, 0, 0, 0.5)'
            }
          },
          splitLine: {
            show: false,
            lineStyle: {
              type: 'dashed',
              color: 'rgba(150, 150, 150, 0.5)'
            }
          },
          axisLabel: {
            rotate: 60,
            fontSize: 10,
            formatter: function (value: string) {
              let text = '';
              const array = value.split(" ");
              for (let i = 0; i < array.length; i++) {
                text += `${array[i]}`;
                if (i > 0 && i % 2 !== 0) {
                  text += ' \n';
                } else {
                  text += ' ';
                }
              }
              return text;
            }
          }
        },
        grid: {
          top: 10,
          bottom: 100,
          // left
          x: 20,
          // right
          x2: 10,
          containLabel: true
        },
        yAxis: [
          {
            minInterval: 1,
            type: 'value',
            axisLine: {
              lineStyle: {
                color: 'rgba(0, 0, 0, 0.5)'
              }
            },
            splitLine: {
              show: true,
              lineStyle: {
                type: 'dashed',
                color: 'rgba(150, 150, 150, 0.5)'
              }
            }
          }
        ],
        series: [
          {
            name: 'Sin daños',
            type: 'bar',
            barGap: 0.1,
            barMaxWidth: 50,
            data: undamages.reverse()
          },
          {
            name: 'Con daños',
            type: 'bar',
            barGap: 0.1,
            barMaxWidth: 50,
            data: damages.reverse()
          }
        ],
        dataZoom: [{
          show: true,
          realtime: true,
          start: 0,
          end: 100
        }]
      };
      this.damagesPerVenueChart.setOption(option);
      this.damagesPerVenueChart.off('click');
      this.damagesPerVenueChart.on('click', (params: any) => {
        this.showdetail(params.name);
      });
    }
  }

  private back(){
    this.setState({detail: false, detailName: ''})
  }

  private showdetail(name: string){
    const {detail} =this.state;
    const {data} = this.props.dashboard;
    if(!detail && data.hasOwnProperty(name)){
      const day = data[name];
      if(day.damaged || day.undamaged){
        this.setState({
          detailName: name,
          detail: true
        })
      }
    }
  }

  private resizeCharts() {
    if (this.damagesPerVenueChart) {
      this.damagesPerVenueChart.resize();
      setTimeout(() => {
        this.damagesPerVenueChart.resize();
      }, 400);
    }
  }
}

const mapStateToProps = (state: { dashboardDamages: IDashboardDamagesState }) => {
  return {
    dashboard: state.dashboardDamages
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch,
    getDashboardDamagesPerVenue: (update?: boolean) => dispatch(getDashboardDamagesPerVenue(update))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(DashboardDamagesView);
