/**
 * Corre el billing de contenedores (billing.task.ts) a mano.
 *
 *   npm run billing:run -- --team=<teamId> --period=YYYYMM --dry-run
 *
 * --dry-run  Calcula y loguea todo, escribe el detalle completo en
 *            /tmp/billing-dryrun-<team>-<period>.json y NO guarda nada.
 *            SIEMPRE usarlo para probar contra datos de producción.
 *
 * --period   Fija el período (YYYYMM). Sin esto el período se deriva del día en
 *            que se corre (`subtract(25, 'days')`): a fin de mes apunta al mes EN
 *            CURSO, no al anterior. Si además se guarda, ese invoice bloquea la
 *            corrida real del cron para el mismo período.
 *
 * Local, contra el DocDB de dev por el túnel SSM (ver DOCDB-MIGRATION.md):
 *   MONGODB_URI="mongodb://...localhost:27018/osaAndes?tls=true&tlsCAFile=./global-bundle.pem&tlsAllowInvalidHostnames=true&directConnection=true&retryWrites=false&authSource=admin" \
 *   NODE_OPTIONS="--no-experimental-strip-types" TS_NODE_TRANSPILE_ONLY=1 \
 *   npm run billing:run -- --team=695e913f69b679429eb335f7 --period=202607 --dry-run
 */
/* eslint-disable @typescript-eslint/no-var-requires */

// Varios model files cargan addons nativos (bcrypt, mmmagic) cuyos binarios
// .node están mal compilados para este host (Node 22 / arm64). El billing no
// usa ninguno de los dos, así que se stubean en require() para que los modelos
// se puedan importar. Mismo patrón que scripts/docdb-build-indexes.ts.
//
// Por eso este archivo usa require() y no import: el stub tiene que instalarse
// ANTES de que se evalúen los modelos, y los import se hoistean.
const Module = require('module');
const _origLoad = Module._load;
const NATIVE_STUBS: Record<string, any> = {
  bcrypt: {
    hash: async () => '$stub$',
    compare: async () => false,
    genSalt: async () => '$stub$',
    hashSync: () => '$stub$',
    compareSync: () => false,
    genSaltSync: () => '$stub$'
  },
  mmmagic: (() => {
    class Magic {
      constructor(_a?: any, _b?: any) { }
      detect(_buf: any, cb: any) {
        if (cb) cb(null, 'application/octet-stream');
      }
      detectFile(_p: any, cb: any) {
        if (cb) cb(null, 'application/octet-stream');
      }
    }
    return { Magic, MAGIC_MIME_TYPE: 0x000010, MAGIC_MIME_ENCODING: 0x000400, MAGIC_MIME: 0x000410 };
  })()
};
Module._load = function (request: string, ...rest: any[]) {
  if (Object.prototype.hasOwnProperty.call(NATIVE_STUBS, request)) return NATIVE_STUBS[request];
  return _origLoad.call(this, request, ...rest);
};

const bluebird = require('bluebird');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

async function BillingRun(): Promise<void> {
  dotenv.config({
    path: path.join(__dirname, '../../../.env')
  });

  const args: string[] = process.argv.slice(2);
  const valueOf = (name: string): string | undefined => {
    const found = args.find(a => a.startsWith(`--${name}=`));
    return found ? found.split('=').slice(1).join('=') : undefined;
  };

  const team = valueOf('team');
  const period = valueOf('period');
  const dryRun = args.includes('--dry-run');

  if (!team) {
    console.log('Falta --team=<teamId>. Sin team no hay tarifas configuradas y todo queda en 0.');
    process.exit(1);
  }

  console.log(`team=${team} period=${period || '(derivado de la fecha de hoy)'} dryRun=${dryRun}`);
  console.log(`MONGODB_URI host: ${(process.env.MONGODB_URI || '(no seteada)').replace(/\/\/[^@]*@/, '//***@')}`);

  if (!dryRun) {
    console.log('');
    console.log('*** ATENCIÓN: esto GUARDA invoices en la base a la que apunte MONGODB_URI ***');
    console.log('*** Para probar sin escribir: agregar --dry-run                           ***');
    console.log('');
  }

  // require() después de los stubs, no import: ver comentario de arriba.
  const BillingQueue = require('../../billing/tasks/billing.task').default;
  const { connectMongo } = require('../../services/mongo.service');
  const Company = require('../models/company.model').default;
  const Team = require('../models/team.model').default;

  (mongoose as any).Promise = bluebird;
  // connectMongo fuerza autoIndex:false, así que conectarse NO dispara la
  // creación de índices nuevos en el cluster.
  await connectMongo();
  new Team();
  new Company();

  try {
    const summary = await new BillingQueue().processBilling(team, { dryRun, period });
    // El volcado a archivo vive acá y no en la task: el endpoint web usa el
    // mismo dry-run y no tiene por qué escribir nada en disco.
    if (dryRun && summary) {
      const fs = require('fs');
      const outPath = `/tmp/billing-dryrun-${team}-${period || 'auto'}.json`;
      fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
      console.log(`DRY-RUN: detalle completo escrito en ${outPath}`);
    }
  } catch (e) {
    console.log('Ha ocurrido un error en BillingQueue.processBilling');
    console.log('error:', e);
  }

  process.exit(0);
}

BillingRun();

export { };
