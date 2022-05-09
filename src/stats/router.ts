import Middlewares from '../middlewares/middlewares';
import * as express from 'express';
import StudioController from "./controllers/studio.controller";

const statsRouter = express.Router();

statsRouter.get('/api/stats/studios/', Middlewares.isLoggedIn, StudioController.apiList);
statsRouter.get('/api/stats/my-studio/', Middlewares.isLoggedIn, StudioController.myStudios);
statsRouter.patch('/api/stats/studios/:id', Middlewares.isLoggedIn, StudioController.patch);
statsRouter.post('/api/stats/studios/', Middlewares.isLoggedIn, StudioController.create);
statsRouter.delete('/api/stats/studios/:id', Middlewares.isLoggedIn, StudioController.delete);

export {statsRouter};
