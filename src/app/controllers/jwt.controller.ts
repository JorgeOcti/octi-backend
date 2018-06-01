import {NextFunction, Request, Response} from 'express';
import * as jwt from 'jsonwebtoken';
import {IRequest} from '../../interfaces/global';
import User, {IUserModel} from '../models/user.model';
// import * as moment  from "moment-timezone";

class JWTController {

  constructor() {
    this.login = this.login.bind(this);
    this.token = this.token.bind(this);
    this.createUser = this.createUser.bind(this);
    this.isJWTAuthenticated = this.isJWTAuthenticated.bind(this);
  }

  public createUser(req: Request, res: Response) {
    const {username, password, firstName, lastName} = req.body;
    if (username && username.length && password && password.length) {
      const newUser = new User({
        username,
        firstName,
        lastName,
        email: username,
        password,
        active: true
      });
      newUser.save((err, user: IUserModel) => {
        if (err) {
          throw err;
        }
        console.log(JSON.stringify(user));
      });
      res.json({
        data: {
          username
        },
        status: 200
      });
    } else {
      res.status(400).json({
        error: 'username and password are required',
        status: 400
      });
    }
  }

  public login(req: Request, res: Response) {
    if (req.body.username === null || req.body.username === undefined || req.body.password === null || req.body.password === undefined) {
      res.status(401).json({message: 'Authentication failed. Invalid user or password.'});
    } else {
      User
        .findOne({
          email: req.body.username
        }, {
          firstName: true,
          username: true,
          email: true,
          lastName: true,
          password: true,
          updatedAt: true,
          active: true,
        })
        .exec((err, user: IUserModel) => {
          if (err) {
            res.status(500).send(err);
          }
          if (!user || !user.comparePasswordSync(req.body.password)) {
            res.status(401).json({
              error: 'Authentication failed. Invalid user or password.',
              status: 401
            });
          } else if (!user.active) {
            res.status(401).json({
              error: 'User is inactive',
              status: 401
            });
          } else {
            user.lastLogin = new Date();
            user.save(function (err: any) {
              if (err) {
                res.status(500).json(err);
              } else {
                const userInfo = {
                  _id: user._id,
                  username: user.username,
                  email: user.email
                };
                res.json({
                  data: {
                    token: jwt.sign(userInfo, req.app.locals.secretKey, {
                      expiresIn: '30 days'
                    }),
                    refreshToken: jwt.sign(userInfo, req.app.locals.secretKey, {
                      expiresIn: '60 days'
                    }),
                    user: {
                      _id: user._id,
                      name: user.firstName,
                      lastName: user.lastName,
                      username: user.username,
                      // updatedAt: moment(user.updatedAt).tz("America/Santiago").format()
                    }
                  },
                  status: 200
                });
              }
            });
          }
        });
    }
  }

  public token(req: Request, res: Response){
    const {refreshToken} = req.body;
    if(!refreshToken){
      res.status(400).json({
        error: 'refresh token is required',
        status: 400
      });
    } else{
      jwt.verify(refreshToken, req.app.locals.secretKey, (err: any, decode: any)=>{
        if (err) {
          res.status(401).json({
            error: err.message,
            status: 401
          });
        }
        else{
          User
            .findById(decode._id)
            .exec((err, user: IUserModel) => {
              if (err) {
                res.status(500).json(err);
              }
              else if (!user.active) {
                res.status(401).json({
                  error: 'User is inactive',
                  status: 401
                });
              } else {
                user.lastLogin = new Date();
                user.save(function (err: any) {
                  if (err) {
                    res.status(500).json(err);
                  } else {
                    const userInfo = {
                      _id: user._id,
                      username: user.username,
                      email: user.email
                    };
                    res.json({
                      data: {
                        token: jwt.sign(userInfo, req.app.locals.secretKey, {
                          expiresIn: '30 days'
                        }),
                        refreshToken: jwt.sign(userInfo, req.app.locals.secretKey, {
                          expiresIn: '60 days'
                        }),
                        user: {
                          _id: user._id,
                          name: user.firstName,
                          lastName: user.lastName,
                          username: user.username,
                          // updatedAt: moment(user.updatedAt).tz("America/Santiago").format()
                        }
                      },
                      status: 200
                    });
                  }
                });
              }
            });
        }
      })

    }
  }

  public isJWTAuthenticated(req: IRequest, res: Response, next: NextFunction) {
    console.log('test');
    if (req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'JWT') {

      jwt.verify(req.headers.authorization.split(' ')[1], req.app.locals.secretKey, (err: any, decode: any) => {
        if (err) {
          res.status(401).json({
            error: err.message,
            status: 401
          });
        }
        req.user = decode;
        next();
      });
    } else {
      res.status(403).json({
        error: 'Forbidden',
        status: 403
      });
      next();
    }
  }

  public test(req: IRequest, res: Response) {
    res.json({
      data: {
        user: req.user
      },
      status: 200
    });
  }
}

export default new JWTController();
