import * as React from 'react';
import { Dispatch } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import TransmittalActions from '../../../actions/transmittal.actions';
import { ITransmittalActionTypes, ITransmittalState } from '../../../actions/transmittal.types';
import { ITransmittalModel } from '../../../../../../../src/distribution/models/transmittal.model';
import TransmitalListItem from './TransmittalListItem';
import ShowIf from '../../Utils/ShowIf';
import { loadDataAction, ModalReduxAction } from '../../../actions/modal.actions';
import { IRequestItem } from '../../../../../../../src/request/interfaces/requestItem.interface';
import ApiService from '../../../utils/axios';
import { AxiosError } from 'axios';
import { goToSection, hasPermission } from '../../../utils/common';
import { IWindow } from '../../../interfaces/window';
import DateRangePicker from '../../Utils/DateRangePicker';
import { getParticipant } from '../../../actions/dashboard.actions';
import { IParticipant } from '../../../../../../../src/form/interfaces/participant.interface';
import UploadTransmittalFile from './UploadTransmittalFile';
import AddItemsToTransmittal from '../TransmittalForms/AddItemsToTransmittal';
import { ICar } from '../../../../../../../src/app/interfaces/car.interface';
import { debounce } from 'throttle-debounce';
import {IMilestone} from "../../../../../../../src/distribution/interfaces/milestone.interface";
import {ChoicesStatusTransmittal} from "../../../../../../../src/distribution/models/transmitall.types";

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  router: any;
  dispatch: Dispatch<ITransmittalActionTypes>;
  transmittal: ITransmittalState;
  item: ITransmittalModel;
  evidenceMilestones: IMilestone[];
  transmittalActions: TransmittalActions;
  getParticipant(id: string): void;

  loadDataAction(title: string, body: JSX.Element, footer: JSX.Element): ModalReduxAction;
}

interface IStateType {
  error: Error | null;
}

declare let window: IWindow;

class TransmitalListDetail extends React.Component<IPropsType, IStateType> {

  private readonly api: ApiService;

  readonly state = {
    error: null
  };

  constructor(props: IPropsType) {
    super(props);
    this.openDialogAddCar = this.openDialogAddCar.bind(this);
    this.pushItem = this.pushItem.bind(this);
    this.pushItemCar = this.pushItemCar.bind(this);
    this.statusIcon = this.statusIcon.bind(this);
    this.downloadFiles = this.downloadFiles.bind(this);
    this.debouncedUpdateTransmittalThunkAction = debounce(2000, this.debouncedUpdateTransmittalThunkAction.bind(this));
    this.api = new ApiService();
  }

  componentDidMount() {
    const { location: { query } } = this.props.router;
    if (query?.transmittal?.length) {
      this.props.transmittalActions.toogleTab(query.transmittal, true);
      if (query?.item?.length) {
        const key = `transmittal-item-${query.item}`;
        setTimeout(() => {
          const element = document.getElementById(key);
          if (element) {
            element.style.backgroundColor = '#efefef';
            // element?.classList.add('bg-gray-light');
            element?.classList.add('text-black');
            goToSection(`#${key}`);
          } else {
            console.log(`No se encontro el elemento ${key}`);
          }
        }, 100);
      }
    }
  }

  private debouncedUpdateTransmittalThunkAction(transmittal: any){
    this.props.transmittalActions.updateTransmittalThunkAction(transmittal)
  }

  public render(): React.ReactElement<IPropsType> {
    const { item: transmittal, transmittalActions, evidenceMilestones } = this.props;
    const { carriers, drivers, milestoneTypes } = this.props.transmittal;
    const open = this.props.transmittal.transmittalOpen.includes(transmittal._id);
    return (
      <React.Fragment>
        <div id={`transmittal-${transmittal._id}`} className='row transmittal bg-transmittal-title background-transition pointer'>
          <div
            onClick={() => transmittalActions.toogleTab(transmittal._id)}
            className='flex-45 col-sm-1 col-xs-1 col-md-1 col-lg-1 center head-sorted'
          >
            <strong className='text-underline'>#{this.padNumber(transmittal.number)}</strong>&nbsp;
          </div>
          <div className='flex-45 col-sm-1 col-xs-1 col-md-1 col-lg-1'>
            {
              hasPermission(window.user, 'changeTransmittal') ?
                (
                  <input
                    className='form-control input-sm'
                    defaultValue={transmittal.transporter?.patent}
                    onChange={(e) => {
                      this.debouncedUpdateTransmittalThunkAction({
                        _id: transmittal._id,
                        'transporter.patent': e.target.value
                      });
                    }}
                  />
                ) :
                (
                  `${transmittal.transporter?.patent}`
                )
            }
          </div>
          <div className='flex-45 col-sm-1 col-xs-1 col-md-1 col-lg-1' style={{ position: 'static' }}>
            {
              hasPermission(window.user, 'changeTransmittal') ?
                (
                  <select
                    className='form-control select-sm font-12' value={transmittal.transporter.driver?._id ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      this.props.transmittalActions.updateTransmittalThunkAction({
                        _id: transmittal._id,
                        'transporter.driver': e.target.value
                      });
                    }}
                  >
                    {/*<option value='' disabled={true}>-</option>*/}
                    {
                      drivers.map((driver) => (
                        <option key={driver._id} value={driver._id}>{`${driver.firstName} ${driver.lastName}`}</option>
                      ))
                    }
                  </select>
                  /*<BootstrapSelect
                    noneSelectedText='Selecciona un chófer'
                    displayItems={2}
                    sm={true}
                    selectedText='choferes seleccionadas.'
                    selected={transmittal.transporter.driver ? [transmittal.transporter.driver._id] : []}
                    autoClouse={true}
                    allOption={false}
                    search={true}
                    options={drivers.map((driver: any) => ({
                      value: driver._id,
                      text: `${driver.firstName} ${driver.lastName}`
                    }))}
                    onClick={(e: string) => {
                      this.props.transmittalActions.updateTransmittalThunkAction({
                        _id: transmittal._id,
                        'transporter.driver': e
                      });
                    }}
                  />*/
                ) :
                (
                  `${transmittal.transporter.driver.firstName} ${transmittal.transporter.driver.lastName}`
                )
            }
            {/*{transmittal.transporter.driver._id}*/}
          </div>
          <div className='flex-45 col-sm-1 col-xs-1 col-md-1 col-lg-1' style={{ position: 'static' }}>
            {
              hasPermission(window.user, 'changeTransmittal') ?
                (
                  <select
                    className='form-control select-sm font-12' value={transmittal.transporter.carrier?._id ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      this.props.transmittalActions.updateTransmittalThunkAction({
                        _id: transmittal._id,
                        'transporter.carrier': e.target.value
                      });
                    }}
                  >
                    {/*<option value='' disabled={true}>-</option>*/}
                    {
                      carriers.map((carrier) => (
                        <option key={carrier._id} value={carrier._id}>{`${carrier.name}`}</option>
                      ))
                    }
                  </select>
                ) :
                (
                  `${transmittal.transporter.carrier.name}`
                )
            }
          </div>
          <div className='flex-45 col-sm-1 col-xs-1 col-md-1 col-lg-1 text-sm text-muted'>
            {transmittal.items.length} unidades.
          </div>
          <div className='flex-45 col-sm-1 col-xs-1 col-md-1 col-lg-1'>
            <div className='flex-45 col-sm-8 col-xs-8 col-md-8 col-lg-8' style={{ position: 'static' }}>
              {
                hasPermission(window.user, 'changeTransmittal') ?
                  (
                    <select
                      className='form-control select-sm font-12' value={transmittal.type?._id ?? ''}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        this.props.transmittalActions.updateTransmittalThunkAction({
                          _id: transmittal._id,
                          'type': e.target.value
                        });
                      }}
                    >
                      <option value='' disabled={true}>-</option>
                      {
                        milestoneTypes.map((milestoneType) => (
                          <option key={milestoneType._id} value={milestoneType._id}>{`${milestoneType.name}`}</option>
                        ))
                      }
                    </select>
                    /*<BootstrapSelect
                      noneSelectedText='Selecciona un transportista'
                      displayItems={2}
                      sm={true}
                      selectedText='transportistas seleccionadas.'
                      selected={transmittal.transporter.carrier ? [transmittal.transporter.carrier._id] : []}
                      autoClouse={true}
                      allOption={false}
                      search={true}
                      options={carriers.map((carrier: any) => ({
                        value: carrier._id,
                        text: carrier.name
                      }))}
                      onClick={(e: string) => {
                        this.props.transmittalActions.updateTransmittalThunkAction({
                          _id: transmittal._id,
                          'transporter.carrier': e
                        });
                      }}
                    />*/
                  ) :
                  (
                    `${transmittal.type?.name}`
                  )
              }

            </div>
            <div className='flex-45 col-sm-4 col-xs-4 col-md-4 col-lg-4'>
              <UploadTransmittalFile transmittal={transmittal} />
              <ShowIf condition={transmittal.files.length >= 1}>
                <button
                  className='btn btn-xs btn-default'
                  onClick={() => this.downloadFiles(transmittal)}
                >
                  <i
                    className='fa fa-paperclip'
                    data-toggle='tooltip'
                    data-placement='top'
                    title={`${transmittal.files.length} archivos adjuntos.`}
                  /> {`(${transmittal.files.length})`}
                </button>
              </ShowIf>
            </div>
          </div>
          {
            evidenceMilestones.map((milestone: IMilestone, index: number) => {
              let tmp = transmittal.evidenceFullLoad.filter(e => {
                if (e.milestone != undefined) {
                  let is_in: Boolean = evidenceMilestones.filter(em => em._id == e.milestone).length > 0;
                  return is_in ? e.milestone == milestone._id : index == 0;
                } else
                  return index == 0;
              });
              return (
                <div className='flex-45 col-sm-1 col-xs-1 col-md-1 col-lg-1 text-center' key={`${transmittal._id}-${milestone._id}`}>
                  {
                    tmp.map((image: any, index: number) => (
                      <div
                        key={`${transmittal._id}-${index}${image._id}`}
                        className={'text-center'} style={{ display: index === 0 ? '' : 'none' }}
                      >
                        <a href={decodeURI(image.file.url)}
                           data-toggle='lightbox'
                           data-gallery={`${transmittal._id}-${milestone._id}`}
                           data-title={`#${this.padNumber(transmittal.number)}`}
                           data-footer={`Conductor ${transmittal.transporter.driver ? `${transmittal.transporter.driver.firstName} ${transmittal.transporter.driver.lastName}` : ''} (${transmittal.transporter?.patent})`}
                        >
                          <button className='btn btn-xs btn-default'>
                            <i className='fa fa-fw fa-image' /> {tmp.length}
                          </button>
                        </a>
                      </div>
                    ))
                  }
                </div>
              );
            })
          }
          <div className='flex-45 col-sm-1 col-xs-1 col-md-1 col-lg-1'>
            {
              transmittal?.passBorder ?
                <i className='fa fa-flag' style={{paddingLeft: '5px'}}/> :
                null
            }
          </div>
          <div className='flex-45 col-sm-1 col-xs-1 col-md-1 col-lg-1'>
            {
              transmittal?.revision || [ChoicesStatusTransmittal.completed_by_reception.toString(), ChoicesStatusTransmittal.completed.toString()].includes(transmittal?.status) ?
                this.statusIcon(transmittal.revision, transmittal.status) :
                null
            }
          </div>
          <div
            className='flex-45 col-sm-1 col-xs-1 col-md-1 col-lg-1 chevron pointer'
            onClick={() => transmittalActions.toogleTab(transmittal._id)}
          >
            {
              open ? <i className='fa fa-chevron-up' /> : <i className='fa fa-chevron-down' />
            }
          </div>
        </div>
        <ShowIf condition={open}>
          <div className='table-transmittal'>
            <table className='table table-striped table-hover m-0 table-xs'>
              <thead>
              <tr style={{ backgroundColor: '#f9f9f9' }}>
                <th className='middle' style={{ width: '80px' }}>SOL</th>
                <th className='middle' style={{ width: '145px' }}>VIN</th>
                <th className='middle' style={{ minWidth: '100px' }}>Descripción</th>
                <th className='middle' style={{ width: '80px' }}>Factura</th>
                <th className='middle' style={{ width: '80px' }}>Partida</th>
                <th className='middle' style={{ width: '80px' }}>BL</th>
                <th className='middle' style={{ width: '100px' }}>Origen</th>
                <th className='middle' style={{ width: '100px' }}>Destino</th>
                <th className='middle' style={{ width: '105px' }}>Fecha emisión</th>
                <th className='middle' style={{ width: '105px' }}>Fecha arribo</th>
                <th className='middle' style={{ width: '20px' }}></th>
                <th className='middle-center' style={{ width: '40px' }}>Cargado</th>
                <ShowIf condition={hasPermission(window.user, 'changeTransmittal')}>
                  <th className='middle' style={{ width: '30px' }} />
                </ShowIf>
              </tr>
              </thead>
              <tbody>
              {
                transmittal.items.map((transmittalItem, index) => (
                  <TransmitalListItem
                    history={this.props.history}
                    item={transmittal}
                    transmittalItem={transmittalItem}
                    key={`${index}${transmittalItem._id}`}
                  />
                ))
              }
              <ShowIf condition={false && transmittal.items.length > 1}>
                <tr className='no-striped'>
                  <td colSpan={8} className='middle text-right'>
                    {/*Masivo*/}
                  </td>
                  <td className='middle'>
                    <DateRangePicker
                      className={'input-sm'}
                      value={''}
                      format={'DD-MM-YY'}
                      onChange={(e) => {
                        this.props.transmittalActions.updateTransmittalThunkAction({
                          _id: transmittal._id,
                          allLoadingDate: e?.toDate() ?? ''
                        });
                      }}
                    />
                  </td>
                  <td className='middle'>
                    <DateRangePicker
                      className={'input-sm'}
                      value={''}
                      format={'DD-MM-YY'}
                      onChange={(e) => {
                        // allArrivalDate
                        this.props.transmittalActions.updateTransmittalThunkAction({
                          _id: transmittal._id,
                          allArrivalDate: e?.toDate() ?? ''
                        });
                      }}
                    />
                  </td>
                </tr>
              </ShowIf>
              </tbody>
            </table>
            <ShowIf condition={hasPermission(window.user, 'changeTransmittal')}>
              <div className='row'>
                <div className='col-md-12 text-right m-b-10 m-t-10'>
                  <button className='btn btn-sm btn-success' onClick={this.openDialogAddCar}>
                    <i className='fa fa-fw fa-plus-square' /> Cargar vehículo
                  </button>
                </div>
              </div>
            </ShowIf>
          </div>
        </ShowIf>
      </React.Fragment>
    );
  }

  private statusIcon(revision: IParticipant, status: string) {
    if (revision && revision.hasDamages) {
      return (
        <button
          className='btn btn-xs btn-default'
          data-toggle='tooltip'
          data-placement='top'
          title={`Ver detalle`}
          onClick={() => this.props.getParticipant(revision._id)}
        >
          <i className='fa fa-warning text-red' />
        </button>
      );
    } else {
      if (status === ChoicesStatusTransmittal.completed_by_reception)
        return (

            <i className='fa fa-ban text-warning' style={{paddingLeft: '5px'}}/>

        );
      return (
        <button
          className='btn btn-xs btn-default'
          data-toggle='tooltip'
          data-placement='top'
          title={`Ver detalle`}
          onClick={() => this.props.getParticipant(revision._id)}
        >
          <i className='fa fa-check-circle text-primary' />
        </button>
      );
    }
  }

  private openDialogAddCar() {
    const { item: transmittal } = this.props;
    this.props.loadDataAction(
      `Agregar vehículo a orden #${this.padNumber(transmittal.number)}`,
      <AddItemsToTransmittal onClickRequest={this.pushItem} onClickCar={this.pushItemCar} slimView={true} />,
      <React.Fragment>
        <button type='button' className='btn btn-sm btn-default' data-dismiss='modal'>Cerrar</button>
      </React.Fragment>
    );
  }

  private downloadFiles(transmittal: ITransmittalModel) {
    window.open(`/transmittals/${transmittal._id}/download-files/`, '_blank');
  }

  private pushItemCar(car: ICar) {
    const { item: transmittal } = this.props;
    this.api.addTransmittalItem({
      requestItem: null,
      car: car._id,
      request: null,
      // origin: requestItem.origin?._id,
      // destination: requestItem.destination?._id,
      transmittal: transmittal._id
    })
      .then((): void => {})
      .catch((err: AxiosError): void => {
        this.api.errorHandler(err);
      });
  }

  private pushItem(requestItem: IRequestItem) {
    const { item: transmittal } = this.props;
    this.props.transmittalActions.loadingRequestItemAction(true);
    this.api.addTransmittalItem({
      requestItem: requestItem._id,
      car: requestItem.car._id,
      request: requestItem.request._id,
      origin: requestItem.origin?._id,
      destination: requestItem.destination?._id,
      transmittal: transmittal._id
    })
      .then((): void => {})
      .catch((err: AxiosError): void => {
        this.api.errorHandler(err);
      });
  }

  private padNumber(n: number): string {
    const s = '' + n;
    return s.substr(0, 5);
  }

}

const mapStateToProps = (state: { transmittal: ITransmittalState }) => {
  return {
    transmittal: state.transmittal
  };
};

const mapDispatchToProps = (dispatch: any) => {
  const transmittalActions = new TransmittalActions(dispatch);
  return {
    dispatch,
    transmittalActions,
    getParticipant: (id: string) => dispatch(getParticipant(id)),
    loadDataAction: (title: string, body: JSX.Element, footer: JSX.Element) => dispatch(loadDataAction(title, body, footer))
  };
};


export default connect<{}, {}, IPropsType | any>(mapStateToProps, mapDispatchToProps)(TransmitalListDetail);
