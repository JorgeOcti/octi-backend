// import * as PropTypes from 'prop-types';
import * as Raven from 'raven-js';
import * as moment from 'moment';
import * as React from 'react';
import { ErrorInfo } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { Dispatch } from 'redux';
import { DashboardReduxAction } from '../../actions/dashboard.actions';
import { getDashboardDamagesPerVenue, IDashboardDamagesState } from '../../actions/dashboardDamages.actions';
import AppContainer from '../../container/AppContainer';
import Row from '../Utils/Row';
import { IWindow } from '../../interfaces/window';
import * as swal from 'sweetalert';
import { default as Axios } from 'axios';
import ApiService from '../../utils/axios';
import { hasPermission } from '../../utils/common';
import TrackingBasePage from '../Utils/TrackingBasePage';
import { io } from 'socket.io-client';
import { Socket } from 'socket.io-client/build/esm/socket';

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
  exporting: boolean
}

class DashboardDamagesView extends TrackingBasePage<IPropsType, IStateType> {
  title : string;

  readonly state: IStateType = {
    error: null,
    detail: false,
    detailName: '',
    exporting: false,
  };
  protected damagesPerVenueChart: echarts.ECharts;
  private socket: Socket;

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Reportería de daños';
    this.resizeCharts = this.resizeCharts.bind(this);
    this.showdetail = this.showdetail.bind(this);
    this.back = this.back.bind(this);
    this.updateDamagesPerVenueChart = this.updateDamagesPerVenueChart.bind(this);
    this.exportDamages = this.exportDamages.bind(this);
  }

  public componentWillMount(): void {
    // get data
    this.props.getDashboardDamagesPerVenue(true);
    // add listeners
    window.addEventListener('resize', this.resizeCharts, false);

    // socket
    this.socket = io(`${location.protocol}//${location.host}`, {
      secure: location.protocol === 'https:',
      transports: ['websocket'],
      reconnection: true,
      query: {
        token: (window.user as any).token
      }
    });
    this.socket.on('connect', () => {
      this.socket.emit('join', {room: `dashboard-vin-view-${window.user.team._id}`});
    });
    this.socket.on('REFRESH', (data: any): void => {
      if (data.update) {
        this.props.getDashboardDamagesPerVenue();
      }
    });
  }

  public componentDidMount(): void {
    super.componentDidMount();
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

  public exportDamages() {
    this.setState({
      exporting: true
    });
    this.trackClick("Exportar");
    const api: ApiService = new ApiService();
    const instance = api.getInstance();
    instance.defaults.responseType = 'blob';
    instance
      .get(`/api/damages/export/`)
      .then((response) => {
        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const fileName = `${moment().format('YYYYMMDD')}-danos.xlsx`;
        if (typeof window.navigator.msSaveBlob !== 'undefined') {
          // IE workaround for "HTML7007: One or more blob URLs were
          // revoked by closing the blob for which they were created.
          // These URLs will no longer resolve as the data backing
          // the URL has been freed."
          window.navigator.msSaveBlob(blob, fileName);
        } else {
          const blobURL = URL.createObjectURL(blob);
          const tempLink = document.createElement('a');
          tempLink.style.display = 'none';
          tempLink.href = blobURL;
          tempLink.setAttribute('download', fileName);
          // Safari thinks _blank anchor are pop ups. We only want to set _blank
          // target if the browser does not support the HTML5 download attribute.
          // This allows you to download files in desktop safari if pop up blocking
          // is enabled.
          if (typeof tempLink.download === 'undefined') {
            tempLink.setAttribute('target', '_blank');
          }
          this.setState({
            exporting: false
          });
          document.body.appendChild(tempLink);
          tempLink.click();
          document.body.removeChild(tempLink);
          URL.revokeObjectURL(blobURL);
        }
      })
      .catch((err) => {
        this.setState({
          exporting: false
        });
        if (!Axios.isCancel(err)) {
          swal('Exportar daños', 'Ha ocurrido un error al general el excel.', 'error');
        }
      });
  }

  public render(): React.ReactElement<IPropsType> {
    const {loading} = this.props.dashboard;
    const {detail, detailName, exporting} = this.state;
    return (
      <AppContainer title="" cMenu="1" cSubMenu="1.4">
        <section className="content">
          <Row>
            <div className="col-md-12">
              <div className="box">
                <div className='box-header with-border'>
                  <h3 className='box-title'>Dashboard de daños</h3>
                  {
                    false && hasPermission(window.user, 'exportDamages') ?
                    <div className='box-tools pull-right'>
                      <button
                        className='btn btn-sm btn-primary hidden-xs hidden-sm'
                        onClick={this.exportDamages}
                        disabled={exporting}
                      >
                        {
                          exporting ?
                            <React.Fragment>
                              <i className='fa fa-fw fa-spinner fa-spin'></i> Exportando reporte
                            </React.Fragment>
                            :
                            <React.Fragment>
                              <i className='fa fa-fw fa-download'></i> Exportar reporte
                            </React.Fragment>
                        }
                      </button>
                    </div>
                    :
                    null
                  }
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
      let damages = [],
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
        damages = damages.reverse()
        undamages = undamages.reverse()
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
          // x: 'center',
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
          left: 5,
          // right
          right: 10,
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
            barGap: "0.1",
            barMaxWidth: 50,
            data: undamages
          },
          {
            name: 'Con daños',
            type: 'bar',
            barGap: "0.1",
            barMaxWidth: 50,
            data: damages
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
