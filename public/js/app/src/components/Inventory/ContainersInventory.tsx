import AppContainer from '../../container/AppContainer';
import TrackingBasePage from "../Utils/TrackingBasePage";
import {RouteComponentProps} from "react-router";
import {
  deleteInventoryAction,
  finishInventoryAction,
  getInventoriesAction,
  IInventoryState
} from "../../actions/inventory.actions";
import {connect} from "react-redux";
import * as React from "react";
import axios from "axios";
import ApiService from "../../utils/axios";
import {IInventory} from "../../../../../../src/inventory/interfaces/inventory.interface";
import * as moment from "moment-timezone";
import {hasPermission} from "../../utils/common";
import {IWindow} from "../../interfaces/window";

declare let window: IWindow;

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
}

interface IStateType {
  error: Error | null;
  containers: any[];
  selectedContainer: number;
  inventorySettings: any;
}

class ContainersInventory extends TrackingBasePage<IPropsType, IStateType> {
  title = "Revisión Containers";

  constructor(props: IPropsType) {
    super(props);
    this.state = {
      error: null,
      containers: [],
      selectedContainer: -1,
      inventorySettings: {
          "leftoverDifferentVenue": true,
          "_id": "5e68fb3e0f7cfc00245e4954",
          "pending": "Pendientes",
          "pendingClass": "aqua",
          "pendingColor": "#00c2f4",
          "found": "Encontrados",
          "foundClass": "green",
          "foundColor": "#00aa51",
          "missing": "Faltantes",
          "missingClass": "red",
          "missingColor": "#f1392c",
          "leftover": "Encontrados*",
          "leftoverClass": "yellow",
          "leftoverColor": "#ff9600",
          "reported": "Reportados",
          "reportedClass": "gray-dark",
          "reportedColor": "#96a4b3",
          "report": {
            "atLeastOne": true,
            "primaryRequired": false,
            "secondaryRequired": false
          }
      }
    };
  }

  componentDidMount() {
    super.componentDidMount();
    const api: ApiService = new ApiService();
    api.getSource()
    api.getInventories(1, true)
      .then(async (response: any) => {
        let inventories: IInventory[] = response.data.inventories;

        let promises = inventories.map((inventory: IInventory) => {
          return api.getInventory((inventory as any)._id)
        })

        let data = (await Promise.all(promises))
          .map((response: any) => {
            return response.data.detail.cars;
          }).flat();

        let containers = data.filter((car: any) => {
          return car.car.isContainer;
        });

        let cars = data.filter((car: any) => {
          return !car.car.isContainer;
        })

        cars.map((car: any) => {
          let container = containers.findIndex((container: any) => {
            return container._id === (car.containerFound || car.container);
          });

          if (container >= 0) {
            if (containers[container].content === undefined) {
              containers[container].content = [];
            }
            containers[container].content.push(car);
          }
        })

        this.setState({
          containers: containers
        })
      })
      .catch((error: any) => {
        console.log(error);
      })
  }

  create = () => {
    this.props.history.push('/inventory/container/create/');
  }

  render() {
    return (
      <AppContainer title="Revisión Containers" cMenu="2" cSubMenu="2.6">
        <section className="content">
          <div className="box">
            <div className="box-header with-border">
              <h3 className="box-title">
                Revisión Containers
              </h3>
            </div>
            <div className="pull-right box-tools">
              {hasPermission(window.user, 'createInventory') ? (
                <button
                  className="btn btn-sm btn-success"
                  onClick={this.create}>
                  <i className="fa fa-plus"/> Crear inventario
                </button>
              ) : null}
            </div>
            <div className='box-body table-responsive request-list'>
              {this.state.containers.length > 0 &&
                <>
                  <div className="row request bg-primary">
                    <div className='col-sm-1 col-xs-1 col-md-1 col-lg-1 center'>
                      <strong>BIC</strong>
                    </div>
                    <div className='col-sm-2 col-xs-2 col-md-2 col-lg-2 center'>
                      <strong>Cant. de elementos</strong>
                    </div>
                  </div>
                  {this.state.containers.map((container: any, index: number) => {
                    return (
                      <div id={`request-${container._id}`} key={index}
                           className='row request bg-request-title background-transition'>
                        <div
                          className='col-sm-1 col-xs-1 col-md-1 col-lg-1 pointer center'
                        >
                          {/* <i className="fa fa-circle status-circle-red" /> */}
                          <strong className='text-underline'>
                            {container.car.vin}
                          </strong>&nbsp;
                        </div>
                        <div className='col-sm-2 col-xs-2 col-md-2 col-lg-2 center'>
                          <strong className='text-info'>{`${container.content.length} Elemento/s`}</strong>
                        </div>
                        <div className='col-sm-8 col-xs-8 col-md-8 col-lg-8 '>
                        </div>
                        <div className='col-sm-1 col-xs-1 col-md-1 col-lg-1 chevron pointer'
                             onClick={() => this.setState({selectedContainer: index})}
                        >
                          {
                            this.state.selectedContainer === index ? (<i className='fa fa-chevron-up'/>) : (
                              <i className='fa fa-chevron-down'/>)
                          }
                        </div>
                        {this.state.selectedContainer === index && container.content && container.content.length &&
                          container.content.map((car: any, index: number) => {
                            let className = `${car.status}Class`;
                            return (
                              <div key={index} className='row request bg-request-title background-transition'>
                                <div className='col-sm-1 col-xs-1 col-md-1 col-lg-1 center'>
                                  <strong>{car.car.vin}</strong>
                                </div>
                                <div className='col-sm-2 col-xs-2 col-md-2 col-lg-2 center'>
                                  <strong>{car.car.brand}</strong>
                                </div>
                                <div className='col-sm-2 col-xs-2 col-md-2 col-lg-2 center'>
                                  <strong>{car.car.denomination}</strong>
                                </div>
                                <div className='col-sm-2 col-xs-2 col-md-2 col-lg-2 center'>
                                  <strong>{car.car.color}</strong>
                                </div>
                                <div className='col-sm-3 col-xs-3 col-md-3 col-lg-3 center'>
                                </div>
                                <div className='col-sm-2 col-xs-2 col-md-2 col-lg-2 center'>
                                      <span
                                        className={`label label-${
                                          this.state.inventorySettings.hasOwnProperty(className)
                                            ? this.state.inventorySettings[className]
                                            : ''
                                        }`}
                                        style={{
                                          padding: '5px 10px'
                                        }}>
                                        {this.state.inventorySettings.hasOwnProperty(car.status)
                                          ? this.state.inventorySettings[car.status]
                                          : car.state}
                                      </span>
                                </div>
                              </div>
                            )
                          })
                        }
                      </div>
                    )
                  })
                  }
                </>
              }
            </div>
          </div>
        </section>
      </AppContainer>
    );
  }
}

const mapStateToProps = (state: any) => {
  return {};
};

const mapDispatchToProps = (dispatch: any) => {
  return {};
};

export default connect<{}, {}, IPropsType>(
  mapStateToProps,
  mapDispatchToProps
)(ContainersInventory);
