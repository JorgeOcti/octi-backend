import * as React from 'react';

interface IPropsType {
  condition: boolean;
  children?: React.ReactNode;
  or?: React.ReactNode;
}

const ShowIf: React.FunctionComponent<IPropsType> = (props: IPropsType) => {
  if (props.condition) {
    return (
      <React.Fragment>
        {props.children}
      </React.Fragment>
    );
  }
  if (props.or) {
    return (
      <React.Fragment>
        {props.or}
      </React.Fragment>
    );
  }
  return null;
};

export default ShowIf;
