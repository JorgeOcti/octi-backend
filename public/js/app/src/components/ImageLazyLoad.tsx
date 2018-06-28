import * as React from 'react';
import {CSSProperties} from "react";
// import ExifOrientationImg from "react-exif-orientation-img";


interface IPropsType {
  url: string;
  height: string;
}

interface IStateType {
  loading: boolean
}

class ImageLazyLoad extends React.Component<IPropsType, IStateType> {
  state = {
    loading: true
  };
  constructor(props: IPropsType) {
    super(props);
    this.handleImageLoaded = this.handleImageLoaded.bind(this);
  }

  handleImageLoaded() {
    this.setState({ loading: false });
  }

  // handleImageErrored() {
  //   this.setState({ imageStatus: "failed to loading" });
  // }

  render() {
    const { loading } = this.state;
    const { url, height } = this.props;

    let imageStyle:CSSProperties = {};
    if (loading){
      imageStyle.display = 'none';
    }

    return (
      <React.Fragment>
        <img
          src={url}
          onLoad={this.handleImageLoaded}
          style={imageStyle}
        />
        {/*<ExifOrientationImg*/}
          {/*src={url}*/}
          {/*onLoad={this.handleImageLoaded}*/}
          {/*style={imageStyle}*/}
        {/*/>*/}
        {
          loading ?
            <div style={{height: height, display:'table-cell', verticalAlign: 'middle'}} className={'text-center'}>
              <i className={'fa fa-circle-o-notch fa-spin fa-2x'}/>
            </div>
          : null
        }

      </React.Fragment>
    );
  }
}
export default ImageLazyLoad;
