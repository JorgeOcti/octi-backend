import * as moment from 'moment-timezone';
import * as React from 'react';
import { CSSProperties, RefObject } from 'react';

interface IPropsType {
  onChange?: (e: moment.Moment | null) => void;
  className?: string;
  format?: string;
  style?: CSSProperties;
  value?: any;
  disabled?: any;

  startDate?: any
  todayHighlight?: boolean
}

interface IStateType {
  error: Error | null;
}

class DateRangePicker extends React.Component<IPropsType, IStateType> {

  readonly input: RefObject<HTMLInputElement>;
  readonly inputGroup: RefObject<HTMLInputElement>;

  constructor(props: IPropsType) {
    super(props);
    this.input = React.createRef();
    this.inputGroup = React.createRef();
    this.clickCalendar = this.clickCalendar.bind(this);
  }

  public componentDidMount() {
    const { format } = this.props;
    $(this.input.current!).datepicker({
      autoclose: true,
      language: 'es',
      todayHighlight: !!this.props.todayHighlight,
      orientation: 'bottom auto',
      clearBtn: true,
      startDate: this.props.startDate,
      format: {
        toDisplay: (date) => {
          return moment(date).utc().format(format ?? 'DD-MM-YY');
        },
        toValue: (date) => {
          return moment(date, format ?? 'DD-MM-YY').utc().toDate();
        }
      }
    });
    $(this.input.current!).on('changeDate', () => {
      if (typeof (this.props.onChange) === 'function') {
        const date = moment(this.input.current!.value, format ?? 'DD-MM-YY', true);
        if (date.isValid()) {
          this.props.onChange(date);
        } else {
          this.props.onChange(null);
        }
      }
    });
  }

  public componentWillUnmount() {
    $(this.input.current!).datepicker('destroy');
  }

  private clickCalendar() {
    $(this.input.current!).datepicker('show');
  }

  public render(): React.ReactElement<IPropsType> {
    const { format, value, disabled } = this.props;
    return (
      <div className='input-group'>
        <input
          ref={this.input}
          type="text"
          disabled={disabled}
          value={value?.toString().length ? moment(value).format(format ?? 'DD-MM-YY') : ''}
          className={`form-control ${this.props.className ?? ''}`}
          onChange={() => {
          }}
          style={{ ...this.props.style }}
        />
        <span className='input-group-addon pointer' onClick={this.clickCalendar}>
          <i className='fa fa-calendar' />
        </span>
      </div>
    );
  }
}

export default DateRangePicker;
