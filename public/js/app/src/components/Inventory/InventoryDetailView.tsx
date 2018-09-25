///<reference path="../../../node_modules/sweetalert/typings/sweetalert.d.ts"/>
// import * as PropTypes from 'prop-types';
import * as Raven from 'raven-js';
import {ErrorInfo} from 'react';
import * as React from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import {AlertReduxAction, IAlertsState} from '../../actions/alerts.action';
import {loadDataAction} from '../../actions/modal.action';
import AppContainer from '../../container/AppContainer';

interface IPropsType extends RouteComponentProps<{ id: string }> {
  alerts: IAlertsState;
  dispatch: Dispatch<AlertReduxAction>;
  // loadDataAction(title: string, body: JSX.Element, footer: JSX.Element): ModalReduxAction;
}

interface IStateType {
  error: Error | null;
}

class InventoryDetailView extends React.Component<IPropsType, IStateType> {

  // static propTypes = {
  //   dispatch: PropTypes.func.isRequired
  // };

  state = {
    error: null
  };

  venuesDetailChart: any;
  brandDetailChart: any;

  constructor(props: IPropsType) {
    super(props);
    this.resizeCharts = this.resizeCharts.bind(this);
  }

  public componentWillMount() {
    // this.props.getAlertsAction();
    // set the title of the page
    document.title = 'OSA Andes | Detalle Inventario';
    // add listeners
    window.addEventListener('resize', this.resizeCharts, false);
  }

  public componentWillUnmount() {
    // remove listeners
    window.removeEventListener('resize', this.resizeCharts, false);
    // cancel request if component is inmounted
    // if (this.props.alerts.source) {
    //   this.props.alerts.source.cancel('Operation canceled by the user.');
    // }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  // public componentDidUpdate(prevProps: IPropsType, prevState: IStateType): void {
  public componentDidMount(): void {
    document.title = 'OSA Andes | Detalle Inventario';
    const $venuesDetail = document.getElementById('chart-venues-detail') as HTMLDivElement;
    const $brandDetail = document.getElementById('chart-brand-detail') as HTMLDivElement;
    this.venuesDetailChart = echarts.init($venuesDetail);
    this.brandDetailChart = echarts.init($brandDetail);
    const optionVenues = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'shadow'
        }
      },
      legend: {
        x: 'center',
        y: 'bottom',
        data: ['Encontrados', 'Faltantes', 'Sobrantes']
      },
      xAxis: {
        type: 'category',
        // boundaryGap: false,
        data: ['Sucursal 1', 'Sucursal 2', 'Sucursal 3', 'Sucursal 4', 'Sucursal 5', 'Sucursal 6', 'Sucursal 7', 'Sucursal 8', 'Sucursal 9', 'Sucursal 10', 'Sucursal 11', 'Sucursal 12'],
        axisLine: {
          lineStyle: {
            color: 'rgba(0, 0, 0, 0.5)'
          }
        },
        axisLabel: {
          rotate: 45
          // fontSize: 10
        }
      },
      calculable: true,
      yAxis: {
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
            color: 'rgba(35, 36, 37, 0.5)'
          }
        }
      },
      grid: {
        top: 30,
        // left
        x: 30,
        // right
        x2: 10,
        containLabel: true
        // borderColor: '#FF0000'
      },
      series: [{
        data: [10, 40, 50, 0, 3, 16, 28, 10, 40, 50, 100, 3],
        name: 'Encontrados',
        type: 'bar',
        color: '#00aa51',
        barGap: 0
        // areaStyle: {}
        // smooth: true
      }, {
        data: [20, 20, 10, 2, 0, 0, 20, 20, 10, 2, 0, 6],
        name: 'Faltantes',
        type: 'bar',
        color: '#f1392c',
        barGap: 0
        // areaStyle: {}
        // smooth: true
      }, {
        data: [1, 0, 3, 0, 1, 2, 1, 0, 3, 0, 1, 2],
        name: 'Sobrantes',
        type: 'bar',
        color: '#ff9600',
        barGap: 0
        // areaStyle: {}
        // smooth: true
      }]
    };
    const optionBrands = {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        x: 'center',
        y: 'bottom',
        data: ['Encontrados', 'Faltantes', 'Sobrantes']
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: ['Mazda', 'Great Wall', 'Susuki', 'Mercedez', 'Nissan', 'Cheevrolet'],
        axisLine: {
          lineStyle: {
            color: 'rgba(0, 0, 0, 0.5)'
          }
        },
        axisLabel: {
          rotate: 45
          // fontSize: 10
        }
      },
      calculable: true,
      yAxis: {
        minInterval: 1,
        type: 'value',
        axisLine: {
          lineStyle: {
            color: 'rgba(0, 0, 0, 0.5)'
          }
        },
        splitLine: {
          show: true
          // lineStyle: {
          //   type: 'dashed',
          //   color: 'rgba(35, 36, 37, 0.5)'
          // }
        }
      },
      grid: {
        top: 30,
        // left
        x: 30,
        // right
        x2: 20,
        containLabel: true
        // borderColor: '#FF0000'
      },
      series: [{
        data: [10, 40, 50, 0, 3, 16, 28],
        name: 'Encontrados',
        type: 'line',
        color: '#00aa51',
        areaStyle: {}
        // smooth: true
      }, {
        data: [20, 20, 10, 2, 0, 0],
        name: 'Faltantes',
        type: 'line',
        color: '#f1392c',
        areaStyle: {}
        // smooth: true
      }, {
        data: [1, 0, 3, 0, 1, 2],
        name: 'Sobrantes',
        type: 'line',
        color: '#ff9600',
        areaStyle: {}
        // smooth: true
      }]
    };
    this.venuesDetailChart.setOption(optionVenues);
    this.brandDetailChart.setOption(optionBrands);
  }

  public render(): React.ReactElement<IPropsType> {
    return (
      <AppContainer title="Inventario Prueba" cMenu="2" cSubMenu="2.1" cAction="Detalle">
        <section className="content">
          <div className="row">
            <div className="col-md-4">
              <div className="info-box bg-green">
                <span className="info-box-icon"><i className="fa fa-check" /></span>
                <div className="info-box-content">
                  <span className="info-box-text">Encontrados</span>
                  <span className="info-box-number">5,200</span>
                  <div className="progress">
                    <div className="progress-bar" style={{width: '50%'}} />
                  </div>
                  <span className="progress-description">
                    50% Increase in 30 Days
                  </span>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="info-box bg-red">
                <span className="info-box-icon"><i className="fa fa-close" /></span>
                <div className="info-box-content">
                  <span className="info-box-text">Faltantes</span>
                  <span className="info-box-number">5,200</span>
                  <div className="progress">
                    <div className="progress-bar" style={{width: '50%'}} />
                  </div>
                  <span className="progress-description">
                    50% Increase in 30 Days
                  </span>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="info-box bg-yellow">
                <span className="info-box-icon"><i className="fa fa-check" /></span>
                <div className="info-box-content">
                  <span className="info-box-text">Sobrantes</span>
                  <span className="info-box-number">5,200</span>
                  <div className="progress">
                    <div className="progress-bar" style={{width: '50%'}} />
                  </div>
                  <span className="progress-description">
                    50% Increase in 30 Days
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">Detalle de inventario por sucursal</h3>
            </div>
            <div className="box-body">
              <div id="chart-venues-detail" style={{height: '400px', maxWidth: '100%'}}/>
            </div>
            {/*<div className="box-footer text-right">*/}
            {/*</div>*/}
            {
              false &&
              <div className="overlay">
                <i className="fa fa-spinner fa-spin text-purple"/>
              </div>
            }
          </div>
          <div className="row">
            <div className="col-md-8">
              <div className="box box-success">
                <div className="box-header with-border">
                  <h3 className="box-title">Detalle de inventario por Marca</h3>
                  {/*<div className="box-tools pull-right">*/}
                  {/*</div>*/}
                </div>
                <div className="box-body">
                  <div id="chart-brand-detail" style={{height: '400px', maxWidth: '100%'}}/>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="box box-info">
                <div className="box-header with-border">
                  <h3 className="box-title">Visitors Report</h3>
                  {/*<div className="box-tools pull-right">*/}
                  {/*</div>*/}
                </div>
                <div className="box-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="progress-group">
                        <span className="progress-text">Add Products to Cart</span>
                        <span className="progress-number"><b>160</b>/200</span>

                        <div className="progress sm">
                          <div className="progress-bar progress-bar-aqua" style={{width: '80%'}}/>
                        </div>
                      </div>
                      <div className="progress-group">
                        <span className="progress-text">Complete Purchase</span>
                        <span className="progress-number"><b>310</b>/400</span>

                        <div className="progress sm">
                          <div className="progress-bar progress-bar-red" style={{width: '80%'}}/>
                        </div>
                      </div>
                      <div className="progress-group">
                        <span className="progress-text">Visit Premium Page</span>
                        <span className="progress-number"><b>480</b>/800</span>

                        <div className="progress sm">
                          <div className="progress-bar progress-bar-green" style={{width: '80%'}}/>
                        </div>
                      </div>
                      <div className="progress-group">
                        <span className="progress-text">Send Inquiries</span>
                        <span className="progress-number"><b>250</b>/500</span>

                        <div className="progress sm">
                          <div className="progress-bar progress-bar-yellow" style={{width: '80%'}}/>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <h3>Detalle sucursales</h3>
          <div className="row">
            <div className="col-md-6">
              <div className="box box-warning collapsed-box">
                <div className="box-header">
                  <h3 className="box-title">Sucursal 1</h3>
                  <div className="box-tools pull-right">
                    <button type="button" className="btn btn-box-tool" data-widget="collapse"><i className="fa fa-plus" /></button>
                  </div>
                </div>
                <div className="box-body" style={{display: 'none'}}>
                  <p>&nbsp;</p>
                  <p>&nbsp;</p>
                  <p>&nbsp;</p>
                  <p>&nbsp;</p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="box box-warning collapsed-box">
                <div className="box-header">
                  <h3 className="box-title">Sucursal 2</h3>
                  <div className="box-tools pull-right">
                    <button type="button" className="btn btn-box-tool" data-widget="collapse"><i className="fa fa-plus" /></button>
                  </div>
                </div>
                <div className="box-body" style={{display: 'none'}}>
                  <p>&nbsp;</p>
                  <p>&nbsp;</p>
                  <p>&nbsp;</p>
                  <p>&nbsp;</p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="box box-warning collapsed-box">
                <div className="box-header">
                  <h3 className="box-title">Sucursal 3</h3>
                  <div className="box-tools pull-right">
                    <button type="button" className="btn btn-box-tool" data-widget="collapse"><i className="fa fa-plus" /></button>
                  </div>
                </div>
                <div className="box-body" style={{display: 'none'}}>
                  <p>&nbsp;</p>
                  <p>&nbsp;</p>
                  <p>&nbsp;</p>
                  <p>&nbsp;</p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="box box-warning collapsed-box">
                <div className="box-header">
                  <h3 className="box-title">Sucursal 4</h3>
                  <div className="box-tools pull-right">
                    <button type="button" className="btn btn-box-tool" data-widget="collapse"><i className="fa fa-plus" /></button>
                  </div>
                </div>
                <div className="box-body" style={{display: 'none'}}>
                  <p>&nbsp;</p>
                  <p>&nbsp;</p>
                  <p>&nbsp;</p>
                  <p>&nbsp;</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </AppContainer>
    );
  }

  private resizeCharts(): void {
    if (this.venuesDetailChart && this.venuesDetailChart !== undefined) {
      this.venuesDetailChart.resize();
    }
    if (this.brandDetailChart && this.brandDetailChart !== undefined) {
      this.brandDetailChart.resize();
    }
  }
}

const mapStateToProps = (state: { alerts: IAlertsState }) => {
  return {
    alerts: state.alerts
  };
};

const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    loadDataAction: (title: string, body: JSX.Element, footer: JSX.Element) => dispatch(loadDataAction(title, body, footer))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(InventoryDetailView);
