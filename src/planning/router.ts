import * as express from "express";
import Middlewares from "../middlewares/middlewares";
import PlanningController from "./controllers/planning.controller";

const planningRouter = express.Router();

planningRouter.get('/planning/', Middlewares.isLoggedIn, PlanningController.index);
planningRouter.get('/planning/import/', Middlewares.isLoggedIn, PlanningController.index);
planningRouter.get('/api/admin/planning/', Middlewares.isLoggedIn, PlanningController.list);
planningRouter.post('/api/admin/planning/', Middlewares.isLoggedIn, PlanningController.create);

export {
  planningRouter
}
