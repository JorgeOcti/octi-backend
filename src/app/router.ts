import * as express from 'express';
import AppController from './controllers/app.controller';
import AdminUsersController from './controllers/adminUsers.controller';
import JWTController from './controllers/jwt.controller';
import Middlewares from '../middlewares/middlewares';

const appRouter = express.Router();
// robots.txt
appRouter.get('/robots.txt', AppController.robots);
// DashBoard Principal
appRouter.get('/', Middlewares.isLoggedIn, AppController.index);
appRouter.get('/2/', Middlewares.isLoggedIn, AppController.index);

// admin user
appRouter.get('/users/', Middlewares.isLoggedIn, AdminUsersController.users);
// api admin users
appRouter.get('/api/admin/users/', Middlewares.isLoggedIn, AdminUsersController.apiUsers);
appRouter.post('/api/admin/users/', Middlewares.isLoggedIn, AdminUsersController.apiAddUser);
appRouter.patch('/api/admin/users/:id/', Middlewares.isLoggedIn, AdminUsersController.apiEditUser);
appRouter.delete('/api/admin/users/:id/', Middlewares.isLoggedIn, AdminUsersController.apiDeleteUser);

// web login
appRouter.get('/account/login/', AppController.login);
appRouter.post('/account/login/', AppController.processLogin);
appRouter.get('/account/logout/', AppController.logout);

const jwtRouter = express.Router();
// JWT login
jwtRouter.post('/login/', JWTController.login);
jwtRouter.post('/token/', JWTController.token);
jwtRouter.post('/test/', Middlewares.isJWTAuthenticated, JWTController.test);
jwtRouter.post('/create/', JWTController.createUser);

export {
  appRouter,
  jwtRouter
};
