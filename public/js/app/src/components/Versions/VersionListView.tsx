import * as moment from 'moment';
import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import * as swal from 'sweetalert';
import {IVersion} from '../../../../../../src/interfaces/version.interface';
import {createVersionAction, IVersionsState, getVersionsAction} from '../../actions/versions.actions';
import {loadDataAction, ModalReduxAction} from '../../actions/modal.actions';
import AppContainer from '../../container/AppContainer';
import {statusFooterButttonsModal} from '../../utils/common';
import ModalView from '../Modal/ModalView';
import VersionFormView from './VersionFormView';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  versions: IVersionsState;
  dispatch: Dispatch<ModalReduxAction>;
  loadDataAction(title: string, body: JSX.Element, footer: JSX.Element): ModalReduxAction;
  getVersionsAction(): ModalReduxAction;

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

    const {versions, loading} = this.props.versions;

    return (
      <AppContainer title="" cMenu="10" cSubMenu="10.7">
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
                    <th className="middle">Creada por</th>
                    <th className="middle">Fecha creación</th>
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
                          <td className="middle">
                            {
                              version.createdBy ? version.createdBy.firstName + " " + version.createdBy.lastName : '-'
                            }
                          </td>
                          <td className="middle">{moment(version.createdAt).format('LLL')}</td>
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
    createVersionAction: (version: ITempVersion) => dispatch(createVersionAction(version))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(VersionListView);
