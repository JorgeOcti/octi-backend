import * as mongoose from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';

import { ChoicesStatusShipmentItem, choicesStatusShipmentItem } from './shipment.types';
import { AggregatePaginateModel, PaginateModel } from 'mongoose';

import type { IShipmentItem } from '../interfaces/shipment.interface';
import mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');

export interface IShipmentItemModel extends IShipmentItem, mongoose.Document<any> { }

const shipmentItemSchema = new mongoose.Schema({
  shipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shipment',
    required: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: true
  },
  // Respuesta del formulario de la unidad. Llega después del reclamo: el
  // formulario viaja por la vía encolada de la app.
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant'
  },
  /**
   * Mientras es true, esta unidad no puede estar en ningún otro camión. Lo
   * hace cumplir el índice único parcial de abajo; no es un flag informativo.
   */
  holdsLock: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: choicesStatusShipmentItem,
    default: ChoicesStatusShipmentItem.loaded
  },
  loadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  loadedAt: {
    type: Date,
    default: Date.now
  },
  // Baja lógica (R7): el registro de quién bajó la unidad nunca se borra.
  removedAt: { type: Date },
  removedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Detalle del envío / fila expandible.
shipmentItemSchema.index({ shipment: 1 });
// Historial de la unidad: en qué camiones estuvo.
shipmentItemSchema.index({ car: 1 });

/**
 * R3 — una unidad no puede estar cargada en dos camiones a la vez.
 *
 * La exclusión la garantiza el motor, no una validación previa: validar y
 * después escribir deja pasar dos requests simultáneas.
 *
 * El candado se expresa con `holdsLock` y no con el status porque tiene que
 * cubrir DOS estados: `claiming` (reservada, con el formulario pendiente) y
 * `loaded`. Un `partialFilterExpression` con `$in` sería lo natural, pero
 * DocDB lo rechaza —probado: "unsupported expression in partial index : $in"—
 * mientras que una igualdad booleana la acepta sin problema.
 *
 * Pasar a `removed` o `shipped` pone `holdsLock` en false y libera la unidad
 * sin borrar el registro.
 *
 * (No usar `sparse` con un campo centinela: `sparse` ignora el campo ausente
 * pero NO los `null`, y dos `null` colisionan.)
 */
shipmentItemSchema.index(
  { car: 1 },
  {
    unique: true,
    partialFilterExpression: { holdsLock: true },
    name: 'car_holds_lock_unique'
  }
);

shipmentItemSchema.plugin(mongoosePaginate);
shipmentItemSchema.plugin(mongooseAggregatePaginate);

export type ShipmentItemSchema =
  mongoose.Model<IShipmentItemModel>
  & PaginateModel<IShipmentItemModel>
  & AggregatePaginateModel<IShipmentItemModel>;

const ShipmentItem = mongoose.model<IShipmentItemModel, ShipmentItemSchema>(
  'ShipmentItem',
  shipmentItemSchema
);

export default ShipmentItem;
