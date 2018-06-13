import * as express from 'express';
import AppController from './controllers/app.controller';
import CarController from './controllers/car.controller';
import AdminUsersController from './controllers/admin/user.admin.controller';
import UserController from './controllers/user.controller';
import AdminCompaniesController from './controllers/admin/companies.admin.controller';
import AdminVenuesController from './controllers/admin/venues.admin.controller';
import JWTController from './controllers/jwt.controller';
import Middlewares from '../middlewares/middlewares';

const appRouter = express.Router();
// robots.txt
appRouter.get('/robots.txt', AppController.robots);

// DashBoard Principal
appRouter.get('/', Middlewares.isLoggedIn, CarController.generalDashboard);

// DashBoard Cars
appRouter.get('/cars/', Middlewares.isLoggedIn, CarController.vinDashboard);
appRouter.get('/cars/:id', Middlewares.isLoggedIn, CarController.vinDashboardDetail);

// api cars
appRouter.get('/api/admin/cars/:id/', Middlewares.isLoggedIn, CarController.apiCarDetail);
appRouter.get('/api/admin/cars/', Middlewares.isLoggedIn, CarController.apiCars);

// form detail
appRouter.get('/api/admin/participant/:id/', Middlewares.isLoggedIn, CarController.apiParticipantDetail);
appRouter.get('/api/admin/participants-per-date/', Middlewares.isLoggedIn, CarController.apiParticipantsPerDate);

// admin user
appRouter.get('/users/', Middlewares.isLoggedIn, AdminUsersController.index);
// api admin users
appRouter.get('/api/admin/users/', Middlewares.isLoggedIn, AdminUsersController.apiUsers);
appRouter.post('/api/admin/users/', Middlewares.isLoggedIn, AdminUsersController.apiAddUser);
appRouter.patch('/api/admin/users/:id/', Middlewares.isLoggedIn, AdminUsersController.apiEditUser);
appRouter.delete('/api/admin/users/:id/', Middlewares.isLoggedIn, AdminUsersController.apiDeleteUser);

// admin companies
appRouter.get('/companies/', Middlewares.isLoggedIn, AdminCompaniesController.index);

// venue companies
appRouter.get('/venues/', Middlewares.isLoggedIn, AdminVenuesController.index);
appRouter.get('/api/admin/venues/', Middlewares.isLoggedIn, AdminVenuesController.apiVenues);

// validate vins
appRouter.post('/api/v1/check-vin/', Middlewares.isJWTAuthenticated, CarController.checkVIN);

// change password
appRouter.post('/api/v1/change-password/', Middlewares.isJWTAuthenticated, UserController.apiChangePassword);

// web login
appRouter.get('/account/login/', AppController.login);
appRouter.post('/account/login/', AppController.processLogin);
appRouter.get('/account/logout/', AppController.logout);

// JWT API
const jwtRouter = express.Router();
jwtRouter.post('/login/', JWTController.login);
jwtRouter.post('/token/', JWTController.token);
jwtRouter.post('/test/', Middlewares.isJWTAuthenticated, JWTController.test);
jwtRouter.post('/create/', JWTController.createUser);

export {
  appRouter,
  jwtRouter
};
