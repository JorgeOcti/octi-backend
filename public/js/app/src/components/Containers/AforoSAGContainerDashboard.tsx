import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { Dispatch } from 'redux';
import {
  DashboardReduxAction,
  IDashboardState,
  IDashboardFilter,
} from '../../actions/dashboard.actions';
import { IWindow } from '../../interfaces/window';
import TrackingBasePage from '../Utils/TrackingBasePage';
import DashboardVinView from '../DashboardVin/DashboardVinView';

declare let window: IWindow;

// TODO: Replace this placeholder form ID with the actual SAG form ID
const AFORO_SAG_FORM_ID = 'PLACEHOLDER_FORM_ID_CHANGE_ME';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<DashboardReduxAction>;
  dashboard: IDashboardState;
}

interface IStateType {
  error: Error | null;
}

class AforoSAGContainerDashboard extends TrackingBasePage<IPropsType, IStateType> {
  public title: string;

  readonly state: IStateType = {
    error: null,
  };
  constructor(props: IPropsType) {
    super(props);
    this.title = 'Buscador de aforos SAG';
  }

  public render(): React.ReactElement<IPropsType> {

    let forms: string[] = [];

    // TODO: Update this condition with the correct company ID for Aforo SAG
    if (window.user.company._id === 'PLACEHOLDER_COMPANY_ID_CHANGE_ME') {
      forms = [AFORO_SAG_FORM_ID]
    }

    return (
      <DashboardVinView formsId={forms}
        history={this.props.history}
        location={this.props.location}
        match={this.props.match}
        dispatch={this.props.dispatch}
        dashboard={this.props.dashboard}
        menu={'6'}
        subMenu={'6.5'}
        getRevisionsThunkAction={function (page: number, loading: boolean, search?: string | undefined, forms?: string[] | undefined): void {
          throw new Error('Function not implemented.');
        }}
        getParticipant={function (id: string): void {
          throw new Error('Function not implemented.');
        }}
        getRevisionsAction={function (page: number, loading: boolean, search?: string | undefined, forms?: string[] | undefined): void {
          throw new Error('Function not implemented.');
        }}
        changeFilterDashboardAction={function (filter: IDashboardFilter, forms?: string[] | undefined): void {
          throw new Error('Function not implemented.');
        }}
        changingParticipantAnswer={function (revisionId: string, answer: string): void {
          throw new Error('Function not implemented.');
        }}
      />
    );
  }
}

const mapStateToProps = (state: any): Partial<IPropsType> => {
  return {
    dashboard: state.dashboard,
  };
};

const mapDispatchToProps = (dispatch: Dispatch<DashboardReduxAction>): Partial<IPropsType> => {
  return {
    dispatch,
  };
};

export default connect<{}, {}, IPropsType>(
  mapStateToProps,
  mapDispatchToProps
)(AforoSAGContainerDashboard);
