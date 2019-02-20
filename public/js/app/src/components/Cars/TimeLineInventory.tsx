import * as Raven from 'raven-js';
import * as React from 'react';

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
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  render(): React.ReactElement<IPropsType> {
    const {inventory} = this.props;
    return (
      <li>
        <i className={`fa ${this.iconStatus[inventory.status]} ${this.classStatus[inventory.status]}`}/>
        <div className="timeline-item">
          <span className="time"><i className="fa fa-clock-o"/> {inventory.createdAt.format('HH:mm')}</span>

          <h3 className="timeline-header"><a href="javascript:void(0)">{inventory.inventory.name}</a></h3>

          <div className="timeline-body">
            {
              ['found'].includes(inventory.status) ?
                `El vehiculo fue encontrado en ${inventory.venueFound.name}` : null
            }
            {
              ['pending'].includes(inventory.status) ?
                `El vehiculo no fue encontrado.` : null
            }
            {
              ['missing'].includes(inventory.status) ?
                `El vehiculo fue marcado como faltante.` : null
            }
          </div>
          <div className="timeline-footer">
            {this.status(inventory.status)}{' '}
            {this.label(inventory.label, inventory.labelText)}
          </div>
        </div>
      </li>
    );
  }

  private label(label: any, labelText: string) {
    if (label) {
      const {sendTo} = label;
      return (
        <span
          className={
            `label ${this.classLabelStatus.hasOwnProperty(sendTo) ? this.classLabelStatus[sendTo] : ''}`
          }
          style={{
            padding: '5px 10px'
          }}
        >
          <i className={`fa fa-fw ${this.iconStatus[sendTo]}`}/>
          {label.name} {label.requireCustomText ? <span
          data-toggle="tooltip"
          data-placement="top"
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
