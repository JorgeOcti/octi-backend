import {DashboardTimingView, IPropsType} from "./CustomDashboardComponent";
import {IWindow} from "../../interfaces/window";
import {connect} from "react-redux";
import {ICompaniesState} from "../../actions/companies.actions";

declare let window: IWindow;

class CustomInventoryAnalysis extends DashboardTimingView {

  cMenu : string = '2';
  cSubMenu : string = '2.5';

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Análisis inventario';
  }

  public getDashboardURL() : string{
    return window.user.company.iFrameURLInventory;
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

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(CustomInventoryAnalysis);
