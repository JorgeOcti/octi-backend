import * as React from "react";
import {InputHTMLAttributes} from "react";
interface IPropsType {
  input: InputHTMLAttributes<any>
  checked: boolean;
  label: string;
  type: string;
  help: string;
  meta: {
    touched: boolean;
    error: string;
    warning: string;
  };
}
const BootstrapSwitchField: React.FunctionComponent<IPropsType> = ({
  input,
  label,
  checked,
  type,
  help,
  meta: { touched, error, warning }
}:IPropsType) => (
  <div className="form-group-switch">
    <label className={`switch switch-blue`}>
      <input type="checkbox" className="switch" checked={checked} {...input} />
      <span className="slider round" />
    </label>
    <label className="switch-label">{label}</label>
    {
      help ?
        <small id="passwordHelpBlock" className="form-text text-muted">
          {help}
        </small>
        : null
    }
    {
      touched &&
      ((error && <span className="error invalid-feedback">{error}</span>) ||
        (warning && <span className="warning warning-feedback">{warning}</span>))
    }
  </div>
);

export default BootstrapSwitchField;



