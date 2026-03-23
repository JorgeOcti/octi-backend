import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { Dispatch } from 'redux';
import {
  DashboardReduxAction,
  IDashboardState,
  IDashboardFilter,
} from '../../actions/dashboard.actions';
import TrackingBasePage from '../Utils/TrackingBasePage';
import DashboardVinView from '../DashboardVin/DashboardVinView';
import ApiService from '../../utils/axios';
import AppContainer from '../../container/AppContainer';

// Hardcoded kindForm - the only hardcoded value as per requirements
const KIND_FORM_AFORO_SAG = 'aforoSAG';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<DashboardReduxAction>;
  dashboard: IDashboardState;
}

interface IStateType {
  error: Error | null;
  forms: string[];
  loading: boolean;
}

class AforoSAGContainerDashboard extends TrackingBasePage<IPropsType, IStateType> {
  public title: string;
  private api: ApiService;

  readonly state: IStateType = {
    error: null,
    forms: [],
    loading: true,
  };

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Buscador de aforos SAG';
    this.api = new ApiService();
  }

  public componentDidMount(): void {
    this.fetchFormsByKind();
  }

  private async fetchFormsByKind(): Promise<void> {
    try {
      const response = await this.api.getFormsByKind(KIND_FORM_AFORO_SAG);
      const formIds = response.data.results?.map((form: any) => form._id) || undefined;
      this.setState({ forms: formIds, loading: false });
    } catch (error) {
      console.error('Error fetching forms by kind:', error);
      this.setState({ error: error as Error, loading: false });
    }
  }

  public render(): React.ReactElement<IPropsType> {
    const { forms, loading } = this.state;

    return forms && forms.length == 0 ? <AppContainer cMenu="6" cSubMenu="6.5">
      <section className="content">
        <div className='box'>
          <div className='box-body'>
            <p>No existen formularios de tipo "Aforo SAG" creados en el sistema. Por favor, contacte al administrador para más detalles.</p>
            </div>
        </div>
      </section>
    </AppContainer> : (
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

