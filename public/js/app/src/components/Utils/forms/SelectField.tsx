import * as React from 'react';
import { SelectHTMLAttributes } from 'react';

interface IPropsType {
  input: SelectHTMLAttributes<any>;
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
  labelOff?: boolean;
  meta: {
    touched: boolean;
    error: string;
    warning: string;
  };
}

const SelectField: React.FunctionComponent<IPropsType> = ({
  input,
  label,
  children,
  disabled,
  labelOff,
  meta: { touched, error, warning }
}: IPropsType) => {
  return (
    <div className={`form-group ${touched && error ? 'has-error' : ''} ${touched && warning ? 'has-warning' : ''}`}>
      {!labelOff ? <label className='control-label'>{label}</label> : null}
      <select
        {...input}
        className={`form-control input-sm ${touched && error ? 'is-invalid' : warning ? 'is-warning' : ''}`}
        disabled={disabled}
        placeholder={label}
      >
        {children}
      </select>
      {
        touched &&
        ((error && <span className='help-block'>{error}</span>) ||
          (warning && <span className='help-block'>{warning}</span>)) || <span className="help-block">&nbsp;</span>
      }
    </div>
  );
};

export default SelectField;
