import * as Raven from 'raven-js';
import * as React from 'react';
import { ErrorInfo } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { Dispatch } from 'redux';
import * as swal from 'sweetalert';
import { IInventoryLabel } from '../../../../../../src/inventory/interfaces/inventoryLabel.interface';
import {
  changeLabelAction,
  changeTempLabelAction,
  createLabelAction,
  deleteLabelAction,
  getLabelsAction,
  ILabelsState,
  LabelsReduxAction
} from '../../actions/labels.actions';
import { loadDataAction, ModalReduxAction } from '../../actions/modal.actions';
import AppContainer from '../../container/AppContainer';
import { IWindow } from '../../interfaces/window';
import { statusFooterButttonsModal } from '../../utils/common';
import ModalView from '../Modal/ModalView';
import BootstrapSwitch from '../Utils/BootstrapSwitch';
import Paginator from '../Utils/Paginator';
import LabelFormView from './LabelFormView';
import { CarStatusType } from '../Inventory/InventoryDetailView';
import TrackingBasePage from '../Utils/TrackingBasePage';
import { io } from 'socket.io-client';
import { Socket } from 'socket.io-client/build/esm/socket';
import Row from '../Utils/Row';

interface IPropsType extends RouteComponentProps<{ ticket: string, tab?: string  }> {
  dispatch: Dispatch<LabelsReduxAction>;
  labels: ILabelsState;

  changeTempLabelAction(tempLabel: IInventoryLabel): LabelsReduxAction;
  getLabelsAction(page: number): LabelsReduxAction;
  loadDataAction(title: string, body: JSX.Element, footer: JSX.Element): ModalReduxAction;
  createLabelAction(label: IInventoryLabel): LabelsReduxAction;
  changeLabelAction(label: IInventoryLabel, message?: boolean): LabelsReduxAction;
  deleteLabelAction(id: string): LabelsReduxAction;
}

interface IStateType {
  error: Error | null;
  tab: string;
}

enum LabelTabsEnum {
  Container = 'container',
  Units = 'units'
}

declare let window: IWindow;

class LabelsListView extends TrackingBasePage<IPropsType, IStateType> {

  title : string;

  readonly state = {
    tab: LabelTabsEnum.Container,
    error: null
  };

  private socket: Socket;

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Listado de etiquetas';
    this.addLabel = this.addLabel.bind(this);
    this.processAddLabel = this.processAddLabel.bind(this);
    this.editLabel = this.editLabel.bind(this);
    this.processEditLabel = this.processEditLabel.bind(this);
    this.deleteLabel = this.deleteLabel.bind(this);
    this.changePage = this.changePage.bind(this);
    this.changeTab = this.changeTab.bind(this);
  }

  public componentWillMount(): void {
    const {pagination} = this.props.labels;
    this.props.getLabelsAction(pagination.page);

    // socket
    this.socket = io(`${location.protocol}//${location.host}`, {
      secure: location.protocol === 'https:',
      transports: ['websocket'],
      reconnection: true,
      query: {token: (window.user as any).token}
    });
    this.socket.on('connect', () => {
      this.socket.emit('join', {room: `label-list-${window.user.team._id}`});
    });
    this.socket.on('REFRESH', (data: any): void => {
      if (data.update && data.updatedBy !== window.user._id) {
        const {pagination} = this.props.labels;
        this.props.getLabelsAction(pagination.page);
      }
    });
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public componentDidUpdate(prevProps: Readonly<IPropsType>, prevState: Readonly<IStateType>, snapshot?: any): void {
    if(this.props.labels.pagination !== prevProps.labels.pagination){
      window.scrollTo(0, 0);
    }
  }

  public componentDidMount(): void {
    super.componentDidMount();
    window.scrollTo(0, 0);
  }

  public componentWillUnmount(): void {
    // cancel request if component is inmounted
    if (this.props.labels.source) {
      this.props.labels.source.cancel('Operation canceled by the user.');
    }
    this.socket.disconnect();
  }

  private changeTab(name: string): void {
    this.setState(
      {
        tab: name
      }
    );
  }

  public render(): React.ReactElement<IPropsType> {
    const {loading, labels, pagination, inventorySettings} = this.props.labels;
    const { tab } = this.state;


    const containerLabes = labels.filter(label => label.isForContainer);
    const containerLabesCount = containerLabes.length;

    const unitsLabes = labels.filter(label => !label.isForContainer);
    const unitLabesCount = unitsLabes.length;


    return (
      <AppContainer title="" 
      cMenu="2" 
      cSubMenu="2.1" 
      cAction={tab === LabelTabsEnum.Container ? 'Contenedor' : 'Unidades'}
      >
        <section className="content">

        <Row>
            <div className="col-md-12 col-lg-12">
              <div className="box box-solid">
                <ul className="nav nav-pills nav-justified">
                  <li
                    className={
                      tab === LabelTabsEnum.Container ? 'no-margin active' : 'no-margin'
                    }>
                    <a
                      href="javascript:void(0);"
                      className={
                        tab === LabelTabsEnum.Container ? 'tabs-labels background-transition' : 'tabs-labels'
                      }
                      onClick={() => this.changeTab(LabelTabsEnum.Container)}>
                      Contenedor
                    </a>
                  </li>
                  <li
                    className={
                      tab === LabelTabsEnum.Units  ? 'no-margin active' : 'no-margin'
                    }>
                    <a
                      className={
                        tab === LabelTabsEnum.Units ? 'tabs-labels background-transition' : 'tabs-labels'
                      }
                      href="javascript:void(0);"
                      onClick={() => this.changeTab(LabelTabsEnum.Units)}>
                      Unidades
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </Row>

          <Row className={  tab === LabelTabsEnum.Container ? 'label-shown' : 'label-no-shown' }>
            <div className="col-md-12 col-lg-12">
            <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">Etiquetas <small>{containerLabesCount}</small></h3>
              <div className="box-tools pull-right">
                <button className="btn btn-sm btn-success" onClick={this.addLabel}>Agregar</button>
              </div>
            </div>
            <div className="box-body no-padding">
              <table className="table  table-andes table-striped">
                <thead>
                  <tr>
                    <th className="middle">Nombre</th>
                    <th className="middle th-default-w100px">Agregar opción en</th>
                    <th className="middle th-default-w80px">Envia a</th>
                    <th className="middle-center th-default-w80px">Activo</th>
                    <th className="width-10"/>
                    <th className="width-10"/>
                  </tr>
                </thead>
                <tbody>
                  {
                    containerLabes.map((label) => {
                      return (
                        <tr
                          key={label._id} id={`label-${label._id}`}
                          className={`background-transition ${!label.active ? 'text-muted' : ''}`}
                        >
                          <td className="middle text-ellipsis">
                            <strong className='text-primary'>{label.name}</strong>
                            <p
                              className="text-muted text-sm zero-marging-botton"
                              
                            >{label.description}</p>
                          </td>
                          <td className="middle table-line-Height">
                            {
                              label.affected.map((aff, key)=>(
                                <React.Fragment key={key}>
                                  <label
                                    className={`label label-${inventorySettings[`${aff}Class` as CarStatusType]}`}
                                  >
                                    {inventorySettings[aff as CarStatusType]}
                                  </label><br />
                                  </React.Fragment>
                              ))
                            }
                          </td>
                          <td className="middle">
                            <label className={`label label-${inventorySettings[`${label.sendTo}Class` as CarStatusType]}`}>
                              {inventorySettings[label.sendTo as CarStatusType]}
                            </label>
                          </td>
                          <td className="td-padding-top15 middle-center">
                            <BootstrapSwitch
                              checked={label.active}
                              onChange={() => {
                                this.props.changeLabelAction({
                                  ...label,
                                  active: !label.active
                                });
                              }}
                            />
                          </td>
                          <td
                            onClick={() => this.editLabel(label)}
                            className="middle text-blue pointer"
                          >
                            <i className="fa fa-pencil"/>
                          </td>
                          <td
                            onClick={() => this.deleteLabel(label)}
                            className={'middle text-red pointer'}
                          >
                            <i className="fa fa-minus-circle"/>
                          </td>
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
            </div>
          </Row>              
          
          <Row className={  tab === LabelTabsEnum.Units ? 'label-shown' : 'label-no-shown' }>
          <div className="col-md-12 col-lg-12">
            <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">Etiquetas <small>{unitLabesCount}</small></h3>
              <div className="box-tools pull-right">
                <button className="btn btn-sm btn-success" onClick={this.addLabel}>Agregar</button>
              </div>
            </div>
            <div className="box-body no-padding">
              <table className="table  table-andes table-striped">
                <thead>
                  <tr>
                    <th className="middle">Nombre</th>
                    <th className="middle th-default-w100px">Agregar opción en</th>
                    <th className="middle th-default-w80px">Envia a</th>
                    <th className="middle-center th-default-w80px">Activo</th>
                    <th className="width-10"/>
                    <th className="width-10"/>
                  </tr>
                </thead>
                <tbody>
                  {
                    unitsLabes.map((label) => {
                      return (
                        <tr
                          key={label._id} id={`label-${label._id}`}
                          className={`background-transition ${!label.active ? 'text-muted' : ''}`}
                        >
                          <td className="middle text-ellipsis">
                            <strong className='text-primary'>{label.name}</strong>
                            <p
                              className="text-muted text-sm zero-marging-botton"
                            >{label.description}</p>
                          </td>
                          <td className="middle table-line-Height">
                            {
                              label.affected.map((aff, key)=>(
                                <React.Fragment key={key}>
                                  <label
                                    className={`label label-${inventorySettings[`${aff}Class` as CarStatusType]}`}
                                  >
                                    {inventorySettings[aff as CarStatusType]}
                                  </label><br />
                                  </React.Fragment>
                              ))
                            }
                          </td>
                          <td className="middle">
                            <label className={`label label-${inventorySettings[`${label.sendTo}Class` as CarStatusType]}`}>
                              {inventorySettings[label.sendTo as CarStatusType]}
                            </label>
                          </td>
                          <td className="td-padding-top15 middle-center" >
                            <BootstrapSwitch
                              checked={label.active}
                              onChange={() => {
                                this.props.changeLabelAction({
                                  ...label,
                                  active: !label.active
                                });
                              }}
                            />
                          </td>
                          <td
                            onClick={() => this.editLabel(label)}
                            className="middle text-blue pointer"
                          >
                            <i className="fa fa-pencil"/>
                          </td>
                          <td
                            onClick={() => this.deleteLabel(label)}
                            className={'middle text-red pointer'}
                          >
                            <i className="fa fa-minus-circle"/>
                          </td>
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
            </div>
          </Row>   


          <ModalView />
        </section>
      </AppContainer>
    );
  }

  private addLabel(): void {

    const isContainer: boolean = this.state.tab === LabelTabsEnum.Container ? true: false;

    const modalTitle = this.state.tab === LabelTabsEnum.Container ? 'Agregar Etiqueta (contenedores)' : 'Agregar Etiqueta (unidades)';

    this.props.changeTempLabelAction({
      _id: '',
      name: '',
      description: '',
      color: '',
      affected: [],
      sendTo: '',
      requireCustomText: false,
      isExhibition: false,
      isForContainer: this.state.tab === LabelTabsEnum.Container ? true : false,
      active: true
    });
    setTimeout(() => {
      this.props.loadDataAction(
        modalTitle,
        <LabelFormView changeTempLabelAction={changeTempLabelAction} isForContainer={ isContainer }/>,
        <React.Fragment>
          <button type="button" className="btn btn-sm btn-default" data-dismiss="modal">Cancelar</button>
          <button type="button" className="btn btn-sm btn-primary" onClick={this.processAddLabel}>Grabar</button>
        </React.Fragment>
      );
    }, 200);
  }

  private processAddLabel(): void {
    const { tempLabel} = this.props.labels;
    if (this.validateLabel(tempLabel, 'Agregar Etiqueta')) {
      statusFooterButttonsModal(true);
      this.props.createLabelAction(tempLabel);
    }
  }

  private editLabel(tempLabel: IInventoryLabel): void {
    this.props.changeTempLabelAction(tempLabel);
    setTimeout(() => {
      this.props.loadDataAction(
        'Editar Etiqueta',
        <LabelFormView changeTempLabelAction={changeTempLabelAction}/>,
        <React.Fragment>
          <button type="button" className="btn btn-sm btn-default" data-dismiss="modal">Cancelar</button>
          <button type="button" className="btn btn-sm btn-primary" onClick={this.processEditLabel}>Editar</button>
        </React.Fragment>
      );
    }, 200);

  }

  private processEditLabel(): void {
    const { tempLabel} = this.props.labels;
    if (this.validateLabel(tempLabel, 'Editar Etiqueta')) {
      statusFooterButttonsModal(true);
      this.props.changeLabelAction(tempLabel, true);
    }
  }

  private deleteLabel(label: IInventoryLabel): void {
    // ask if you are sure that you are going to delete the user?
    swal({
      title: '¿Estás seguro?',
      text: `Vas a eliminar la etiqueta "${label.name}". Los inventarios marcados con esta etiqueta serán afectados y no se mostrara. `,
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
        this.props.deleteLabelAction(label._id);
      }
    });
  }

  private validateLabel(label: IInventoryLabel, action: string): boolean {
    if (!label.name || !label.name.trim().length) {
      swal!(action, 'El nombres es requerido', 'error');
      return false;
    } else if (!label.affected || !label.affected.length) {
      swal!(action, '"Agregar opción en" debe tener al menos 1 seleccionado.', 'error');
      return false;
    } else if (!label.sendTo || !label.sendTo.trim().length) {
      swal!(action, 'Debe seleccionar donde se enviara', 'error');
      return false;
    }
    return true;
  }

  private changePage(page: number): void {
    // change the page
    this.props.getLabelsAction(page);
  }
}

const mapStateToProps = (state: { labels: ILabelsState }) => {
  return {
    labels: state.labels
  };
};

const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    changeTempLabelAction: (tempLabel: IInventoryLabel) => dispatch(changeTempLabelAction(tempLabel)),
    createLabelAction: (label: IInventoryLabel) => dispatch(createLabelAction(label)),
    changeLabelAction: (label: IInventoryLabel, message?: boolean) => dispatch(changeLabelAction(label, message)),
    deleteLabelAction: (id: string) => dispatch(deleteLabelAction(id)),
    getLabelsAction: (page: number) => dispatch(getLabelsAction(page)),
    loadDataAction: (title: string, body: JSX.Element, footer: JSX.Element) => dispatch(loadDataAction(title, body, footer))
  };
};

export default connect<{labels: ILabelsState}, {dispatch: any}, IPropsType>(mapStateToProps, mapDispatchToProps)(LabelsListView);
