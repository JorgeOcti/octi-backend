import * as moment from 'moment-timezone';
import * as React from 'react';
import { CSSProperties, RefObject } from 'react';

interface IPropsType {
  onChange?: (e: moment.Moment) => void;
  className?: string;
  format?: string;
  style?: CSSProperties;
}

interface IStateType {
  error: Error | null;
}

class DateRangePicker extends React.Component<IPropsType, IStateType> {

  readonly input: RefObject<HTMLInputElement>;

  constructor(props: IPropsType) {
    super(props);
    this.input = React.createRef();
  }

  public componentDidMount() {
    const { format } = this.props;
    $(this.input.current!).datepicker({
      autoclose: true,
      language: 'es',
      format: {
        toDisplay: (date) => {
          return moment(date).format(format ?? 'DD-MM-YY');
        },
        toValue: (date) => {
          return moment(date).toDate();
        }
      }
    });
    $(this.input.current!).on('changeDate', () => {
      const date = $(this.input.current!).datepicker('getDate');
      if (typeof (this.props.onChange) === 'function') {
        this.props.onChange(date);
      }
    });
  }

  public render(): React.ReactElement<IPropsType> {
    return (
      <input
        ref={this.input}
        type="text"
        className={`form-control ${this.props.className}`}
        style={{ ...this.props.style }}
      />
    );
  }
}

export default DateRangePicker;
