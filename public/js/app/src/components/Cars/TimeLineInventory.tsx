import * as Raven from 'raven-js';
import * as React from 'react';
import Row from '../Utils/Row';
import * as moment from 'moment-timezone';

interface IPropsType {
  inventory: any;
}

interface IStateType {
  error: Error | null;
}

class TimeLineInventory extends React.Component<IPropsType, IStateType> {

  private iconStatus: any = {
    pending: 'fa-clock-o',
    found: 'fa-check',
    leftover: 'fa-arrow-up',
    missing: 'fa-arrow-down',
    reported: 'fa-exclamation'
  };

  private classStatus: any = {
    pending: 'bg-aqua',
    found: 'bg-green',
    missing: 'bg-red',
    leftover: 'bg-yellow',
    reported: 'bg-gray'
  };

  private classLabelStatus: any = {
    pending: 'label-info',
    found: 'label-success',
    missing: 'label-danger',
    leftover: 'label-warning',
    reported: 'label-default'
  };

  private statusText: any = {
    pending: 'Pendiente',
    found: 'Encontrado',
    leftover: 'Sobrante',
    missing: 'Faltante',
    reported: 'Reportado'
  };

  constructor(props: IPropsType) {
    super(props);
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error });
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public componentDidUpdate(prevProps: Readonly<IPropsType>, prevState: Readonly<IStateType>, snapshot?: any): void {
    $('[data-toggle="tooltip"]').tooltip();
  }

  render(): React.ReactElement<IPropsType> {
    const { inventory } = this.props;
    return (
      <li style={{ marginRight: '0' }}>
        <i className={`fa ${this.iconStatus[inventory.status]} ${this.classStatus[inventory.status]}`} />
        <div className='timeline-item'>
          <span className='time text-sm' style={{
            color: '#888',
            fontSize: '13px'
          }}>
            <div
              className='text-muted text-sm' data-toggle='tooltip'
              data-placement='top'
              title={moment(inventory.createdAt).format('LLL')}
            >
                                <i className='fa fa-fw fa-clock-o' /> {moment(inventory.createdAt).fromNow()}
                              </div>
          </span>

          <h3 className='timeline-header'><a href={`/inventory/${inventory.inventory._id}`} target='_blank'>{inventory.inventory.name}</a></h3>

          <div className='timeline-body'>
            {
              ['found'].includes(inventory.status) ?
                <React.Fragment>
                  El vehículo fue encontrado en <span
                  className='text-blue'>{inventory.venueFound ? inventory.venueFound.name : inventory.venue.name}</span>.
                </React.Fragment>
                : null
            }
            {
              ['pending'].includes(inventory.status) ?
                <React.Fragment>
                  El vehículo no fue encontrado en <span className='text-blue'>{inventory.venue.name}</span>.
                </React.Fragment> : null
            }
            {
              ['reported'].includes(inventory.status) ?
                <React.Fragment>
                  El vehículo fue reportado en <span className='text-blue'>{inventory.venue.name}</span>.
                </React.Fragment> : null
            }
            {
              ['missing'].includes(inventory.status) ?
                <React.Fragment>
                  El vehículo fue marcado como faltante en <span
                  className='text-blue'>{inventory.venueFound ? inventory.venueFound.name : inventory.venue.name}</span>.
                </React.Fragment> : null
            }
            {
              ['leftover'].includes(inventory.status) ?
                <React.Fragment>
                  El vehículo fue marcado como sobrante en <span
                  className='text-blue'>{inventory.venueFound ? inventory.venueFound.name : inventory.venue.name}</span>.
                </React.Fragment> : null
            }
          </div>
          <div className='timeline-footer'>
            <Row>
              <div
                className='col col-md-5 col-sm-5 col-xs-5'
                style={{
                  height: '60px',
                  padding: '15px 5px 15px 15px'
                }}>
                {this.status(inventory.status)}{' '}
                {this.label(inventory.label, inventory.labelText)}
              </div>
              <div
                className='col col-md-7 col-sm-7 col-xs-7 text-right text-muted text-sm'
                style={{
                  color: '#888',
                  padding: '15px 15px 15px 5px'
                }}>
                {
                  ['leftover', 'missing'].includes(inventory.status) && inventory.labelBy ?
                    <React.Fragment>
                      <i className='fa fa-user-o' /> {inventory.labelBy.firstName} {inventory.labelBy.lastName}
                    </React.Fragment>
                    : inventory.inventoriedBy ?
                      <React.Fragment>
                        <i className='fa fa-user-o' /> {inventory.inventoriedBy.firstName} {inventory.inventoriedBy.lastName}
                      </React.Fragment> : null
                }
              </div>
            </Row>
          </div>
        </div>
      </li>
    );
  }

  private label(label: any, labelText: string) {
    if (label) {
      const { sendTo } = label;
      return (
        <span
          className={
            `label ${this.classLabelStatus.hasOwnProperty(sendTo) ? this.classLabelStatus[sendTo] : ''}`
          }
          style={{
            padding: '5px 10px'
          }}
        >
          <i className={`fa fa-fw ${this.iconStatus[sendTo]}`} />
          {label.name} {label.requireCustomText ? <span
          data-toggle='tooltip'
          data-placement='top'
          title={labelText}>Ver más</span> : ''}
        </span>
      );
    } else {
      return null;
    }
  }

  private status(status: string) {
    return (
      <span
        className={`label ${this.classLabelStatus.hasOwnProperty(status) ? this.classLabelStatus[status] : ''}`}
        style={{
          padding: '5px 10px'
        }}
      >
          {this.statusText.hasOwnProperty(status) ? this.statusText[status] : status}
          </span>
    );
  }
}

export default TimeLineInventory;
