///<reference path="../../../node_modules/sweetalert/typings/sweetalert.d.ts"/>
import * as moment from 'moment';
import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import {IBaseCompany, ICompany} from '../../../../../../src/interfaces/company.interface';
import {changeTempCompanyAction, CompaniesReduxAction, createCompanyAction, getCompaniesAction, ICompaniesState} from '../../actions/companies.actions';
import {loadDataAction, ModalReduxAction} from '../../actions/modal.actions';
import AppContainer from '../../container/AppContainer';
import ModalView from '../Modal/ModalView';
import Paginator from '../Paginator';
import CompaniesFormView from './CompaniesFormView';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<CompaniesReduxAction>;
  companies: ICompaniesState;

  getCompaniesAction(page: number): CompaniesReduxAction;
  createCompanyAction(): CompaniesReduxAction;
  // deleteVenueAction(id?: string): VenueReduxAction;
  changeTempCompanyAction(venue: IBaseCompany): CompaniesReduxAction;
  loadDataAction(title: string, body: JSX.Element, footer: JSX.Element): ModalReduxAction;
  // editVenueAction(): ModalReduxAction;
}

interface IStateType {
  error: Error | null;
}
class CompaniesListView extends React.Component<IPropsType, IStateType> {

  constructor(props: IPropsType) {
    super(props);
    this.addCompany = this.addCompany.bind(this);
    this.processAddCompany = this.processAddCompany.bind(this);
    this.editCompany = this.editCompany.bind(this);
    this.deleteCompany = this.deleteCompany.bind(this);
    this.changePage = this.changePage.bind(this);
  }

  public componentWillMount(): void {
    const {pagination} = this.props.companies;
    // set the title of the page
    document.title = 'OSA Andes | Listado de empresas';
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
      <AppContainer title="" cMenu="10" cSubMenu="10.5" cAction="Listado">
        <section className="content">
          <div className="box">
            <div className="box-header with-border"><h3 className="box-title">Empresas <small>{pagination.count}</small></h3>
              {/*{*/}
                {/*hasPermission(window.user, 'addVenue') ?*/}
                  <div className="box-tools pull-right">
                    <button className="btn btn-sm btn-success" onClick={this.addCompany}>Agregar</button>
                  </div>
                  {/*: null*/}
              {/*}*/}
            </div>
            <div className="box-body no-padding">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th style={{width: '60%'}} className="middle">Nombre</th>
                    <th style={{width: '20%'}} className="middle hidden-xs">Modificado</th>
                    {/*{*/}
                      {/*hasPermission(window.user, 'changeVenue') ?*/}
                        <th style={{width: '1%'}} className="width-10"/>
                    {/*}*/}
                    {/*{*/}
                      {/*hasPermission(window.user, 'deleteVenue') ?*/}
                        <th style={{width: '1%'}} className="width-10"/>
                    {/*}*/}
                  </tr>
                </thead>
                <tbody>
                  {
                    companies.map((company: ICompany) => {
                      {/*const canDelete = company.users && company.users.length === 0 && company.participants && company.participants.length === 0;*/}
                      return (
                        <tr key={company._id} id={`company-${company._id}`}>
                          <td className="middle">{company.name}</td>
                          <td className="middle hidden-xs">{moment(company.updatedAt).format('LLL')}</td>
                          {/*{*/}
                            {/*hasPermission(window.user, 'changeVenue') ?*/}
                          <td
                            className="middle text-blue pointer"
                            onClick={() => this.editCompany(company)}>
                            <i className="fa fa-pencil"/>
                          </td>
                          {/*}*/}
                          {/*{*/}
                            {/*hasPermission(window.user, 'deleteVenue') ?*/}
                          <td
                            className={'middle text-red pointer'}
                            onClick={() => this.deleteCompany(company)}
                          ><i className="fa fa-minus-circle"/></td>
                          {/*}*/}
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
                  <Paginator changePage={this.changePage} page={pagination.page} pages={pagination.pages} />
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
      name: ''
    });
    setTimeout(() => {
      this.props.loadDataAction(
        'Agregar Empresa',
        <CompaniesFormView />,
        <React.Fragment>
          <button type="button" className="btn btn-default" data-dismiss="modal">Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={this.processAddCompany}>Grabar</button>
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

  private editCompany(company: ICompany): void {
    this.props.changeTempCompanyAction({
      _id: company._id,
      name: company.name
    });
    setTimeout(() => {
      this.props.loadDataAction(
        'Editar Empresa',
        <CompaniesFormView />,
        <React.Fragment>
          <button type="button" className="btn btn-default" data-dismiss="modal">Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={undefined}>Editar</button>
        </React.Fragment>
      );
    }, 400);
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
    }).then((willDelete) => {
      if (willDelete) {
        console.log('deleteCompany');
        // this.props.deleteVenueAction(venue._id);
      }
    });
  }

  private changePage(page: number): void {
    // change the page
    this.props.getCompaniesAction(page);
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
    addCompanyAction: () => dispatch(createCompanyAction()),
    // editVenueAction: () => dispatch(editVenueAction()),
    // deleteVenueAction: (id: string) => dispatch(deleteVenueAction(id)),
    changeTempCompanyAction: (company: IBaseCompany) => dispatch(changeTempCompanyAction(company)),
    loadDataAction: (title: string, body: JSX.Element, footer: JSX.Element) => dispatch(loadDataAction(title, body, footer))
  };
};

export default connect<{companies: ICompaniesState}, {dispatch: any}, IPropsType>(mapStateToProps, mapDispatchToProps)(CompaniesListView);
