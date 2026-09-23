const mongoose = require('mongoose');
const moment = require('moment-timezone');
(async () => {
  const s = Date.now();
  await mongoose.connect(process.env.MONGODB_URI, { autoIndex: false });
  console.log('[' + (Date.now() - s) + 'ms] conectado');
  const BillingQueue = require('./billing/tasks/billing.task').default;
  const period = process.env.PERIOD || moment().format('YYYYMM');
  const summary = await new BillingQueue().processBilling(
    '695e913f69b679429eb335f7', { dryRun: true, period, rethrow: true });
  console.log('[' + (Date.now() - s) + 'ms] LISTO rows=' + (summary || []).length);
  (summary || []).forEach((r: any) => {
    const d = r.detail?.desconsolidado ?? {};
    console.log('RESULT', JSON.stringify({
      company: r.company, containers: r.containers, cars: r.inventoryCars,
      totalDolar: r.totalDolar, valueDolar: r.valueDolar,
      bdContainers: d.containers?.count, bdContainersPrice: d.containers?.price,
      bdUnits: d.codedUnits?.count, bdUnitsPrice: d.codedUnits?.price
    }));
  });
  await mongoose.disconnect();
  process.exit(0);
})().catch((e: any) => { console.log('ERR', e.message); process.exit(1); });
export {};
