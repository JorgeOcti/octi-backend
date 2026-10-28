import * as mongoose from 'mongoose';

import { KindQuestion } from '../models/form.model';
import Scale, { choiceBackgroundColors } from '../models/scale.model';

/**
 * Opciones de respuesta inline para las preguntas `scale` y `accessory` del
 * editor de superadmin.
 *
 * En la app (andes-offline) ambas preguntas dibujan un botón por cada choice de
 * `question.scale` — `accessory` además abre la lista de accesorios en los
 * choices con `requireAccesories`. Si la pregunta no tiene escala, la app hace
 * `question.scale!` y el formulario se cae.
 *
 * Para que quien arma el formulario no tenga que entender ni elegir escalas, el
 * editor manda las opciones en `question.scaleOptions` y acá se traducen a una
 * Scale:
 *
 *  1. Si la escala actual de la pregunta tiene exactamente esas opciones, se
 *     deja como está (editar otra cosa del formulario no crea escalas).
 *  2. Si no, se busca una escala activa del team + company con exactamente esas
 *     opciones y se reusa.
 *  3. Si no hay, se crea una nueva.
 *
 * Una escala existente NUNCA se modifica: está compartida entre formularios, y
 * cambiarla cambiaría en silencio las preguntas de los otros. Los participants
 * guardan su propia copia de la escala, así que el historial no depende de esto.
 *
 * Si el save del formulario falla después de crear una escala, la escala queda
 * sin uso; el próximo intento la encuentra por sus opciones y la reusa.
 */

export interface IScaleOption {
  choice: string;
  value: number;
  backgroundColor: string;
  requireImage: boolean;
  requireComment: boolean;
  requireAccesories: boolean;
  requireConciliation: boolean;
  na: boolean;
}

const SCALE_KINDS: string[] = [KindQuestion.scale, KindQuestion.accessory];

function normalizeOption(o: any): IScaleOption {
  return {
    choice: String(o?.choice ?? '').trim(),
    value: Number(o?.value),
    backgroundColor: choiceBackgroundColors.includes(o?.backgroundColor) ? o.backgroundColor : 'blue',
    requireImage: !!o?.requireImage,
    requireComment: !!o?.requireComment,
    requireAccesories: !!o?.requireAccesories,
    requireConciliation: !!o?.requireConciliation,
    na: !!o?.na
  };
}

/**
 * El puntaje sale de `(100 / scale.maxValue) * choice.value`
 * (form.controller.ts), y las opciones N/A no puntúan: por eso el rango se
 * calcula solo con las que puntúan.
 */
function range(options: IScaleOption[]): { minValue: number; maxValue: number } {
  const values = options.filter((o) => !o.na).map((o) => o.value);
  if (!values.length) return { minValue: 0, maxValue: 0 };
  return { minValue: Math.min(...values), maxValue: Math.max(...values) };
}

function optionsSignature(options: IScaleOption[]): string {
  return JSON.stringify(options.map((o) => [
    o.choice, o.value, o.backgroundColor, o.requireImage, o.requireComment,
    o.requireAccesories, o.requireConciliation, o.na
  ]));
}

function signature(options: IScaleOption[], maxValue: number): string {
  return `${maxValue}|${optionsSignature(options)}`;
}

function sortedOptions(scale: any): IScaleOption[] {
  return [...(scale?.choices || [])]
    .sort((a: any, b: any) => a.order - b.order)
    .map(normalizeOption);
}

function scaleSignature(scale: any): string {
  return signature(sortedOptions(scale), scale.maxValue);
}

function questionsOf(sections: any[]): any[] {
  return (sections || []).reduce((out: any[], s: any) => out.concat(s?.questions || []), []);
}

class FormScaleService {
  /**
   * Chequeos en lenguaje simple de lo que hace caer la app o deja el puntaje
   * roto. El editor corre los mismos antes de mandar; esto cubre el modo JSON.
   */
  public validate(sections: any[]): string[] {
    const out: string[] = [];
    (sections || []).forEach((s: any, si: number) => {
      (s?.questions || []).forEach((q: any, qi: number) => {
        if (!SCALE_KINDS.includes(q?.kind)) return;
        const ql = `Sección ${si + 1} / pregunta ${qi + 1} ("${q.question || ''}")`;

        if (!Array.isArray(q.scaleOptions)) {
          if (!q.scale) out.push(`${ql}: no tiene opciones de respuesta.`);
          return;
        }

        const options = q.scaleOptions.map(normalizeOption);
        if (options.length < 2) out.push(`${ql}: necesita al menos 2 opciones de respuesta.`);
        options.forEach((o: IScaleOption, oi: number) => {
          if (!o.choice) out.push(`${ql}: la opción ${oi + 1} no tiene texto.`);
          if (!Number.isFinite(o.value)) out.push(`${ql}: la opción "${o.choice || oi + 1}" no tiene puntaje.`);
        });
        const seen = new Set<string>();
        options.forEach((o: IScaleOption) => {
          const key = o.choice.toLowerCase();
          if (key && seen.has(key)) out.push(`${ql}: la opción "${o.choice}" está repetida.`);
          seen.add(key);
        });
        if (options.length >= 2 && range(options).maxValue <= 0) {
          out.push(`${ql}: al menos una opción (que no sea N/A) tiene que tener puntaje mayor a 0.`);
        }

        if (q.kind === KindQuestion.accessory) {
          const opener = options.find((o: IScaleOption) => o.requireAccesories);
          if (!opener) {
            out.push(`${ql}: ninguna opción abre la lista de accesorios.`);
          }
          if (!q.accessories?.question || !String(q.accessories.question).trim()) {
            out.push(`${ql}: falta la pregunta de la lista de accesorios.`);
          }
          const items = (q.accessories?.items || []).filter((it: any) => it?.item && String(it.item).trim());
          if (!items.length) {
            out.push(
              opener
                ? `${ql}: la opción "${opener.choice}" abre la lista de accesorios, pero la lista está vacía.`
                : `${ql}: la lista de accesorios está vacía.`
            );
          }
        }
      });
    });
    return out;
  }

  /**
   * Reemplaza `scaleOptions` por `scale` en cada pregunta (muta `sections`).
   * Devuelve los nombres de las escalas creadas, para el log.
   */
  public async resolve(sections: any[], team: any, company: any): Promise<string[]> {
    const questions = questionsOf(sections);
    const pending = questions.filter((q) => SCALE_KINDS.includes(q?.kind) && Array.isArray(q.scaleOptions));
    // `scaleOptions` es solo del editor: nunca se guarda (y una pregunta que
    // dejó de ser scale/accessory conserva su `scale` como antes).
    questions.forEach((q) => {
      if (!pending.includes(q)) delete q.scaleOptions;
    });
    if (!pending.length) return [];

    const currentIds = pending
      .map((q) => q.scale)
      .filter((id) => id && mongoose.Types.ObjectId.isValid(String(id)));
    const [teamScales, currentScales] = await Promise.all([
      Scale.find({ team, company }).lean(),
      Scale.find({ _id: { $in: currentIds } }).lean()
    ]);

    const byId = new Map<string, any>();
    [...teamScales, ...currentScales].forEach((s: any) => byId.set(String(s._id), s));
    const bySignature = new Map<string, any>();
    teamScales
      .filter((s: any) => s.active !== false)
      .forEach((s: any) => {
        const sig = scaleSignature(s);
        if (!bySignature.has(sig)) bySignature.set(sig, s);
      });
    // Nombres únicos dentro del team + company: copiar un formulario a otro
    // team busca las escalas por nombre (formCopy.service.ts).
    const names = new Set<string>(teamScales.map((s: any) => String(s.name || '').trim().toLowerCase()));

    const created: string[] = [];
    for (const q of pending) {
      const options: IScaleOption[] = q.scaleOptions.map(normalizeOption);
      const { minValue, maxValue } = range(options);
      const sig = signature(options, maxValue);
      delete q.scaleOptions;

      // Contra la escala actual se comparan solo las opciones: hay escalas viejas
      // cuyo maxValue no es el máximo de sus valores, y guardar el formulario sin
      // tocar la pregunta no debe crear otra escala ni cambiarle el puntaje.
      const current = q.scale ? byId.get(String(q.scale)) : null;
      if (current && optionsSignature(sortedOptions(current)) === optionsSignature(options)) continue;

      const match = bySignature.get(sig);
      if (match) {
        q.scale = match._id;
        continue;
      }

      const base = options.map((o) => o.choice).join(' / ').slice(0, 80);
      let name = base;
      for (let i = 2; names.has(name.toLowerCase()); i++) name = `${base} (${i})`;
      names.add(name.toLowerCase());

      const scale: any = await new Scale({
        name,
        team,
        company,
        minValue,
        maxValue,
        choices: options.map((o, i) => ({ ...o, order: i + 1 })),
        active: true
      }).save();
      bySignature.set(sig, scale);
      byId.set(String(scale._id), scale);
      q.scale = scale._id;
      created.push(name);
    }
    return created;
  }

  /** Opciones de una escala existente, en el formato de `scaleOptions`. */
  public optionsOf(scale: any): IScaleOption[] {
    return sortedOptions(scale);
  }
}

export default new FormScaleService();
