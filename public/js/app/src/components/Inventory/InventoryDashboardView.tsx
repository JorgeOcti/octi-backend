///<reference path="../../../node_modules/sweetalert/typings/sweetalert.d.ts"/>
import * as moment from 'moment';
import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import {
  getInventoryDashboard,
  getInventoryDashboardFiltered,
  IInventoryDashboardState,
  InventoryDashboardReduxAction,
} from '../../actions/inventory_dashboard.actions';
import AppContainer from '../../container/AppContainer';
import {IWindow} from '../../interfaces/window';
import BootstrapSelect from '../Utils/BootstrapSelect';
import Row from '../Utils/Row';
import {IFilterCar} from "../../reducers/inventory.reducer";

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

class InventoryDashboardView extends React.Component<IPropsType, IStateType> {

  // static propTypes = {
  //   dispatch: PropTypes.func.isRequired
  // };

  monthlyReport: echarts.ECharts;

  state = {
    error: null
  };
  private socket: SocketIOClient.Socket;

  constructor(props: IPropsType) {
    super(props);
    this.resizeCharts = this.resizeCharts.bind(this);

    this.filterVenues = this.filterVenues.bind(this);
    this.filterAllVenues = this.filterAllVenues.bind(this);
  }

  public componentWillMount(): void {
    // set the title of the page
    document.title = 'OSA Andes | Inventarios';
    window.scrollTo(0, 0);

    // add listeners
    window.addEventListener('resize', this.resizeCharts, false);

    // get data
    const { filter } = this.props.inventoryDashboard;
    this.props.getInventoryDashboard(filter);

  }

  public componentDidMount(): void {
    const $monthlyReport = document.getElementById('inventory-monthly-report') as HTMLDivElement;
    this.monthlyReport = echarts.init($monthlyReport);

  }

  public componentDidUpdate(prevProps: IPropsType, prevState: IStateType): void {
    const {loading} = this.props.inventoryDashboard;
    console.log("--loading", loading)
    if (!loading) {
      this.updateDashboardChart();
    }
  }

  public componentWillUnmount(): void {

    // remove listeners
    window.removeEventListener('resize', this.resizeCharts, false);

  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public render(): React.ReactElement<IPropsType> {
    const { filter, loading, venues } = this.props.inventoryDashboard;
    return (
      <AppContainer title="" cMenu="2" cSubMenu="2.3">
        <section className="content">
          <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">Dashboard de inventarios</h3>
            </div>
            <div className="box-body">
              <Row>
                <div className="col-md-12">
                  <BootstrapSelect
                    noneSelectedText="Todas"
                    displayItems={2}
                    selectedText="sucursales seleccionadas."
                    selected={filter.venues}
                    allOption={true}
                    selectAll={this.filterAllVenues}
                    options={venues.map((venue: any) => ({
                      value: venue._id,
                      text: venue.name
                    }))}
                    onClick={this.filterVenues}
                  />
                  <div id="inventory-monthly-report" style={{height: '400px', maxWidth: '100%'}} />
                </div>
              </Row>
            </div>
            {
              loading &&
                <div className="overlay">
                  <i className="fa fa-spinner fa-spin text-purple"/>
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

    const {filter} = this.props.inventoryDashboard;

    const venues = filter.venues.includes(value) ? filter.venues.filter((venue) => venue !== value) : [value, ...filter.venues]
    this.props.getInventoryDashboardFiltered({
      ...filter,
      venues: venues
    });
  }

  private filterAllVenues(value: boolean) {

    const { filter, venues} = this.props.inventoryDashboard;
    this.props.getInventoryDashboardFiltered({
      ...filter,
      venues: value ? venues.map((v) => v._id) : [],
    })

  }

  public updateDashboardChart()
  {
    const { monthly_report } = this.props.inventoryDashboard;

    let labelOption = {
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

    const xSerie = Object.keys(monthly_report);
    const found = Object.values(monthly_report).map((v) => v.found);
    const pending = Object.values(monthly_report).map((v) => v.pending);
    const leftover = Object.values(monthly_report).map((v) => v.leftover);
    const missing = Object.values(monthly_report).map((v) => v.missing);
    const reported = Object.values(monthly_report).map((v) => v.reported);

    const option: any = {
      color: ['#00aa51', '#ff9600', '#f1392c', '#00c2f4', '#96a4b3'],
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        x: 'center',
        bottom: 50,
        data: ['Encontrados', 'Sobrantes', 'Faltantes', 'Pendientes', 'Reportados']
      },
      calculable: true,
      xAxis: [
        {
          type: 'category',
          axisTick: {show: false},
          data: xSerie
        }
      ],
      yAxis: [
        {
          type: 'value'
        }
      ],
      grid: {
        top: 30,
        bottom: 100,
        // left
        x: 0,
        // right
        x2: 10,
        containLabel: true
      },
      series: [
        {
          name: 'Encontrados',
          type: 'bar',
          barMaxWidth: 100,
          label: labelOption,
          data: found
        },
        {
          name: 'Pendientes',
          type: 'bar',
          barMaxWidth: 100,
          label: labelOption,
          data: pending
        },
        {
          name: 'Sobrantes',
          type: 'bar',
          barMaxWidth: 100,
          label: labelOption,
          data: leftover
        },
        {
          name: 'Faltantes',
          type: 'bar',
          barMaxWidth: 100,
          label: labelOption,
          data: missing
        },
        {
          name: 'Reportados',
          type: 'bar',
          barMaxWidth: 100,
          label: labelOption,
          data: reported,
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

const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    getInventoryDashboard: () => dispatch(getInventoryDashboard()),
    getInventoryDashboardFiltered: (filter: IFilterCar) => dispatch(getInventoryDashboardFiltered(filter)),
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(InventoryDashboardView);
