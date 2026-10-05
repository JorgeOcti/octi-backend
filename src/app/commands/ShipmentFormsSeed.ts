/**
 * Crea los dos formularios que el Envío de unidades necesita para funcionar:
 * `shipmentUnit` (uno por unidad cargada) y `shipmentDeparture` (uno al
 * registrar la salida del camión).
 *
 * Sin ambos, `POST /api/v1/shipments/` devuelve 400 FORMS_NOT_CONFIGURED: el
 * envío resuelve sus formularios por kind al crearse.
 *
 *   npm run shipment:forms -- --company=<id|nombre> --dry-run
 *   npm run shipment:forms -- --company=<id|nombre>
 *   npm run shipment:forms -- --company=<id|nombre> --fix
 *
 * Es idempotente: si ya existe un formulario activo de ese kind para la
 * company no lo toca ni lo duplica. `--fix` sí entra a corregir una sola cosa
 * en el que ya existe —los `kindUpdate` del formulario de salida—, porque de
 * ahí saca la Tarja el nombre del chofer y la foto del camión, y sin ellos el
 * PDF sale incompleto sin avisar.
 *
 * Las preguntas son un punto de partida razonable, no una definición cerrada:
 * el admin las edita desde el editor de formularios y el cambio toma efecto en
 * los envíos siguientes. Lo único que no se puede tocar sin romper la Tarja son
 * los `kindUpdate`. Ver docs/envio-de-unidades/02-technical-plan.md §3.b y §6.
 */
/* eslint-disable @typescript-eslint/no-var-requires */

// Varios model files cargan addons nativos (bcrypt, mmmagic) con binarios
// arch-mismatched en algunos hosts. No se usan acá. Mismo patrón que
// SuperAdminGrant.ts; por eso este archivo usa require() y no import (el stub
// tiene que instalarse antes de evaluar los modelos).
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

/**
 * Los dos `kindUpdate` de los que depende la Tarja. Están acá y no sueltos en
 * el texto de una pregunta justamente para que renombrar o reordenar las
 * preguntas desde el admin no rompa el PDF.
 */
const DRIVER_NAME = 'shipment.driverName';
const DRIVER_RUT = 'shipment.driverRut';
const TRUCK_PHOTO = 'shipment.truckPhoto';

function unitFormDefinition(name: string, team: any, company: any, damagesCatalog: any): any {
  const questions: any[] = [];
  let order = 1;

  // El catálogo de daños es por team; si no hay ninguno se omite la pregunta en
  // vez de crear un formulario que la app no puede renderizar.
  if (damagesCatalog) {
    questions.push({
      question: 'Daños',
      kind: 'damage',
      damages: damagesCatalog,
      weight: 0,
      order: order++
    });
  }

  questions.push({
    question: 'Foto de la unidad',
    kind: 'image',
    imageType: 'photo',
    weight: 0,
    order: order++
  });

  questions.push({
    question: 'Observaciones',
    kind: 'text',
    keyboardType: 'text',
    optional: true,
    weight: 0,
    order: order++
  });

  return {
    name,
    team,
    company,
    kind: 'shipmentUnit',
    active: true,
    unitsToUse: { container: false, units: true },
    sections: [{ name: 'Estado de la unidad', weight: 25, order: 1, questions }]
  };
}

function departureFormDefinition(name: string, team: any, company: any): any {
  return {
    name,
    team,
    company,
    kind: 'shipmentDeparture',
    active: true,
    unitsToUse: { container: false, units: false },
    sections: [{
      name: 'Salida del camión',
      weight: 25,
      order: 1,
      questions: [
        {
          // La Tarja la busca por kindUpdate, no por este texto.
          question: 'Nombre completo del chofer',
          kind: 'text',
          keyboardType: 'text',
          kindUpdate: DRIVER_NAME,
          weight: 0,
          order: 1
        },
        {
          // También por kindUpdate: la Tarja lo muestra y la app ya no lo pide.
          question: 'RUT del chofer',
          kind: 'text',
          keyboardType: 'text',
          kindUpdate: DRIVER_RUT,
          optional: true,
          weight: 0,
          order: 2
        },
        {
          question: 'Foto del camión cargado',
          kind: 'image',
          imageType: 'photo',
          kindUpdate: TRUCK_PHOTO,
          // Varias fotos: un camión cargado no se documenta con una sola toma.
          // Con `multi` el botón de agregar no desaparece tras la primera
          // (ver questions.dart en la app).
          multi: true,
          weight: 0,
          order: 3
        },
        {
          question: 'Observaciones',
          kind: 'text',
          keyboardType: 'text',
          optional: true,
          weight: 0,
          order: 4
        }
      ]
    }]
  };
}

/** Resumen legible de un formulario, para no tener que ir a mirar la base. */
function describe(form: any): string {
  const lines: string[] = [];
  for (const section of form.sections || []) {
    lines.push(`      sección "${section.name}"`);
    for (const q of section.questions || []) {
      const marks = [
        q.kind,
        q.optional ? 'opcional' : null,
        q.kindUpdate ? `kindUpdate=${q.kindUpdate}` : null
      ].filter(Boolean).join(', ');
      lines.push(`        ${q.order}. ${q.question}  (${marks})`);
    }
  }
  return lines.join('\n');
}

async function ShipmentFormsSeed(): Promise<void> {
  dotenv.config({ path: path.join(__dirname, '../../../.env') });

  const args: string[] = process.argv.slice(2);
  const valueOf = (name: string): string | undefined => {
    const found = args.find(a => a.startsWith(`--${name}=`));
    return found ? found.split('=').slice(1).join('=') : undefined;
  };
  const dryRun = args.includes('--dry-run');
  const fix = args.includes('--fix');
  const companyArg = valueOf('company');

  const { connectMongo } = require('../../services/mongo.service');
  const Company = require('../models/company.model').default;
  const Form = require('../../form/models/form.model').default;
  const Damages = require('../../form/models/damages.model').default;
  require('../models/team.model');

  console.log(`MONGODB_URI host: ${(process.env.MONGODB_URI || '(no seteada)').replace(/\/\/[^@]*@/, '//***@')}`);
  await connectMongo();

  if (!companyArg) {
    const handlers = await Company
      .find({ handler: true }, { name: true, team: true })
      .populate({ path: 'team', select: ['name'] })
      .lean();
    console.log('\nFalta --company=<id|nombre>. Companies handler disponibles:');
    for (const c of handlers) {
      console.log(`  - ${c._id}  ${c.name}  (team ${c.team?.name || c.team})`);
    }
    if (!handlers.length) console.log('  (ninguna)');
    process.exit(1);
  }

  const byId = /^[0-9a-f]{24}$/i.test(companyArg);
  const company = await Company
    .findOne(byId ? { _id: companyArg } : { name: companyArg }, { name: true, team: true, handler: true })
    .populate({ path: 'team', select: ['name'] });
  if (!company) {
    console.log(`No existe una company con ${byId ? 'id' : 'nombre'} "${companyArg}".`);
    process.exit(1);
  }
  if (!company.handler) {
    // No es fatal —se puede querer prepararla antes de marcarla— pero sí
    // merece el aviso: los envíos los crea la company que despacha.
    console.log(`AVISO: "${company.name}" no está marcada como handler. Los envíos los crea la company que despacha.`);
  }

  const team = company.team?._id || company.team;
  console.log(`\ncompany: ${company.name} (${company._id})`);
  console.log(`team:    ${company.team?.name || ''} (${team})`);
  if (dryRun) console.log('\n*** --dry-run: no se escribe nada ***');

  const damagesCatalog = await Damages.findOne({ team }, { name: true }).lean();
  if (damagesCatalog) {
    console.log(`daños:   "${damagesCatalog.name}" (${damagesCatalog._id})`);
  } else {
    console.log('daños:   no hay catálogo para este team — el formulario de unidad va sin la pregunta de daños.');
  }

  const planned = [
    { kind: 'shipmentUnit', def: unitFormDefinition('Carga de unidad', team, company._id, damagesCatalog?._id) },
    { kind: 'shipmentDeparture', def: departureFormDefinition('Salida del camión', team, company._id) }
  ];

  for (const { kind, def } of planned) {
    console.log('');
    const existing = await Form.findOne({ team, company: company._id, kind, active: true });

    if (existing) {
      console.log(`  ${kind}: YA EXISTE — "${existing.name}" (${existing._id}), no se toca.`);

      if (kind === 'shipmentDeparture') {
        // Lo único que se corrige del que ya existe: sin estos kindUpdate la
        // Tarja sale sin chofer ni foto y no hay forma de notarlo desde la UI.
        const flat = (existing.sections || []).flatMap((s: any) => s.questions || []);
        const faltan = [DRIVER_NAME, DRIVER_RUT, TRUCK_PHOTO]
          .filter(k => !flat.some((q: any) => q.kindUpdate === k));

        if (!faltan.length) {
          console.log('      los kindUpdate de la Tarja están puestos.');
        } else if (!fix) {
          console.log(`      FALTAN kindUpdate: ${faltan.join(', ')} — la Tarja sale incompleta.`);
          console.log('      Corregir con --fix (asigna el kindUpdate a la primera pregunta del tipo que corresponda).');
        } else if (!dryRun) {
          let changed = false;
          for (const k of faltan) {
            const wantedKind = k === TRUCK_PHOTO ? 'image' : 'text';
            const target = flat.find((q: any) => q.kind === wantedKind && !q.kindUpdate);
            if (target) {
              target.kindUpdate = k;
              changed = true;
              console.log(`      --fix: "${target.question}" -> kindUpdate=${k}`);
            } else {
              console.log(`      --fix: no hay ninguna pregunta ${wantedKind} libre para ${k}; agregala desde el editor.`);
            }
          }
          if (changed) {
            await existing.save();
            console.log('      guardado.');
          }
        }
      }
      continue;
    }

    if (dryRun) {
      console.log(`  ${kind}: SE CREARÍA — "${def.name}"`);
      console.log(describe(def));
      continue;
    }

    const created = await Form.create(def);
    console.log(`  ${kind}: CREADO — "${created.name}" (${created._id})`);
    console.log(describe(created));
  }

  console.log('');
  console.log('Listo. Si el formulario de salida se edita desde el admin, lo único');
  console.log('que no se puede sacar son los kindUpdate: de ahí salen el nombre del');
  console.log('chofer y la foto del camión en la Tarja.');
  process.exit(0);
}

ShipmentFormsSeed();

export { };
