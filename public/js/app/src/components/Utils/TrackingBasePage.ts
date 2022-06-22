import * as React from 'react';
import { IWindow } from '../../interfaces/window';
import MixpanelTracker from './MixpanelTracker';
import * as ReactGA from 'react-ga';

declare let window: IWindow;

abstract class TrackingBasePage<PropsType, StateType> extends React.Component<PropsType, StateType>{
  abstract title : string;

  protected constructor(props: PropsType) {
    super(props);
    this.trackPage = this.trackPage.bind(this);
    this.registerUser = this.registerUser.bind(this);
    this.shouldTrack = this.shouldTrack.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.trackClick = this.trackClick.bind(this);
  }

  public componentDidMount() : void {
    // set the title of the page
    document.title = `OSA Andes | ${this.title}`;
    this.registerUser();
    this.trackPage();
  }

  trackPage() : void {
    if (this.shouldTrack()){
      ReactGA.initialize('UA-101792436-1', {
        // debug: true,
        // titleCase: false,
        gaOptions: {
          clientId: window.user._id,
          name: window.user.email
        }
      });
      ReactGA.pageview(`${window.location.pathname}${window.location.search ?? ''}`);
      MixpanelTracker.getInstance().trackAction(this.title);
    }
  }

  trackClick(title: string, properties: any = {}) : void {
    if (this.shouldTrack())
      MixpanelTracker.getInstance().trackAction(`${this.title} - ${title}`, properties);
  }

  public shouldTrack() : boolean {
    return !window.user.email.includes('@osacontrol.com');
  }

  private registerUser() : void {
    if (this.shouldTrack() && !window.isTracked) {
      MixpanelTracker.getInstance().identifyUser(window.user);
      window.isTracked = true;
    }
  }
}

 export default TrackingBasePage;
