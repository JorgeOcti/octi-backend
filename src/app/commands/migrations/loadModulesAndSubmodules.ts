/*import { ModuleHistory } from '../../../app/models/history.types';*/
import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
/*import Module from '../../../billing/models/module.model';
import Submodule from '../../../billing/models/submodule.model';*/
import BillingTeamQueue from "../../../billing/tasks/billingTeam.task";

// node dist/app/commands/migrations/loadModulesAndSubmodules.js

async function loadModulesAndSubmodules() {

  dotenv.config({
    path: path.join(__dirname, '../../../.env')
  });
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  (mongoose as any).Promise = bluebird;
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  mongoose.set('debug', true);
  try {
    /*let module;
    module = await Module.findOneAndUpdate({ name: 'Control de Stock' }, { name: 'Control de Stock' }, { upsert: true, new: true });
    await Submodule.findOneAndUpdate({
      name: 'Control de Unidad',
      module: module._id,
      type: ModuleHistory.form
    }, {
      name: 'Control de Unidad',
      module: module._id,
      type: ModuleHistory.form
    }, { upsert: true, new: true });
    await Submodule.findOneAndUpdate({
      name: 'Inventario',
      module: module._id,
      type: ModuleHistory.inventory
    }, {
      name: 'Inventario',
      module: module._id,
      type: ModuleHistory.inventory
    }, { upsert: true, new: true });
    await Submodule.findOneAndUpdate({
      name: 'Acta de Entrega',
      module: module._id,
      type: ModuleHistory.deliveryCertificate
    }, {
      name: 'Acta de Entrega',
      module: module._id,
      type: ModuleHistory.deliveryCertificate
    }, { upsert: true, new: true });
    module = await Module.findOneAndUpdate({ name: 'Distribución' }, { name: 'Distribución' }, { upsert: true, new: true });
    await Submodule.findOneAndUpdate({
      name: 'Solicitudes',
      module: module._id,
      type: ModuleHistory.request
    }, {
      name: 'Solicitudes',
      module: module._id,
      type: ModuleHistory.request
    }, { upsert: true, new: true });
    await Submodule.findOneAndUpdate({
      name: 'Agendamiento',
      module: module._id,
      type: ModuleHistory.scheduling
    }, {
      name: 'Agendamiento',
      module: module._id,
      type: ModuleHistory.scheduling
    }, { upsert: true, new: true });
    await Submodule.findOneAndUpdate({
      name: 'Asignaciones',
      module: module._id,
      type: ModuleHistory.assignment
    }, {
      name: 'Asignaciones',
      module: module._id,
      type: ModuleHistory.assignment
    }, { upsert: true, new: true });
    await Submodule.findOneAndUpdate({
      name: 'Transporte',
      module: module._id,
      type: ModuleHistory.transportation
    }, {
      name: 'Transporte',
      module: module._id,
      type: ModuleHistory.transportation
    }, { upsert: true, new: true });*/
    await new BillingTeamQueue().processBilling({

    }, true);
    process.exit(1);
  } catch (e) {
    console.log('Ha ocurrido un error en loadModulesAndSubmodules');
    console.log('error:', e);
  }
  // process.exit(1);
}

loadModulesAndSubmodules();
