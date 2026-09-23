const mongoose = require('mongoose');
const moment = require('moment-timezone');
(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { autoIndex: false });
  const BillingQueue = require('./billing/tasks/billing.task').default;
  const period = moment().format('YYYYMM');
  console.log('PERIODO EN CURSO:', period);
  const summary = await new BillingQueue().processBilling(
    '695e913f69b679429eb335f7', { dryRun: true, period, rethrow: true }
  );
  console.log('RETURNED_ROWS:', (summary || []).length);
  (summary || []).forEach((r: any) => {
    const d = r.detail?.desconsolidado ?? {};
    console.log('  company        :', r.company);
    console.log('  containers     :', r.containers, ' cars:', r.inventoryCars);
    console.log('  totalDolar     :', r.totalDolar, ' valueDolar:', r.valueDolar);
    console.log('  breakdown cont :', d.containers?.count, '$' + (d.containers?.price ?? 0));
    console.log('  breakdown units:', d.codedUnits?.count, '$' + (d.codedUnits?.price ?? 0));
    console.log('  ya existe inv. :', r.invoiceAlreadyExists);
    console.log('  detail items   :', (d.containers?.items || []).length + (d.codedUnits?.items || []).length, '(NO se mandan al browser)');
  });
  await mongoose.disconnect();
})().catch((e: any) => { console.log('ERR', e.message); process.exit(1); });
export {};
