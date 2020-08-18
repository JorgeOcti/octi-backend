import * as Raven from 'raven-js';
import * as React from 'react';
import {ErrorInfo} from 'react';
import {connect} from 'react-redux';
import {IInventoryLabel} from '../../../../../../src/interfaces/inventoryLabel.interface';
import {changeTempLabelAction, ILabelsState, LabelsReduxAction} from '../../actions/labels.actions';
import {updateTooltip} from '../../utils/common';
import BootstrapSelect from '../Utils/BootstrapSelect';
import BootstrapSwitch from '../Utils/BootstrapSwitch';
import {CarStatusType} from "../Inventory/InventoryDetailView";

interface IPropsType {
  labels?: ILabelsState;
  update?: boolean;
  changeTempLabelAction: (label: IInventoryLabel, debounce?: number) => LabelsReduxAction;
}

interface IStateType {
  error: Error | null;
}

class LabelFormView extends React.Component<IPropsType, IStateType> {

  private statusText: any = {
    pending: 'Pendiente',
    found: 'Encontrado',
    leftover: 'Sobrante',
    missing: 'Faltante',
    reported: 'Reportado'
  };

  constructor(props: IPropsType) {
    super(props);
    this.filterAffected = this.filterAffected.bind(this);
    this.filterSendTo = this.filterSendTo.bind(this);
    this.getOptions = this.getOptions.bind(this);
  }

  public componentDidMount(): void {
    updateTooltip();
  }

  public componentDidUpdate(): void {
    updateTooltip();
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }



  render(): React.ReactElement<IPropsType> | null {
    const {changeTempLabelAction} = this.props;
    if (this.props.labels) {
      const {tempLabel} = this.props.labels;
      return (
        <div className="row">
          <div className="col-md-12">
            <div className="form-group">
              <label>Nombre</label>
              <input
                type="text"
                name="name"
                className="form-control"
                maxLength={50}
                defaultValue={tempLabel ? tempLabel.name : ''}
                onChange={
                  (e: React.ChangeEvent<HTMLInputElement>) => changeTempLabelAction({
                    ...tempLabel,
                    name: e.target.value.trim()
                  }, 300)
                }
              />
            </div>
          </div>
          <div className="col-md-12">
            <div className="form-group">
              <label htmlFor="states" className="control-label">Agregar opción en</label>
              <BootstrapSelect
                noneSelectedText="Seleccione"
                displayItems={5}
                selectedText="estados seleccionados."
                separator=" - "
                options={this.getOptions()}
                selected={tempLabel.affected}
                onClick={this.filterAffected}
              />
            </div>
          </div>
          <div className="col-md-12">
            <div className="form-group">
              <label htmlFor="states" className="control-label">Enviar a</label>
              <BootstrapSelect
                noneSelectedText="Seleccione a donde"
                displayItems={5}
                autoClouse={true}
                selectedText="estados seleccionados."
                separator=" - "
                options={this.getOptions()}
                selected={tempLabel.sendTo ? [tempLabel.sendTo] : []}
                onClick={this.filterSendTo}
              />
            </div>
          </div>
          <div className="col-md-12">
            <div className="form-group-switch">
              <BootstrapSwitch
                checked={tempLabel.isExhibition}
                color="blue"
                onChange={() => {
                  this.props.changeTempLabelAction({
                    ...tempLabel,
                    isExhibition: !tempLabel.isExhibition
                  });
                }}/>
              <label className="switch-label">Unidad de la marca</label>
            </div>
          </div>
          <div className="col-md-12">
            <div className="form-group-switch">
              <BootstrapSwitch
                checked={tempLabel.requireCustomText}
                color="blue"
                onChange={() => {
                  this.props.changeTempLabelAction({
                    ...tempLabel,
                    requireCustomText: !tempLabel.requireCustomText
                  });
                }}/>
              <label className="switch-label">Requerir datos adicionales</label>
            </div>
          </div>
          <div className="col-md-12">
            <div className="form-group">
              <label>Descripción</label>
              <textarea
                name="description"
                className="form-control"
                defaultValue={tempLabel ? tempLabel.description : ''}
                onChange={
                  (e: React.ChangeEvent<HTMLTextAreaElement>) => changeTempLabelAction({
                    ...tempLabel,
                    description: e.target.value.trim()
                  }, 300)
                }
              />
            </div>
          </div>
        </div>
      );
    } else {
      return null;
    }
  }

  private getOptions() {
    const {inventorySettings} = this.props.labels!;
    return Object
      .keys(this.statusText)
      .map((status: CarStatusType) => ({
        value: status,
        text: inventorySettings[status],
        className: `label label-${inventorySettings[`${status}Class` as CarStatusType]}`
      }));
  }

  private filterAffected(value: any): void  {
    if (this.props.labels && this.props.changeTempLabelAction) {
      const {tempLabel} = this.props.labels;
      this.props.changeTempLabelAction({
        ...tempLabel,
        affected: tempLabel.affected.includes(value)
          ? tempLabel.affected.filter((state) => state !== value)
          : [value, ...tempLabel.affected]
      });
    }
  }

  private filterSendTo(value: any): void  {
    if (this.props.labels && this.props.changeTempLabelAction) {
      const {tempLabel} = this.props.labels;
      this.props.changeTempLabelAction({
        ...tempLabel,
        sendTo: value
      });
    }
  }
}

const mapStateToProps = (state: { labels: ILabelsState }) => {
  return {
    labels: state.labels
  };
};

const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    changeTempLabelAction: (label: IInventoryLabel, debounce?: number) => dispatch(changeTempLabelAction(label, debounce))
  };
};

export default connect<{labels: ILabelsState}, {dispatch: LabelsReduxAction}, IPropsType>(mapStateToProps, mapDispatchToProps)(LabelFormView);
