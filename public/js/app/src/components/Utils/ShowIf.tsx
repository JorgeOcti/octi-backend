import * as React from 'react';

interface IPropsType {
  condition: boolean;
  children?: React.ReactNode;
}

const ShowIf: React.FunctionComponent<IPropsType> = (props: IPropsType) => {
  if(props.condition){
    return (
      <React.Fragment>
        {props.children}
      </React.Fragment>
    );
  }
  return null;
};

export default ShowIf;
