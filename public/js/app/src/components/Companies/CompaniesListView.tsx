import * as moment from 'moment';
import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import * as swal from 'sweetalert';
import {IBaseCompany, ICompany} from '../../../../../../src/app/interfaces/company.interface';
import {
  changeTempCompanyAction,
  CompaniesReduxAction,
  createCompanyAction, deleteCompanyAction,
  getCompaniesAction,
  ICompaniesState,
  updateCompanyAction
} from '../../actions/companies.actions';
import {loadDataAction, ModalReduxAction} from '../../actions/modal.actions';
import AppContainer from '../../container/AppContainer';
import {IWindow} from '../../interfaces/window';
import {hasPermission} from '../../utils/common';
import ModalView from '../Modal/ModalView';
import Paginator from '../Utils/Paginator';
import CompaniesFormView from './CompaniesFormView';
import TrackingBasePage from '../Utils/TrackingBasePage';

interface IPropsType extends RouteComponentProps<{ company: string }> {
  dispatch: Dispatch<CompaniesReduxAction>;
  companies: ICompaniesState;

  getCompaniesAction(page: number): CompaniesReduxAction;
  createCompanyAction(): CompaniesReduxAction;
  updateCompanyAction(): CompaniesReduxAction;
  deleteCompanyAction(id?: string): CompaniesReduxAction;
  changeTempCompanyAction(company: IBaseCompany): CompaniesReduxAction;
  loadDataAction(title: string, body: JSX.Element, footer: JSX.Element): ModalReduxAction;
}

interface IStateType {
  error: Error | null;
}

declare let window: IWindow;

class CompaniesListView extends TrackingBasePage<IPropsType, IStateType> {
  title : string;

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Listado de empresas';
    this.addCompany = this.addCompany.bind(this);
    this.processAddCompany = this.processAddCompany.bind(this);
    this.udpateCompany = this.udpateCompany.bind(this);
    this.processUpdateCompany = this.processUpdateCompany.bind(this);
    this.deleteCompany = this.deleteCompany.bind(this);
  }

  componentDidMount() {
    super.componentDidMount();
  }

  public componentWillMount(): void {
    const {pagination} = this.props.companies;
    this.props.getCompaniesAction(pagination.page);
  }

  public componentWillUnmount(): void {
    // cancel request if component is inmounted
    if (this.props.companies.source) {
      this.props.companies.source.cancel('Operation canceled by the user.');
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public render(): React.ReactElement<IPropsType> {
    const {loading, companies, pagination} = this.props.companies;
    return (
      <AppContainer title="" cMenu="200" cSubMenu="200.0" cAction="Listado">
        <section className="content">
          <div className="box">
            <div className="box-header with-border"><h3 className="box-title">Empresas <small>{pagination.count}</small></h3>
              {
                hasPermission(window.user, 'addCompany') ?
                  <div className="box-tools pull-right">
                    <button className="btn btn-sm btn-success" onClick={this.addCompany}><i className="fa fa-plus" /> Crear empresa</button>
                  </div>
                  : null
              }
            </div>
            <div className="box-body no-padding">
              <table className="table table-andes table-striped">
                <thead>
                  <tr>
                    <th style={{width: '60%'}} className="middle">Nombre</th>
                    {/*<th style={{width: '20%'}} className="middle hidden-xs">Modificado</th>*/}
                    {
                      window.user.isAdmin ?
                        <th style={{width: '1%'}} className="width-10 hidden-xs">Inventario</th> : null
                    }
                    {
                      window.user.isAdmin ?
                        <th style={{width: '1%'}} className="width-10 hidden-xs">Entregas</th> : null
                    }
                    {
                      window.user.isAdmin ?
                        <th style={{width: '1%'}} className="width-10 hidden-xs">Checklist</th> : null
                    }
                    {
                      window.user.isAdmin ?
                        <th style={{width: '1%'}} className="width-10 hidden-xs">Solicitudes</th> : null
                    }
                    {
                      window.user.isAdmin ?
                        <th style={{width: '1%'}} className="width-10">Billing</th> : null
                    }
                    {
                      hasPermission(window.user, 'changeCompany') ?
                        <th style={{width: '1%'}} className="width-10"/> : null
                    }
                    {
                      hasPermission(window.user, 'deleteCompany') ?
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
                          id={`company-${company._id}`}
                          className={'background-transition'}
                        >
                          <td className="middle">
                            <strong className='text-primary'>{company.name}</strong> <br/>
                            <span className="text-sm text-muted">
                              {company?.businessName ?? ''} - {company?.rut ?? ''}
                            </span>
                          </td>
                          {/*<td className="middle hidden-xs">{moment(company.updatedAt).format('LLL')}</td>*/}
                          {
                            window.user.isAdmin ?
                              <td className="middle text-center hidden-xs">
                                {
                                  company.billing.inventoryPrice ? `${company.billing.inventoryPrice?.toFixed(4)}UF` : '-'
                                }
                              </td> : null
                          }
                           {
                            window.user.isAdmin ?
                              <td className="middle text-center hidden-xs">
                                {
                                  company.billing.deliveryPrice ? `${company.billing.deliveryPrice?.toFixed(4)}UF` : '-'
                                }
                              </td> : null
                          }
                          {
                            window.user.isAdmin ?
                              <td className="middle text-center hidden-xs">
                                {
                                  company.billing.checklistPrice ? `${company.billing.checklistPrice?.toFixed(4)}UF` : '-'
                                }
                              </td> : null
                          }
                          {
                            window.user.isAdmin ?
                              <td className="middle text-center hidden-xs">
                                {
                                  company.billing.requestPrice ? `${company.billing.requestPrice?.toFixed(4)}UF` : '-'
                                }
                              </td> : null
                          }

                          {
                            window.user.isAdmin ?
                              <td className="middle text-center">
                                <i
                                  className={
                                    company.billing.active ?
                                      'fa fa-check-circle text-green':
                                      'fa fa-times-circle text-red'
                                  }
                                />
                              </td> : null
                          }
                          {
                            hasPermission(window.user, 'changeCompany') ?
                              <td
                                className="middle text-blue pointer"
                                onClick={() => this.udpateCompany(company)}>
                                <i className="fa fa-pencil"/>
                              </td> : null
                          }
                          {
                            hasPermission(window.user, 'deleteCompany') ?
                              <td
                                className={'middle text-red pointer'}
                                onClick={() => this.deleteCompany(company)}
                              ><i className="fa fa-minus-circle"/></td> : null
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
                  <Paginator changePage={this.props.getCompaniesAction} page={pagination.page} pages={pagination.pages} />
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

  private addCompany(): void {
    this.props.changeTempCompanyAction({
      _id: '',
      name: '',
      businessName: '',
      rut: '',
      image: null,
      marker: null,
      markerURI: '/static/images/files/pin_osa.svg',
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
        'Agregar Empresa',
        <CompaniesFormView />,
        <React.Fragment>
          <button type="button" className="btn btn-sm btn-default" data-dismiss="modal">Cancelar</button>
          <button type="button" className="btn btn-sm btn-primary" onClick={this.processAddCompany}>Grabar</button>
        </React.Fragment>
      );
    }, 400);
  }

  private processAddCompany(): void {
    const {tempCompany} = this.props.companies;
    if (!tempCompany.name || !tempCompany.name.trim()) {
      swal('Agregar empresa', 'El nombres es requerido', 'error');
    } else {
      this.props.createCompanyAction();
    }
  }

  private udpateCompany(company: ICompany): void {
    const {_id, name, businessName, rut, billing, marker, image, notifications} = company;
    this.props.changeTempCompanyAction({
      _id,
      name,
      businessName,
      rut,
      image: null,
      marker: null,
      imageURI: image && image.hasOwnProperty('url') ? decodeURI(image.url) : null,
      markerURI: marker && marker.hasOwnProperty('url') ? decodeURI(marker.url) : '/static/images/files/pin_osa.svg',
      billing,
      notifications
    });
    setTimeout(() => {
      this.props.loadDataAction(
        'Editar Empresa',
        <CompaniesFormView />,
        <React.Fragment>
          <button type="button" className="btn btn-sm btn-default" data-dismiss="modal">Cancelar</button>
          <button type="button" className="btn btn-sm btn-primary" onClick={this.processUpdateCompany}>Editar</button>
        </React.Fragment>
      );
    }, 400);
  }

  private processUpdateCompany(): void {
    const {name} = this.props.companies.tempCompany;
    if (!name || !name.trim()) {
      swal('Editar Empresa', 'El nombres es requerido', 'error');
    } else {
      this.props.updateCompanyAction();
    }
  }

  private deleteCompany(company: ICompany): void {
    swal({
      title: '¿Estás seguro?',
      text: `Vas a eliminar la empresa ${company.name} `,
      icon: 'warning',
      dangerMode: true,
      buttons: {
        cancel: 'Cancelar' as any,
        confirm: {
          text: 'Sí'
        }
      }
    }).then((willDelete: any) => {
      if (willDelete) {
        this.props.deleteCompanyAction(company._id);
      }
    });
  }
}

const mapStateToProps = (state: { companies: ICompaniesState }) => {
  return {
    companies: state.companies
  };
};

const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    getCompaniesAction: (page: number) => dispatch(getCompaniesAction(page)),
    createCompanyAction: () => dispatch(createCompanyAction()),
    updateCompanyAction: () => dispatch(updateCompanyAction()),
    deleteCompanyAction: (id: string) => dispatch(deleteCompanyAction(id)),
    changeTempCompanyAction: (company: IBaseCompany) => dispatch(changeTempCompanyAction(company)),
    loadDataAction: (title: string, body: JSX.Element, footer: JSX.Element) => dispatch(loadDataAction(title, body, footer))
  };
};

export default connect<{companies: ICompaniesState}, {dispatch: any}, IPropsType>(mapStateToProps, mapDispatchToProps)(CompaniesListView);
