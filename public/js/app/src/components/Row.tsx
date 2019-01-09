import * as React from 'react';

interface IPropsType {
  className?: string;
  children?: React.ReactNode;
}

const Row: React.FunctionComponent<IPropsType> = (props: IPropsType) => {
  return (
    <div className={`row ${props.className && props.className.length ? props.className : ''}`}>
      {props.children}
    </div>
  );
};

export default Row;
