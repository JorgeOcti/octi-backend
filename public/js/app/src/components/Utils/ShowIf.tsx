import * as React from 'react';

interface IPropsType {
  condition: boolean;
  children?: React.ReactNode;
  alternative?: React.ReactNode;
}

const ShowIf: React.FunctionComponent<IPropsType> = (props: IPropsType) => {
  if (props.condition) {
    return (
      <>{props.children}</>
    );
  }
  if (props.alternative) {
    return (
      <>{props.alternative}</>
    );
  }
  return null;
};

export default ShowIf;
