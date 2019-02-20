// import * as PropTypes from 'prop-types';
import * as moment from 'moment';
import * as Raven from 'raven-js';
import {ErrorInfo} from 'react';
import * as React from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import {IParticipant} from '../../../../../../src/interfaces/participant.interface';
import {CarReduxAction, getCarAction, ICarsState} from '../../actions/cars.actions';
import {getParticipant, IDashboardState, loadParticipantInCarAction} from '../../actions/dashboard.actions';
import AppContainer from '../../container/AppContainer';
import {IWindow} from '../../interfaces/window';
import ModalView from '../Modal/ModalView';
import TimeLineForm from './TimeLineForm';
import TimeLineInventory from './TimeLineInventory';

declare let window: IWindow;

interface IPropsType extends RouteComponentProps<{ id: string }> {
  dispatch: Dispatch<CarReduxAction>;
  cars: ICarsState;
  dashboard: IDashboardState;
  getCarAction(id: string): void;
  getParticipant(id: string): void;

  loadParticipantInCarAction(participant: IParticipant): void;
}

interface IStateType {
  error: Error | null;
}

class CarDetailView extends React.Component<IPropsType, IStateType> {

  state = {
    error: null,
    highlight: []
  };

  componentWillMount() {
    // set the title of the page
    const {id} = this.props.match.params;
    document.title = 'OSA Andes | Detalle VIN';
    this.props.getCarAction(id);
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public componentWillUnmount() {
    // cancel request if component is inmounted
    if (this.props.cars.source) {
      this.props.cars.source.cancel('Operation canceled by the user.');
    }
  }

  public render(): React.ReactElement<IPropsType> {
    const {loading, car, carEvents} = this.props.cars;
    // const {loadingParticipant} = this.props.dashboard;
    const {getParticipant} = this.props;
    return (
      <AppContainer title="" cMenu="10" cSubMenu="10.2"  cAction="Detalle Vehículo">
        <section className="content">
          <div className="box">
            <div className="box-header with-border"><h3 className="box-title">Detalle VIN {car ? car.vin : null}</h3>
              <div className="box-tools pull-right">
              </div>
            </div>
            <div className="box-body">
              <table style={{width: '100%'}}>
                <tbody>
                <tr>
                  <td style={{padding: '5px'}}><strong>Marca</strong></td>
                  <td style={{padding: '5px'}}>
                    {
                      car && car.brand ? car.brand : '-'
                    }
                  </td>
                </tr>
                <tr>
                  <td style={{padding: '5px'}}><strong>Denominación</strong></td>
                  <td style={{padding: '5px'}}>
                    {
                      car && car.denomination ? car.denomination : '-'
                    }
                  </td>
                </tr>
                <tr>
                  <td style={{padding: '5px'}}><strong>Color</strong></td>
                  <td style={{padding: '5px'}}>
                    {
                      car && car.color ? car.color : '-'
                    }
                  </td>
                </tr>
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
          <ul className="timeline">
            {
              Object.keys(carEvents).map((event) => {
                const events = carEvents[event];
                return <React.Fragment key={event}>
                  <li className="time-label">
                    <span className="bg-blue">
                        {moment(event).format('LL')}
                    </span>
                  </li>
                  {
                    events.map((data: any) => {
                      console.log(data);
                      return (
                        data.typeEvent === 'revision' ?
                          <TimeLineForm form={data} getParticipant={getParticipant} key={data._id}/>
                        : <TimeLineInventory inventory={data}  key={data._id}/>
                      );
                    })
                  }
                </React.Fragment>;
              })
            }
            <li>
              <i className="fa fa-clock-o bg-gray"></i>
            </li>
          </ul>
          <ModalView />
        </section>
      </AppContainer>
    );
  }
}

const mapStateToProps = (state: { cars: ICarsState, dashboard: IDashboardState }) => {
  return {
    cars: state.cars,
    dashboard: state.dashboard
  };
};

const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    getCarAction: (id: string) => dispatch(getCarAction(id)),
    getParticipant: (id: string) => dispatch(getParticipant(id)),
    loadParticipantInCarAction: (participant: IParticipant) => dispatch(loadParticipantInCarAction(participant))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(CarDetailView);
