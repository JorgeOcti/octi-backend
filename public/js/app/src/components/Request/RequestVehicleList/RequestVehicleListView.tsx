import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { IRequestsState } from '../../../actions/requests.types';
import AppContainer from '../../../container/AppContainer';
import { IWindow } from '../../../interfaces/window';


interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  requests: IRequestsState;
  // dispatch: Dispatch<IRequestsState>;
  // updateRequestItemActionInList: (idRequest: string, item: IRequestItem) => void;
  // getRequestsThunkAction: (page: number, orderBy: string, orderType: string) => void;
  // deleteRequestItemActionInList: (idRequest: string, item: IRequestItem) => void;
  // deleteRequestActionInList: (id: string) => void;
  // createRequestItemActionInList: (idRequest: string, item: IRequestItem) => void;
}

interface IStateType {
  error: Error | null;
}

declare let window: IWindow;

class RequestVehicleListView extends React.Component<IPropsType, IStateType> {

  public render(): React.ReactElement<IPropsType> {
    const {
      pagination, loading, requests, reasons, requestItemStatus, carriers,
      orderBy, orderType
    } = this.props.requests;
    return (
      <AppContainer title="" cMenu="3" cSubMenu="3.2">
        <section className="content">
          <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">Vehículos <small>{pagination.count}</small></h3>
            </div>
          </div>
        </section>
      </AppContainer>
    );
  }
}

const mapStateToProps = (state: { requests: IRequestsState }) => {
  return {
    requests: state.requests
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch
    // getRequestsThunkAction: (page: number, orderBy: string, orderType: string) => dispatch(getRequestsThunkAction(page, orderBy, orderType)),
    // createRequestItemActionInList: (idRequest: string, item: IRequestItem) => dispatch(createRequestItemActionInList(idRequest, item)),
    // updateRequestItemActionInList: (idRequest: string, item: IRequestItem) => dispatch(updateRequestItemActionInList(idRequest, item)),
    // deleteRequestItemActionInList: (idRequest: string, item: IRequestItem) => dispatch(deleteRequestItemActionInList(idRequest, item)),
    // deleteRequestActionInList: (id: string) => dispatch(deleteRequestActionInList(id))
  };
};


export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(RequestVehicleListView);