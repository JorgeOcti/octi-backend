import * as React from 'react';
import {RefObject} from 'react';

interface IPropsType {
  value: string;

  items: any[];
  inputClass?: string;

  renderItem(item: any, index: any): React.ReactElement<any>;
  onChange(e: React.ChangeEvent<HTMLInputElement>): void;
  onSelect(item: any): void;
}

interface IStateType {
  error: Error | null;
  open: boolean;
}

class AutocompleteInput extends React.Component<IPropsType, IStateType>{

  readonly state = {
    error: null,
    open: false
  };
  readonly autocompleteElement: RefObject<HTMLInputElement>;
  readonly items: RefObject<HTMLInputElement>;

  constructor(props: IPropsType) {
    super(props);
    this.changeOpen = this.changeOpen.bind(this);
    this.close = this.close.bind(this);
    this.outsideClick = this.outsideClick.bind(this);
    this.renderItem = this.renderItem.bind(this);
    this.autocompleteElement = React.createRef();
    this.items = React.createRef();
  }

  public componentDidMount(): void {
    document.addEventListener('keydown', this.close, true);
    document.addEventListener('click', this.outsideClick, true);
  }

  public render(): React.ReactElement<IPropsType> {
    const { onChange, value, items, inputClass } = this.props;
    return (
      <div className="autocomplete" ref={this.autocompleteElement} >
        <input
          type="text"
          className={`form-control ${inputClass ? inputClass : ''}`}
          onChange={(e) => {
            if (this.items.current) {
              this.items.current.scrollTop = 0;
            }
            this.setState({
              open: true
            });
            onChange(e);
          }}
          value={value}
          onClick={this.changeOpen}
          autoComplete={'off'}
        />
        {
          this.state.open ?
            <div className="items" ref={this.items}>
              {
                items.map((item, index) => (
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
        this.props.onSelect(item);
        this.changeOpen();
      }
    });
  }

  public componentWillUnmount(): void {
    document.removeEventListener('keydown', this.close, true);
    document.removeEventListener('click', this.outsideClick, true);
  }

  private close(e: any): void {
    // if ((e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) && (e.target.nodeName === 'BODY')) {
    if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
      e.preventDefault();
      this.setState({
        open: false
      });
    }
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

export default AutocompleteInput;
