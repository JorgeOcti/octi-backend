import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import * as swal from 'sweetalert';
import {IVersion} from '../../../../../../src/interfaces/version.interface';
import {AlertReduxAction, deleteAlertAction} from '../../actions/alerts.actions';
import {createVersionAction, IVersionsState, getVersionsAction} from '../../actions/versions.actions';
import {loadDataAction, ModalReduxAction} from '../../actions/modal.actions';
import AppContainer from '../../container/AppContainer';
import {statusFooterButttonsModal} from '../../utils/common';
import ModalView from '../Modal/ModalView';
import VersionFormView from './VersionFormView';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  versions: IVersionsState;
  dispatch: Dispatch<AlertReduxAction>;
  loadDataAction(title: string, body: JSX.Element, footer: JSX.Element): ModalReduxAction;
  getVersionsAction(): ModalReduxAction;

  deleteVersionAction(id: string): ModalReduxAction;
  createVersionAction(version: ITempVersion): ModalReduxAction;
}

interface ITempVersion {
  ios: string;
  android: string;
}

interface IStateType {
  error: Error | null;
  tempVersion: ITempVersion;
}

class VersionListView extends React.Component<IPropsType, IStateType> {

  // static propTypes = {
  //   alerts: PropTypes.object.isRequired,
  //   dispatch: PropTypes.func.isRequired
  // };

  state = {
    error: null,
    tempVersion: {
      ios: '',
      android: '',
    }
  };

  constructor(props: IPropsType) {
    super(props);
    this.changeTempVersion = this.changeTempVersion.bind(this);

    this.addVersion = this.addVersion.bind(this);
    this.processAddAlert = this.processAddAlert.bind(this);

    this.deleteVersion = this.deleteVersion.bind(this);
  }

  public componentWillMount() {
    this.props.getVersionsAction();
    // set the title of the page
    document.title = 'OSA Andes | Listado de versiones';
  }

  public componentWillUnmount() {
    // cancel request if component is inmounted
    if (this.props.versions.source) {
      this.props.versions.source.cancel('Operation canceled by the user.');
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public render(): React.ReactElement<IPropsType> {
    console.log("--props", this.props)
    const {versions, loading} = this.props.versions;

    return (
      <AppContainer title="" cMenu="10" cSubMenu="10.1">
        <section className="content">
          <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">Versiones <small>{versions.length}</small></h3>
              <div className="pull-right box-tools">
                <button className="btn btn-sm btn-success" onClick={this.addVersion}>Agregar</button>
              </div>
            </div>
            <div className="box-body no-padding">
              <table className="table table-andes table-striped">
                <thead>
                  <tr>
                    <th className="middle">Descripción</th>
                    <th className="middle text-center">iOS Version</th>
                    <th className="middle text-center">Android Version</th>
                    <th className="middle width-10" />
                  </tr>
                </thead>
                <tbody>
                {
                  versions.length ?
                    versions.map((version: any) => {
                      return (
                        <tr
                          key={version._id}
                          id={`alert-${version._id}`}
                          className={'background-transition'}
                        >
                          <td className="middle">{version.description}</td>
                          <td className="middle text-center">{version.ios}</td>
                          <td className="middle text-center">{version.android}</td>
                          <td className="text-red pointer" onClick={() => this.deleteVersion(version)}><i className="fa fa-minus-circle"/></td>
                        </tr>
                      );
                    }) : <tr>
                      <td colSpan={5}>Aún no se han ingresado versiones</td>
                    </tr>
                }
                </tbody>
              </table>
            </div>
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

  private deleteVersion(version: IVersion) {
    // ask if you are sure that you are going to delete the alert?
    swal({
      title: '¿Estás seguro?',
      text: `Vas a eliminar la alerta ${alert.name}`,
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
        this.props.deleteVersionAction(version._id);
      }
    });
  }

  private addVersion() {
    this.props.loadDataAction(
      'Agregar Alerta',
        <VersionFormView changeTempVersion={this.changeTempVersion} />
      ,
      <React.Fragment>
        <button type="button" className="btn btn-sm btn-sm btn-default" data-dismiss="modal">Cancelar</button>
        <button type="button" className="btn btn-sm btn-sm btn-primary" onClick={this.processAddAlert}>Grabar</button>
      </React.Fragment>
    );
  }

  private changeTempVersion(tempVersion: ITempVersion) {
    this.setState({
      tempVersion
    });
  }

  private processAddAlert() {

    const {tempVersion} = this.state;

    if(tempVersion.ios.trim().length === 0)
    {
      swal('Agregar alerta', 'El campo nombre es requerido.', 'error');
    }
    else if(tempVersion.android.trim().length === 0)
    {
      swal('Agregar alerta', 'El campo nombre es requerido.', 'error');
    }
    else
    {
      statusFooterButttonsModal(true);
      this.props.createVersionAction(tempVersion);
    }
  }
}

const mapStateToProps = (state: { versions: IVersionsState }) => {
  return {
    versions: state.versions
  };
};


const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    loadDataAction: (title: string, body: JSX.Element, footer: JSX.Element) => dispatch(loadDataAction(title, body, footer)),
    getVersionsAction: () => dispatch(getVersionsAction()),
    deleteAlertAction: (id: string) => dispatch(deleteAlertAction(id)),
    createVersionAction: (version: ITempVersion) => dispatch(createVersionAction(version))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(VersionListView);
