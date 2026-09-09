/**
 * Otorga / revoca / lista el flag `isSuperAdmin`.
 *
 * Este flag da acceso a herramientas que cruzan la frontera de team/company
 * (copiar formularios entre teams). A propósito NO es parte de
 * `userPermissions`: no aparece en el admin de permisos y no existe ningún
 * endpoint HTTP que lo pueda escribir, así que no se puede otorgar por error
 * desde la UI. Este comando es la única vía.
 *
 *   npm run superadmin:list
 *   npm run superadmin:grant  -- --email=alguien@octimize.cl --confirm=alguien@octimize.cl
 *   npm run superadmin:revoke -- --email=alguien@octimize.cl
 *
 * `--confirm` tiene que repetir el email exacto: evita otorgarlo al usuario
 * equivocado por un typo o un copy/paste a medias.
 */
/* eslint-disable @typescript-eslint/no-var-requires */

// Varios model files cargan addons nativos (bcrypt, mmmagic) con binarios
// arch-mismatched en algunos hosts. No se usan acá. Mismo patrón que
// scripts/docdb-build-indexes.ts; por eso este archivo usa require() y no
// import (el stub tiene que instalarse antes de evaluar los modelos).
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
      detect(_buf: any, cb: any) { if (cb) cb(null, 'application/octet-stream'); }
      detectFile(_p: any, cb: any) { if (cb) cb(null, 'application/octet-stream'); }
    }
    return { Magic, MAGIC_MIME_TYPE: 0x000010, MAGIC_MIME_ENCODING: 0x000400, MAGIC_MIME: 0x000410 };
  })()
};
Module._load = function (request: string, ...rest: any[]) {
  if (Object.prototype.hasOwnProperty.call(NATIVE_STUBS, request)) return NATIVE_STUBS[request];
  return _origLoad.call(this, request, ...rest);
};

const dotenv = require('dotenv');
const path = require('path');

async function SuperAdminGrant(): Promise<void> {
  dotenv.config({ path: path.join(__dirname, '../../../.env') });

  const args: string[] = process.argv.slice(2);
  const valueOf = (name: string): string | undefined => {
    const found = args.find(a => a.startsWith(`--${name}=`));
    return found ? found.split('=').slice(1).join('=') : undefined;
  };

  const action = args.includes('--revoke')
    ? 'revoke'
    : args.includes('--list')
      ? 'list'
      : 'grant';
  const email = valueOf('email');
  const confirm = valueOf('confirm');

  const { connectMongo } = require('../../services/mongo.service');
  const User = require('../models/user.model').default;
  // Registrar el modelo Team: --list hace populate('team') y sin esto Mongoose
  // tira MissingSchemaError.
  require('../models/team.model');

  console.log(`MONGODB_URI host: ${(process.env.MONGODB_URI || '(no seteada)').replace(/\/\/[^@]*@/, '//***@')}`);
  await connectMongo();

  if (action === 'list') {
    const supers = await User
      .find({ isSuperAdmin: true }, { email: true, firstName: true, lastName: true, team: true })
      .populate({ path: 'team', select: ['name'] })
      .lean();
    console.log(`\nsuperadmins (${supers.length}):`);
    for (const u of supers) {
      console.log(`  - ${u.email}  ${u.firstName || ''} ${u.lastName || ''}  team=${u.team?.name || u.team || '-'}`);
    }
    if (!supers.length) console.log('  (ninguno)');
    process.exit(0);
  }

  if (!email) {
    console.log('Falta --email=<email>');
    process.exit(1);
  }

  const user = await User.findOne({ email }, { email: true, firstName: true, lastName: true, isSuperAdmin: true });
  if (!user) {
    console.log(`No existe un usuario con email "${email}".`);
    process.exit(1);
  }

  if (action === 'revoke') {
    if (!user.isSuperAdmin) {
      console.log(`${user.email} no es superadmin, no hay nada que revocar.`);
      process.exit(0);
    }
    await User.updateOne({ _id: user._id }, { $set: { isSuperAdmin: false } });
    console.log(`REVOCADO: ${user.email} ya no es superadmin.`);
    console.log('Efecto inmediato: el middleware relee el flag desde la base en cada request.');
    process.exit(0);
  }

  // grant
  if (confirm !== email) {
    console.log('Para otorgar superadmin hay que repetir el email en --confirm.');
    console.log(`  esperado: --confirm=${email}`);
    console.log(`  recibido: --confirm=${confirm ?? '(vacío)'}`);
    process.exit(1);
  }

  if (user.isSuperAdmin) {
    console.log(`${user.email} ya es superadmin, no hay cambios.`);
    process.exit(0);
  }

  console.log('');
  console.log('*** Vas a otorgar SUPERADMIN a: ***');
  console.log(`      ${user.email}  (${user.firstName || ''} ${user.lastName || ''})`);
  console.log('    Eso habilita copiar formularios entre CUALQUIER team y company.');
  console.log('');

  await User.updateOne({ _id: user._id }, { $set: { isSuperAdmin: true } });
  console.log(`OTORGADO: ${user.email} es superadmin.`);
  process.exit(0);
}

SuperAdminGrant();

export { };
