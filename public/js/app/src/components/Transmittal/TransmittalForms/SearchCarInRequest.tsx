import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import TransmittalActions from "../../../actions/transmittal.actions";
import {ITransmittalActionTypes, ITransmittalState} from "../../../actions/transmittal.types";
import {Dispatch} from "redux";
import {FieldArrayFieldsProps} from "redux-form/lib/FieldArray";
import Paginator from "../../Utils/Paginator";


interface IExternarlPropsType {
  fields: FieldArrayFieldsProps<any>
}

interface IPropsType extends RouteComponentProps<{ }> {
  dispatch: Dispatch<ITransmittalActionTypes>;
  transmittal: ITransmittalState;
  transmittalActions: TransmittalActions
}

interface IStateType {
  error: Error | null;
}

class SearchCarInRequests extends React.Component<IPropsType, IStateType> {

  readonly state = {
    error: null
  };

  constructor(props: IPropsType) {
    super(props);
    this.changePage = this.changePage.bind(this);
  }

  public componentWillMount(): void {
    this.props.transmittalActions.getRequestItemThunkAction(1);
  }

  public componentWillUnmount(): void {
    //cancel request if component is inmounted
    if (this.props.transmittal.source) {
      this.props.transmittal.source.cancel('Operation canceled by the user.');
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public render(): React.ReactElement<IPropsType> {
    const {transmittalActions, transmittal} = this.props;
    const {requestItemsfilters, requestItemsPagination} = transmittal;
    // this.props.transmittalActions.pushItem({});
    return (
      <div className="col-md-12">
        <div className="row">
          <div className="col-md-12" style={{marginTop: '10px'}}>
            <h4>Agregar Vehículos</h4>
          </div>
          <div className="col-md-8">
            <div className="form-group">
              <label className="control-label">
                Vehículo
              </label>
              <input
                type="text"
                className="form-control input-sm"
                placeholder="Busca por VIN, marca, modelo, material o nº de solicitud."
                defaultValue={requestItemsfilters.text}
                onChange={(e) => {
                  // this.changeFilterDebounced('text', e.target.value);
                }}
              />
            </div>
          </div>
          <div className="col-md-4">
            <div className="form-group">
              <label className="control-label">
                Nº Solicitudes
              </label>
              <input
                type="text"
                className="form-control input-sm"
                placeholder="Nº de solicitudes ejemplo: 2, 8, 10"
                defaultValue={requestItemsfilters.request}
                onChange={(e) => {
                  // this.changeFilterDebounced('request', e.target.value);
                }}
              />
            </div>
          </div>
        </div>
        {
          requestItemsPagination.pages > 1 &&
          <div className="row">
            <div className="col-md-6" style={{padding: '20px 15px'}}>
              <span className="react-bootstrap-table-pagination-total text-ellipsis">
                &nbsp;&nbsp;Mostrando registros del {(requestItemsPagination.page - 1) * 20 + 1} al {(requestItemsPagination.page) * 20} de {requestItemsPagination.count} registros.
              </span>
            </div>
            <div className="col-md-6">
              <div className="text-right" style={{marginRight: '15px'}}>
                <Paginator changePage={this.changePage} page={requestItemsPagination.page} pages={requestItemsPagination.pages}/>
              </div>
            </div>
          </div>
        }
      </div>
    );
  }

  private changePage(page: number): void {
    window.scrollTo(0, 0);
     this.props.transmittalActions.getRequestItemThunkAction(page);
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


export default connect<{}, {}, IExternarlPropsType | any>(mapStateToProps, mapDispatchToProps)(SearchCarInRequests);
