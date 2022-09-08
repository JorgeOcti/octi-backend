import * as bcrypt from 'bcrypt';
import { ObjectID } from 'bson';
import * as jwt from 'jsonwebtoken';
import { IUser } from '../interfaces';
import { IUserModel } from './user.model';

export default class UserServices {

  constructor(protected user: IUser | IUserModel) {
    this.user = user;
    this.fullName = this.fullName.bind(this);
    this.comparePassword = this.comparePassword.bind(this);
    this.hasPermission = this.hasPermission.bind(this);
    this.generateToken = this.generateToken.bind(this);
    this.venuesPermissions = this.venuesPermissions.bind(this);
    this.middleware = this.middleware.bind(this);
  }

  public fullName(): string {
    const { firstName, lastName } = this.user;
    return `${firstName.trim()} ${lastName.trim()}`;
  }

  public async comparePassword(candidatePassword: string): Promise<boolean> {
    return await bcrypt.compare(candidatePassword, this.user.password);
  }

  public hasPermission(permission: string): boolean {
    const { userPermissions } = this.user;
    if (permission && permission.length && userPermissions && userPermissions.length) {
      return userPermissions.some((perm) => perm.codeName === permission);
    }
    return false;
  }

  public venuesPermissions(inString?: boolean): any[] {
    let venuesPermissions = [];
    const { venue, venuesAccess } = this.user;
    const currentVenue = venue?._id ?? venue;
    if (currentVenue) {
      venuesPermissions.push(currentVenue);
    }
    if (venuesAccess?.length) {
      venuesPermissions = Array.from(
        new Set([
          ...venuesPermissions,
          ...venuesAccess.map((venue: any) => (venue && venue._id ? venue._id : venue))
        ])
      );
    }
    venuesPermissions = venuesPermissions
      .map((id) => id.toString())
      .filter((elem, pos, arr) => {
        return arr.indexOf(elem) === pos;
      });
    if (inString) {
      return venuesPermissions;
    } else {
      return venuesPermissions.map((id) => new ObjectID(id));
    }
  }

  public generateToken(): string {
    const { _id, firstName, lastName, company, venue } = this.user;
    const userInfo = {
      _id,
      firstName,
      lastName,
      company,
      venue
    };
    return jwt.sign(userInfo, process.env.SECRET_KEY || 'secretKey', {
      expiresIn: '7 days'
    });
  }

  public middleware(): IUser {
    return {
      ...this.user,
      fullName: this.fullName,
      comparePassword: this.comparePassword,
      hasPermission: this.hasPermission,
      generateToken: this.generateToken,
      venuesPermissions: this.venuesPermissions
    };
  }
}
