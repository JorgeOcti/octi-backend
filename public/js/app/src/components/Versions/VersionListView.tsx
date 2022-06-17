import * as moment from 'moment';
import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import * as swal from 'sweetalert';
import {createVersionAction, IVersionsState, getVersionsAction} from '../../actions/versions.actions';
import {loadDataAction, ModalReduxAction} from '../../actions/modal.actions';
import AppContainer from '../../container/AppContainer';
import {statusFooterButttonsModal} from '../../utils/common';
import ModalView from '../Modal/ModalView';
import VersionFormView from './VersionFormView';
import Row from '../Utils/Row';
import TrackingBasePage from "../Utils/TrackingBasePage";

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
  dragging: string;
  draggingLocation: number;
  completed: string[];
  users: string[];
  tempVersion: ITempVersion;
}

class VersionListView extends TrackingBasePage<IPropsType, IStateType> {
  title : string;

  // static propTypes = {
  //   alerts: PropTypes.object.isRequired,
  //   dispatch: PropTypes.func.isRequired
  // };

  state = {
    error: null,
    dragging: '',
    draggingLocation: -1,
    completed: [],
    users: ['One', 'Two', 'Three', 'Four', 'Five'],
    tempVersion: {
      ios: '',
      android: ''
    }
  };

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Listado de versiones';
    this.changeTempVersion = this.changeTempVersion.bind(this);
    this.onDragStart = this.onDragStart.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
    this.onDragOver = this.onDragOver.bind(this);
    this.onDrop = this.onDrop.bind(this);
    this.onDropChangeIndex = this.onDropChangeIndex.bind(this);
    this.onDragOverChange = this.onDragOverChange.bind(this);
    this.onDragEndChange = this.onDragEndChange.bind(this);

    this.addVersion = this.addVersion.bind(this);
    this.processAddAlert = this.processAddAlert.bind(this);

  }

  componentDidMount() {
    super.componentDidMount();
  }

  public componentWillMount() {
    this.props.getVersionsAction();
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
      <AppContainer title="" cMenu="200" cSubMenu="200.100">
        <section className="content">
          <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">Versiones <small>{versions.length}</small></h3>
              <div className="pull-right box-tools">
                <button className="btn btn-sm btn-success" onClick={this.addVersion}><i className='fa fa-plus' /> Crear versión</button>
              </div>
            </div>
            <div className="box-body no-padding">
              <table className="table table-andes table-striped">
                <thead>
                  <tr>
                    <th className="middle">Descripción</th>
                    <th className="middle text-center">iOS</th>
                    <th className="middle text-center">Android</th>
                    <th className="middle">Creada</th>
                    <th className="middle">Creada por</th>
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
                          <td className="middle">
                            <strong className='text-primary'>{version.description}</strong>
                          </td>
                          <td className="middle text-center text-muted">{version.ios}</td>
                          <td className="middle text-center text-muted">{version.android}</td>
                          <td className="middle text-sm text-muted">{moment(version.createdAt).format('LLL')}</td>
                          <td className="middle text-info">
                            {
                              version.createdBy ? version.createdBy.firstName + ' ' + version.createdBy.lastName : '-'
                            }
                          </td>
                        </tr>
                      );
                    }) : <tr>
                      <td colSpan={5}>Aún no se han ingresado versiones</td>
                    </tr>
                }
                </tbody>
              </table>
              <Row>
                <div className="col-md-6">
                  <table className="table table-andes table-striped">
                    <thead>
                      <tr>
                        <th className="middle">Nombre</th>
                      </tr>
                    </thead>
                    <tbody>
                      {
                        this.state.users.map((user, index)=>{
                          return (
                            <tr
                              draggable
                              key={index}
                              className={`pointer ${this.state.draggingLocation === index ? 'bg-aqua-active' : ''}`}
                              style={{
                                opacity: this.state.dragging === user || this.state.draggingLocation === index ? 0.5 : 1
                              }}
                              onDragStart = {(e) => this.onDragStart(e, user, index)}
                              onDragEnter={this.onDragEnter}
                              onDragEnd = {this.onDragEndChange}
                              onDrop={(e) =>this.onDropChangeIndex(e, index)}
                              onDragOver={(e)=>this.onDragOverChange(e, index)}
                            >
                              <td
                              ><i className="fa fa-arrows-v text-muted font-md" /> {
                                this.state.draggingLocation === index ? this.state.dragging : user
                              }</td>
                            </tr>

                          );
                        })
                      }
                    </tbody>
                  </table>
                </div>
                <div className="col-md-6" style={{height: '150px', overflowY: 'auto'}}>
                  <div
                    onDragOver={this.onDragOver}
                    onDrop={(e) =>this.onDrop(e, 'completed')}
                    onDragEnter={this.onDragEnter}
                    style={{width: 200, minHeight: 100, border: '1px solid #CCC'}}
                  >
                    completed
                    {this.state.completed.map((item, index)=><div key={index}>{item}</div>)}
                  </div>
                  <div
                    onDragOver={this.onDragOver}
                    onDragEnter={this.onDragEnter}
                    onDrop={(e) =>this.onDrop(e, 'incompleted')}
                    style={{width: 200,  minHeight: 100, border: '1px solid #CCC'}}
                  >
                    incompleted
                  </div>
                </div>
              </Row>
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

  private onDragStart(ev: React.DragEvent<HTMLTableRowElement>, id:string, index: number) {
    console.log(`onDragStart: ${id}`);
    ev.dataTransfer.setData('id', id);
    ev.dataTransfer.setData('type', 'type');
    ev.dataTransfer.setData('index', index.toString());

    ev.dataTransfer.dropEffect = 'move';

    const dragIcon = document.createElement('img');
    dragIcon.src = 'https://www.automotrizcumbre.cl/wp-content/uploads/2018/08/chevrolet-sail-sedan-detalles-personaliza-648x240-4-300x180.jpg';
    dragIcon.width = 100;
    ev.dataTransfer.setDragImage(dragIcon, -10, -10);

    this.setState({
      dragging: id
    });
  }

  private onDragEnd(ev: React.DragEvent<HTMLTableRowElement>) {
    console.log(`onDragEnd`);
    this.setState({
      dragging: ''
    });
  }

  private onDragEnter(ev: React.DragEvent<HTMLElement>) {
    console.log(`onDragEnter`);
    ev.preventDefault();
    ev.stopPropagation();
  }

  private onDragOver(ev: React.DragEvent<HTMLElement>) {
    console.log(`onDragOver`);
    ev.preventDefault();
    ev.stopPropagation();
  }

  private onDragOverChange(ev: React.DragEvent<HTMLElement>, index: number) {
    console.log(`onDragOverChange`);
    ev.dataTransfer.dropEffect = 'move';
    ev.preventDefault();
    ev.stopPropagation();
    this.setState({
      draggingLocation: index
    });
  }

  private onDragEndChange(ev: React.DragEvent<HTMLElement>){
    console.log(`onDragEndChange`);
    this.setState({
      draggingLocation: -1,
      dragging: ''
    });
  }

  private onDrop(ev: React.DragEvent<HTMLElement>, cat: string){
    const id = ev.dataTransfer.getData('id');
    const type = ev.dataTransfer.getData('type');
    console.log(`onDrop: id: ${id} cat: ${cat}`);
    console.log(id);
    if (cat === 'completed') {
      this.setState({
        completed: [id, ...this.state.completed]
      });
    } else {
      alert(`${id} se a soltado en ${cat}`);

    }
  }

  private onDropChangeIndex(ev: React.DragEvent<HTMLElement>, newIndex: number) {
    let {users} = this.state;
    let index = parseInt(ev.dataTransfer.getData('index'));
    console.log(`onDropChangeIndex newIndex:${newIndex} index:${index}`);
    const data = users[index];
    if (newIndex > index) {
      for (let i = 0; i < users.length; i++) {
        if (i >= index && i < newIndex) {
          users[i] = users[i + 1];
        }
      }
    } else {
      for (let i = users.length - 1; i >= 0; i--) {
        if (i > newIndex && i <= index) {
          console.log(`2 ${users[i]} -> ${users[i - 1]}`);
          users[i] = users[i - 1];
        }
      }
    }
    users[newIndex] = data;
    this.setState({
      users
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
    createVersionAction: (version: ITempVersion) => dispatch(createVersionAction(version))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(VersionListView);
