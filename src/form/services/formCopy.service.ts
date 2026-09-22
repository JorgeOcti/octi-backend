import * as mongoose from 'mongoose';

import Company from '../../app/models/company.model';
import Damages from '../models/damages.model';
import Form, { IFormModel } from '../models/form.model';
import Kind from '../models/kind.model';
import Part from '../models/part.model';
import Position from '../models/position.model';
import Scale from '../models/scale.model';
import Team from '../../app/models/team.model';
import logger from '../../services/logger.service';

/**
 * Copia un formulario completo a otro team/company.
 *
 * El documento del formulario es fácil: `sections` y `questions` son
 * subdocumentos embebidos, así que viajan con el documento. Lo que NO viaja son
 * las referencias a otras colecciones, que están scopeadas por team:
 *
 *   question.scale   -> Scale    (team + company)
 *   question.damages -> Damages  (team)
 *                        +-> parts[]      -> Part      (team)
 *                        +-> kinds[]      -> Kind      (team)
 *                        +-> positions[]  -> Position  (team)
 *                        +-> partFallback -> Part      (team)
 *                        +-> kindFallback -> Kind      (team)
 *
 * Si no se remapean, el formulario copiado queda apuntando a las escalas y
 * catálogos de daños del team ORIGEN: se ve bien en el listado y falla recién
 * cuando alguien lo llena.
 *
 * Estrategia: REUSAR primero, crear solo lo que falta.
 *
 * Para cada referencia se busca en el team destino (y company, en el caso de
 * Scale) una con el mismo nombre. Si existe se apunta a esa; si no, se crea.
 *
 * Antes esto siempre creaba copias nuevas, lo que duplicaba catálogos enteros:
 * un formulario con una pregunta `damage` podía generar más de 100 documentos
 * (p.ej. "Daños Derco Despacho" = 1 Damages + 81 parts + 6 kinds + 16 positions)
 * en CADA copia. Un Damages reusado se toma tal cual: no se recorre su árbol,
 * porque el catálogo del destino ya es el bueno.
 *
 * La comparación es por nombre normalizado (trim + minúsculas). Los catálogos
 * del destino se cargan una sola vez al principio y se indexan en memoria, así
 * que esto no agrega una query por referencia.
 *
 * Dos detalles que importan:
 *  - Se preservan los `_id` de los subdocumentos embebidos. `triggerConfig.
 *    questionId` es un String que apunta al `_id` de una question embebida; si
 *    Mongoose generara `_id` nuevos, esos triggers quedarían apuntando a nada.
 *    Duplicar `_id` de subdocumentos entre documentos distintos es inofensivo.
 *  - Se limpia `matrix.questions[].images` (referencias a ParticipantFile): son
 *    datos de respuesta, no parte de la plantilla.
 */

export interface IFormCopyRequest {
  formId: string;
  targetTeam: string;
  targetCompany: string;
  /** Nombre del formulario copiado. Si no se pasa, se usa el del origen. */
  name?: string;
  /** true = no escribe nada, solo devuelve el plan. */
  preview?: boolean;
}

export interface IFormCopyPlanEntry {
  collection: 'Scale' | 'Damages' | 'Part' | 'Kind' | 'Position';
  name: string;
  /**
   * reuse          — ya existe una con ese nombre en el destino, se apunta a esa
   * create         — no existe, se crea
   * missing-source — la referencia del origen apunta a algo que ya no existe
   */
  action: 'create' | 'reuse' | 'missing-source';
  sourceId?: string;
  targetId?: string;
  note?: string;
}

export interface IFormCopyResult {
  preview: boolean;
  source: {
    formId: string;
    name: string;
    kind: string;
    team: string;
    teamName?: string;
    company: string;
    companyName?: string;
    sections: number;
    questions: number;
    triggers: number;
  };
  target: {
    team: string;
    teamName?: string;
    company: string;
    companyName?: string;
    name: string;
  };
  plan: IFormCopyPlanEntry[];
  warnings: string[];
  /** Solo cuando preview = false. */
  createdFormId?: string;
}

class FormCopyService {
  constructor() {
    this.copy = this.copy.bind(this);
  }

  public async copy(request: IFormCopyRequest): Promise<IFormCopyResult> {
    const { formId, targetTeam, targetCompany } = request;
    const preview = request.preview !== false;

    if (!mongoose.isValidObjectId(formId)) {
      throw new Error(`formId inválido: "${formId}"`);
    }
    if (!mongoose.isValidObjectId(targetTeam)) {
      throw new Error(`targetTeam inválido: "${targetTeam}"`);
    }
    if (!mongoose.isValidObjectId(targetCompany)) {
      throw new Error(`targetCompany inválido: "${targetCompany}"`);
    }

    // El formulario origen se lee como objeto plano para poder mutarlo libremente.
    const source: any = await Form.findById(formId).lean();
    if (!source) {
      throw new Error(`No existe el formulario ${formId}`);
    }

    const [targetTeamDoc, targetCompanyDoc, sourceTeamDoc, sourceCompanyDoc] = await Promise.all([
      Team.findById(targetTeam, { name: true }).lean() as any,
      Company.findById(targetCompany, { name: true, team: true }).lean() as any,
      Team.findById(source.team, { name: true }).lean() as any,
      Company.findById(source.company, { name: true }).lean() as any
    ]);

    if (!targetTeamDoc) {
      throw new Error(`No existe el team destino ${targetTeam}`);
    }
    if (!targetCompanyDoc) {
      throw new Error(`No existe la company destino ${targetCompany}`);
    }
    // La company tiene que pertenecer al team destino, si no queda un
    // formulario cruzado que ninguna pantalla filtra bien.
    if (String(targetCompanyDoc.team) !== String(targetTeam)) {
      throw new Error(
        `La company "${targetCompanyDoc.name}" no pertenece al team "${targetTeamDoc.name}". ` +
        `Pertenece al team ${targetCompanyDoc.team}.`
      );
    }

    const plan: IFormCopyPlanEntry[] = [];
    const warnings: string[] = [];

    // Caches por id de origen: si dos questions comparten la misma Scale o el
    // mismo Damages, se resuelve una sola vez.
    const scaleMap = new Map<string, mongoose.Types.ObjectId | null>();
    const damagesMap = new Map<string, mongoose.Types.ObjectId | null>();
    const partMap = new Map<string, mongoose.Types.ObjectId | null>();
    const kindMap = new Map<string, mongoose.Types.ObjectId | null>();
    const positionMap = new Map<string, mongoose.Types.ObjectId | null>();

    const norm = (name: any): string => String(name == null ? '' : name).trim().toLowerCase();

    // Catálogos que YA existen en el destino, indexados por nombre normalizado.
    // Se cargan una sola vez: sin esto haría falta una query por referencia.
    const indexByName = (docs: any[]): Map<string, any> => {
      const m = new Map<string, any>();
      for (const d of docs) {
        const k = norm(d.name);
        // El primero gana: si el destino ya tiene duplicados, se reusa el más
        // viejo en vez de agregar otro.
        if (!m.has(k)) m.set(k, d);
      }
      return m;
    };

    const [targetScales, targetDamages, targetParts, targetKinds, targetPositions] = await Promise.all([
      Scale.find({ team: targetTeam, company: targetCompany }, { name: true }).lean(),
      Damages.find({ team: targetTeam }, { name: true }).lean(),
      Part.find({ team: targetTeam }, { name: true }).lean(),
      Kind.find({ team: targetTeam }, { name: true }).lean(),
      Position.find({ team: targetTeam }, { name: true }).lean()
    ]);

    const existing = {
      Scale: indexByName(targetScales),
      Damages: indexByName(targetDamages),
      Part: indexByName(targetParts),
      Kind: indexByName(targetKinds),
      Position: indexByName(targetPositions)
    };

    const resolveSimpleCatalog = async (
      model: any,
      collection: 'Part' | 'Kind' | 'Position',
      cache: Map<string, mongoose.Types.ObjectId | null>,
      sourceId: any
    ): Promise<mongoose.Types.ObjectId | null> => {
      if (!sourceId) return null;
      const key = String(sourceId);
      if (cache.has(key)) return cache.get(key)!;

      const doc: any = await model.findById(key).lean();
      if (!doc) {
        plan.push({ collection, name: `(${key})`, action: 'missing-source', sourceId: key });
        warnings.push(`${collection} ${key} referenciado no existe en el origen; queda sin copiar.`);
        cache.set(key, null);
        return null;
      }

      const match = existing[collection].get(norm(doc.name));
      if (match) {
        plan.push({
          collection, name: doc.name, action: 'reuse',
          sourceId: key, targetId: String(match._id)
        });
        cache.set(key, match._id);
        return match._id;
      }

      plan.push({ collection, name: doc.name, action: 'create', sourceId: key });
      if (preview) {
        // En preview no se escribe: se devuelve el id de origen solo para poder
        // seguir armando el plan. Nunca se persiste.
        cache.set(key, doc._id);
        return doc._id;
      }

      const created = await new model({ name: doc.name, team: targetTeam }).save();
      // Queda disponible para las próximas referencias de esta misma copia.
      existing[collection].set(norm(doc.name), created);
      cache.set(key, created._id);
      return created._id;
    };

    const resolveScale = async (sourceId: any): Promise<mongoose.Types.ObjectId | null> => {
      if (!sourceId) return null;
      const key = String(sourceId);
      if (scaleMap.has(key)) return scaleMap.get(key)!;

      const doc: any = await Scale.findById(key).lean();
      if (!doc) {
        plan.push({ collection: 'Scale', name: `(${key})`, action: 'missing-source', sourceId: key });
        warnings.push(`Scale ${key} referenciada no existe en el origen; la question queda sin escala.`);
        scaleMap.set(key, null);
        return null;
      }

      const match = existing.Scale.get(norm(doc.name));
      if (match) {
        plan.push({
          collection: 'Scale', name: doc.name, action: 'reuse',
          sourceId: key, targetId: String(match._id)
        });
        scaleMap.set(key, match._id);
        return match._id;
      }

      plan.push({ collection: 'Scale', name: doc.name, action: 'create', sourceId: key });
      if (preview) {
        scaleMap.set(key, doc._id);
        return doc._id;
      }

      const created = await new Scale({
        name: doc.name,
        team: targetTeam,
        company: targetCompany,
        minValue: doc.minValue,
        maxValue: doc.maxValue,
        // choices son subdocumentos: se copian tal cual, con sus _id.
        choices: doc.choices,
        active: doc.active
      }).save();
      existing.Scale.set(norm(doc.name), created);
      scaleMap.set(key, created._id);
      return created._id;
    };

    const resolveDamages = async (sourceId: any): Promise<mongoose.Types.ObjectId | null> => {
      if (!sourceId) return null;
      const key = String(sourceId);
      if (damagesMap.has(key)) return damagesMap.get(key)!;

      const doc: any = await Damages.findById(key).lean();
      if (!doc) {
        plan.push({ collection: 'Damages', name: `(${key})`, action: 'missing-source', sourceId: key });
        warnings.push(`Damages ${key} referenciado no existe en el origen; la question queda sin daños.`);
        damagesMap.set(key, null);
        return null;
      }

      // Si el destino ya tiene un catálogo con ese nombre, se usa tal cual y NO
      // se recorre su árbol: sus parts/kinds/positions ya son los del destino.
      // Esto es lo que evita clonar más de 100 documentos por copia.
      const matchDamages = existing.Damages.get(norm(doc.name));
      if (matchDamages) {
        plan.push({
          collection: 'Damages', name: doc.name, action: 'reuse',
          sourceId: key, targetId: String(matchDamages._id),
          note: 'se reusa el catálogo del destino con sus partes, tipos y posiciones'
        });
        damagesMap.set(key, matchDamages._id);
        return matchDamages._id;
      }

      plan.push({ collection: 'Damages', name: doc.name, action: 'create', sourceId: key });

      // Hay que crear el catálogo: sus hijos se resuelven uno a uno, reusando
      // los que ya existan en el destino.
      const parts = [];
      for (const p of (doc.parts || [])) {
        const mapped = await resolveSimpleCatalog(Part, 'Part', partMap, p);
        if (mapped) parts.push(mapped);
      }
      const kinds = [];
      for (const k of (doc.kinds || [])) {
        const mapped = await resolveSimpleCatalog(Kind, 'Kind', kindMap, k);
        if (mapped) kinds.push(mapped);
      }
      const positions = [];
      for (const p of (doc.positions || [])) {
        const mapped = await resolveSimpleCatalog(Position, 'Position', positionMap, p);
        if (mapped) positions.push(mapped);
      }
      const partFallback = await resolveSimpleCatalog(Part, 'Part', partMap, doc.partFallback);
      const kindFallback = await resolveSimpleCatalog(Kind, 'Kind', kindMap, doc.kindFallback);

      if (preview) {
        damagesMap.set(key, doc._id);
        return doc._id;
      }

      const created = await new Damages({
        name: doc.name,
        team: targetTeam,
        parts,
        kinds,
        positions,
        partFallback,
        kindFallback,
        severityOptions: doc.severityOptions
      }).save();
      existing.Damages.set(norm(doc.name), created);
      damagesMap.set(key, created._id);
      return created._id;
    };

    // ------------------------------------------------------------------
    // Recorrer sections/questions remapeando referencias
    // ------------------------------------------------------------------
    let questionCount = 0;
    for (const section of (source.sections || [])) {
      for (const question of (section.questions || [])) {
        questionCount++;
        if (question.scale) {
          question.scale = await resolveScale(question.scale);
        }
        if (question.damages) {
          question.damages = await resolveDamages(question.damages);
        }
        // matrix.questions[].images son ParticipantFile: datos de respuesta.
        if (question.matrix?.questions?.length) {
          for (const matrixQuestion of question.matrix.questions) {
            if (matrixQuestion.images?.length) {
              matrixQuestion.images = [];
            }
            if (matrixQuestion.value) {
              matrixQuestion.value = undefined;
            }
          }
        }
      }
    }

    // ------------------------------------------------------------------
    // Triggers: quedan tal cual, pero avisamos de lo que no se puede remapear
    // ------------------------------------------------------------------
    for (const trigger of (source.triggers || [])) {
      const config = trigger.config || {};
      if (config.requestItemStatus) {
        warnings.push(
          `Trigger "${trigger.name}": config.requestItemStatus (${config.requestItemStatus}) apunta a un ` +
          `RequestItemStatus del team origen. Revisar a mano en el destino.`
        );
      }
      if (config.transmittalTypes?.length) {
        warnings.push(
          `Trigger "${trigger.name}": config.transmittalTypes tiene ${config.transmittalTypes.length} ` +
          `referencia(s) del team origen. Revisar a mano en el destino.`
        );
      }
      if (config.signature) {
        warnings.push(
          `Trigger "${trigger.name}": config.signature (${config.signature}) apunta a un archivo del origen. ` +
          `Revisar a mano en el destino.`
        );
      }
    }

    const result: IFormCopyResult = {
      preview,
      source: {
        formId: String(source._id),
        name: source.name,
        kind: source.kind,
        team: String(source.team),
        teamName: sourceTeamDoc?.name,
        company: String(source.company),
        companyName: sourceCompanyDoc?.name,
        sections: (source.sections || []).length,
        questions: questionCount,
        triggers: (source.triggers || []).length
      },
      target: {
        team: String(targetTeam),
        teamName: targetTeamDoc.name,
        company: String(targetCompany),
        companyName: targetCompanyDoc.name,
        name: request.name?.trim() || source.name
      },
      plan,
      warnings
    };

    if (preview) {
      return result;
    }

    // ------------------------------------------------------------------
    // Crear el formulario. Se preservan los _id embebidos (ver cabecera) y se
    // descartan solo los campos propios del documento origen.
    // ------------------------------------------------------------------
    delete source._id;
    delete source.__v;
    delete source.createdAt;
    delete source.updatedAt;

    const created: IFormModel = await new Form({
      ...source,
      name: result.target.name,
      team: targetTeam,
      company: targetCompany
    }).save();

    result.createdFormId = String(created._id);
    logger.info(
      `FormCopyService: formulario ${formId} copiado a ${created._id} ` +
      `(team ${targetTeam} / company ${targetCompany}), ${plan.length} referencias creadas`
    );

    return result;
  }
}

export default new FormCopyService();
