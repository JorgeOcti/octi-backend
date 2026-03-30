import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import * as swal from 'sweetalert';
import {IBaseCompany, ICompany} from '../../../../../../src/app/interfaces/company.interface';
import {
  changeTempClientCompanyAction,
  ClientCompaniesReduxAction,
  getClientCompaniesAction,
  IClientCompaniesState,
  updateClientCompanyAction
} from '../../actions/clientCompanies.actions';
import {loadDataAction, ModalReduxAction} from '../../actions/modal.actions';
import AppContainer from '../../container/AppContainer';
import {IWindow} from '../../interfaces/window';
import {hasPermission} from '../../utils/common';
import ModalView from '../Modal/ModalView';
import Paginator from '../Utils/Paginator';
import ClientCompaniesFormView from './ClientCompaniesFormView';
import TrackingBasePage from '../Utils/TrackingBasePage';

interface IPropsType extends RouteComponentProps<{ company: string }> {
  dispatch: Dispatch<ClientCompaniesReduxAction>;
  clientCompanies: IClientCompaniesState;

  getClientCompaniesAction(page: number): ClientCompaniesReduxAction;
  updateClientCompanyAction(): ClientCompaniesReduxAction;
  changeTempClientCompanyAction(company: IBaseCompany): ClientCompaniesReduxAction;
  loadDataAction(title: string, body: JSX.Element, footer: JSX.Element): ModalReduxAction;
}

interface IStateType {
  error: Error | null;
}

declare let window: IWindow;

class ClientCompaniesListView extends TrackingBasePage<IPropsType, IStateType> {
  title: string;

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Listado de empresas cliente';
    this.editCompany = this.editCompany.bind(this);
    this.processUpdateCompany = this.processUpdateCompany.bind(this);
  }

  componentDidMount() {
    super.componentDidMount();
  }

  public componentWillMount(): void {
    const {pagination} = this.props.clientCompanies;
    this.props.getClientCompaniesAction(pagination.page);
  }

  public componentWillUnmount(): void {
    if (this.props.clientCompanies.source) {
      this.props.clientCompanies.source.cancel('Operation canceled by the user.');
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({error});
    Raven.captureException(error, {extra: errorInfo});
  }

  public render(): React.ReactElement<IPropsType> {
    const {loading, companies, pagination} = this.props.clientCompanies;
    return (
      <AppContainer title="" cMenu="10" cSubMenu="10.12" cAction="Listado">
        <section className="content">
          <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">Empresas Cliente <small>{pagination.count}</small></h3>
            </div>
            <div className="box-body no-padding">
              <table className="table table-andes table-striped">
                <thead>
                  <tr>
                    <th style={{width: '80px'}} className="middle">Logo</th>
                    <th style={{width: '80%'}} className="middle">Nombre</th>
                    {
                      hasPermission(window.user, 'changeCompany') ?
                        <th style={{width: '1%'}} className="width-10"/> : null
                    }
                  </tr>
                </thead>
                <tbody>
                  {
                    companies.map((company: ICompany) => {
                      return (
                        <tr
                          key={company._id}
                          id={`client-company-${company._id}`}
                          className={'background-transition'}
                        >
                          <td className="middle text-center">
                            {
                              company.image && company.image.url ?
                                <img
                                  src={decodeURI(company.image.url)}
                                  alt={company.name}
                                  style={{maxHeight: '40px', maxWidth: '70px', objectFit: 'contain'}}
                                /> :
                                <i className="fa fa-building-o text-muted fa-lg"/>
                            }
                          </td>
                          <td className="middle">
                            <strong className="text-primary">{company.name}</strong><br/>
                            <span className="text-sm text-muted">
                              {company?.businessName ?? ''} - {company?.rut ?? ''}
                            </span>
                          </td>
                          {
                            hasPermission(window.user, 'changeCompany') ?
                              <td
                                className="middle text-blue pointer"
                                onClick={() => this.editCompany(company)}>
                                <i className="fa fa-pencil"/>
                              </td> : null
                          }
                        </tr>
                      );
                    })
                  }
                </tbody>
              </table>
            </div>
            {
              pagination.pages > 1 &&
                <div className="box-footer text-right">
                  <Paginator changePage={this.props.getClientCompaniesAction} page={pagination.page} pages={pagination.pages} />
                </div>
            }
            {
              loading &&
                <div className="overlay">
                  <i className="fa fa-spinner fa-spin text-purple"/>
                </div>
            }
          </div>
          <ModalView />
        </section>
      </AppContainer>
    );
  }

  private editCompany(company: ICompany): void {
    const {_id, name, businessName, rut, image} = company;
    this.props.changeTempClientCompanyAction({
      _id,
      name,
      businessName,
      rut,
      image: null,
      marker: null,
      imageURI: image && image.hasOwnProperty('url') ? decodeURI(image.url) : null,
      markerURI: null,
      billing: {
        active: false,
        checklistPrice: 0.0,
        inventoryPrice: 0.0,
        requestPrice: 0.0,
        deliveryPrice: 0.0
      },
      notifications: []
    });
    setTimeout(() => {
      this.props.loadDataAction(
        'Editar Empresa Cliente',
        <ClientCompaniesFormView />,
        <React.Fragment>
          <button type="button" className="btn btn-sm btn-default" data-dismiss="modal">Cancelar</button>
          <button type="button" className="btn btn-sm btn-primary" onClick={this.processUpdateCompany}>Editar</button>
        </React.Fragment>
      );
    }, 400);
  }

  private processUpdateCompany(): void {
    const {name} = this.props.clientCompanies.tempCompany;
    if (!name || !name.trim()) {
      swal('Editar Empresa Cliente', 'El nombre es requerido', 'error');
    } else {
      this.props.updateClientCompanyAction();
    }
  }
}

const mapStateToProps = (state: { clientCompanies: IClientCompaniesState }) => {
  return { clientCompanies: state.clientCompanies };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch,
    getClientCompaniesAction: (page: number) => dispatch(getClientCompaniesAction(page)),
    updateClientCompanyAction: () => dispatch(updateClientCompanyAction()),
    changeTempClientCompanyAction: (company: IBaseCompany) => dispatch(changeTempClientCompanyAction(company)),
    loadDataAction: (title: string, body: JSX.Element, footer: JSX.Element) => dispatch(loadDataAction(title, body, footer))
  };
};

export default connect<{ clientCompanies: IClientCompaniesState }, { dispatch: any }, IPropsType>(mapStateToProps, mapDispatchToProps)(ClientCompaniesListView);
