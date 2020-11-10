import * as React from "react";
import * as moment from "moment-timezone";

interface IPropsType {
  request: any;
}

interface IStateType {
  error: Error | null;
  open: boolean;
}

class RequestDetailView extends React.Component<IPropsType, IStateType> {

  readonly state = {
    error: null,
    open: false
  };

  constructor(props:IPropsType) {
    super(props);
    this.handleChangeOpen = this.handleChangeOpen.bind(this);
  }

  public render(): React.ReactElement<IPropsType> {
    const {request} = this.props;
    const {open} = this.state;
    return (
      <React.Fragment>
        <div className="row request pointer" onClick={this.handleChangeOpen}>
          <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1">
            <i className="fa fa-circle status-circle-red"/> <strong>#{this.padNumber(request.number)}</strong>
          </div>
          <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1">
            {
              request.fleet ?
                <i className="fa fa-check-circle-o"/>
                : null

            }
          </div>
          <div className="col-sm-2 col-xs-2 col-md-2 col-lg-2">
            <span className="label label-primary">En proceso</span>
          </div>
          <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1">ANT</div>
          <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1 center">{request.items.length}</div>
          <div className="col-sm-2 col-xs-2 col-md-2 col-lg-2 center">{moment(request.createdAt).format("DD-MM-YY")}</div>
          <div className="col-sm-2 col-xs-2 col-md-2 col-lg-2 center">{moment(request.updatedAt).format("DD-MM-YY")}</div>
          <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1 center">
            10
          </div>
          <div className="col-sm-1 col-xs-1 col-md-1 col-lg-1 chevron">
            {
              open ? <i className="fa fa-chevron-up"/> : <i className="fa fa-chevron-down"/>
            }
          </div>
        </div>
        {
          open ?
            <table className="table table-request">
              <thead>
              <tr>
                <th/>
                <th>Progreso</th>
                <th>Estado</th>
                <th>Modelo</th>
                <th>Color</th>
                <th className="text-center">VIN</th>
                <th className="text-center">CDO</th>
                <th className="text-center">Equip. / Carroc. / Preentrega</th>
                <th>Motivo</th>
                <th>Transporte</th>
                <th>Fecha carga</th>
                <th>Hora carga</th>
                <th>LLegada est</th>
                <th>Observación despacho</th>
              </tr>
              </thead>
              <tbody>
              {
                request.items.map((item:any)=>{
                  return (
                    <tr key={item._id}>
                      <td className="text-center">
                        {
                          item.priority ?
                            <i className="fa fa-star text-yellow"/>
                            : null
                        }
                      </td>
                      <td>
                        <div className="progress progress-xs">
                          <div className="progress-bar progress-bar-aqua" style={{width: "75%"}} />
                        </div>
                      </td>
                      <td>En centro logistica</td>
                      <td>{`${item.car.brand} ${item.car.denomination} ${item.car.material}`}</td>
                      <td>{item.car.color}</td>
                      <td className="text-center">
                        {
                          item.car.vin && item.car.vin.length ?
                            <i className="fa fa-check-circle text-olive"/>
                            : null
                        }
                      </td>
                      <td className="text-center">
                        {
                          item.car.internalNumber && item.car.internalNumber.length ?
                            <i className="fa fa-check-circle text-olive"/>
                            : null
                        }
                      </td>
                      <td>
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
                      <td>{item.reason.name}</td>
                      <td>Schiappacasse</td>
                      <td>06-11-19</td>
                      <td>15:31</td>
                      <td>8-11-19</td>
                      <td></td>
                    </tr>
                  )
                })
              }
              {/*<tr>*/}
              {/*  <td className="text-center"><i className="fa fa-star text-yellow"/></td>*/}
              {/*  <td>*/}
              {/*    <div className="progress progress-xs">*/}
              {/*      <div className="progress-bar progress-bar-aqua" style={{width: "75%"}}/>*/}
              {/*    </div>*/}
              {/*  </td>*/}
              {/*  <td>En centro logistica</td>*/}
              {/*  <td>Toyota 4 Runner ASD14</td>*/}
              {/*  <td>Calypso</td>*/}
              {/*  <td className="text-center"><i className="fa fa-check-circle text-olive"/></td>*/}
              {/*  <td className="text-center"><i className="fa fa-check-circle text-olive"/></td>*/}
              {/*  <td>*/}
              {/*    <div className="flex-wrap">*/}
              {/*      <div className="flex-wrap-item-center">-</div>*/}
              {/*      <div className="flex-wrap-item-center">-</div>*/}
              {/*      <div className="flex-wrap-item-center">*/}
              {/*        <i className="material-icons">local_car_wash</i>*/}
              {/*      </div>*/}
              {/*      <div className="flex-wrap-item-center">*/}
              {/*        <i className="material-icons">build</i>*/}
              {/*      </div>*/}
              {/*    </div>*/}
              {/*  </td>*/}
              {/*  <td>Venta</td>*/}
              {/*  <td>Schiappacasse</td>*/}
              {/*  <td>06-11-19</td>*/}
              {/*  <td>15:31</td>*/}
              {/*  <td>8-11-19</td>*/}
              {/*  <td></td>*/}
              {/*</tr>*/}
              {/*<tr>*/}
              {/*  <td></td>*/}
              {/*  <td>*/}
              {/*    <div className="progress progress-xs">*/}
              {/*      <div className="progress-bar progress-bar-aqua" style={{width: "10%"}}/>*/}
              {/*    </div>*/}
              {/*  </td>*/}
              {/*  <td>Pendiente</td>*/}
              {/*  <td>Toyota 4 Runner ASD14</td>*/}
              {/*  <td>Gris</td>*/}
              {/*  <td></td>*/}
              {/*  <td className="text-center"><i className="fa fa-check-circle text-olive"/></td>*/}
              {/*  <td>*/}
              {/*    <div className="flex-wrap">*/}
              {/*      <div className="flex-wrap-item-center">-</div>*/}
              {/*      <div className="flex-wrap-item-center">-</div>*/}
              {/*      <div className="flex-wrap-item-center">*/}
              {/*        <i className="material-icons text-gray">local_car_wash</i>*/}
              {/*      </div>*/}
              {/*      <div className="flex-wrap-item-center">*/}
              {/*        <i className="material-icons text-gray">build</i>*/}
              {/*      </div>*/}
              {/*    </div>*/}
              {/*  </td>*/}
              {/*  <td>Stock</td>*/}
              {/*  <td>Schiappacasse</td>*/}
              {/*  <td>06-11-19</td>*/}
              {/*  <td>15:31</td>*/}
              {/*  <td>8-11-19</td>*/}
              {/*  <td></td>*/}
              {/*</tr>*/}
              {/*<tr>*/}
              {/*  <td></td>*/}
              {/*  <td>*/}
              {/*    <div className="progress progress-xs">*/}
              {/*      <div className="progress-bar progress-bar-aqua" style={{width: "55%"}}/>*/}
              {/*    </div>*/}
              {/*  </td>*/}
              {/*  <td>Gestión marca</td>*/}
              {/*  <td>Toyota 4 Runner ASD14</td>*/}
              {/*  <td>Gris</td>*/}
              {/*  <td></td>*/}
              {/*  <td className="text-center"><i className="fa fa-check-circle text-olive"/></td>*/}
              {/*  <td>*/}
              {/*    <div className="flex-wrap">*/}
              {/*      <div className="flex-wrap-item-center">-</div>*/}
              {/*      <div className="flex-wrap-item-center">-</div>*/}
              {/*      <div className="flex-wrap-item-center">*/}
              {/*        <i className="material-icons text-gray">local_car_wash</i>*/}
              {/*      </div>*/}
              {/*      <div className="flex-wrap-item-center">*/}
              {/*        <i className="material-icons">build</i>*/}
              {/*      </div>*/}
              {/*    </div>*/}
              {/*  </td>*/}
              {/*  <td>Stock</td>*/}
              {/*  <td>Schiappacasse</td>*/}
              {/*  <td>06-11-19</td>*/}
              {/*  <td>15:31</td>*/}
              {/*  <td>8-11-19</td>*/}
              {/*  <td></td>*/}
              {/*</tr>*/}
              </tbody>
            </table>
            : null
        }
      </React.Fragment>
    );
  }

  private padNumber(n: number): string {
    const s = "000" + n;
    return s.substr(s.length-4);
  }

  private handleChangeOpen(){
    const {open} = this.state;
    this.setState({
      open: !open
    })

  }
}

export default RequestDetailView;
