import * as React from 'react';
import {createRef, RefObject} from 'react';

interface IPropsType {
  options: daterangepicker.Options,
  startDate: Date,
  endDate: Date,
  onChange: (from: Date, to: Date) => void,
}

interface IStateType {
  from: Date,
  to: Date
}

class DateRangeInput extends React.Component<IPropsType, IStateType> {

  state = {
    from: this.props.startDate,
    to: this.props.startDate
  };
  pickerRef : RefObject<HTMLInputElement> = createRef();

  componentDidMount(): void {
    let $this = this;
    const {options, startDate, endDate} = this.props;
    ($(this.pickerRef.current!) as any).daterangepicker({...options, startDate, endDate},
      function (from: any, to: any, label: any) {
        $this.onChange(from, to);
      });
  }

  onChange = (from: Date, to: Date) => {
    this.setState({
      from: from,
      to: to
    }, () => {
      this.props.onChange(from, to);
    });
  }

  render() {
    return <div className="input-group input-group-sm" style={{padding: '10px 5px'}}>
      <input type="text" className="form-control input-sm" ref={this.pickerRef} />
      <div className="input-group-btn">
        <button className="btn btn-default" onClick={() => {
          ($(this.pickerRef.current!) as any).click();
        }}>
          <i className="fa fa-calendar"/></button>
      </div>
    </div>;
  }

}

export default DateRangeInput;
