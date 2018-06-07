import * as React from 'react';
import AppContainer from "../../container/AppContainer";
import {connect} from "react-redux";
import {Dispatch} from "redux";
import {RouteComponentProps} from "react-router";
import {DashboardReduxAction, getCarsAction, IDashboardState} from "../../actions/dashboard";
import * as PropTypes from "prop-types";
// backend interfaces
import {ICar} from "../../../../../../src/interfaces/car.interface";


interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<DashboardReduxAction>;
  dashboard: IDashboardState;

  getCarsAction(): void;
}

interface IStateType {
  error: Error | null;
}

class DashboardVinView extends React.Component<IPropsType, IStateType> {

  static propTypes = {
    dashboard: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    getCarsAction: PropTypes.func.isRequired,
  };

  componentWillMount(){
    // set the title of the page
    document.title = 'OSA Andes | Listado de VINs';
    this.props.getCarsAction();
  }

  public render(): React.ReactElement<IPropsType> {
    const {loading, cars} = this.props.dashboard;
    return (
      <AppContainer title='' cMenu='1' cSubMenu='1.1' cAction='List'>
        <section className="content">
          <div className="box">
            <div className="box-header with-border"><h3 className="box-title">Listado de VINs</h3>
              <div className="box-tools pull-right">
              </div>
            </div>
            <div className="box-body">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>VIN</th>
                    {/*<th>Apellido</th>*/}
                    {/*<th className="hidden-xs">Sucursal</th>*/}
                    {/*<th className="hidden-xs">Email</th>*/}
                    {/*<th className="hidden-xs">Modificado</th>*/}
                    {/*<th className="width-10" />*/}
                    {/*<th className="width-10" />*/}
                  </tr>
                </thead>
                <tbody>
                  {
                    cars.map((car: ICar) => {
                      return (
                        <tr key={car._id} id={`car-${car._id}`}>
                          <td>{car.vin}</td>
                          {/*<td>{user.lastName}</td>*/}
                          {/*<td className="hidden-xs">{user.venue.name}</td>*/}
                          {/*<td className="hidden-xs">{user.email}</td>*/}
                          {/*<td className="hidden-xs">{moment(user.updatedAt).format('LLL')}</td>*/}
                          {/*<td className="text-blue pointer" onClick={() => this.editUser(user)}><i className="fa fa-pencil"/></td>*/}
                          {/*<td className="text-red pointer" onClick={() => this.deleteUser(user)}><i className="fa fa-minus-circle"/></td>*/}
                        </tr>
                      )
                    })
                  }
                </tbody>
              </table>

            </div>
            {/*<div className="box-footer">Footer</div>*/}
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

// const mapDispatchToProps = (dispatch: Dispatch<UserReduxAction> ) => {
const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    getCarsAction: () => dispatch(getCarsAction()),
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(DashboardVinView);

