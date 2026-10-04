import * as mongoose from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';

import { ChoicesStatusShipment, choicesStatusShipment } from './shipment.types';
import { AggregatePaginateModel, PaginateModel } from 'mongoose';

import type { IShipment } from '../interfaces/shipment.interface';
import mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');

export interface IShipmentModel extends IShipment, mongoose.Document<any> { }

/**
 * Envío de unidades: un camión, identificado por su patente, cargado por una
 * company handler con unidades de UNA company cliente.
 *
 * Es un modelo aparte de Transmittal a propósito: aquel está atado a
 * request/requestItem y tiene otro ciclo de vida. Ver
 * docs/envio-de-unidades/02-technical-plan.md §1.
 */
const shipmentTransporterSchema = new mongoose.Schema({
  carrier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Carrier'
  },
  driverName: { type: String, trim: true },
  driverRut: { type: String, trim: true },
  phone: { type: String, trim: true }
}, {
  _id: false,
  timestamps: false
});

const shipmentSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  handlerCompany: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  // Una patente abierta pertenece a un solo cliente (R2).
  clientCompany: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  // Identifica el envío (R1). Se guarda normalizada: sin espacios ni guiones,
  // en mayúsculas, para que "ab-12 cd" y "AB12CD" sean el mismo camión.
  plate: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  transporter: {
    type: shipmentTransporterSchema,
    default: {}
  },
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue'
  },
  unitForm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form'
  },
  departureForm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form'
  },
  // Respuesta del formulario de salida. De acá salen el nombre del chofer y la
  // foto del camión que necesita la Tarja.
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant'
  },
  status: {
    type: String,
    enum: choicesStatusShipment,
    default: ChoicesStatusShipment.open
  },
  observation: { type: String, trim: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  shippedAt: { type: Date },
  shippedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: { type: Date },
  // Para no cancelar un envío que nunca tuvo unidades (R8).
  itemsEverLoaded: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Listado web, ordenado por fecha.
shipmentSchema.index({ team: 1, status: 1, createdAt: -1 });
// Vista del cliente: solo sus envíos.
shipmentSchema.index({ clientCompany: 1, createdAt: -1 });
// Buscar el envío abierto de una patente (R1). Sin esto el get-or-create
// recorre la colección en cada carga.
shipmentSchema.index({ plate: 1, status: 1 });
// Botón flotante de la app: camiones en curso del cliente, en la sucursal.
shipmentSchema.index({ clientCompany: 1, venue: 1, status: 1 });

shipmentSchema.plugin(mongoosePaginate);
shipmentSchema.plugin(mongooseAggregatePaginate);

export type ShipmentSchema =
  mongoose.Model<IShipmentModel>
  & PaginateModel<IShipmentModel>
  & AggregatePaginateModel<IShipmentModel>;

const Shipment = mongoose.model<IShipmentModel, ShipmentSchema>('Shipment', shipmentSchema);

export default Shipment;
