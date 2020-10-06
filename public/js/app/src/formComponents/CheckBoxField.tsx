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
const CheckBoxField: React.FunctionComponent<IPropsType> = ({
  input,
  label,
  checked,
  type,
  help,
  meta: { touched, error, warning }
}:IPropsType) => (
  <div className="form-group">
    <div className="form-check">
      <input type={type} className="form-check-input" checked={checked} {...input}  />
      <label className="form-check-label">{label}</label>
    </div>
    {
      help ?
        <small className="form-text text-muted">
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

export default CheckBoxField;



