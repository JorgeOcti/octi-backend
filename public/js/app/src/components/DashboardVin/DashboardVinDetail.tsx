import {DashboardReduxAction, IDashboardState, getCarAction} from "../../actions/dashboard";
import * as React from "react";
import {Dispatch} from "redux";
import {RouteComponentProps} from "react-router";
import {connect} from "react-redux";
import AppContainer from "../../container/AppContainer";
import {IParticipant} from "../../../../../../src/interfaces/participant.interface";
import * as moment from "moment";

interface IPropsType extends RouteComponentProps<{ id: string }> {
  dispatch: Dispatch<DashboardReduxAction>;
  dashboard: IDashboardState;
  getCarAction(id: string): void;
}

interface IStateType {
  error: Error | null;
}

class DashboardVinDetail extends React.Component<IPropsType, IStateType> {

  componentWillMount(){
    // set the title of the page
    const {id} = this.props.match.params;
    document.title = 'OSA Andes | Listado de VINs';
    this.props.getCarAction(id);
  }

  public render(): React.ReactElement<IPropsType> {
    const {loading, car} = this.props.dashboard;
    return (
      <AppContainer title='' cMenu='1' cSubMenu='1.1' cAction={`Detalle`}>
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
                        car && `${moment(((car as any).participants[0] as IParticipant).createdAt).format('LLL')}`
                      }
                    </td>
                  </tr>
                  <tr>
                    <td style={{padding:'5px'}}><strong>Por</strong></td>
                    <td style={{padding:'5px'}}>
                      {
                        car && `${((car as any).participants[0] as IParticipant).user.firstName} ${((car as any).participants[0] as IParticipant).user.lastName}`
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
                  car && ((car as any).participants as IParticipant[]).map((participant, index) => (
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
