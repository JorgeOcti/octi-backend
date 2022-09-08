import TrackingBasePage from '../../Utils/TrackingBasePage';
import { RouteComponentProps } from 'react-router';
import { Dispatch } from 'redux';
import * as React from 'react';
import { ErrorInfo } from 'react';
import { connect } from 'react-redux';
import BillingSettingsActions from '../../../actions/billingSettings.actions';
import {
  IBillingSettingsActionTypes,
  IBillingSettingsState
} from '../../../actions/billingSettings.types';
import AppContainer from '../../../container/AppContainer';
import * as Raven from 'raven-js';
import BillingSettingsForm from './form/BillingSettingsForm';
import ModalView from '../../Modal/ModalView';
import { loadDataAction, ModalReduxAction } from '../../../actions/modal.actions';
import { IForm } from '../../../../../../../src/form/interfaces';
import * as swal from 'sweetalert';
import ShowIf from '../../Utils/ShowIf';
import BillingMenu from '../BillingMenu';
import ApiService from '../../../utils/axios';

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

class BillingSettingsListView extends TrackingBasePage<IPropsType, IStateType> {
  title: string;
  private api: ApiService;

  readonly state = {
    error: null
  };

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Configuración de Billing';
    this.processUpdateSettings = this.processUpdateSettings.bind(this);
    this.api = new ApiService();
  }

  public componentWillMount(): void {
    const { billingSettingsActions } = this.props;
    billingSettingsActions.getTeamSettings();
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
    const { billingSettingsActions } = this.props;
    const { loading, modules, billingSettings } = this.props.billingSettings;
    return (
      <AppContainer title={''} cMenu='200' cSubMenu='200.21'>
        <section className='content'>
          <div className='row'>
            <div className='col-md-3'>
              <BillingMenu />
            </div>
            <div className='col-md-9'>
              <div className='box'>
                <div className='box-header with-border'>
                  <h3 className='box-title'>Configuración de Billing</h3>
                </div>
                <div className={`box-body`}>
                  <ShowIf condition={!loading}>
                    <BillingSettingsForm
                      initialValues={{
                        name: 'default',
                        businessName : '',
                        notifications:[{
                          name: 'Soporte',
                          email: 'soporte@osacontrol.com',
                        }],
                        ...billingSettings,
                        modules : modules.map((module) => {
                          const moduleSetting = billingSettings?.modules.find((m) => {
                            return m.module === module._id;
                          });
                          if(moduleSetting){
                            return {
                              ...moduleSetting,
                              ...module,
                            }
                          }
                          return {
                            ...module,
                          }
                        })
                      }}
                      onSubmit={this.processUpdateSettings}
                    />
                  </ShowIf>
                </div>
                <div className='box-footer text-right'>
                  <button
                    className='btn btn-sm btn-primary'
                    style={{ marginLeft: '5px' }}
                    onClick={() => billingSettingsActions.submit('billingSettingsForm')}
                    // disabled={sending}
                  >
                    Actualizar
                    {/*<ShowIf condition={sending} alternative={'Actualizar'}>*/}
                    {/*  <React.Fragment>*/}
                    {/*    <i className='fa fa-fw fa-spin fa-spinner' /> Actualizando...*/}
                    {/*  </React.Fragment>*/}
                    {/*</ShowIf>*/}
                  </button>
                </div>
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

  private processUpdateSettings(form: any): void {
    this.api.updateBillingByCorporate({
      ...form,
      modules: form.modules.map((module: any) => {
        return {
          ...module,
          module: module._id
        }
      })
    }).then((response: any) => {
      console.log(response);
    });
  }

  private deleteForm(form: IForm): void {
    // ask if you are sure that you are going to delete the user?
    swal({
      title: '¿Estás seguro?',
      text: `Vas a eliminar el formulario: ${form.name} `,
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
        // this.props.deleteFormThunkAction(form);
      }
    });
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


export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(BillingSettingsListView);
