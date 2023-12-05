import TrackingBasePage from '../Utils/TrackingBasePage';
import * as React from 'react';
import AppContainer from "../../container/AppContainer";
import Row from "../Utils/Row";
import {ICompaniesState} from "../../actions/companies.actions";
import {connect} from "react-redux";
import {Dispatch} from "redux";
import {
  IStatsDashboardState,
  StatsDashboardReducerAction
} from "../../actions/statsDashboard.actions";
import {RouteComponentProps} from "react-router";
import {ErrorInfo} from "react";
import * as Raven from "raven-js";

interface IPropsType extends RouteComponentProps<{ }> {
  dispatch: Dispatch<StatsDashboardReducerAction>;
  dashboard: IStatsDashboardState;
}

interface IStateType {
  error: Error | null;
}

export class TraceabilityView extends TrackingBasePage<IPropsType, IStateType> {
  title: string;

  state = {
    error: null,
  };

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Trazabilidad';
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public render() {
    return (
      <AppContainer title="" cMenu='3' cSubMenu='3.1'>
        <section className="content">
          <Row>
            <div className="col-md-12">
              <div className="box">
                <div className="box-header with-border"><h1 className="box-title">Trazabilidad de Unidades</h1>
                </div>
                <div className="box-body">
                  <iframe
                    src="https://lookerstudio.google.com/embed/reporting/26cdb2d8-2190-4278-8781-da8c77ef77d9/page/i0GkD"
                    style={{width: "100%", minWidth: "1000px", minHeight: "500px", height: "100vh"}}
                    allowFullScreen={true}
                    frameBorder={0}
                    security={""}
                  />
                </div>
              </div>
            </div>
          </Row>
        </section>
      </AppContainer>
    );
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
  };
};
export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(TraceabilityView);

