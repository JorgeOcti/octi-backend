import * as Raven from 'raven-js';
import * as React from 'react';
import { Dispatch, ErrorInfo } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import * as io from 'socket.io-client';
import AppContainer from '../../container/AppContainer';
import { IWindow } from '../../interfaces/window';
import TrackingBasePage from '../Utils/TrackingBasePage';
import TransmittalActions from '../../actions/transmittal.actions';
import { ITransmittalActionTypes, ITransmittalState } from '../../actions/transmittal.types';
import TransmittalForm from './TransmittalForms/TransmittalForm';
import ShowIf from '../Utils/ShowIf';
import ApiService from '../../utils/axios';
import { AxiosError, AxiosResponse } from 'axios';
import * as swal from 'sweetalert';
import { imageStatus } from '../Utils/MultiUploadFiles';
import { ITransmittal } from '../../../../../../src/distribution/interfaces/transmittal.interface';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<ITransmittalActionTypes>;
  transmittal: ITransmittalState;
  transmittalActions: TransmittalActions;
}

interface IStateType {
  error: Error | null;
  loading: boolean;
}

declare let window: IWindow;

class TransmittalCreateView extends TrackingBasePage<IPropsType, IStateType> {
  title: string;

  readonly state = {
    error: null,
    loading: false
  };

  private socket: SocketIOClient.Socket;

  private readonly api: ApiService;

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Crear orden de transporte';
    this.processForm = this.processForm.bind(this);
    this.cancel = this.cancel.bind(this);
    this.api = new ApiService();
  }

  public componentWillMount(): void {
    this.socket = io.connect(`${location.protocol}//${location.host}`, {
      secure: location.protocol === 'https:',
      transports: ['websocket'],
      reconnection: true,
      query: {
        token: window.user.token
      }
    });

    this.socket.on('connect', () => {
      this.socket.emit('join', {
        room: `distribution-create-${window.user.team._id}`
      });
    });
  }

  public componentDidMount(): void {
    super.componentDidMount();
    window.scrollTo(0, 0);
  }

  public componentDidUpdate(prevProps: IPropsType): void {
    $('[data-toggle="tooltip"]').tooltip();
  }

  public componentWillUnmount(): void {
    // cancel request if component is inmounted
    if (this.props.transmittal.source) {
      this.props.transmittal.source.cancel('Operation canceled by the user.');
    }
    this.socket.emit('leave', { room: `distribution-create-${window.user.team._id}` });
    this.socket.disconnect();
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error });
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public render(): React.ReactElement<IPropsType> {
    const { transmittalActions } = this.props;
    const { loading } = this.props.transmittal;

    return (
      <AppContainer title='' cMenu='3' cSubMenu='3.4' cAction='Crear Order'>
        <section className='content'>
          <div className='box'>
            <div className='box-header with-border'>
              <h3 className='box-title'>Crear orden de transporte</h3>
            </div>
            <div className='box-body'>
              <TransmittalForm
                initialValues={{
                  files: [],
                  items: []
                }}
                onSubmit={this.processForm}
              />
            </div>
            <div className='box-footer text-right'>
              <button
                type='button'
                className='btn btn-sm btn-default'
                onClick={this.cancel}
              >
                Cancelar
              </button>
              <button
                type='button'
                className='btn btn-sm btn-primary'
                disabled={this.state.loading}
                style={{ marginLeft: '5px' }}
                onClick={() => transmittalActions.submit('transmittalForm')}
              >
                <ShowIf condition={this.state.loading}>
                  <i className='fa fa-spinner fa-spin ' />
                </ShowIf> Crear
              </button>
            </div>
            <ShowIf condition={loading || this.state.loading}>
              <div className='overlay'>
                <i className='fa fa-spinner fa-spin text-purple' />
              </div>
            </ShowIf>
          </div>
        </section>
      </AppContainer>
    );
  }

  private cancel(): void {
    this.props.history.push('/transmittals/');
  }

  private processForm(data: ITransmittal) {
    const { history } = this.props;
    const isUploadingFiles = data.files?.filter((file: any) => file.status !== imageStatus.complete).length;
    const hasItemsLoaded = data.items?.length >= 1;
    if (isUploadingFiles) {
      swal!('Orden de transporte', 'Aún se estan cargando archivos, espera que terminen para enviar.', 'error');
    } else if (!hasItemsLoaded) {
      swal!('Orden de transporte', 'Debes agregar al menos un vehículo para poder crear una order.', 'error');
    } else {
      this.setState({ loading: true });
      this.api.createTransmittals({
        ...data,
        items: data.items.map((item) => ({
          ...item,
          request: item.request?._id,
          requestItem: (item as any).type === 'request' ? item?._id : null
        })),
        files: data.files.map((file) => file._id)
      })
        .then((response: AxiosResponse): void => {
          swal('Orden de transporte', 'Se ha creado satisfactoriamente.', 'success')
            .then(() => {
              this.setState({ loading: false });
              history.push('/transmittals/');
            });
        })
        .catch((err: AxiosError): void => {
          this.setState({ loading: false });
          this.api.errorHandler(err);
        });
    }
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
    transmittalActions
  };
};


export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(TransmittalCreateView);
