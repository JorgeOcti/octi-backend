import * as React from "react";
import {InputHTMLAttributes} from "react";
interface IPropsType {
  input: InputHTMLAttributes<any>
  label: string;
  type: string
  help: string
  placeholder: string;
  meta: {
    touched: boolean;
    error: string;
    warning: string;
  }
}
const InputField: React.FunctionComponent<IPropsType> = ({
  input,
  label,
  placeholder,
  type,
  help,
  meta: { touched, error, warning }
}:IPropsType) => (
  <div className={`form-group ${touched && error ? 'has-error' : warning ? 'has-warning' : ''}`}>
    <label>{label}</label>
    <input
      {...input}
      className={`form-control input-sm`}
      placeholder={placeholder}
      type={type}
    />
    {
      help ?
        <small id="passwordHelpBlock" className="form-text text-muted">
          {help}
        </small>
        : null
    }
    {
      touched &&
      ((error && <span className="help-block">{error}</span>) ||
        (warning && <span className="help-block">{warning}</span>))
    }
  </div>
);

export default InputField;
