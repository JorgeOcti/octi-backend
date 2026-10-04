import { Response } from 'express';

import { ChoicesStatusShipment, ChoicesStatusShipmentItem } from '../models/shipment.types';
import { ShipmentError, normalizePlate } from '../services/shipment.service';

import Car from '../../app/models/car.model';
import History from '../../app/models/history.model';
import { IRequest } from '../../interfaces/global.interface';
import { ModuleHistory } from '../../app/models/history.types';
import Shipment from '../models/shipment.model';
import ShipmentItem from '../models/shipmentItem.model';
import { StatusHistory } from '../../app/models/history.types';
import logger from '../../services/logger.service';
import shipmentService from '../services/shipment.service';

/**
 * Envío de unidades. Endpoints /api/v1 para la app (carga en patio) y los de
 * sesión para la web (listado, detalle, Tarja).
 *
 * Las reglas viven en shipment.service.ts; acá solo se traduce HTTP.
 * Ver docs/envio-de-unidades/.
 */
class ShipmentController {
  constructor() {
    this.apiOpenByPlate = this.apiOpenByPlate.bind(this);
    this.apiListOpen = this.apiListOpen.bind(this);
    this.apiCreate = this.apiCreate.bind(this);
    this.apiDetail = this.apiDetail.bind(this);
    this.apiClaimUnit = this.apiClaimUnit.bind(this);
    this.apiRemoveUnit = this.apiRemoveUnit.bind(this);
    this.apiDepart = this.apiDepart.bind(this);
  }

  // =========================================================== app (/api/v1)

  /** Patentes en curso del cliente elegido, en la sucursal del operario. */
  public async apiListOpen(req: IRequest, res: Response): Promise<any> {
    const { clientCompany, venue } = req.query as Record<string, string>;
    try {
      const filter: any = {
        team: req.user.team._id,
        handlerCompany: req.user.company._id,
        status: ChoicesStatusShipment.open
      };
      if (clientCompany) filter.clientCompany = clientCompany;
      if (venue) filter.venue = venue;

      const shipments = await Shipment.find(filter)
        .populate([{ path: 'clientCompany', select: ['name'] }, { path: 'venue', select: ['name'] }])
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

      // El contador de unidades se resuelve en una sola consulta agrupada, no
      // una por envío.
      const counts = await ShipmentItem.aggregate([
        { $match: { shipment: { $in: shipments.map((s: any) => s._id) }, status: ChoicesStatusShipmentItem.loaded } },
        { $group: { _id: '$shipment', n: { $sum: 1 } } }
      ]);
      const byShipment = new Map(counts.map((c: any) => [String(c._id), c.n]));

      return res.json({
        results: shipments.map((s: any) => ({
          _id: s._id,
          plate: s.plate,
          clientCompany: s.clientCompany,
          venue: s.venue,
          transporter: s.transporter,
          units: byShipment.get(String(s._id)) || 0,
          createdAt: s.createdAt
        })),
        status: 200
      });
    } catch (e) {
      return this.fail(res, e, 'apiListOpen', req);
    }
  }

  /** Envío abierto de una patente. 404 si no hay — no crea nada. */
  public async apiOpenByPlate(req: IRequest, res: Response): Promise<any> {
    try {
      const shipment = await shipmentService.findOpenByPlate(req.user.team._id, req.params.plate);
      if (!shipment) {
        return res.status(404).json({
          message: `No hay ningún camión abierto con la patente ${normalizePlate(req.params.plate)}.`,
          status: 404
        });
      }
      return res.json({ ...(await this.detailPayload(shipment)), status: 200 });
    } catch (e) {
      return this.fail(res, e, 'apiOpenByPlate', req);
    }
  }

  /** Crea el envío (o devuelve el abierto de esa patente, validando el cliente). */
  public async apiCreate(req: IRequest, res: Response): Promise<any> {
    const { plate, clientCompany, transporter, venue } = req.body;
    try {
      if (!plate || !clientCompany) {
        return res.status(400).json({ message: 'Faltan la patente y la company cliente.', status: 400 });
      }
      const { shipment, created } = await shipmentService.create({
        team: req.user.team._id,
        handlerCompany: req.user.company._id,
        clientCompany,
        plate,
        transporter,
        venue: venue || req.user.venue?._id,
        createdBy: req.user._id
      });
      return res.status(created ? 201 : 200).json({
        ...(await this.detailPayload(shipment)),
        created,
        status: created ? 201 : 200
      });
    } catch (e) {
      return this.fail(res, e, 'apiCreate', req);
    }
  }

  public async apiDetail(req: IRequest, res: Response): Promise<any> {
    try {
      const shipment = await this.loadScoped(req);
      if (!shipment) return this.notFound(res);
      return res.json({ ...(await this.detailPayload(shipment)), status: 200 });
    } catch (e) {
      return this.fail(res, e, 'apiDetail', req);
    }
  }

  /**
   * Reclama una unidad. Es la llamada chica y online del flujo: lo único que
   * necesita señal, porque la exclusión no se puede resolver en el dispositivo.
   */
  public async apiClaimUnit(req: IRequest, res: Response): Promise<any> {
    const { vin } = req.body;
    try {
      const shipment = await this.loadScoped(req);
      if (!shipment) return this.notFound(res);
      if (!vin) return res.status(400).json({ message: 'Falta el VIN.', status: 400 });

      const item = await shipmentService.claimUnit({ shipment, vin, user: req.user });
      // Se devuelve el estado completo del envío: así el dispositivo se
      // autocorrige si otro operario cargó mientras tanto.
      return res.status(201).json({
        item,
        ...(await this.detailPayload(await Shipment.findById(shipment._id) as any)),
        status: 201
      });
    } catch (e) {
      return this.fail(res, e, 'apiClaimUnit', req);
    }
  }

  /** Baja una unidad del camión. Si era la última, el envío queda cancelado. */
  public async apiRemoveUnit(req: IRequest, res: Response): Promise<any> {
    try {
      const shipment = await this.loadScoped(req);
      if (!shipment) return this.notFound(res);

      const { shipmentCancelled } = await shipmentService.removeUnit({
        shipment,
        itemId: req.params.itemId,
        user: req.user
      });
      return res.json({
        shipmentCancelled,
        ...(await this.detailPayload(await Shipment.findById(shipment._id) as any)),
        status: 200
      });
    } catch (e) {
      return this.fail(res, e, 'apiRemoveUnit', req);
    }
  }

  /**
   * Registra la salida: cierra el envío (R5), escribe el History de cada
   * unidad (R6) y saca las unidades de manos del handler (R6.b).
   *
   * Es chica y online a propósito: el camión queda cerrado aunque el formulario
   * de salida todavía esté subiendo por la vía encolada.
   */
  public async apiDepart(req: IRequest, res: Response): Promise<any> {
    try {
      const shipment = await this.loadScoped(req);
      if (!shipment) return this.notFound(res);

      if (shipment.status !== ChoicesStatusShipment.open) {
        throw new ShipmentError(
          shipment.status === ChoicesStatusShipment.shipped
            ? ('SHIPMENT_CLOSED' as any)
            : ('SHIPMENT_CANCELLED' as any),
          shipment.status === ChoicesStatusShipment.shipped
            ? 'El camión ya salió.'
            : 'El envío fue cancelado.',
          409
        );
      }

      const items = await ShipmentItem.find({
        shipment: shipment._id,
        status: ChoicesStatusShipmentItem.loaded
      }, { _id: 1, car: 1 }).lean();

      if (!items.length) {
        return res.status(409).json({
          code: 'SHIPMENT_EMPTY',
          message: 'No se puede registrar la salida de un camión sin unidades.',
          status: 409
        });
      }

      const carIds = items.map((i: any) => i.car);
      const now = new Date();

      // 1) cerrar el envío
      const closed = await Shipment.findOneAndUpdate(
        { _id: shipment._id, status: ChoicesStatusShipment.open },
        { $set: { status: ChoicesStatusShipment.shipped, shippedAt: now, shippedBy: req.user._id } },
        { new: true }
      );
      if (!closed) {
        // Otro operario lo cerró entre el chequeo y el update.
        return res.status(409).json({ code: 'SHIPMENT_CLOSED', message: 'El camión ya salió.', status: 409 });
      }

      // 2) los items dejan de bloquear la unidad
      await ShipmentItem.updateMany(
        { shipment: shipment._id, status: ChoicesStatusShipmentItem.loaded },
        { $set: { status: ChoicesStatusShipmentItem.shipped } }
      );

      // 3) History inTransit por unidad (R6). Primero se desmarca el current
      //    anterior, como hacen los demás flujos.
      await History.updateMany({ car: { $in: carIds } }, { $set: { current: false } });
      await History.insertMany(items.map((i: any) => ({
        status: StatusHistory.inTransit,
        module: ModuleHistory.transportation,
        car: i.car,
        team: shipment.team,
        company: shipment.clientCompany,
        handlerCompany: shipment.handlerCompany,
        venue: shipment.venue,
        createdBy: req.user._id,
        executedAt: now,
        current: true
      })));

      // 4) la unidad sale de manos del handler (R6.b): queda registrado el
      //    despacho y deja de ser elegible para otro camión.
      await Car.updateMany(
        { _id: { $in: carIds } },
        {
          $unset: { handlerCompany: '' },
          $push: {
            dispatches: {
              shipment: shipment._id,
              handlerCompany: shipment.handlerCompany,
              by: req.user._id,
              at: now
            }
          }
        }
      );

      logger.info(
        `ShipmentController.apiDepart: envío ${shipment._id} patente ${shipment.plate} ` +
        `despachado por ${req.user.email} con ${items.length} unidades`
      );

      return res.json({
        ...(await this.detailPayload(closed)),
        dispatched: items.length,
        status: 200
      });
    } catch (e) {
      return this.fail(res, e, 'apiDepart', req);
    }
  }

  // ---------------------------------------------------------------- helpers

  /** Envío con scope: solo los del handler del usuario. */
  private async loadScoped(req: IRequest): Promise<any> {
    return Shipment.findOne({
      _id: req.params.id,
      team: req.user.team._id,
      handlerCompany: req.user.company._id
    });
  }

  /** Estado completo del envío: cabecera + unidades cargadas. */
  private async detailPayload(shipment: any): Promise<any> {
    const populated = await Shipment.findById(shipment._id)
      .populate([
        { path: 'clientCompany', select: ['name'] },
        { path: 'handlerCompany', select: ['name'] },
        { path: 'venue', select: ['name'] }
      ])
      .lean();

    const items = await ShipmentItem.find({
      shipment: shipment._id,
      status: { $ne: ChoicesStatusShipmentItem.removed }
    })
      .populate([
        { path: 'car', select: ['vin', 'brand', 'denomination', 'model'] },
        { path: 'loadedBy', select: ['firstName', 'lastName', 'email'] }
      ])
      .sort({ loadedAt: 1 })
      .lean();

    return {
      shipment: populated,
      // La app necesita saber qué formularios usar sin pedirlos aparte.
      unitForm: (populated as any)?.unitForm,
      departureForm: (populated as any)?.departureForm,
      items,
      units: items.length
    };
  }

  private notFound(res: Response) {
    return res.status(404).json({ message: 'Envío no encontrado.', status: 404 });
  }

  /**
   * Los ShipmentError llevan código y status propios: la app los usa para
   * mostrar un mensaje accionable en vez de un error genérico.
   */
  private fail(res: Response, e: any, where: string, req: IRequest) {
    if (e instanceof ShipmentError) {
      return res.status(e.status).json({
        code: e.code,
        message: e.message,
        ...e.details,
        status: e.status
      });
    }
    logger.error(`ShipmentController.${where}: ${e?.message}`);
    logger.error(`{user: ${req.user?.email}}`);
    console.error(e);
    return res.status(500).json({ message: 'Ha ocurrido un error.', status: 500 });
  }
}

export default new ShipmentController();
