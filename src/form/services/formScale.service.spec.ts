import { expect } from 'chai';
import 'mocha';
import * as mongoose from 'mongoose';

import Scale from '../models/scale.model';
import formScaleService from './formScale.service';

const TEAM = new mongoose.Types.ObjectId();
const COMPANY = new mongoose.Types.ObjectId();

const yes = { choice: 'Sí', value: 1, backgroundColor: 'green' };
const no = { choice: 'No', value: 0, backgroundColor: 'red' };

function section(q: any) {
  return [{ name: 'S', questions: [{ question: '¿Q?', weight: 1, order: 1, ...q }] }];
}

function existingScale(choices: any[], extra: any = {}) {
  return {
    _id: new mongoose.Types.ObjectId(),
    name: choices.map((c) => c.choice).join(' / '),
    team: TEAM,
    company: COMPANY,
    minValue: 0,
    maxValue: 1,
    active: true,
    choices: choices.map((c, i) => ({ order: i + 1, ...c })),
    ...extra
  };
}

describe('formScale.service', () => {
  describe('validate', () => {
    it('acepta una scale con opciones válidas', () => {
      expect(formScaleService.validate(section({ kind: 'scale', scaleOptions: [yes, no] }))).to.deep.equal([]);
    });

    it('pide opciones a una scale sin escala ni scaleOptions', () => {
      const out = formScaleService.validate(section({ kind: 'scale' }));
      expect(out[0]).to.contain('no tiene opciones de respuesta');
    });

    it('exige puntaje mayor a 0 (el puntaje divide por maxValue)', () => {
      const out = formScaleService.validate(section({
        kind: 'scale', scaleOptions: [{ ...yes, value: 0 }, no]
      }));
      expect(out.join()).to.contain('puntaje mayor a 0');
    });

    it('no deja guardar un accessory que abre una lista vacía', () => {
      const out = formScaleService.validate(section({
        kind: 'accessory',
        scaleOptions: [yes, { ...no, requireAccesories: true }],
        accessories: { question: '¿Cuáles faltan?', items: [] }
      }));
      expect(out.join()).to.contain('"No" abre la lista de accesorios, pero la lista está vacía');
    });

    it('exige que alguna opción de un accessory abra la lista', () => {
      const out = formScaleService.validate(section({
        kind: 'accessory',
        scaleOptions: [yes, no],
        accessories: { question: '¿Cuáles faltan?', items: [{ item: 'Gata' }] }
      }));
      expect(out.join()).to.contain('ninguna opción abre la lista');
    });
  });

  describe('resolve', () => {
    const originalFind = Scale.find;
    const originalSave = Scale.prototype.save;
    let stored: any[];
    let saved: any[];

    beforeEach(() => {
      saved = [];
      (Scale as any).find = (filter: any) => ({
        lean: async () => (filter._id
          ? stored.filter((s) => filter._id.$in.map(String).includes(String(s._id)))
          : stored)
      });
      Scale.prototype.save = async function () {
        saved.push(this);
        return this;
      } as any;
    });

    afterEach(() => {
      (Scale as any).find = originalFind;
      Scale.prototype.save = originalSave;
    });

    it('deja la escala actual si las opciones no cambiaron', async () => {
      const current = existingScale([yes, no]);
      stored = [current];
      const sections = section({ kind: 'scale', scale: current._id, scaleOptions: [yes, no] });
      await formScaleService.resolve(sections, TEAM, COMPANY);
      expect(String(sections[0].questions[0].scale)).to.equal(String(current._id));
      expect(sections[0].questions[0]).to.not.have.property('scaleOptions');
      expect(saved).to.have.length(0);
    });

    it('deja una escala vieja con maxValue distinto si las opciones no cambiaron', async () => {
      const legacy = existingScale([yes, no], { maxValue: 5 });
      stored = [legacy];
      const sections = section({ kind: 'scale', scale: legacy._id, scaleOptions: [yes, no] });
      await formScaleService.resolve(sections, TEAM, COMPANY);
      expect(String(sections[0].questions[0].scale)).to.equal(String(legacy._id));
      expect(saved).to.have.length(0);
    });

    it('no reusa otra escala con mismas opciones pero distinto maxValue', async () => {
      stored = [existingScale([yes, no], { maxValue: 5 })];
      const sections = section({ kind: 'scale', scaleOptions: [yes, no] });
      await formScaleService.resolve(sections, TEAM, COMPANY);
      expect(saved).to.have.length(1);
    });

    it('reusa otra escala activa del team con las mismas opciones', async () => {
      const match = existingScale([yes, no]);
      stored = [match, existingScale([yes, no], { active: false })];
      const sections = section({ kind: 'scale', scaleOptions: [yes, no] });
      await formScaleService.resolve(sections, TEAM, COMPANY);
      expect(String(sections[0].questions[0].scale)).to.equal(String(match._id));
      expect(saved).to.have.length(0);
    });

    it('crea una escala nueva, sin tocar la actual, si cambió una opción', async () => {
      const current = existingScale([yes, no]);
      stored = [current];
      const sections = section({
        kind: 'scale', scale: current._id, scaleOptions: [yes, { ...no, requireComment: true }]
      });
      const created = await formScaleService.resolve(sections, TEAM, COMPANY);
      expect(saved).to.have.length(1);
      // Nombre único dentro del team/company: la copia entre teams busca por nombre.
      expect(created).to.deep.equal(['Sí / No (2)']);
      expect(saved[0].maxValue).to.equal(1);
      expect(saved[0].choices[1].requireComment).to.equal(true);
      expect(String(sections[0].questions[0].scale)).to.equal(String(saved[0]._id));
      expect(current.choices[1]).to.not.have.property('requireComment');
    });

    it('dos preguntas con las mismas opciones nuevas comparten una sola escala', async () => {
      stored = [];
      const sections = [{
        name: 'S',
        questions: [
          { question: 'A', kind: 'scale', scaleOptions: [yes, no] },
          { question: 'B', kind: 'scale', scaleOptions: [yes, no] }
        ]
      }];
      await formScaleService.resolve(sections, TEAM, COMPANY);
      expect(saved).to.have.length(1);
      expect(String(sections[0].questions[1].scale)).to.equal(String(sections[0].questions[0].scale));
    });

    it('descarta scaleOptions en preguntas que no son scale/accessory', async () => {
      stored = [];
      const sections = section({ kind: 'text', scaleOptions: [yes, no] });
      await formScaleService.resolve(sections, TEAM, COMPANY);
      expect(sections[0].questions[0]).to.not.have.property('scaleOptions');
      expect(saved).to.have.length(0);
    });
  });
});
