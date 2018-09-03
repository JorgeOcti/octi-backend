///<reference path="../../../node_modules/sweetalert/typings/sweetalert.d.ts"/>
import * as PropTypes from 'prop-types';
import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import {AlertReduxAction, IAlertsState} from '../../actions/alerts';
import {loadDataAction, ModalReduxAction} from '../../actions/modal';
import AppContainer from '../../container/AppContainer';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  alerts: IAlertsState;
  dispatch: Dispatch<AlertReduxAction>;
  loadDataAction(title: string, body: JSX.Element, footer: JSX.Element): ModalReduxAction;
}

interface IStateType {
  error: Error | null;
}

class InventoryListView extends React.Component<IPropsType, IStateType> {

  static propTypes = {
    dispatch: PropTypes.func.isRequired
  };

  state = {
    error: null
  };

  constructor(props: IPropsType) {
    super(props);
  }

  public componentWillMount() {
    // this.props.getAlertsAction();
    // set the title of the page
    document.title = 'OSA Andes | Inventarios';
  }

  public componentWillUnmount() {
    // cancel request if component is inmounted
    // if (this.props.alerts.source) {
    //   this.props.alerts.source.cancel('Operation canceled by the user.');
    // }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public render(): React.ReactElement<IPropsType> {
    // const {alerts, loading} = this.props.alerts;
    return (
      <AppContainer title="" cMenu="2" cSubMenu="2.1">
        <section className="content">
          <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">Gestión</h3>
              <div className="pull-right box-tools">
                <button className="btn btn-sm btn-success">Nuevo</button>
              </div>
            </div>
            <div className="box-body">
              {/*<table className="table table-striped">*/}
                {/*<thead>*/}
                  {/*<tr>*/}
                    {/*<th style={{width: '20%'}} className="middle">Nombre</th>*/}
                    {/*<th style={{width: '20%'}} className="middle text-center">Menor igual que</th>*/}
                    {/*<th style={{width: '20%'}} className="middle text-center">Mayor igual que</th>*/}
                    {/*<th style={{width: '40%'}} className="middle">Usuarios</th>*/}
                    {/*/!*<th className="width-10" />*!/*/}
                    {/*<th className="middle width-10" />*/}
                  {/*</tr>*/}
                {/*</thead>*/}
                {/*<tbody>*/}
                {/*{*/}
                  {/*alerts.length ?*/}
                    {/*alerts.map((alert) => {*/}
                      {/*return (*/}
                        {/*<tr key={alert._id} id={`alert-${alert._id}`}>*/}
                          {/*<td className="middle">{alert.name}</td>*/}
                          {/*<td className="middle text-center">{alert.lte !== 0 ? alert.lte : '-'}</td>*/}
                          {/*<td className="middle text-center">{alert.gte !== 0 ? alert.gte : '-'}</td>*/}
                          {/*<td>*/}
                            {/*{*/}
                              {/*alert.users.map((user) => {*/}
                                {/*return (*/}
                                  {/*<p key={user._id} style={{margin: 0}}>{`${user.firstName} ${user.lastName} <${user.email}>`}</p>*/}
                                {/*);*/}
                              {/*})*/}
                            {/*}*/}
                          {/*</td>*/}
                          {/*/!*<td className="text-blue pointer" onClick={undefined}><i className="fa fa-pencil"/></td>*!/*/}
                          {/*<td className="text-red pointer" onClick={() => this.deleteAlert(alert)}><i className="fa fa-minus-circle"/></td>*/}
                        {/*</tr>*/}
                      {/*);*/}
                    {/*}) : <tr>*/}
                      {/*<td colSpan={5}>Aún no se han ingresado alertas</td>*/}
                    {/*</tr>*/}
                {/*}*/}
                {/*</tbody>*/}
              {/*</table>*/}
            </div>
            {/*{*/}
              {/*loading &&*/}
                {/*<div className="overlay">*/}
                  {/*<i className="fa fa-spinner fa-spin text-purple"/>*/}
                {/*</div>*/}
            {/*}*/}
          </div>
          {/*<ModalView />*/}
        </section>
      </AppContainer>
    );
  }
}

const mapStateToProps = (state: { alerts: IAlertsState }) => {
  return {
    alerts: state.alerts
  };
};

const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    loadDataAction: (title: string, body: JSX.Element, footer: JSX.Element) => dispatch(loadDataAction(title, body, footer))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(InventoryListView);
