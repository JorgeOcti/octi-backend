import * as React from 'react';
import {CSSProperties, RefObject} from 'react';

interface IPropsType {
  url: string;
  height: string;
  maxHeight?: string;
  maxWidth?: string;
  small?: boolean;
}

interface IStateType {
  loading: boolean;
  inViewPort: boolean;
  error: boolean;
  eventRuning: boolean;
  bounding: any;
  height: any;
}

class ImageLazyLoad extends React.Component<IPropsType, IStateType> {

  readonly state = {
    loading: true,
    eventRuning: false,
    inViewPort: false,
    error: false,
    bounding: null,
    height: null
  };

  private element: RefObject<HTMLDivElement>;

  constructor(props: IPropsType) {
    super(props);
    this.element = React.createRef();
    this.handleImageLoaded = this.handleImageLoaded.bind(this);
    this.isInViewport = this.isInViewport.bind(this);
    this.addEventListener = this.addEventListener.bind(this);
    this.removeEventListener = this.removeEventListener.bind(this);
  }

  public componentDidMount() {
    this.addEventListener();
  }

  public componentWillUnmount() {
    this.removeEventListener();
  }

  public render() {
    const { loading, inViewPort, error} = this.state;
    const { url, height, maxHeight, maxWidth, small} = this.props;

    const imageStyle: CSSProperties = {};
    if (loading) {
      imageStyle.display = 'none';
    }
    if (maxHeight) {
      imageStyle.maxHeight = maxHeight;
    }
    if (maxWidth) {
      imageStyle.maxWidth = maxWidth;
    }
    return (
      <React.Fragment>
        {
          inViewPort &&
            <img
              src={url}
              onLoad={this.handleImageLoaded}
              onError={this.error}
              style={imageStyle}
            />
        }
        {
          loading ?
            <div style={{height, display: 'table-cell', verticalAlign: 'middle'}} className={'text-center'} ref={this.element}>
              {small ? <i className={'fa fa-circle-o-notch fa-spin'}/> : <i className={'fa fa-circle-o-notch fa-spin fa-2x'}/>}
            </div>
          : null
        }

      </React.Fragment>
    );
  }

  private error() {
    this.setState({
      error: true
    });
  }
  private handleImageLoaded() {
    this.setState({ loading: false });
  }

  private isInViewport() {
    // console.log('isInViewport');
    if (!this.state.inViewPort && this.element.current) {
      const bounding = this.element.current.getBoundingClientRect();
      // start load distance
      const distance = 300;
      const clientHeight: number = document && document.documentElement ? document.documentElement.clientHeight : 0;
      const height = window.innerHeight || clientHeight;
      const isInViewPort = (
        bounding.top >= 0 &&
        bounding.left >= 0 &&
        (bounding.bottom - distance) <= height
      );
      this.setState({
        bounding: {
          top: bounding.top,
          left: bounding.left,
          right: bounding.right,
          bottom: bounding.bottom
        },
        height
      });
      if (isInViewPort) {
        this.removeEventListener();
        this.setState({
          inViewPort: true
        });
      }
    }
  }

  private addEventListener() {
    this.setState({
      eventRuning: true
    });
    // const modal = document.getElementById('andesModal');
    const modal = ($('#andesModal').data('bs.modal') || {}).isShown;
    if (modal) {
      modal.addEventListener('scroll', this.isInViewport, false);
      modal.addEventListener('rezise', this.isInViewport, false);
      setTimeout(() => {
        this.isInViewport();
      }, 1000);
    } else {
      window.addEventListener('scroll', this.isInViewport, false);
      window.addEventListener('rezise', this.isInViewport, false);
      this.isInViewport();
    }
  }

  private removeEventListener() {
    this.setState({
      eventRuning: false
    });
    // const modal = document.getElementById('andesModal');
    const modal = ($('#andesModal').data('bs.modal') || {}).isShown;
    if (modal) {
      modal.removeEventListener('scroll', this.isInViewport, false);
      modal.removeEventListener('rezise', this.isInViewport, false);
    } else {
      window.removeEventListener('scroll', this.isInViewport, false);
      window.removeEventListener('rezise', this.isInViewport, false);
    }
  }
}
export default ImageLazyLoad;
