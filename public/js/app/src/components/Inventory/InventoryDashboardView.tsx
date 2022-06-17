import * as Raven from 'raven-js';
import * as React from 'react';
import { ErrorInfo } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { Dispatch } from 'redux';
import {
  getInventoryDashboard,
  getInventoryDashboardFiltered,
  IInventoryDashboardState,
  InventoryDashboardReduxAction
} from '../../actions/inventoryDashboard.actions';
import AppContainer from '../../container/AppContainer';
import { IWindow } from '../../interfaces/window';
import { IFilterCar } from '../../reducers/inventory.reducer';
import BootstrapSelect from '../Utils/BootstrapSelect';
import Row from '../Utils/Row';
import TrackingBasePage from '../Utils/TrackingBasePage';

declare let window: IWindow;

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  inventoryDashboard: IInventoryDashboardState;
  dispatch: Dispatch<InventoryDashboardReduxAction>;

  getInventoryDashboard(filter: IFilterCar): void;

  getInventoryDashboardFiltered(filter: IFilterCar): void;
}

interface IStateType {
  error: Error | null;
}

class InventoryDashboardView extends TrackingBasePage<IPropsType, IStateType> {
  title: string;

  monthlyReport: echarts.ECharts;

  state = {
    error: null
  };

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Dashboard de inventarios';
    this.resizeCharts = this.resizeCharts.bind(this);

    this.filterVenues = this.filterVenues.bind(this);
    this.filterAllVenues = this.filterAllVenues.bind(this);
  }

  public componentWillMount(): void {

    window.scrollTo(0, 0);

    // add listeners
    window.addEventListener('resize', this.resizeCharts, false);

    // get data
    const { filter } = this.props.inventoryDashboard;
    this.props.getInventoryDashboard(filter);

  }

  public componentDidMount(): void {
    super.componentDidMount();
    const $monthlyReport = document.getElementById('inventory-monthly-report') as HTMLDivElement;
    this.monthlyReport = echarts.init($monthlyReport);

  }

  public componentDidUpdate(prevProps: IPropsType, prevState: IStateType): void {
    const { loading } = this.props.inventoryDashboard;
    if (!loading) {
      this.updateDashboardChart();
    }
  }

  public componentWillUnmount(): void {
    // remove listeners
    window.removeEventListener('resize', this.resizeCharts, false);
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error });
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public render(): React.ReactElement<IPropsType> {
    const { filter, loading, venues } = this.props.inventoryDashboard;
    return (
      <AppContainer title='' cMenu='2' cSubMenu='2.3'>
        <section className='content'>
          <div className='box'>
            <div className='box-header with-border'>
              <h3 className='box-title'>Dashboard de inventarios</h3>
            </div>
            <div className='box-body no-padding'>
              <Row>
                <div className='col-md-offset-8 col-md-4' style={{ padding: '20px 40px' }}>
                  <BootstrapSelect
                    sm={true}
                    noneSelectedText='Todas'
                    displayItems={2}
                    selectedText='sucursales seleccionadas.'
                    selected={filter.venues}
                    allOption={true}
                    selectAll={this.filterAllVenues}
                    options={venues.map((venue: any) => ({
                      value: venue._id,
                      text: venue.name
                    }))}
                    onClick={this.filterVenues}
                  />
                </div>
                <div className='col-md-12' style={{padding: '0 0 15px 0'}}>
                   <div id='inventory-monthly-report' style={{ height: '65vh', maxWidth: '100%' }} />
                </div>
              </Row>
            </div>
            {
              loading &&
              <div className='overlay'>
                <i className='fa fa-spinner fa-spin text-purple' />
              </div>
            }
          </div>
        </section>
      </AppContainer>
    );
  }

  private resizeCharts(): void {
    if (this.monthlyReport) {
      this.monthlyReport.resize();
      setTimeout(() => {
        this.monthlyReport.resize();
      }, 400);
    }
  }

  private filterVenues(value: any) {

    const { filter } = this.props.inventoryDashboard;

    const venues = filter.venues.includes(value) ? filter.venues.filter((venue) => venue !== value) : [value, ...filter.venues];
    this.props.getInventoryDashboardFiltered({
      ...filter,
      venues
    });
  }

  private filterAllVenues(value: boolean) {
    const { filter, venues } = this.props.inventoryDashboard;
    this.props.getInventoryDashboardFiltered({
      ...filter,
      venues: value ? venues.map((v) => v._id) : []
    });
  }

  private updateDashboardChart() {
    const { monthlyReport, inventorySettings } = this.props.inventoryDashboard;

    const labelOption = {
      normal: {
        show: true,
        position: 'inside',
        align: 'center',
        verticalAlign: 'middle',
        rotate: 90,
        formatter: '{c}',
        fontSize: 12,
        rich: {
          name: {
            textBorderColor: '#fff'
          }
        }
      }
    };

    const xSerie = Object.keys(monthlyReport);
    const found = Object.values(monthlyReport).map((v) => v.found);
    const pending = Object.values(monthlyReport).map((v) => v.pending);
    const leftover = Object.values(monthlyReport).map((v) => v.leftover);
    const missing = Object.values(monthlyReport).map((v) => v.missing);
    const reported = Object.values(monthlyReport).map((v) => v.reported);

    const option: any = {
      color: [inventorySettings.foundColor, inventorySettings.leftoverColor, inventorySettings.missingColor, inventorySettings.pendingColor, inventorySettings.reportedColor],
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        }
      },
      legend: {
        // x: 'center',
        // bottom: 50,
        data: [inventorySettings.found, inventorySettings.leftover, inventorySettings.missing, inventorySettings.pending, inventorySettings.reported]
      },
      calculable: true,
      xAxis: [
        {
          type: 'category',
          boundaryGap: false,
          data: xSerie
        }
      ],
       yAxis: {
        // minInterval: 1,
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
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: 80,
        containLabel: true
      },
      dataZoom: {
        show: true,
        realtime: true,
        start: 50,
        end: 100
      },
      series: [
        {
          name: inventorySettings.found,
          type: 'line',
          stack: 'Total',
          // barMaxWidth: 100,
          // label: labelOption,
          areaStyle: {},
          emphasis: {
            focus: 'series'
          },
          data: found
        },
        {
          name: inventorySettings.leftover,
          type: 'line',
          stack: 'Total',
          // barMaxWidth: 100,
          // label: labelOption,
          areaStyle: {},
          emphasis: {
            focus: 'series'
          },

          data: leftover
        },
        {
          name: inventorySettings.missing,
          type: 'line',
          stack: 'Total',
          // barMaxWidth: 100,
          // label: labelOption,
          areaStyle: {},
          emphasis: {
            focus: 'series'
          },

          data: missing
        },
        {
          name: inventorySettings.pending,
          type: 'line',
          stack: 'Total',
          // barMaxWidth: 100,
          // label: labelOption,
          areaStyle: {},
          emphasis: {
            focus: 'series'
          },

          data: pending
        },
        {
          name: inventorySettings.reported,
          type: 'line',
          stack: 'Total',
          // barMaxWidth: 100,
          // label: labelOption,
          areaStyle: {},
          emphasis: {
            focus: 'series'
          },

          data: reported
        }
      ]
    };

    this.monthlyReport.setOption(option);

  }
}

const mapStateToProps = (state: { inventoryDashboard: IInventoryDashboardState }) => {
  return {
    inventoryDashboard: state.inventoryDashboard
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch,
    getInventoryDashboard: () => dispatch(getInventoryDashboard()),
    getInventoryDashboardFiltered: (filter: IFilterCar) => dispatch(getInventoryDashboardFiltered(filter))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(InventoryDashboardView);
