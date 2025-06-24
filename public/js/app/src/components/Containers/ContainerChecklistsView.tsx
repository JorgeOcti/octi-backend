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

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<DashboardReduxAction>;
  dashboard: IDashboardState;
}

interface IStateType {
  error: Error | null;
}

class AforoContainerDashboard extends TrackingBasePage<IPropsType, IStateType> {
  public title: string;

  readonly state: IStateType = {
    error: null,
  };
  constructor(props: IPropsType) {
    super(props);
    this.title = 'Buscador de aforos';
  }

  public render(): React.ReactElement<IPropsType> {

    let forms : string[] = [];

    if (window.user.company._id === '5b590abca9683b0413293aa1') { // OSA
      forms = ['685ac8676c276d713ec75d59']
    } else if (window.user.company._id == '67aac64a94ed0a1f9da3478c') { // Medlog
      forms = ['681917760000000000f5da10']
    }

    return (
      <DashboardVinView formsId={forms}
                        history={this.props.history}
                        location={this.props.location}
                        match={this.props.match}
                        dispatch={this.props.dispatch}
                        dashboard={this.props.dashboard}
                        menu={'6'}
                        subMenu={'6.4'}
                        getRevisionsThunkAction={function(page: number, loading: boolean, search?: string | undefined, forms?: string[] | undefined): void {
                          throw new Error('Function not implemented.');
                        }}
                        getParticipant={function(id: string): void {
                          throw new Error('Function not implemented.');
                        }}
                        getRevisionsAction={function(page: number, loading: boolean, search?: string | undefined, forms?: string[] | undefined): void {
                          throw new Error('Function not implemented.');
                        }}
                        changeFilterDashboardAction={function(filter: IDashboardFilter, forms?: string[] | undefined): void {
                          throw new Error('Function not implemented.');
                        }}
                        changingParticipantAnswer={function(revisionId: string, answer: string): void {
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
)(AforoContainerDashboard);
