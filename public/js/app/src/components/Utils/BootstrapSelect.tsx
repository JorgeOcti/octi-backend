import * as React from 'react';

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
  noneSelectedText?: string;
  selectedText?: string;
  separator?: string;
  allOption?: boolean;
  autoClouse?: boolean;
  search?: boolean;
}

interface IStateType {
  open: boolean;
}

class BootstrapSelect extends React.Component<IPropsType, IStateType> {

  state = {
    open: false
  };

  constructor(props: IPropsType) {
    super(props);
    this.handlerOpen = this.handlerOpen.bind(this);
  }

  handlerOpen() {
    this.setState({
      open: !this.state.open
    });
  }

  render(): React.ReactElement<IPropsType> {
    const {
      options, selected, onClick, displayItems, noneSelectedText, selectedText, separator, allOption, search, autoClouse
    } = this.props;
    const selectedItems = options.filter((option) => (selected.includes(option.value)));
    return (
      <div className={`dropdown bootstrap-select form-control show-tick ${autoClouse ? '' : 'keep-inside-clicks-open'}`}>
        <button
          type="button"
          className={`btn dropdown-toggle bs-placeholder btn-filter btn-default`}
          data-toggle="dropdown"
          style={{borderRadius: '0px'}}
        >
          <div className="filter-option">
            <div className="filter-option-inner">
              <div className="filter-option-inner-inner">
                {
                  selectedItems.length ?
                    displayItems && selectedItems.length > displayItems ?
                      `${selectedItems.length} ${selectedText ? selectedText : 'items seleccionados.'}` :
                      selectedItems
                        .map((option, index) => (
                          <React.Fragment key={index}>
                            <span
                              className={option.className ? option.className : ''}
                            >{option.text}</span> {selectedItems.length > index + 1 ? separator ? `${separator}` : ', ' : null}
                          </React.Fragment>
                        ))
                    : noneSelectedText ? noneSelectedText : 'Todos'
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
                <input type="text" className="form-control input-sm" autoComplete="off"/>
              </div> : null
          }
          {
            allOption ?
              <div className="bs-actionsbox">
                <div className="btn-group btn-group-sm btn-block">
                  <button type="button" className="actions-btn bs-select-all btn btn-default">Seleccionar todo</button>
                  <button type="button" className="actions-btn bs-deselect-all btn btn-default">Deseleccionar todo</button>
                </div>
              </div> : null
          }
          <div
            className="inner open"
            aria-expanded="false"
            tabIndex={-1}
          >
            <ul className="dropdown-menu inner" style={{maxHeight: '50vh', overflowY: 'auto'}}>
              {
                options.map((option) => {
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
}

export default BootstrapSelect;
