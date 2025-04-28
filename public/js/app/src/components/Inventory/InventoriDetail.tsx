import {RouteComponentProps} from "react-router";


interface IPropsType extends RouteComponentProps<{ ticket: string }> {

}

interface IStateType {
  error: Error | null;
  containers: any[];
  labels: any[],
  unitLabels: any[],
  activeIndex: number,
  activeUnitIndex: number,
  inventorySelected: string, 
  carSelected: string, 
  cardIDSelected: string, 
  labelSelected: any,
  unitLabelSelected: any,
  originalContainers: any[];
  blFilter: string;
  containerFilter: string;
  containerUpdated: any;
  clientFilter: string;
  clientSelector: any[];
  statusFilterSelected: string[],
  selectedContainer: number;
  shipFilter: string[];
  shipSelector: any[];
  tripSelector: any[];
  tripFilter: string[];
  inventorySettings: any;
  loading: boolean;
  filterHasDamage:boolean;
  endDate: Date;
  startDate: Date;
  isFilteringByDate: boolean;
}

class ContainersInventory extends TrackingBasePage<IPropsType, IStateType> {

}