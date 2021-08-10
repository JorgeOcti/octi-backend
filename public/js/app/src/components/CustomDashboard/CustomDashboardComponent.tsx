import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import AppContainer from '../../container/AppContainer';
import Row from '../Utils/Row';
import TrackingBasePage from "../Utils/TrackingBasePage";
import {CompaniesReduxAction, ICompaniesState} from "../../actions/companies.actions";
import {connect} from "react-redux";
import {IWindow} from "../../interfaces/window";

declare let window: IWindow;

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<CompaniesReduxAction>;
  dashboard: ICompaniesState;
}

interface IStateType {
  error: Error | null;
  showDrilldown: boolean,
  selectedDate: string | null,
  from: Date,
  to: Date,
}

class DashboardTimingView extends TrackingBasePage<IPropsType, IStateType> {
  public title: string;
  public cMenu  : string = "1";
  public cSubMenu  : string = "1.7";

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Reporte personalizado';
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public getDashboardURL() : string{
    return window.user.company.iFrameURL;
  }

  public render(): React.ReactElement<IPropsType> {
    return (
      <AppContainer title="" cMenu={this.cMenu} cSubMenu={this.cSubMenu}>
        <section className="content">
          <Row>
            <div className="col-md-12">
              <div className="box">
                <div className="box-header with-border"><h1 className="box-title">Dashboard de análisis de datos</h1>
                </div>
                <div className="box-body">
                  <iframe src={this.getDashboardURL()} style={{width: "100%", minWidth: "1000px" ,minHeight: "500px", height: "100vh"}} allowFullScreen={true}  frameBorder={0} security={""}/>
                </div>
              </div>
            </div>
          </Row>
        </section>
      </AppContainer>
    );
  }
}

const mapStateToProps = (state: { dashboardTiming: ICompaniesState }) => {
  return {
    dashboard: state.dashboardTiming
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch,
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(DashboardTimingView);
