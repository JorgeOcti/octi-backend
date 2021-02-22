import MixpanelTracker from "./MixpanelTracker";
import * as React from 'react';
import {IWindow} from "../../interfaces/window";

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
    this.trackPage()
  }

  trackPage() : void {
    if (this.shouldTrack())
      MixpanelTracker.getInstance().trackAction(this.title);
  }

  trackClick(title: string, properties: any = {}) : void {
    if (this.shouldTrack())
      MixpanelTracker.getInstance().trackAction(`${this.title} - ${title}`, properties);
  }

  public shouldTrack() : boolean {
    if (window.user)
      return window.user.email.includes('@osacontrol.com');
    return true;
  }

  private registerUser() : void {
    if (this.shouldTrack() && !window.isTracked) {
      MixpanelTracker.getInstance().identifyUser(window.user);
      window.isTracked = true;
    }
  }
}

 export default TrackingBasePage;
