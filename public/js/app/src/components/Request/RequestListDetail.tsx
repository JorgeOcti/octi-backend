import * as moment from 'moment-timezone';
import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { ICarrier } from '../../../../../../src/interfaces/carrier.interface';
import { IReason } from '../../../../../../src/interfaces/reason.interface';
import { IRequest } from '../../../../../../src/interfaces/request.interface';
import { IRequestItemStatus } from '../../../../../../src/interfaces/requestItemStatus.interface';
import { IRequestsState } from '../../actions/requests.actions';
import DateRangePicker from '../Utils/DateRangePicker';

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  request: IRequest;
  reasons: IReason[];
  carriers: ICarrier[];
  requestItemStatus: IRequestItemStatus[];
}

interface IStateType {
  error: Error | null;
  open: boolean;
}

class RequestListDetail extends React.Component<IPropsType, IStateType> {

  readonly state = {
    error: null,
    open: false
  };

  constructor(props: IPropsType) {
    super(props);
    this.handleChangeOpen = this.handleChangeOpen.bind(this);
    this.goToDetail = this.goToDetail.bind(this);
  }

  public render(): React.ReactElement<IPropsType> {
    const {request, reasons, requestItemStatus, carriers} = this.props;
    const {open} = this.state;
    return (
      <React.Fragment>
        <div className="row request bg-request-title pointer" onClick={this.handleChangeOpen}>
          <div
            className="col-sm-1 col-xs-1 col-md-1 col-lg-1"
            onClick={() => this.goToDetail(request._id)}
          >
            <i className="fa fa-circle status-circle-red" />
            <strong className="text-underline">
              #{this.padNumber(request.number)}
            </strong>&nbsp;
            <i className="fa fa-share-square-o" style={{fontSize: '10px'}}/>
          </div>
          <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1">
            {
              request.fleet ?
                <i className="fa fa-check-circle-o text-green"/>
                : null

            }
          </div>
          <div className="col-sm-2 col-xs-2 col-md-2 col-lg-2">
            <span className="label label-primary">
              {
                request.status?.name
              }
            </span>
          </div>
          <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1">{request.destination.name}</div>
          <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1 center">
            {request.items.length}
          </div>
          <div className="col-sm-2 col-xs-2 col-md-2 col-lg-2 center">
            {moment(request.createdAt).format('DD-MM-YY')}
          </div>
          <div className="col-sm-2 col-xs-2 col-md-2 col-lg-2 center">
            {moment(request.updatedAt).format('DD-MM-YY')}
          </div>
          <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1 center">
            10
          </div>
          <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1 chevron">
            {
              open ? <i className="fa fa-chevron-up"/> : <i className="fa fa-chevron-down"/>
            }
          </div>
        </div>
        <div className="table-request" style={{display: open ? 'block' : 'none'}}>
          <table className="table">
            <thead>
              <tr style={{ backgroundColor: '#f9f9f9' }}>
                <th style={{ width: '28px' }} />
                <th>Progreso</th>
                <th>Estado</th>
                <th style={{ width: '250px' }}>Modelo</th>
                <th>Color</th>
                <th className="text-center">VIN</th>
                <th className="text-center">CDO</th>
                <th className="text-center">Equip. / Carroc. / Preentrega</th>
                <th>Motivo</th>
                <th>Transporte</th>
                <th>Fecha carga</th>
                <th>LLegada est</th>
                <th>Observación despacho</th>
              </tr>
            </thead>
            <tbody>
              {
                request.items.map((item: any) => (
                  <tr key={item._id}>
                    <td className="middle-center">
                      {item.priority ?
                        <i className="fa fa-star text-yellow" />
                        : null}
                    </td>
                    <td className="middle">
                      <div className="progress progress-xs">
                        <div className="progress-bar progress-bar-aqua" style={{ width: '75%' }} />
                      </div>
                    </td>
                    {/* <td className="middle">En centro logística</td> */}
                    <td className="middle">
                      <select className="form-control select-sm font-12" value={item.status?._id ?? ''} onChange={console.log}>
                        <option value="" disabled={true}>-</option>
                        {
                          requestItemStatus.map((req) => (
                            <option key={req._id} value={req._id}>{req.name}</option>
                          ))
                        }
                        <option value="1">Pendiente</option>
                        <option value="2">En centro logística</option>
                      </select>
                    </td>
                    <td className="middle">{`${item.car.brand} ${item.car.denomination} ${item.car.material}`}</td>
                    <td className="middle">{item.car.color}</td>
                    <td className="text-center">
                      {item.car.vin && item.car.vin.length ?
                        <i className="fa fa-check-circle text-olive" />
                        : null}
                    </td>
                    <td className="text-center">
                      {item.car.internalNumber && item.car.internalNumber.length ?
                        <i className="fa fa-check-circle text-olive" />
                        : null}
                    </td>
                    <td className="middle">
                      <div className="flex-wrap">
                        <div className={`flex-wrap-item-center ${item.equipment ? '' : 'text-gray'}`}>
                          <i className="material-icons">library_add</i>
                        </div>
                        <div className={`flex-wrap-item-center ${item.body ? '' : 'text-gray'}`}>
                          <i className="material-icons">rv_hookup</i>
                        </div>
                        <div className={`flex-wrap-item-center ${item.washed ? '' : 'text-gray'}`}>
                          <i className="material-icons">local_car_wash</i>
                        </div>
                        <div className={`flex-wrap-item-center ${item.review ? '' : 'text-gray'}`}>
                          <i className="material-icons">build</i>
                        </div>
                      </div>
                    </td>
                    {/* <td className="middle">{item.reason.name}</td> */}
                    <td className="middle">
                      <select className="form-control select-sm font-12" value={item.reason?._id ?? ''} onChange={console.log}>
                        <option value="" disabled={true}>-</option>
                        {
                          reasons.map((reason)=>(
                            <option key={reason._id} value={reason._id}>{reason.name}</option>
                          ))
                        }
                      </select>
                    </td>
                    {/* <td className="middle">Schiappacasse</td> */}
                    <td className="middle">
                      <select className="form-control select-sm font-12" value={item.carrier?._id ?? ''} onChange={console.log}>
                        <option value="">-</option>
                        {
                          carriers.map((carrier) => (
                            <option key={carrier._id} value={carrier._id}>{carrier.name}</option>
                          ))
                        }
                      </select>
                    </td>
                    {/* <td className="middle">06-11-19</td> */}
                    <td className="middle">
                      <DateRangePicker
                        style={{ width: '60px' }}
                        className={'input-xs'}
                        onChange={(e) => console.info(e)}
                      />
                    </td>
                    {/* <td className="middle">8-11-19</td> */}
                    <td className="middle">
                      <DateRangePicker
                        style={{ width: '60px' }}
                        className={'input-xs'}
                        onChange={(e) => console.info(e)}
                      />
                    </td>
                    <td />
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </React.Fragment>
    );
  }

  private goToDetail(id: string): void {
    this.props.history.push(`/requests/${id}/`);
  }

  private padNumber(n: number): string {
    const s = '000' + n;
    return s.substr(s.length-4);
  }

  private handleChangeOpen(){
    const {open} = this.state;
    this.setState({
      open: !open
    });
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
    // getRequestsAction: (page: number) => dispatch(getRequestsAction(page))
  };
};


export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(RequestListDetail);
// export default RequestListDetail;
