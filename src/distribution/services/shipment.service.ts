import { ChoicesStatusShipment, ChoicesStatusShipmentItem } from '../models/shipment.types';
import Shipment, { IShipmentModel } from '../models/shipment.model';

import Car from '../../app/models/car.model';
import Form from '../../form/models/form.model';
import ShipmentItem, { IShipmentItemModel } from '../models/shipmentItem.model';
import logger from '../../services/logger.service';

/**
 * Reglas del Envío de unidades. Viven acá y no en el controller porque las dos
 * reglas de exclusión (R2 y R3) tienen que ser atómicas: validar y después
 * escribir deja pasar dos requests simultáneas, y en el patio hay varios
 * operarios cargando a la vez.
 *
 * Ver docs/envio-de-unidades/02-technical-plan.md §3.
 */

/** Códigos que la app distingue para mostrar un mensaje accionable. */
export enum ShipmentErrorCode {
  unitAlreadyLoaded = 'UNIT_ALREADY_LOADED',
  unitOtherClient = 'UNIT_OTHER_CLIENT',
  unitAlreadyDispatched = 'UNIT_ALREADY_DISPATCHED',
  unitNotFound = 'UNIT_NOT_FOUND',
  plateOtherClient = 'PLATE_OTHER_CLIENT',
  shipmentClosed = 'SHIPMENT_CLOSED',
  shipmentCancelled = 'SHIPMENT_CANCELLED',
  formsNotConfigured = 'FORMS_NOT_CONFIGURED'
}

export class ShipmentError extends Error {
  public readonly code: ShipmentErrorCode;
  public readonly status: number;
  public readonly details: any;

  constructor(code: ShipmentErrorCode, message: string, status = 409, details: any = {}) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * Patente normalizada: sin espacios ni guiones, en mayúsculas. "ab-12 cd" y
 * "AB12CD" tienen que resolver al mismo camión.
 */
export function normalizePlate(plate: string): string {
  return String(plate || '').replace(/[\s-]/g, '').toUpperCase().trim();
}

class ShipmentService {
  constructor() {
    this.findOpenByPlate = this.findOpenByPlate.bind(this);
    this.create = this.create.bind(this);
    this.claimUnit = this.claimUnit.bind(this);
    this.removeUnit = this.removeUnit.bind(this);
    this.resolveForms = this.resolveForms.bind(this);
  }

  /**
   * Formularios configurables por etapa, resueltos por kind — mismo patrón que
   * usa billing para los aforos. Editar el formulario desde el admin cambia lo
   * que pide la app en el envío siguiente, sin desplegar.
   */
  public async resolveForms(team: any, handlerCompany: any): Promise<{ unitForm: any; departureForm: any }> {
    const [unitForm, departureForm] = await Promise.all([
      Form.findOne({ team, company: handlerCompany, kind: 'shipmentUnit', active: true }, { _id: 1 }).lean(),
      Form.findOne({ team, company: handlerCompany, kind: 'shipmentDeparture', active: true }, { _id: 1 }).lean()
    ]);

    if (!unitForm || !departureForm) {
      throw new ShipmentError(
        ShipmentErrorCode.formsNotConfigured,
        'Faltan configurar los formularios de envío para esta company.',
        400,
        { unitForm: !!unitForm, departureForm: !!departureForm }
      );
    }
    return { unitForm: (unitForm as any)._id, departureForm: (departureForm as any)._id };
  }

  /** Envío abierto de una patente, o null. No crea nada (R1). */
  public async findOpenByPlate(team: any, plate: string): Promise<IShipmentModel | null> {
    return Shipment.findOne({
      team,
      plate: normalizePlate(plate),
      status: ChoicesStatusShipment.open
    });
  }

  /**
   * Crea el envío. Si ya hay uno abierto para esa patente lo devuelve, y si es
   * de otro cliente rechaza (R2) — la decisión nunca queda del lado del cliente.
   */
  public async create(params: {
    team: any;
    handlerCompany: any;
    clientCompany: any;
    plate: string;
    transporter?: any;
    venue?: any;
    createdBy: any;
  }): Promise<{ shipment: IShipmentModel; created: boolean }> {
    const plate = normalizePlate(params.plate);
    const existing = await this.findOpenByPlate(params.team, plate);

    if (existing) {
      this.assertSameClient(existing, params.clientCompany);
      return { shipment: existing, created: false };
    }

    const forms = await this.resolveForms(params.team, params.handlerCompany);

    const shipment = await new Shipment({
      team: params.team,
      handlerCompany: params.handlerCompany,
      clientCompany: params.clientCompany,
      plate,
      transporter: params.transporter || {},
      venue: params.venue,
      unitForm: forms.unitForm,
      departureForm: forms.departureForm,
      createdBy: params.createdBy,
      status: ChoicesStatusShipment.open,
      itemsEverLoaded: 0
    }).save();

    logger.info(
      `ShipmentService.create: envío ${shipment._id} patente ${plate} ` +
      `cliente ${params.clientCompany} por ${params.createdBy}`
    );
    return { shipment, created: true };
  }

  /**
   * Reclama una unidad para el envío (R3). Llamada chica y online: es el único
   * paso que necesita señal, porque la exclusión no se puede decidir offline.
   *
   * El orden importa: primero se valida la elegibilidad del auto, y recién
   * después se intenta la escritura, que es la que realmente excluye. Si dos
   * operarios llegan juntos, el índice único parcial deja pasar a uno solo y el
   * otro recibe 11000, que acá se traduce a UNIT_ALREADY_LOADED.
   */
  public async claimUnit(params: {
    shipment: IShipmentModel;
    vin: string;
    user: any;
  }): Promise<IShipmentItemModel> {
    const { shipment, vin, user } = params;
    this.assertOpen(shipment);

    // Elegibilidad (§3.c): la unidad es del cliente del camión y sigue en manos
    // de este handler. Una unidad ya despachada no tiene handlerCompany, así
    // que no matchea y no se puede volver a enviar.
    const car: any = await Car.findOne({
      vin: String(vin || '').trim().toUpperCase(),
      company: shipment.clientCompany,
      handlerCompany: shipment.handlerCompany
    }, { _id: 1, vin: 1, brand: 1, denomination: 1, model: 1, company: 1, handlerCompany: 1 }).lean();

    if (!car) {
      await this.explainIneligibleUnit(vin, shipment);
    }

    try {
      const item = await new ShipmentItem({
        shipment: shipment._id,
        team: shipment.team,
        car: car._id,
        status: ChoicesStatusShipmentItem.loaded,
        loadedBy: user._id,
        loadedAt: new Date()
      }).save();

      await Shipment.updateOne({ _id: shipment._id }, { $inc: { itemsEverLoaded: 1 } });

      logger.info(
        `ShipmentService.claimUnit: ${car.vin} -> envío ${shipment._id} ` +
        `(patente ${shipment.plate}) por ${user.email}`
      );
      return item;
    } catch (e: any) {
      if (e?.code === 11000) {
        // El índice hizo su trabajo. Averiguar el detalle es "nice to have":
        // si esa consulta falla, igual hay que devolver un 409 claro y no un
        // 500 — el operario tiene el auto delante.
        let described: ShipmentError;
        try {
          described = await this.describeConflict(car, shipment, user);
        } catch (inner: any) {
          logger.error(`ShipmentService.claimUnit: no se pudo describir el conflicto: ${inner?.message}`);
          described = new ShipmentError(
            ShipmentErrorCode.unitAlreadyLoaded,
            'Esta unidad ya está cargada en otro camión.',
            409,
            { vin: car.vin }
          );
        }
        throw described;
      }
      throw e;
    }
  }

  /**
   * Baja lógica de una unidad (R7): nunca se borra, queda quién la bajó. Pasar
   * a `removed` saca la fila del índice único parcial, así que la unidad queda
   * disponible al instante para otro camión.
   *
   * Si era la última que quedaba cargada y el envío llegó a tener unidades, el
   * envío se cancela (R8).
   */
  public async removeUnit(params: {
    shipment: IShipmentModel;
    itemId: any;
    user: any;
  }): Promise<{ item: IShipmentItemModel; shipmentCancelled: boolean }> {
    const { shipment, itemId, user } = params;
    this.assertOpen(shipment);

    const item = await ShipmentItem.findOneAndUpdate(
      {
        _id: itemId,
        shipment: shipment._id,
        status: ChoicesStatusShipmentItem.loaded
      },
      {
        $set: {
          status: ChoicesStatusShipmentItem.removed,
          removedAt: new Date(),
          removedBy: user._id
        }
      },
      { new: true }
    );

    if (!item) {
      throw new ShipmentError(
        ShipmentErrorCode.unitNotFound,
        'La unidad no está cargada en este camión.',
        404
      );
    }

    const stillLoaded = await ShipmentItem.countDocuments({
      shipment: shipment._id,
      status: ChoicesStatusShipmentItem.loaded
    });

    let shipmentCancelled = false;
    if (stillLoaded === 0 && (shipment.itemsEverLoaded || 0) > 0) {
      await Shipment.updateOne(
        { _id: shipment._id, status: ChoicesStatusShipment.open },
        { $set: { status: ChoicesStatusShipment.cancelled, cancelledAt: new Date() } }
      );
      shipmentCancelled = true;
      logger.info(`ShipmentService.removeUnit: envío ${shipment._id} cancelado, se bajaron todas las unidades`);
    }

    logger.info(
      `ShipmentService.removeUnit: item ${itemId} del envío ${shipment._id} bajado por ${user.email}`
    );
    return { item, shipmentCancelled };
  }

  // ---------------------------------------------------------------- helpers

  private assertOpen(shipment: IShipmentModel): void {
    if (shipment.status === ChoicesStatusShipment.shipped) {
      throw new ShipmentError(
        ShipmentErrorCode.shipmentClosed,
        'El camión ya salió: no se puede modificar.',
        409,
        { shippedAt: shipment.shippedAt }
      );
    }
    if (shipment.status === ChoicesStatusShipment.cancelled) {
      throw new ShipmentError(
        ShipmentErrorCode.shipmentCancelled,
        'El envío fue cancelado.',
        409,
        { cancelledAt: shipment.cancelledAt }
      );
    }
  }

  private assertSameClient(shipment: IShipmentModel, clientCompany: any): void {
    if (String(shipment.clientCompany) !== String(clientCompany)) {
      throw new ShipmentError(
        ShipmentErrorCode.plateOtherClient,
        'Esa patente ya está cargando para otro cliente.',
        409,
        { clientCompany: shipment.clientCompany, shipmentId: shipment._id }
      );
    }
  }

  /**
   * El auto no pasó el filtro de elegibilidad. Se averigua por qué para dar un
   * mensaje útil en vez de un "no encontrado" genérico — el operario tiene el
   * auto delante y necesita saber qué hacer con él.
   */
  private async explainIneligibleUnit(vin: string, shipment: IShipmentModel): Promise<never> {
    const anyCar: any = await Car.findOne(
      { vin: String(vin || '').trim().toUpperCase() },
      { _id: 1, vin: 1, company: 1, handlerCompany: 1 }
    ).populate([{ path: 'company', select: ['name'] }]).lean();

    if (!anyCar) {
      throw new ShipmentError(
        ShipmentErrorCode.unitNotFound,
        `No existe ninguna unidad con VIN ${vin}.`,
        404,
        { vin }
      );
    }
    if (String(anyCar.company?._id ?? anyCar.company) !== String(shipment.clientCompany)) {
      throw new ShipmentError(
        ShipmentErrorCode.unitOtherClient,
        `Esta unidad es de ${anyCar.company?.name ?? 'otro cliente'}. El camión está cargando para otro cliente.`,
        409,
        { vin, company: anyCar.company }
      );
    }
    // Es del cliente correcto pero ya no la tiene el handler: fue despachada.
    throw new ShipmentError(
      ShipmentErrorCode.unitAlreadyDispatched,
      'Esta unidad ya fue despachada y no está en poder del handler.',
      409,
      { vin }
    );
  }

  /**
   * Duplicate key al reclamar: la unidad ya está cargada en algún camión. Se
   * devuelve dónde y quién, porque la app lo necesita para distinguir dos casos
   * muy distintos:
   *  - la cargó otro  -> conflicto real, hay que avisarle al operario
   *  - la cargó él mismo en ESTE camión -> fue un reintento tras una respuesta
   *    perdida, y la app lo trata como éxito (ver 03-app-movil.md §3)
   */
  private async describeConflict(car: any, shipment: IShipmentModel, user: any): Promise<ShipmentError> {
    const existing: any = await ShipmentItem.findOne({
      car: car._id,
      status: ChoicesStatusShipmentItem.loaded
    })
      .populate([
        { path: 'shipment', select: ['plate', 'clientCompany'] },
        { path: 'loadedBy', select: ['firstName', 'lastName', 'email'] }
      ])
      .lean();

    if (!existing) {
      // Se liberó entre el fallo y esta consulta. Que la app reintente.
      return new ShipmentError(
        ShipmentErrorCode.unitAlreadyLoaded,
        'La unidad estaba siendo cargada por otro operario. Intentá de nuevo.',
        409,
        { vin: car.vin }
      );
    }

    const plate = existing.shipment?.plate;
    const by = existing.loadedBy;
    const byName = by ? `${by.firstName ?? ''} ${by.lastName ?? ''}`.trim() || by.email : 'otro operario';
    const sameShipment = String(existing.shipment?._id ?? existing.shipment) === String(shipment._id);
    const sameUser = String(by?._id ?? '') === String(user._id);

    return new ShipmentError(
      ShipmentErrorCode.unitAlreadyLoaded,
      sameShipment && sameUser
        ? 'Esta unidad ya la cargaste vos en este camión.'
        : `Esta unidad ya fue cargada en la patente ${plate} por ${byName}.`,
      409,
      {
        vin: car.vin,
        plate,
        shipmentId: existing.shipment?._id ?? existing.shipment,
        loadedBy: by ? { _id: by._id, name: byName } : undefined,
        // La app usa estos dos para decidir si fue un reintento propio.
        sameShipment,
        sameUser
      }
    );
  }
}

export default new ShipmentService();
