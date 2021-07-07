import * as React from "react";
import {SelectHTMLAttributes} from "react";
interface IPropsType {
  input: SelectHTMLAttributes<any>
  label: string;
  children: React.ReactNode;
  disabled?:boolean;
  meta: {
    touched: boolean;
    error: string;
    warning: string;
  }
}
const SelectField: React.FunctionComponent<IPropsType> = ({
  input,
  label,
  children,
  disabled,
  meta: { touched, error, warning }
}: IPropsType) => (

  <div className={`form-group ${touched && error ? "has-error" : ""} ${touched && warning ? "has-warning" : ""}`}>
    <label>{label}</label>
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
      ((error && <span className="help-block">{error}</span>) ||
        (warning && <span className="help-block">{warning}</span>))
    }
  </div>
);

export default SelectField;
