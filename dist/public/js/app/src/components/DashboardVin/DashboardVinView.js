"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const AppContainer_1 = require("../../container/AppContainer");
const react_redux_1 = require("react-redux");
const dashboard_1 = require("../../actions/dashboard");
const PropTypes = require("prop-types");
const moment = require("moment");
class DashboardVinView extends React.Component {
    componentWillMount() {
        // set the title of the page
        document.title = 'OSA Andes | Listado de VINs';
        this.props.getCarsAction();
    }
    render() {
        const { loading, cars } = this.props.dashboard;
        return (<AppContainer_1.default title='' cMenu='1' cSubMenu='1.1' cAction='List'>
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
                    <th>Supervisor</th>
                    <th className="hidden-xs">Último checkeo</th>
                    
                    
                    
                    <th className="width-10"/>
                  </tr>
                </thead>
                <tbody>
                  {cars.map((car) => {
            return (<tr key={car._id} id={`car-${car._id}`}>
                          <td>{car.vin}</td>
                          <td>{`${car.lastForm.user ? `${car.lastForm.user.firstName} ${car.lastForm.user.lastName}` : ''}`}</td>
                          <td className="hidden-xs">{moment(car.lastForm.createdAt).format('LLL')}</td>
                          
                          
                          
                          
                          <td className="text-primary pointer"><i className="fa fa-table"/></td>
                        </tr>);
        })}
                </tbody>
              </table>

            </div>
            
            {loading &&
            <div className="overlay">
                  <i className="fa fa-spinner fa-spin text-purple"/>
                </div>}
          </div>
        </section>
      </AppContainer_1.default>);
    }
}
DashboardVinView.propTypes = {
    dashboard: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    getCarsAction: PropTypes.func.isRequired,
};
const mapStateToProps = (state) => {
    return {
        dashboard: state.dashboard
    };
};
// const mapDispatchToProps = (dispatch: Dispatch<UserReduxAction> ) => {
const mapDispatchToProps = (dispatch) => {
    return {
        dispatch,
        getCarsAction: () => dispatch(dashboard_1.getCarsAction()),
    };
};
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(DashboardVinView);
//# sourceMappingURL=DashboardVinView.js.map