import { RouteComponentProps } from 'react-router';
import { Dispatch } from 'redux';
import TrackingBasePage from '../Utils/TrackingBasePage';
import AppContainer from '../../container/AppContainer';
import * as React from 'react';
import { ErrorInfo } from 'react';
import * as Raven from 'raven-js';
import { connect } from 'react-redux';
import { getMyStudiosAction, IStatsDashboardState, StatsDashboardReducerAction } from '../../actions/statsDashboard.actions';
import { IStudio } from '../../../../../../src/stats/interfaces/studio.interface';
import Row from '../Utils/Row';
import { StatsDashboardTypes } from '../../../../../../src/stats/models/studio.types';

interface IPropsType extends RouteComponentProps<{ }> {
  dispatch: Dispatch<StatsDashboardReducerAction>;
  dashboard: IStatsDashboardState;
  getMyStudiosAction(type?: StatsDashboardTypes): void;
}

interface IStateType {
  error: Error | null;
  menu: string;
  cSubmenu: string;
  type: StatsDashboardTypes;
  tab: String;
}

class DashboardStatsView extends TrackingBasePage<IPropsType, IStateType> {
  title: string;
  state = {
    error: null,
    menu: "",
    cSubmenu: "",
    tab: "0",
    type: StatsDashboardTypes.UNIT_CONTROL,
  };

  constructor(props: IPropsType) {
    super(props);
    this.title = "Dashboard de Estadísticas";
  }

  public componentDidMount(): void {
    super.componentDidMount();
    this.props.getMyStudiosAction(this.state.type)
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public componentDidUpdate(prevProps: Readonly<IPropsType>, prevState: Readonly<IStateType>, snapshot?: any) {
    if (prevProps.dashboard.loading && !this.props.dashboard.loading && this.props.dashboard.studios.length > 0){
      this.setState({
        tab: this.props.dashboard.studios[0]._id as String
      })
    }
  }

  private changeTab(name: string): void {
    this.setState({
      tab: name
    });
  }


  render() {
    const {studios, loading} = this.props.dashboard;
    const { tab } = this.state;
    const selectedStudio : IStudio | undefined = studios.find((studio: IStudio) => studio._id === tab);
    return <AppContainer cMenu={this.state.menu} cSubMenu={this.state.cSubmenu}>
      <section className="content">
        <div className="box">
          <div className="box-header with-border">
            <h3 className="box-title">Dashboard de Estadísticas</h3>
          </div>
          <div className="box-body">
            {
              loading &&
              <div className="overlay">
                <i className="fa fa-spinner fa-spin text-purple"/>
              </div>
            }
            {
              !loading && studios.length == 0 &&
              <div className="row">
                <div className="col-md-12">
                  <p>No se han encontrado resultados.</p>
                </div>
              </div>
            }
            {!loading && studios.length > 0 &&
              <div className="col-md-12 col-lg-12">
                <div className="box box-solid">
                  <div className="nav-tabs-custom">
                    <ul className="nav nav-tabs">
                      {
                        studios.map((studio: any) => {
                          return (
                            <li className={tab === studio._id ? 'active' : ''} key={studio._id}>
                              <a
                                href="javascript:void(0);"
                                className={tab === studio._id ? 'background-transition' : ''}
                                style={{borderTop: '0', marginBottom: '0'}}
                                onClick={() => this.changeTab(studio._id)}
                              >{studio.name}</a>
                            </li>
                          )
                        })
                      }
                    </ul>
                  </div>
                </div>
              </div>
            }
            { selectedStudio &&
              <Row>
                <div className="col-md-12">
                  <div className="box">
                    <div className="box-body">
                      <iframe src={selectedStudio.embedURL} style={{width: "100%", minWidth: "1000px" ,minHeight: "500px", height: "100vh"}} allowFullScreen={true}  frameBorder={0} security={""}/>
                    </div>
                  </div>
                </div>
              </Row>
            }
          </div>
        </div>
      </section>
    </AppContainer>
  }
}

const mapStateToProps = (state: { statsDashboard: IStatsDashboardState }) => {
  return {
    dashboard: state.statsDashboard,
  };
};

const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    getMyStudiosAction: (type?: StatsDashboardTypes) => dispatch(getMyStudiosAction(type))
  };
};


class InventoryDashboardStatsView extends DashboardStatsView {
  state = {
    error: null,
    loading: true,
    menu: "2",
    cSubmenu: "2.5",
    type: StatsDashboardTypes.INVENTORY,
    tab: "",
  };
}

class UnitControlDashboardStatsView extends DashboardStatsView {
  state = {
    error: null,
    loading: true,
    menu: "1",
    cSubmenu: "1.7",
    type: StatsDashboardTypes.UNIT_CONTROL,
    tab: "",
  };
}

class DistributionDashboardStatsView extends DashboardStatsView {
  state = {
    error: null,
    loading: true,
    menu: "3",
    cSubmenu: "3.5",
    type: StatsDashboardTypes.DISTRIBUTION,
    tab: "",
  };
}

class PlanificationDashboardStatsView extends DashboardStatsView {
  state = {
    error: null,
    loading: true,
    menu: "3",
    cSubmenu: "3.5",
    type: StatsDashboardTypes.PLANIFICATION,
    tab: "",
  };
}

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(DashboardStatsView);
let VInventoryDashboardStatsView =  connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(InventoryDashboardStatsView);
let VUnitControlDashboardStatsView = connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(UnitControlDashboardStatsView);
let VDistributionDashboardStatsView = connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(DistributionDashboardStatsView);
let VPlanificationDashboardStatsView = connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(PlanificationDashboardStatsView);
export { VInventoryDashboardStatsView, VUnitControlDashboardStatsView, VDistributionDashboardStatsView, VPlanificationDashboardStatsView };
