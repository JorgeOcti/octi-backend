import * as React from 'react';

interface IPropsType {
  input: any;
  label: string;
  labelOff?: boolean;
  readOnly?: boolean;
  onChange?: any;
  type: string;
  help: string;
  placeholder: string;
  meta: {
    touched: boolean;
    error: string;
    warning: string;
  };
}

const InputField: React.FunctionComponent<IPropsType> = ({
   input,
   label,
   labelOff,
   placeholder,
   type,
   onChange,
   readOnly,
   help,
   meta: { touched, error, warning }
  }: IPropsType) => (
  <div className={`form-group ${touched && error ? 'has-error' : warning ? 'has-warning' : ''}`}>
    {!labelOff ? <label className='control-label text-ellipsis'>{label}</label> : null}
    <input
      {...input}
      readOnly={readOnly}
      onChange={onChange ? onChange : input.onChange}
      className={`form-control input-sm`}
      placeholder={placeholder}
      type={type}
    />
    {
      help ?
        <small id='passwordHelpBlock' className='form-text text-muted'>
          {help}
        </small>
        : null
    }
    {
      touched &&
      ((error && <span className='help-block text-ellipsis'>{error}</span>) ||
        (warning && <span className='help-block text-ellipsis'>{warning}</span>)) || <span className='help-block'>&nbsp;</span>
    }
  </div>
);

export default InputField;
