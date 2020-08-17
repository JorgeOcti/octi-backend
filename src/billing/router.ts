import Middlewares from "../middlewares/middlewares";
import BillingController from "../billing/controllers/billing.controller";
import * as express from "express";

const billingRouter = express.Router();

billingRouter.get('/settings/billing/pdf/:id', Middlewares.isLoggedIn, BillingController.pdf);
billingRouter.get('/settings/billing/', Middlewares.isLoggedIn, BillingController.index);
billingRouter.get('/api/admin/billing/', Middlewares.isLoggedIn, BillingController.apiList);


export {
  billingRouter
};

