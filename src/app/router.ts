import * as express from 'express';
import AppController from './controllers/app.controller';
import JWTController from './controllers/jwt.controller';

const appRouter = express.Router();
appRouter.get('/', AppController.index);
appRouter.get('/2/', AppController.index);

const jwtRouter = express.Router();
jwtRouter.post('/login/', JWTController.login);
jwtRouter.post('/test/', JWTController.isJWTAuthenticated, JWTController.test);
jwtRouter.post('/create/', JWTController.createUser);

export {
  appRouter,
  jwtRouter
};
