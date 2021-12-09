import * as React from 'react';
import { InputHTMLAttributes } from 'react';

interface IPropsType {
  input: InputHTMLAttributes<any>;
  type: string;
}

const InputHiddenField: React.FunctionComponent<IPropsType> = ({ input, type }: IPropsType) => (
    <input
      {...input}
      type={type}
    />
);

export default InputHiddenField;
