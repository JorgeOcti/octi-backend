import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from "react";
import AppContainer from "../../container/AppContainer";
import {connect} from "react-redux";
import {Dispatch} from "redux";
import {RouteComponentProps} from "react-router";
import {DashboardReduxAction, getParticipantsPerDateAction, IDashboardState} from "../../actions/dashboard";
import * as PropTypes from "prop-types";

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<DashboardReduxAction>;
  dashboard: IDashboardState;

  getParticipantsPerDateAction(): void;
}

interface IStateType {
  error: Error | null;
}

class DashboardGeneralView extends React.Component<IPropsType, IStateType> {

  participantsPerDayChart: any;

  static propTypes = {
    dashboard: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    getParticipantsPerDateAction: PropTypes.func.isRequired,
  };

  constructor(props: IPropsType) {
    super(props);
    this.resizeCharts = this.resizeCharts.bind(this)
  }

  componentWillMount(){
    // set the title of the page
    document.title = 'OSA Andes | Reportes generales';
    this.props.getParticipantsPerDateAction();
    window.addEventListener('resize', this.resizeCharts, false);
  }


  private resizeCharts() {
    if (this.participantsPerDayChart != null && this.participantsPerDayChart != undefined) {
      this.participantsPerDayChart.resize();
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  componentDidUpdate(prevProps: IPropsType, prevState: IStateType) {
    const {participantsPerDate, loading} = this.props.dashboard;

    const $participantPerDate = document.getElementById('participant-per-date') as HTMLDivElement;
    const categories: any[] = [];
    const totals: any[] = [];

    if (participantsPerDate.length) {
      participantsPerDate.forEach((day) => {
        categories.push(day._id);
        totals.push(day.total);
      });
    }
    if ($participantPerDate && !loading) {
      this.participantsPerDayChart = echarts.init($participantPerDate);
      const option = {
        title: {
          text: 'Revisiones realizadas por día',
          x:'center',
          textStyle: {
            align: 'center',
          }
        },
        tooltip: {
        },
        xAxis: {
          type: 'category',
          data: categories,
          axisLine: {
            lineStyle: {
              color: '#9b9b9b',
              width: 0.5
            }
          }
        },
        yAxis: {
          type: 'value',
          axisLine: {
            lineStyle: {
              color: '#9b9b9b',
              width: 0.5
            }
          }
        },
        grid: {
          // borderColor: '#FF0000'
        },
        series: [{
          data: totals,
          // itemStyle: {
          //   normal: {
          //     areaStyle: {
          //       type: 'default',
          //       color: '#0081da',
          //       opacity: 0.4
          //     }
          //   }
          // },
          // lineStyle: {
          //   normal: {
          //     color: '#006faf',
          //     // opacity: 0.1
          //   }
          // },
          // data: [{
          //   value: 820,
          //   name: '2018-06-05',
          //   itemStyle: {
          //     color: '#c23531'
          //   }
          // }],
          type: 'line',
          smooth: true
        }],
        color: ["#006faf", ]
      };
      console.log('option', option);
      this.participantsPerDayChart.setOption(option);
    }
  }

  public componentWillUnmount(){
    // cancel request if component is inmounted
    window.removeEventListener('resize', this.resizeCharts, false);
    if (this.props.dashboard.source) {
      this.props.dashboard.source.cancel('Operation canceled by the user.');
    }
  }

  public render(): React.ReactElement<IPropsType> {
    const {loading, cars} = this.props.dashboard;
    return (
      <AppContainer title='' cMenu='1' cSubMenu='1.1'>
        <section className="content">
          <div className="box">
            <div className="box-header with-border"><h3 className="box-title">Dashboard General</h3>
              <div className="box-tools pull-right">
              </div>
            </div>
            <div className="box-body">
              <div id="participant-per-date" style={{height: '400px', maxWidth:'100%'}} />
            </div>
            {/*<div className="box-footer">Footer</div>*/}
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
}

const mapStateToProps = (state: { dashboard: IDashboardState }) => {
  return {
    dashboard: state.dashboard
  };
};

const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    getParticipantsPerDateAction: () => dispatch(getParticipantsPerDateAction()),
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(DashboardGeneralView);

