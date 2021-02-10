import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Dispatch } from 'redux';
import { DashboardReduxAction, IDashboardState } from '../../actions/dashboard.actions';
import AppContainer from '../../container/AppContainer';
import CircleChartCard from './CircleChartCard';
import InfoCard, { CardColors } from './InfoCard';

interface IPropsType extends RouteComponentProps<{}> {
  dispatch: Dispatch<DashboardReduxAction>;
  dashboard: IDashboardState;
  getRevisionsResume(): void;
}

interface IStateType {
  error: Error | null;
  loading: boolean;
}

class DashboardRevisionsView extends React.Component<IPropsType, IStateType> {
  readonly state: IStateType = {
    error: null,
    loading: false
  };

  constructor(props: IPropsType) {
    super(props);
  }

  public render() {
    const { loading } = this.state;
    return (
      <AppContainer title="" cMenu="1" cSubMenu="1.3">
        <section className="content">
          <div className="row" style={{ marginTop: '10px' }}>
            <InfoCard
              icon="fa-search"
              title="REVISIONES HOY" value={9}
              className="col-md-3 col-lg-3"
            />
            <InfoCard
              className="col-md-3 col-lg-3"
              icon="fa-caret-up"
              iconBackgroundColor={CardColors.GREEN}
              title="REVISIONES ÚLTIMO DÍA"
              value={9}>
              <span className="green font-normal font-14" > (+2% vs mes anterior)</span>
            </InfoCard>
            <InfoCard
              className="col-md-3 col-lg-3"
              icon="fa-caret-down"
              iconBackgroundColor={CardColors.RED}
              title="PROMEDIO DIARIO MES"
              value={9}>
              <span className="red font-normal font-14" > (-2% vs mes anterior)</span>
            </InfoCard>
            <InfoCard
              className="col-md-3 col-lg-3"
              icon="fa-search"
              title="TOTAL REVISIONES"
              value={9}
            />
          </div>
          <div className="box">
            <div className="box-header with-border bg-">
              <h3 className="box-title">Reporte Revisiones</h3>
            </div>
            <div className="box-body">
              <div className="row">
                <CircleChartCard className="col-md-4" title="% ACEPTA REVISIÓN (Pórtico)" value={99} />
                <CircleChartCard className="col-md-4" title="SUCURSALES ACTIVAS MES" value={70}>
                  <div>
                    <span className="info-box-text">ACEPTA RECEPCIÓN 98%</span>
                    <span className="info-box-text">ACEPTA DESPACHO 100%</span>
                  </div>
                </CircleChartCard>
              </div>
            </div>
          </div>
        </section>
      </AppContainer>
    );
  }

}

export default DashboardRevisionsView;
