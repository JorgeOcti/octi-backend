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
}:IPropsType) => (
  <div className="form-group">
    <label>{label}</label>
    <select
      {...input}
      className={`custom-select ${touched && error ? 'is-invalid' : warning ? 'is-warning' : ''}`}
      disabled={disabled}
      placeholder={label}
    >
      {children}
    </select>
    {
      touched &&
      ((error && <span className="error invalid-feedback">{error}</span>) ||
        (warning && <span className="warning warning-feedback">{warning}</span>))
    }
  </div>
);

export default SelectField;
