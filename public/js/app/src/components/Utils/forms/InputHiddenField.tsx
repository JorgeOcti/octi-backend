import * as React from 'react';
import { DetailedHTMLFactory, InputHTMLAttributes } from 'react';

interface IPropsType {
  input: DetailedHTMLFactory<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;
  type: string;
}

const InputHiddenField: React.FunctionComponent<IPropsType> = ({ input, type }: IPropsType) => (
    <input
      {...input}
      type={type}
    />
);

export default InputHiddenField;
