import TrackingBasePage from '../../Utils/TrackingBasePage';
import { RouteComponentProps } from 'react-router';
import { Dispatch } from 'redux';
import * as React from 'react';
import { ErrorInfo } from 'react';
import { connect } from 'react-redux';
import BillingSettingsActions from '../../../actions/billingSettings.actions';
import { IBillingSettingsActionTypes, IBillingSettingsState } from '../../../actions/billingSettings.types';
import AppContainer from '../../../container/AppContainer';
import * as Raven from 'raven-js';
import ModalView from '../../Modal/ModalView';
import { loadDataAction, ModalReduxAction } from '../../../actions/modal.actions';
import * as moment from 'moment-timezone';
import ShowIf from '../../Utils/ShowIf';
import ApiService from '../../../utils/axios';
import BootstrapSelect from '../../Utils/BootstrapSelect';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  router: any;
  dispatch: Dispatch<IBillingSettingsActionTypes>;
  billingSettings: IBillingSettingsState;
  billingSettingsActions: BillingSettingsActions;

  loadDataAction(title: string, body: JSX.Element, footer: JSX.Element): ModalReduxAction;
}

interface IStateType {
  error: Error | null;
}

class BillingCoporateListView extends TrackingBasePage<IPropsType, IStateType> {
  title: string;
  private api: ApiService;

  readonly state = {
    error: null
  };

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Billing Corporativo';
    this.api = new ApiService();
    this.selectPeriod = this.selectPeriod.bind(this);
    this.makeRangeMonths = this.makeRangeMonths.bind(this);
  }

  public componentWillMount(): void {
    const { billingSettingsActions } = this.props;
    billingSettingsActions.getInvoice({});
  }

  public componentDidMount(): void {
    super.componentDidMount();
  }

  public componentDidUpdate(prevProps: IPropsType): void {
    $('[data-toggle="tooltip"]').tooltip();
  }

  public componentWillUnmount(): void {
    // cancel request if component is inmounted
    if (this.props.billingSettings.source) {
      this.props.billingSettings.source.cancel('Operation canceled by the user.');
    }
    // this.socket.emit('leave', { room: `distribution-list-${window.user.team._id}` });
    // this.socket.disconnect();
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error });
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public render(): React.ReactElement<IPropsType> {
    const { loading, invoice } = this.props.billingSettings;
    return (
      <AppContainer title={''} cMenu='200' cSubMenu='200.4'>
        <section className='content'>
          <div className='row'>
            <div className='col-md-12'>
              <div className='box'>
                <div className='box-header with-border'>
                  <h3 className='box-title'>Billing {moment(`${invoice?.period}01`, 'YYYYMMDD').format('MMMM YYYY')}</h3>
                  <div className='box-tools pull-right'>
                    <button
                      className='btn btn-default btn-sm'
                      onClick={
                        () => window.open(`/settings/billing/pdf-corporate/${invoice?._id}`, '_blank')
                      }
                    >
                      PDF
                    </button>
                    <button
                      className='btn btn-primary btn-sm'
                      style={{ marginLeft: '5px' }}
                      onClick={
                        () => window.open(`/settings/billing/export/?period=${invoice?.period}`, '_blank')
                      }
                    >
                      Exportar
                    </button>
                  </div>
                </div>
                <div className={`box-body`}>
                  <div className='row'>
                    <div className='col-md-12'>
                      <div className={'pull-right'} style={{ width: '200px' }}>
                        <BootstrapSelect
                          noneSelectedText='Seleccione un periodo'
                          displayItems={2}
                          sm={true}
                          selectedText='periodos seleccionadas.'
                          selected={invoice?.period ? [invoice.period] : []}
                          autoClouse={true}
                          allOption={false}
                          selectAll={() => ({})}
                          options={this.makeRangeMonths()}
                          onClick={this.selectPeriod}
                        />
                      </div>
                    </div>
                    <div className='col-md-6 text-right'>{}
                    </div>
                  </div>
                  <div className='row'>
                    <div className='col-md-5' style={{ padding: '15px' }}>
                      <div style={{ fontSize: '120%' }}>Módulo Control de Stock</div>
                      <ShowIf condition={!!(invoice && invoice.totalDolar <= invoice.teamBilling.baseCost)}>
                        <div className='alert alert-danger' style={{ margin: '10px 0' }}>{invoice?.teamBilling.textBaseCost}</div>
                      </ShowIf>
                      <ShowIf condition={!!(invoice && invoice.totalDolar > invoice.teamBilling.baseCost)}>
                        {
                          invoice?.teamBilling.modules.map((module, index) => {
                            const section = module.sections.find((section) => invoice.total >= section.start && invoice.total <= section.end);
                            if (section) {
                              return (
                                <div key={index}>
                                  <div className='alert alert-success'>{section?.text}</div>
                                </div>
                              );
                            }
                            return null;
                          })
                        }
                      </ShowIf>
                    </div>
                    <div className='col-md-5' style={{ padding: '15px' }}>
                      <div style={{ fontSize: '120%' }}>{new Intl.NumberFormat('de-DE').format(invoice?.total as number)} unidades controladas</div>
                      <div>
                        <ShowIf condition={!!(invoice && invoice.totalDolar > invoice.teamBilling.baseCost)}>
                          {
                            invoice?.teamBilling.modules.map((module, index) => {
                              let totalInModule = invoice.total;
                              return module.sections.sort((a: any, b: any) => {
                                if (a.start < b.start) {
                                  return -1;
                                }
                                if (a.start > b.start) {
                                  return 1;
                                }
                                return 0;
                              }).map((section) => {
                                if (totalInModule > 0) {
                                  const totalInSection = totalInModule >= section.end ? section.end : totalInModule;
                                  totalInModule = totalInModule - totalInSection;
                                  return (
                                    <div key={index} className={'text-muted'}>
                                      {new Intl.NumberFormat('de-DE').format(totalInSection)} a {new Intl.NumberFormat('de-DE').format(section.price)} USD
                                    </div>
                                  );
                                }
                                return null;
                              });
                            })
                          }
                        </ShowIf>
                      </div>
                    </div>
                    <div className='col-md-2 text-right' style={{ padding: '15px' }}>
                      <div style={{ fontSize: '120%' }}>{new Intl.NumberFormat('de-DE').format(invoice?.totalDolar as number)} USD</div>
                    </div>
                    <div className='col-md-12'>
                      <table className='table'>
                        <thead>
                        <tr>
                          <th>Empresa</th>
                          <th></th>
                          <th></th>
                        </tr>
                        </thead>
                        <tbody>
                        {
                          invoice?.companies.map((company, index) => (
                            <tr key={index}>
                              <td><strong>{company.company.name}</strong></td>
                              <td>{new Intl.NumberFormat('de-DE').format(company.histories.length)} unidades únicas</td>
                              <td></td>
                            </tr>
                          ))
                        }
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {/*{JSON.stringify(invoice)}*/}
                </div>
                {/*<div className='box-footer text-right'>*/}
                {/*</div>*/}
                <ShowIf condition={loading}>
                  <div className='overlay'>
                    <i className='fa fa-spinner fa-spin text-purple' />
                  </div>
                </ShowIf>
              </div>
            </div>
          </div>
          <ModalView />
        </section>
      </AppContainer>
    );
  }

  private makeRangeMonths() {
    const { oldest, last } = this.props.billingSettings;
    const months = [];
    const lastDate = moment(last).clone();
    while (lastDate?.isSameOrAfter(oldest)) {
      months.push({
        value: lastDate.format('YYYYMM'),
        text: lastDate.format('MMMM YYYY').toUpperCase()
      });
      lastDate?.subtract(1, 'month');
    }
    return months;
  }

  private selectPeriod(value: any): void {
    const { billingSettingsActions } = this.props;
    billingSettingsActions.getInvoice({ period: value });
  }

}

const mapStateToProps = (state: { billingSettings: IBillingSettingsState, router: any }) => {
  return {
    billingSettings: state.billingSettings,
    router: state.router
  };
};

const mapDispatchToProps = (dispatch: any) => {
  const billingSettingsActions = new BillingSettingsActions(dispatch);
  return {
    dispatch,
    billingSettingsActions,
    loadDataAction: (title: string, body: JSX.Element, footer: JSX.Element) => dispatch(loadDataAction(title, body, footer))
  };
};


export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(BillingCoporateListView);
