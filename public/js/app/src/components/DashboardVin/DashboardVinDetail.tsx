import * as Raven from 'raven-js';
import * as React from "react";
import {ErrorInfo} from "react";
import {Dispatch} from "redux";
import {RouteComponentProps} from "react-router";
import {connect} from "react-redux";
import {DashboardReduxAction, IDashboardState, getCarAction} from "../../actions/dashboard";
import AppContainer from "../../container/AppContainer";
import * as moment from "moment";
import * as PropTypes from "prop-types";

interface IPropsType extends RouteComponentProps<{ id: string }> {
  dispatch: Dispatch<DashboardReduxAction>;
  dashboard: IDashboardState;
  getCarAction(id: string): void;
}

interface IStateType {
  error: Error | null;
}

class DashboardVinDetail extends React.Component<IPropsType, IStateType> {

  static propTypes = {
    dashboard: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    getCarAction: PropTypes.func.isRequired,
  };

  componentWillMount(){
    // set the title of the page
    const {id} = this.props.match.params;
    document.title = 'OSA Andes | Listado de VINs';
    this.props.getCarAction(id);
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public componentWillUnmount(){
    // cancel request if component is inmounted
    if (this.props.dashboard.source) {
      this.props.dashboard.source.cancel('Operation canceled by the user.');
    }
  }

  public render(): React.ReactElement<IPropsType> {
    const {loading, car} = this.props.dashboard;
    return (
      <AppContainer title='' cMenu='1' cSubMenu='1.2' cAction={`Detalle`}>
        <section className="content">
          <div className="box">
            <div className="box-header with-border"><h3 className="box-title">Auto VIN {car ? car.vin : null}</h3>
              <div className="box-tools pull-right">
              </div>
            </div>
            <div className="box-body">
              <table style={{width: '50%'}}>
                <tbody>
                  <tr>
                    <td style={{padding:'5px'}}><strong>Último Checkeo</strong></td>
                    <td style={{padding:'5px'}}>
                      {
                        car && car.participants && `${moment(car.participants[0].createdAt).format('LLL')}`
                      }
                    </td>
                  </tr>
                  <tr>
                    <td style={{padding:'5px'}}><strong>Por</strong></td>
                    <td style={{padding:'5px'}}>
                      {
                        car && car.participants && `${car.participants[0].user.firstName} ${car.participants[0].user.lastName}`
                      }
                    </td>
                  </tr>
                </tbody>
              </table>
              <h4>Detalle</h4>
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Formulario</th>
                    <th>Supervisor</th>
                    <th>Calificación</th>
                  </tr>
                </thead>
                <tbody>
                {
                  car &&  car.participants && car.participants.map((participant) => (
                    <tr key={participant._id}>
                      <td>{moment(participant.createdAt).format('LLL')}</td>
                      <td>{participant.name}</td>
                      <td>{participant.user.firstName} {participant.user.lastName}</td>
                      <td>{Math.round(participant.qualification)}%</td>
                    </tr>
                  ))
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
        </section>
      </AppContainer>
    );
  }
}

const mapStateToProps = (state: { dashboard: IDashboardState }) => {
  return {
    dashboard: state.dashboard
  };
};

const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    getCarAction: (id: string) => dispatch(getCarAction(id))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(DashboardVinDetail);
