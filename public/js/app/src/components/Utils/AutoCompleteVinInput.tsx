import * as React from 'react';
import {RefObject} from 'react';
import * as Rx from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import { ajax } from 'rxjs/ajax';
import { IRequestItem } from '../../../../../../src/request/interfaces';
import ApiService from '../../utils/axios';
import { AxiosError, AxiosResponse } from 'axios';
import { parseReplicableURL } from '../../utils/common';
import ShowIf from './ShowIf';

interface IPropsType {
  defaultValue: string;
  inputClass?: string;
  item: IRequestItem;

  renderItem(item: any, index: any): React.ReactElement<any>;
}

interface IStateType {
  error: Error | null;
  open: boolean;
  canEdit: boolean;
  value: string;
  VINRecommends: any[];
}

class AutoCompleteVinInput extends React.Component<IPropsType, IStateType>{
  readonly $subjectVINRecommends = new Rx.Subject<any>();
  readonly api: ApiService;
  readonly autocompleteElement: RefObject<HTMLInputElement>;
  readonly items: RefObject<HTMLInputElement>;

  constructor(props: IPropsType) {
    super(props);
    this.changeOpen = this.changeOpen.bind(this);
    this.close = this.close.bind(this);
    this.outsideClick = this.outsideClick.bind(this);
    this.renderItem = this.renderItem.bind(this);
    this.searchVin = this.searchVin.bind(this);
    this.updateVin = this.updateVin.bind(this);
    this.openVehicle = this.openVehicle.bind(this);
    this.autocompleteElement = React.createRef();
    this.api = new ApiService();
    this.items = React.createRef();
    this.state = {
      error: null,
      open: false,
      value: this.props.defaultValue,
      canEdit: false,
      VINRecommends: []
    };
    this.$subjectVINRecommends.pipe(
      debounceTime(300),
      switchMap(({ vin, material }: { vin: string, material: string }) => {
        return ajax({
          url: `/api/v1/requests/search-vin/?vin=${vin}&material=${material}`,
          headers: {
            'Content-Type': 'application/json;charset=UTF-8'
          },
          method: 'GET'
        });
      })
    ).subscribe((response) => {
      this.setState({
        VINRecommends: response.response.data
      });
    });
  }

  public componentWillReceiveProps(nextProps: Readonly<IPropsType>, nextContext: any) {
    if(nextProps.defaultValue !== this.props.defaultValue){
      this.setState({
        value: nextProps.defaultValue
      })
    }
  }

  public componentDidMount(): void {
    document.addEventListener('keydown', this.close, true);
    document.addEventListener('click', this.outsideClick, true);
  }

  public render(): React.ReactElement<IPropsType> {
    const { defaultValue, inputClass, item } = this.props;
    const { VINRecommends, canEdit, value } = this.state;
    return (
      <div className="autocomplete" ref={this.autocompleteElement} >
        <div
          className='input-group input-group-sm'
        >
          {
            !canEdit ?
              <ShowIf condition={item.car.vin?.length > 0}>
              <span
                className='input-group-addon pointer'
                style={{ padding: '5px' }}
                onClick={this.openVehicle}
              >
                <i className='fa fa-fw fa-external-link-square' />
              </span>
              </ShowIf>
              : <span
                className='input-group-addon pointer bg-red'
                style={{ padding: '5px' }}
                onClick={() => {
                  this.setState({
                    value: defaultValue || '',
                    canEdit: false
                  });
                }}
              >
                <i className='fa fa-fw fa-close' />
              </span>
          }
          <input
            type='text'
            className={`form-control ${inputClass ? inputClass : ''}`}
            onChange={(e) => {
              const { value } = e.target;
              if (this.items.current) {
                this.items.current.scrollTop = 0;
              }
              this.setState({
                open: true,
                value
              });
              this.searchVin(value, item.car.material)
            }}
            style={{padding: '5px'}}
            disabled={!canEdit}
            value={value}
            onClick={this.changeOpen}
            autoComplete={'off'}
          />
          <div
            className={`input-group-addon pointer ${canEdit ? 'bg-green' : ''}`}
            onClick={() => {
              if (canEdit) {
                this.updateVin(value)
              } else {
                this.setState({
                  canEdit: true
                });
              }
            }}
          >
            <i className={`fa ${canEdit ? 'fa fa-save' : 'fa fa-pencil'}`} />
          </div>
        </div>
        {
          this.state.open ?
            <div className="items" ref={this.items}>
              {
                VINRecommends.map((item, index) => (
                  this.renderItem(item, index)
                ))
              }
            </div>
            : null
        }
      </div>
    );
  }

  private renderItem(item: any, index: any) {
    const element = this.props.renderItem(item, index);
    return React.cloneElement(element, {
      onClick: () => {
        this.setState({
          value: item.vin
        });
        this.changeOpen();
      }
    });
  }

  public componentWillUnmount(): void {
    document.removeEventListener('keydown', this.close, true);
    document.removeEventListener('click', this.outsideClick, true);
  }

  private close(e: any): void {
    if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
      e.preventDefault();
      this.setState({
        open: false
      });
    }
  }

  private updateVin(vin:string){
    const {item} = this.props;
    this.api.uppdateRequestItemVin(item, vin)
      .then((response: AxiosResponse) => {
        console.log('responde', response);
        this.setState({
          canEdit: false
        });
        // transmittalActions.updateTransmittalAction(response.data.data);
      })
      .catch((err: AxiosError) => {
        this.api.errorHandler(err);
      });
  }

  openVehicle(){
    const {item} = this.props;
    window.open(parseReplicableURL(`/settings/cars/${item.car._id}/`), '_blank');
  }


  private searchVin(vin: string, material: string): void {
    this.$subjectVINRecommends.next({ vin, material })
  }

  private outsideClick(e: any): void{
    if(!this.autocompleteElement.current!.contains(e.target)){
      this.setState({
        open: false
      });
    }
  }

  private changeOpen(): void {
    const {open} = this.state;
    this.setState({
      open: !open
    });
  }
}

export default AutoCompleteVinInput;
