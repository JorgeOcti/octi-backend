import * as express from 'express';
import AppController from './controllers/app.controller';
import AdminController from './controllers/admin.controller';
import JWTController from './controllers/jwt.controller';
import Middlewares from '../middlewares/middlewares';

const appRouter = express.Router();
appRouter.get('/robots.txt', AppController.robots);
appRouter.get('/', Middlewares.isLoggedIn, AppController.index);
appRouter.get('/2/', Middlewares.isLoggedIn, AppController.index);

appRouter.get('/users/', Middlewares.isLoggedIn, AdminController.users);
appRouter.delete('/api/admin/users/:id/', Middlewares.isLoggedIn, AdminController.apiDeleteUser);
appRouter.get('/api/admin/users/', Middlewares.isLoggedIn, AdminController.apiUsers);

appRouter.get('/account/login/', AppController.login);
appRouter.post('/account/login/', AppController.processLogin);
appRouter.get('/account/logout/', AppController.logout);

const jwtRouter = express.Router();
jwtRouter.post('/login/', JWTController.login);
jwtRouter.post('/test/', JWTController.isJWTAuthenticated, JWTController.test);
jwtRouter.post('/create/', JWTController.createUser);

export {
  appRouter,
  jwtRouter
};
