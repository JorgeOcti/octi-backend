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

    this.filterVenues = this.filterVenues.bind(this);
    this.filterAllVenues = this.filterAllVenues.bind(this);
  }

  public componentWillMount(): void {
    // set the title of the page
    document.title = 'OSA Andes | Inventarios';
    window.scrollTo(0, 0);

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

  private filterVenues(value: any) {

    const {filter} = this.props.inventoryDashboard;

    const venues = filter.venues.includes(value) ? filter.venues.filter((venue) => venue !== value) : [value, ...filter.venues]
    this.props.getInventoryDashboardFiltered({
      ...filter,
      venues: venues
    });
  }

  private filterAllVenues(value: any) {

    const { filter, venues} = this.props.inventoryDashboard;
    this.props.getInventoryDashboardFiltered({
      ...filter,
      venues: venues.map((v) => v._id)
    })

  }

  public updateDashboardChart()
  {
    const { monthly_report } = this.props.inventoryDashboard;

    console.log("lala");

    var posList = [
      'left', 'right', 'top', 'bottom',
      'inside',
      'insideTop', 'insideLeft', 'insideRight', 'insideBottom',
      'insideTopLeft', 'insideTopRight', 'insideBottomLeft', 'insideBottomRight'
    ];

    let labelOption = {
      normal: {
        show: true,
        fontSize: 16,
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
      color: ['#003366', '#006699', '#4cabce', '#e5323e'],
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: ['Encontrados', 'Pendientes', 'Sobrantes', 'Faltantes', 'Reportados']
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
      series: [
        {
          name: 'Encontrados',
          type: 'bar',
          barGap: 0,
          label: labelOption,
          data: found
        },
        {
          name: 'Pendientes',
          type: 'bar',
          label: labelOption,
          data: pending
        },
        {
          name: 'Sobrantes',
          type: 'bar',
          label: labelOption,
          data: leftover
        },
        {
          name: 'Faltantes',
          type: 'bar',
          label: labelOption,
          data: missing
        },
        {
          name: 'Reportados',
          type: 'bar',
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
    getInventoryDashboard: (filter: IFilterCar) => dispatch(getInventoryDashboard(filter)),
    getInventoryDashboardFiltered: (filter: IFilterCar) => dispatch(getInventoryDashboardFiltered(filter)),
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(InventoryDashboardView);
