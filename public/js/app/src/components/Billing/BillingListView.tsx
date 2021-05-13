import * as moment from 'moment';
import * as Raven from 'raven-js';
import * as React from 'react';
import { ErrorInfo } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { Dispatch } from 'redux';
import {
  BillingReduxAction,
  getBillingAction,
  IBillingState
} from '../../actions/billing.actions';
import AppContainer from '../../container/AppContainer';
import ModalView from '../Modal/ModalView';
import Paginator from '../Utils/Paginator';
import TrackingBasePage from '../Utils/TrackingBasePage';

interface IPropsType extends RouteComponentProps<{ }> {
  dispatch: Dispatch<BillingReduxAction>;
  billing: IBillingState;

  getBillingAction(page: number): BillingReduxAction;
}

interface IStateType {
  error: Error | null;
}

class BillingListView extends TrackingBasePage<IPropsType, IStateType> {
  title : string;

  readonly state = {
    error: null
  };

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Billing';
    this.changePage = this.changePage.bind(this);
  }

  public componentWillMount(): void {
    const {pagination} = this.props.billing;
    this.props.getBillingAction(pagination.page);
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public componentDidUpdate(prevProps: Readonly<IPropsType>, prevState: Readonly<IStateType>, snapshot?: any): void {
    if(this.props.billing.pagination !== prevProps.billing.pagination){
      window.scrollTo(0, 0);
    }
  }

  public componentDidMount(): void {
    super.componentDidMount();
    window.scrollTo(0, 0);
  }

  public componentWillUnmount(): void {
    // cancel request if component is inmounted
    if (this.props.billing.source) {
      this.props.billing.source.cancel('Operation canceled by the user.');
    }
  }

  public render() {
    const {pagination, loading, invoices} = this.props.billing;
    return (
      <AppContainer title="" cMenu="10" cSubMenu="10.8" cAction="Detalle">
        <section className="content">
          <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">Billing <small>{pagination.count}</small></h3>
            </div>
            <div className={`box-body ${invoices.length ? 'no-padding' : ''}`}>
              {
                !loading && !invoices.length?
                  <div className="row">
                    <div className="col-md-12">
                      <p>No se han encontrado resultados.</p>
                    </div>
                  </div>
                  :null
              }
              {
                invoices.length ?
                  <table className="table">
                    <thead>
                      <tr>
                        <th className="middle">Período</th>
                        <th className="middle">Empresa</th>
                        <th className="middle">Unidades en Inventario</th>
                        <th className="middle">Unidades en Checklist</th>
                        <th className="middle">Unidades en Solicitudes</th>
                        {/*<th className="middle">Valor Inventario</th>*/}
                        {/*<th className="middle">Valor Checklist</th>*/}
                        <th className="middle">Total</th>
                        <th style={{width: '80px'}} />
                      </tr>
                    </thead>
                    <tbody>
                      {
                        invoices.map((invoice)=>(
                          <tr key={invoice._id}>
                            <td>
                              {
                                moment(invoice.createdAt).subtract(1, 'month').format('MMMM YYYY')
                              }
                            </td>
                            <td>{invoice.company.name}</td>
                            <td>{invoice.inventoryCars}</td>
                            <td>{invoice.checklistCars}</td>
                            <td>{invoice.requestCars}</td>
                            {/*<td>{invoice.inventoryPrice} UF</td>*/}
                            {/*<td>{invoice.checklistPrice} UF</td>*/}
                            <td>{invoice.totalUF.toFixed(2)} UF</td>
                            <td>
                              <button
                                className="btn btn-xs btn-primary hidden-xs"
                                onClick={()=> window.open(`/settings/billing/pdf/${invoice._id}`,'_blank')}
                              >
                                <i className="fa fa-fw fa-download" /> Billing
                              </button>
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                  : null
              }
            </div>
            {
              pagination.pages > 1 &&
              <div className="box-footer text-right">
                <Paginator changePage={this.changePage} page={pagination.page} pages={pagination.pages}/>
              </div>
            }
            {
              loading &&
              <div className="overlay">
                <i className="fa fa-spinner fa-spin text-purple"/>
              </div>
            }
          </div>
          <ModalView/>
        </section>
      </AppContainer>
    );
  }

  private changePage(page: number): void {
    // change the page
    this.props.getBillingAction(page);
  }
}

const mapStateToProps = (state: { billing: IBillingState }) => {
  return {
    billing: state.billing
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch,
    getBillingAction: (page: number) => dispatch(getBillingAction(page))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(BillingListView);
