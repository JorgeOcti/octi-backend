import * as React from 'react';
import { Dispatch } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import TransmittalActions from '../../../actions/transmittal.actions';
import { ITransmittalActionTypes, ITransmittalState } from '../../../actions/transmittal.types';
import { ITransmittalModel } from '../../../../../../../src/distribution/models/transmittal.model';
import TransmitalListItem from './TransmittalListItem';
import ShowIf from '../../Utils/ShowIf';
import BootstrapSelect from '../../Utils/BootstrapSelect';
import { loadDataAction, ModalReduxAction } from '../../../actions/modal.actions';
import SearchCarInRequests from '../TransmittalForms/SearchCarInRequest';
import { IRequestItem } from '../../../../../../../src/request/interfaces/requestItem.interface';
import ApiService from '../../../utils/axios';
import { AxiosError, AxiosResponse } from 'axios';
import { hasPermission } from '../../../utils/common';
import { IWindow } from '../../../interfaces/window';
import DateRangePicker from '../../Utils/DateRangePicker';
import { getParticipant } from '../../../actions/dashboard.actions';
import { IParticipant } from '../../../../../../../src/form/interfaces/participant.interface';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<ITransmittalActionTypes>;
  transmittal: ITransmittalState;
  item: ITransmittalModel;
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
    this.statusIcon = this.statusIcon.bind(this);
    this.api = new ApiService();
  }

  public render(): React.ReactElement<IPropsType> {
    const { item: transmittal, transmittalActions } = this.props;
    const { carriers, drivers } = this.props.transmittal;
    const open = this.props.transmittal.transmittalOpen.includes(transmittal._id);
    return (
      <React.Fragment>
        <div id={`transmittal-${transmittal._id}`} className='row transmittal bg-transmittal-title background-transition'>
          <div className='flex-45 col-sm-1 col-xs-1 col-md-1 col-lg-1 center pointer head-sorted'>
            <strong className='text-underline'>#{this.padNumber(transmittal.number)}</strong>&nbsp;
          </div>
          <div className='flex-45 col-sm-1 col-xs-1 col-md-1 col-lg-1'>
            {transmittal.transporter?.patent}
          </div>
          <div className='flex-45 col-sm-2 col-xs-2 col-md-2 col-lg-2' style={{ position: 'static' }}>
            {
              hasPermission(window.user, 'changeTransmittal') ?
                (
                  <BootstrapSelect
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
                  />
                ) :
                (
                  `${transmittal.transporter.driver.firstName} ${transmittal.transporter.driver.lastName}`
                )
            }
            {/*{transmittal.transporter.driver._id}*/}
          </div>
          <div className='flex-45 col-sm-2 col-xs-2 col-md-2 col-lg-2' style={{ position: 'static' }}>
            {
              hasPermission(window.user, 'changeTransmittal') ?
                (
                  <BootstrapSelect
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
                  />
                ) :
                (
                  `${transmittal.transporter.carrier.name}`
                )
            }

          </div>
          <div className='flex-45 col-sm-1 col-xs-1 col-md-1 col-lg-1'>
            {transmittal.items.length}
          </div>
          <div className='flex-45 col-sm-2 col-xs-2 col-md-2 col-lg-2'>
            {transmittal.files.length}&nbsp;
            <ShowIf condition={process.env.NODE_ENV === 'development'}>
              <i
                className='fa fa-paperclip'
                data-toggle='tooltip'
                data-placement='top'
                title={`2 archivos adjuntos.`}
              />
            </ShowIf>
          </div>
          <div className='flex-45 col-sm-1 col-xs-1 col-md-1 col-lg-1'>
            {
              transmittal.evidenceFullLoad.map((image: any, index: number) => (
                <div key={image._id} className={'text-center'} style={{ display: index === 0 ? '' : 'none' }}>
                  <a href={decodeURI(image.file.url)}
                     data-toggle='lightbox'
                     data-gallery={transmittal._id}
                     data-title={`#${this.padNumber(transmittal.number)}`}
                     data-footer={`Conductor ${transmittal.transporter.driver ? `${transmittal.transporter.driver.firstName} ${transmittal.transporter.driver.lastName}` : ''} (${transmittal.transporter?.patent})`}
                  >
                    <button className='btn btn-xs btn-default'>
                      <i className='fa fa-fw fa-image' /> {transmittal.evidenceFullLoad.length}
                    </button>
                  </a>
                </div>
              ))
            }
          </div>
          <div className='flex-45 col-sm-1 col-xs-1 col-md-1 col-lg-1'>
            {
              transmittal?.revision ?
                this.statusIcon(transmittal.revision) :
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
          <table className='table table-hover m-0'>
            <thead>
            <tr style={{ backgroundColor: '#f9f9f9' }}>
              <th className='middle' style={{ width: '28px' }}>Solicitud</th>
              <th className='middle' style={{ width: '100px' }}>VIN</th>
              <th className='middle' style={{ width: '160px' }}>Modelo</th>
              <th className='middle' style={{ width: '80px' }}>Factura</th>
              <th className='middle' style={{ width: '80px' }}>Partida</th>
              <th className='middle' style={{ width: '80px' }}>BL</th>
              <th className='middle' style={{ minWidth: '100px' }}>Origen</th>
              <th className='middle' style={{ minWidth: '100px' }}>Destino</th>
              <th className='middle' style={{ width: '110px' }}>Fecha emisión</th>
              <th className='middle' style={{ width: '110px' }}>Fecha arribo</th>
              <th className='middle' style={{ width: '120px' }}>Observación</th>
              <th className='middle' style={{ width: '40px' }}>Carga</th>
              <ShowIf condition={hasPermission(window.user, 'changeTransmittal')}>
                <th className='middle' style={{ width: '30px' }} />
              </ShowIf>
            </tr>
            </thead>
            <tbody>
            {
              transmittal.items.map((transmittalItem) => (
                <TransmitalListItem
                  item={transmittal}
                  transmittalItem={transmittalItem}
                  key={transmittalItem._id}
                />
              ))
            }
            <ShowIf condition={transmittal.items.length > 1}>
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
                  <i className='fa fa-fw fa-plus' /> Agregar vehículo
                </button>
              </div>
            </div>
          </ShowIf>
        </div>
        </ShowIf>
      </React.Fragment>
    );
  }

  private statusIcon(revision: IParticipant) {
    if (revision.hasDamages) {
      return (
        <div className={'middle pointer'} onClick={() => this.props.getParticipant(revision._id)}>
          <i className='fa fa-warning text-red' />
        </div>
      );
    } else  {
      return (
        <div className={'middle pointer'} onClick={() => this.props.getParticipant(revision._id)}>
          <i className='fa fa-check-circle text-primary' />
        </div>
      );
    }
  }

  private openDialogAddCar() {
    const { item: transmittal } = this.props;
    this.props.loadDataAction(
      `Agregar vehículo a orden #${this.padNumber(transmittal.number)}`,
      <SearchCarInRequests onClick={this.pushItem} slimView={true} />,
      <React.Fragment>
        <button type='button' className='btn btn-sm btn-default' data-dismiss='modal'>Cerrar</button>
      </React.Fragment>
    );
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
      .then((): void => {

      })
      .catch((err: AxiosError): void => {
        this.api.errorHandler(err);
      });
  }

  private padNumber(n: number): string {
    const s = '0000' + n;
    return s.substr(s.length - 5);
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
