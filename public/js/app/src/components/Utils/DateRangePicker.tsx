import * as moment from 'moment-timezone';
import * as React from 'react';
import { CSSProperties, RefObject } from 'react';

interface IPropsType {
  onChange?: (e: moment.Moment | null) => void;
  className?: string;
  format?: string;
  style?: CSSProperties;
  value?: string | Date;
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
      todayHighlight: true,
      orientation: 'bottom auto',
      clearBtn: true,
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
      const date = $(this.input.current!).datepicker('getDate');
      if (typeof (this.props.onChange) === 'function') {
        this.props.onChange(date);
      }
    });
  }

  public render(): React.ReactElement<IPropsType> {
    const { format, value } = this.props;
    return (
      <input
        ref={this.input}
        type="text"
        value={this.props.value?.toString().length ? moment(this.props.value).format(format ?? 'DD-MM-YY') : ''}
        className={`form-control ${this.props.className ?? ''}`}
        onChange={(e) => {
          if (typeof (this.props.onChange) === 'function') {
            if (e.target.value !== value) {
              const date = moment(e.target.value, format ?? 'DD-MM-YY', true);
              if (date.isValid()) {
                this.props.onChange(date);
              } else {
                this.props.onChange(null);
              }
            }
          }
        }}
        style={{ ...this.props.style }}
      />
    );
  }
}

export default DateRangePicker;
