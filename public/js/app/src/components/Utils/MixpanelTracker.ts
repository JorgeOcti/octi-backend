import * as Mixpanel from 'mixpanel-browser';
import {IUser} from "../../../../../../src/interfaces/user.interface";
import {IWindow} from "../../interfaces/window";

declare let window: IWindow;

class MixpanelTracker {
  private static instance : MixpanelTracker;

  static getInstance() : MixpanelTracker {
    if (!this.instance)
      this.instance = new MixpanelTracker();
    return this.instance;
  }

  private constructor() {
    Mixpanel.init(window.MIXPANEL);
  }

  public trackAction(title: string, properties: any = {}) : void {
    Mixpanel.track(title, properties);
  }

  public identifyUser(user : IUser) : void {
    Mixpanel.register({
      'team_id': user.team,
      'company': user.company.name,
      'company_id': user.company.id,
    });
    Mixpanel.identify(user._id);
    Mixpanel.people.set( user._id, {
      '$first_name': user.firstName,
      '$last_name': user.lastName,
      '$email': user.email,
      'team_id': user.team,
      'company': user.company.name,
      'company_id': user.company._id
    });
  }

}

export default MixpanelTracker;
