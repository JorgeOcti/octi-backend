import Middlewares from '../middlewares/middlewares';
import BillingController from '../billing/controllers/billing.controller';
import * as express from 'express';

const billingRouter = express.Router();

billingRouter.get('/settings/billing/pdf-corporate/:id', Middlewares.isLoggedIn, BillingController.coportarePdf);
billingRouter.get('/settings/billing/pdf/:id', Middlewares.isLoggedIn, BillingController.pdf);
billingRouter.get('/settings/billing/', Middlewares.isLoggedIn, BillingController.index);
billingRouter.get('/api/settings/billing/companies/', Middlewares.isLoggedIn, BillingController.apiListCompaniesCorporateBilling);
billingRouter.get('/api/settings/billing/modules/', Middlewares.isLoggedIn, BillingController.apiListModules);
billingRouter.get('/api/settings/billing/corporate/', Middlewares.isLoggedIn, BillingController.apiListCorporateBilling);
billingRouter.get('/settings/billing/corporate/', Middlewares.isLoggedIn, BillingController.index);
billingRouter.patch('/api/settings/billing/corporate/', Middlewares.isLoggedIn, BillingController.apiPatchCorporateBilling);
billingRouter.get('/settings/billing-settings/', Middlewares.isLoggedIn, BillingController.index);
billingRouter.get('/settings/billing-settings/invoices/', Middlewares.isLoggedIn, BillingController.apiInvoiceCorporative);
billingRouter.get('/settings/billing/run/', Middlewares.isLoggedIn, BillingController.run);
billingRouter.get('/settings/billing/export/', Middlewares.isLoggedIn, BillingController.exportDetail);
billingRouter.get('/api/admin/billing/', Middlewares.isLoggedIn, BillingController.apiList);
billingRouter.get('/api/admin/billing/detail/', Middlewares.isLoggedIn, BillingController.apiDetail);


export {
  billingRouter
};

