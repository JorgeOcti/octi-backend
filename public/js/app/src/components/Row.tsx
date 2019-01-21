import * as React from 'react';

interface IPropsType {
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

const Row: React.FunctionComponent<IPropsType> = (props: IPropsType) => {
  return (
    <div
      className={`row${props.className && props.className.length ? ` ${props.className}` : ''}`}
      style={props.style ? props.style : {}}
    >
      {props.children}
    </div>
  );
};

export default Row;
