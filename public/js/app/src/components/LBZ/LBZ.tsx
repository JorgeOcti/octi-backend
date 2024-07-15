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

export class LBZView extends TrackingBasePage<IPropsType, IStateType> {
  title: string;

  state = {
    error: null,
  };

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Preparación LBZ';
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public render() {
    return (
      <AppContainer title="Control" cMenu='3' cSubMenu='3.3'>
    <section className="content">
    <Row>
      <div className="col-md-12">
    <div className="box">
    <div className="box-header with-border"><h1 className="box-title">Control LBZ</h1>
    </div>
    <div className="box-body">
    <iframe
      src="https://lookerstudio.google.com/embed/reporting/17746362-2153-49fb-900b-58abc9a90fe3/page/tEnnC"
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
export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(LBZView);

