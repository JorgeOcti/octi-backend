import * as React from "react";
import { TextareaHTMLAttributes} from "react";
import {Property} from "csstype";
interface IPropsType {
  input: TextareaHTMLAttributes<any>
  label: string;
  labelOff?:boolean;
  resize: Property.Resize;
  type: string
  help: string
  placeholder: string;
  meta: {
    touched: boolean;
    error: string;
    warning: string;
  }
}
const TextAreaField: React.FunctionComponent<IPropsType> = ({
  input,
  label,
  labelOff,
  placeholder,
  help,
  resize,
  meta: { touched, error, warning },
  ...custom
}: IPropsType) => (
  <div className={`form-group ${touched && error ? 'has-error' : warning ? 'has-warning' : ''}`}>
    {!labelOff?<label className="control-label">{label}</label>: null}
    <textarea
      {...input}
      {...custom}
      style={{
        resize: resize ? resize : 'inherit'
      }}
      className={`form-control`}
      placeholder={placeholder}
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

export default TextAreaField;
