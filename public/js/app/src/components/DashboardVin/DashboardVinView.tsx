import * as React from 'react';
import AppContainer from "../../container/AppContainer";
import {connect} from "react-redux";
import {Dispatch} from "redux";
import {RouteComponentProps} from "react-router";
import {DashboardReduxAction, getCarsAction, IDashboardState} from "../../actions/dashboard";
import * as PropTypes from "prop-types";


interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<DashboardReduxAction>;
  dashboard: IDashboardState;

  getCarsAction(): void;
}

interface IStateType {
  error: Error | null;
}

class DashboardVinView extends React.Component<IPropsType, IStateType> {

  static propTypes = {
    dashboard: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    getUsersAction: PropTypes.func.isRequired,
  };

  componentWillMount(){
    // set the title of the page
    document.title = 'OSA Andes | Listado de VINs';
    this.props.getCarsAction();
  }

  render() {
    return (
      <AppContainer title='' cMenu='1' cSubMenu='1.1' cAction='List'>
        <section className="content">
          <div className="box">
            <div className="box-header with-border"><h3 className="box-title">Listado de VINs</h3>
              <div className="box-tools pull-right">
              </div>
            </div>
            <div className="box-body">Start creating your amazing application!!</div>
            {/*<div className="box-footer">Footer</div>*/}
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

// const mapDispatchToProps = (dispatch: Dispatch<UserReduxAction> ) => {
const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    getCarsAction: () => dispatch(getCarsAction()),
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(DashboardVinView);

