import * as React from 'react';
import * as unorm from 'unorm';
import {RefObject} from "react";

interface IOption {
  value: string;
  text: any;
  className?: string;
}

interface IPropsType {
  options: IOption[];
  selected: string[];
  className?: string;
  displayItems?: number;
  onClick: any;
  selectAll?: any;
  noneSelectedText?: string;
  selectedText?: string;
  separator?: string;
  allOption?: boolean;
  autoClouse?: boolean;
  search?: boolean;
  sm?: boolean;
}

interface IStateType {
  open: boolean;
  searchText: string;
}

class BootstrapSelect extends React.Component<IPropsType, IStateType> {

  readonly state = {
    open: false,
    searchText: ''
  };

  readonly input: RefObject<HTMLInputElement>;

  constructor(props: IPropsType) {
    super(props);
    this.handlerOpen = this.handlerOpen.bind(this);
    this.search = this.search.bind(this);
    this.input = React.createRef();
  }

  public render(): React.ReactElement<IPropsType> {
    const {
      sm, options, selected, onClick, displayItems, noneSelectedText, selectedText, separator, allOption, search, autoClouse, selectAll
    } = this.props;
    const  {searchText} = this.state;
    const selectedItems = options.filter((option) => (selected.includes(option.value)));

    return (
      <div className={`dropdown bootstrap-select form-control show-tick ${autoClouse ? '' : 'keep-inside-clicks-open'} ${sm?'bootstrap-select-sm':''}`}>
        <button
          type="button"
          className={`btn dropdown-toggle bs-placeholder btn-filter btn-default`}
          data-toggle="dropdown"
          style={{borderRadius: '0px'}}
          onClick={this.handlerOpen}
        >
          <div className="filter-option">
            <div className="filter-option-inner">
              <div className="filter-option-inner-inner">
                {
                  selectedItems.length ?
                    displayItems && selectedItems.length > displayItems ?
                      <span style={{color: '#555'}}>{`${selectedItems.length} ${selectedText ? selectedText : 'items seleccionados.'}`}</span> :
                      selectedItems
                        .map((option, index) => (
                          <React.Fragment key={index}>
                            <span
                              className={option.className ? option.className : ''}
                              style={{color: '#555'}}
                            >{option.text}</span> {selectedItems.length > index + 1 ? separator ? `${separator}` : ', ' : null}
                          </React.Fragment>
                        ))
                    : noneSelectedText ? <span style={{color: '#999'}}> {noneSelectedText}</span> : <span style={{color: '#999'}}> Todos </span>
                }
              </div>
            </div>
          </div>
          <span className="bs-caret">
            <span className="caret" />
          </span>
        </button>
        <div className="dropdown-menu" style={{borderRadius: '0px'}}>
          {
            search ?
              <div className="bs-searchbox">
                <input
                  ref={this.input}
                  type="text"
                  className="form-control input-sm"
                  autoComplete="off"
                  value={this.state.searchText}
                  onChange={
                    (e: React.ChangeEvent<HTMLInputElement>) => this.search(e.target.value)
                  }
                />
              </div> : null
          }
          {
            allOption ?
              <div className="bs-actionsbox">
                <div className="btn-group btn-group-sm btn-block">
                  <button
                    onClick={() => selectAll(true)}
                    type="button" className="actions-btn bs-select-all btn btn-default">Seleccionar todo
                  </button>
                  <button
                    onClick={() => selectAll(false)}
                    type="button" className="actions-btn bs-deselect-all btn btn-default">Deseleccionar todo
                  </button>
                </div>
              </div> : null
          }
          <div
            className="inner open"
            aria-expanded="false"
            tabIndex={-1}
          >
            <ul className="dropdown-menu inner" style={{maxHeight: '30vh', overflowY: 'auto'}}>
              {
                options.filter((option) => {
                  if (!searchText || !searchText.length) {
                    return true;
                  }
                  return unorm.nfd(option.text)
                    .replace(/[\u0300-\u036f]/g, '')
                    .toLowerCase()
                    .includes(searchText.toLowerCase());
                }).map((option) => {
                  const isSelected = selected.includes(option.value);
                  return (
                    <li key={option.value} className={`${isSelected ? 'selected' : ''}`} onClick={() => onClick(option.value)}>
                      <a role="option" tabIndex={0} className={`${isSelected ? 'selected' : ''}`} style={{background: '#FFF'}}>
                        <span className="glyphicon glyphicon-ok check-mark" />
                        <span className={option.className ? option.className : ''}>{option.text}</span>
                      </a>
                    </li>
                  );
                })
              }
            </ul>
          </div>
        </div>
      </div>
    );
  }

  private handlerOpen() {
    if(this.input.current){
      this.input.current.focus()
    }
    this.setState({
        open: !this.state.open
      }, () => {
        if (!this.state.open) {
          this.search('');
        }
      }
    );
  }

  private search(searchText: string) {
    this.setState({
      searchText: unorm.nfd(searchText).replace(/[\u0300-\u036f]/g, '')
    });
  }
}

export default BootstrapSelect;
