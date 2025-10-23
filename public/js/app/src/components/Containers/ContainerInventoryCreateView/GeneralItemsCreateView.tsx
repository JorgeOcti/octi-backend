import ContainerInventoryCreateView from './ContainerInventoryCreateView';
import { RouteComponentProps } from 'react-router';
import { AlertReduxAction, IAlertsState } from '../../../actions/alerts.actions';
import { Dispatch } from 'redux';
import { loadDataAction, ModalReduxAction } from '../../../actions/modal.actions';
import TrackingBasePage from '../../Utils/TrackingBasePage';
import React = require('react');
import { string } from 'yup';
import { connect } from 'react-redux';

const mandatoryHeaders = [
  "BIC",
  "Tipo Carga",
  "Descripción",
  "Cliente Razón Social",
  "RUT Cliente",
  "Manifiesto",
  "N° BL",
  "Nave",
  "N° Viaje",
  "Sello IN",
  "Puerto Origen",
  "Peso",
  "Emplazamiento",
]

const excelHeaders = [
  "BIC",
  "Cantidad",
  "Tipo Carga",
  "Descripción",
  "Marca",
  "Modelo",
  "Color",
  "Cliente Razón Social",
  "RUT Cliente",
  "Manifiesto",
  "N° BL",
  "Emplazamiento",
  "Año DR",
  "N° DR",
  "Item",
  "Mes",
  "Contenedor",
  "Tipo CTR",
  "Tamaño CTR",
  "Ubicación",
  "Zona",
  "Origen",
  "Tipo Retiro",
  "RUT Asociado",
  "Cliente Asoc. Razón Social",
  "Forwarder",
  "Agencia",
  "N° Destinación",
  "Fecha Destinación",
  "Línea Operadora",
  "St.CTR IN",
  "St.CTR OUT",
  "Nave",
  "N° Viaje",
  "Tráfico",
  "N° Booking IN",
  "N° Booking OUT",
  "Sello IN",
  "Sello OUT",
  "N° TATC",
  "Puerto Origen",
  "Doc.Pta IN",
  "N° Doc.Pta IN",
  "Doc.Pta OUT",
  "N° Doc.Pta OUT",
  "Estado",
  "Fch.Inicio Alm.",
  "F. Recep .Efec.",
  "Fch. Provid.",
  "Fch. Descon.",
  "F. Sol. Retiro",
  "F. Aut. Salida",
  "F. Carga Camión",
  "Tº Espera",
  "Fch.Salida AEP",
  "Días Alm.",
  "Peso",
  "Tipo IMO",
  "N° UN",
  "Patente IN",
  "Patente OUT",
  "Consignatario",
  "Notificado",
]

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  alerts: IAlertsState;
  dispatch: Dispatch<AlertReduxAction>;
  loadDataAction(
    title: string,
    body: JSX.Element,
    footer: JSX.Element
  ): ModalReduxAction;
}

interface IStateType {
  error: Error | null;
}



class GeneralItemsCreateView extends TrackingBasePage<IPropsType, IStateType> {
  public title: string;

  readonly state: IStateType = {
    error: null,
  };

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Crear Desconsolidad - Elementos con código';
  }

  public render(): React.ReactElement<IPropsType> {
    return (
      <ContainerInventoryCreateView
        excelHeaders={excelHeaders}
        mandatoryHeaders={mandatoryHeaders}
        contentType="general-items"
        history={this.props.history}
        location={this.props.location}
        match={this.props.match}
        dispatch={this.props.dispatch}
        alerts={this.props.alerts}
        loadDataAction={this.props.loadDataAction}
      />
    );
  }
}

const mapStateToProps = (state: any): Partial<IPropsType> => {
  return {
    alerts: state.alerts,
  };
}

const mapDispatchToProps = (dispatch: any): Partial<IPropsType> => {
  return {
    dispatch: dispatch,
    loadDataAction: (title: string, body: JSX.Element, footer: JSX.Element) =>
      dispatch(loadDataAction(title, body, footer))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(GeneralItemsCreateView);


