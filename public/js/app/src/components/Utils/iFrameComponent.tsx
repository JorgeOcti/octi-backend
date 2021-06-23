import * as React from 'react';

interface IPropsType {
  iframe: string;
}

export default class FrameComponent extends React.Component<IPropsType, {}> {

  public render() {
    return (
        <div dangerouslySetInnerHTML={{ __html: this.props.iframe }} />
    );

  }
}
