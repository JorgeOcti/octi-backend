import * as fs from 'fs';
import * as moment from 'moment';
import * as path from 'path';

import { Response } from 'express';

import { ChoicesStatusShipment, ChoicesStatusShipmentItem } from '../models/shipment.types';
import { ShipmentError, normalizePlate } from '../services/shipment.service';

import { OSA_LOGO_SVG } from '../../utils/svg';
import { PDF_S3_REFERER } from '../../inventory/controllers/inventory.controller';

import Car from '../../app/models/car.model';
import Company from '../../app/models/company.model';
import History from '../../app/models/history.model';
import { IRequest } from '../../interfaces/global.interface';
import { ModuleHistory } from '../../app/models/history.types';
import Shipment from '../models/shipment.model';
import ShipmentItem from '../models/shipmentItem.model';
import { StatusHistory } from '../../app/models/history.types';
import GeneralUtils from '../../utils/general.utils';
import logger from '../../services/logger.service';
import puppeteer from 'puppeteer';
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
    this.webList = this.webList.bind(this);
    this.webItems = this.webItems.bind(this);
    this.webTarja = this.webTarja.bind(this);
    this.index = this.index.bind(this);
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

  // ============================================================ web (sesión)

  /** Shell de la SPA: el listado vive en public/js/app. */
  public async index(req: IRequest, res: Response): Promise<any> {
    return res.render('app/index', { token: await req.user.generateToken() });
  }

  /**
   * Listado paginado. El handler ve lo que despachó; el cliente, lo suyo.
   * Es el mismo criterio que aplica currentCompanyStock, no uno nuevo.
   *
   * Los cancelados también se listan acá (en la app no aparecen): es donde se
   * puede ver qué unidades se bajaron y quién las bajó.
   */
  public async webList(req: IRequest, res: Response): Promise<any> {
    try {
      const { plate, clientCompany, status, startDate, endDate } = req.query as Record<string, string>;
      const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
      const pageSize = Math.min(200, Math.max(1, parseInt((req.query.pageSize as string) || '10', 10)));

      const filter: any = await this.scopeFilter(req);
      if (plate) filter.plate = { $regex: normalizePlate(plate), $options: 'i' };
      if (clientCompany) filter.clientCompany = clientCompany;
      if (status) filter.status = { $in: status.split(',') };
      if (startDate && endDate) {
        filter.createdAt = {
          $gte: moment(startDate, 'YYYY-MM-DD').startOf('day').toDate(),
          $lte: moment(endDate, 'YYYY-MM-DD').endOf('day').toDate()
        };
      }

      const total = await Shipment.countDocuments(filter);
      const shipments = await Shipment.find(filter)
        .populate([
          { path: 'clientCompany', select: ['name'] },
          { path: 'handlerCompany', select: ['name'] },
          { path: 'venue', select: ['name'] },
          { path: 'shippedBy', select: ['firstName', 'lastName', 'email'] },
          { path: 'createdBy', select: ['firstName', 'lastName', 'email'] }
        ])
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean();

      // Las unidades de cada fila se piden al desplegarla; acá solo el total,
      // y en una sola consulta agrupada.
      const counts = await ShipmentItem.aggregate([
        { $match: { shipment: { $in: shipments.map((s: any) => s._id) } } },
        { $group: { _id: { shipment: '$shipment', status: '$status' }, n: { $sum: 1 } } }
      ]);
      const byShipment = new Map<string, any>();
      for (const c of counts) {
        const key = String(c._id.shipment);
        const entry = byShipment.get(key) || { loaded: 0, shipped: 0, removed: 0 };
        entry[c._id.status] = c.n;
        byShipment.set(key, entry);
      }

      return res.json({
        results: shipments.map((s: any) => {
          const n = byShipment.get(String(s._id)) || { loaded: 0, shipped: 0, removed: 0 };
          return {
            ...s,
            units: n.loaded + n.shipped,
            unitsRemoved: n.removed,
            // La Tarja sale del formulario de salida, que viaja por la vía
            // encolada: hay una ventana en que el camión ya salió y el PDF
            // todavía no se puede emitir. La web muestra el motivo.
            ...this.tarjaAvailability(s)
          };
        }),
        total,
        page,
        pageSize,
        status: 200
      });
    } catch (e) {
      return this.fail(res, e, 'webList', req);
    }
  }

  /** Unidades de un envío — la fila expandible las pide al desplegarse. */
  public async webItems(req: IRequest, res: Response): Promise<any> {
    try {
      const shipment = await Shipment.findOne({
        _id: req.params.id,
        ...(await this.scopeFilter(req))
      }).lean();
      if (!shipment) return this.notFound(res);

      const items = await ShipmentItem.find({ shipment: shipment._id })
        .populate([
          { path: 'car', select: ['vin', 'brand', 'denomination', 'color', 'patent'] },
          { path: 'loadedBy', select: ['firstName', 'lastName', 'email'] },
          { path: 'removedBy', select: ['firstName', 'lastName', 'email'] },
          { path: 'participant', select: ['hasDamages', 'createdAt'] }
        ])
        .sort({ loadedAt: 1 })
        .lean();

      return res.json({ results: items, status: 200 });
    } catch (e) {
      return this.fail(res, e, 'webItems', req);
    }
  }

  /**
   * Tarja en PDF. Mismo patrón que el PDF de desconsolidado: pug + puppeteer
   * con el chromium de la imagen.
   *
   * El nombre del chofer y la foto del camión salen del formulario de salida,
   * que es editable desde el admin: se buscan por `kindUpdate`, nunca por el
   * texto ni el orden de las preguntas. Ver §6 del plan técnico.
   */
  public async webTarja(req: IRequest, res: Response): Promise<any> {
    try {
      const shipment: any = await Shipment.findOne({
        _id: req.params.id,
        ...(await this.scopeFilter(req))
      })
        .populate([
          { path: 'clientCompany', select: ['name', 'businessName', 'rut', 'image'] },
          { path: 'handlerCompany', select: ['name', 'businessName', 'rut', 'image'] },
          { path: 'venue', select: ['name', 'code', 'abbreviation'] },
          { path: 'shippedBy', select: ['firstName', 'lastName', 'email'] },
          {
            path: 'participant',
            populate: [{ path: 'sections.answers.images', model: 'ParticipantFile' }]
          }
        ])
        .lean();
      if (!shipment) return this.notFound(res);

      const availability = this.tarjaAvailability(shipment);
      if (!availability.tarjaReady) {
        return res.status(409).json({
          code: 'TARJA_NOT_READY',
          message: availability.tarjaReason,
          status: 409
        });
      }

      const items: any[] = await ShipmentItem.find({
        shipment: shipment._id,
        status: ChoicesStatusShipmentItem.shipped
      })
        .populate([
          { path: 'car', select: ['vin', 'brand', 'denomination', 'color', 'patent'] },
          { path: 'loadedBy', select: ['firstName', 'lastName'] },
          {
            path: 'participant',
            populate: [
              { path: 'sections.answers.damagesSelected.kind', model: 'Kind' },
              { path: 'sections.answers.damagesSelected.part', model: 'Part' },
              { path: 'sections.answers.damagesSelected.position', model: 'Position' },
              // Las fotos de cada unidad son la evidencia de en qué estado
              // salió: sin esto la Tarja documenta el despacho sin mostrarlo.
              { path: 'sections.answers.images', model: 'ParticipantFile' },
              { path: 'sections.answers.damagesSelected.images', model: 'ParticipantFile' }
            ]
          }
        ])
        .sort({ loadedAt: 1 })
        .lean();

      const units = items.map((item: any, index: number) => ({
        index: index + 1,
        vin: item.car?.vin || '',
        brand: item.car?.brand || '',
        denomination: item.car?.denomination || '',
        color: item.car?.color || '',
        loadedBy: item.loadedBy
          ? `${item.loadedBy.firstName || ''} ${item.loadedBy.lastName || ''}`.trim()
          : '',
        loadedAt: item.loadedAt,
        hasDamages: !!item.participant?.hasDamages,
        damages: this.extractDamages(item.participant),
        photos: this.extractPhotos(item.participant)
      }));

      const css = fs.readFileSync(
        path.join(__dirname, '../../../views/') + 'shipment/pdf/styles.css',
        'utf8'
      );
      const html = GeneralUtils.generateHtmlFromPugFile(
        path.join(__dirname, '../../../views/') + 'shipment/pdf/tarja.pug',
        {
          css: css.replace(/(\r\n|\n|\r)/gm, ''),
          moment,
          shipment,
          units,
          driverName: this.answerByKindUpdate(shipment.participant, 'shipment.driverName')?.comment || '',
          truckPhotos: this.answerByKindUpdate(shipment.participant, 'shipment.truckPhoto')?.images || [],
          userName: `${GeneralUtils.capitalizeFirstLetter(req.user.firstName)} ${GeneralUtils.capitalizeFirstLetter(req.user.lastName)}`,
          user: req.user
        }
      );

      const browser = await puppeteer.launch({
        executablePath: '/usr/bin/chromium',
        args: ['--no-sandbox', '--allow-file-access-from-files', '--enable-local-file-accesses'],
        headless: true
      });
      try {
        const page = await browser.newPage();
        // Las fotos viven en S3 detrás de una policy de aws:Referer, igual que
        // en el PDF de desconsolidado.
        await page.setExtraHTTPHeaders({ referer: PDF_S3_REFERER });
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
          format: 'A4',
          displayHeaderFooter: true,
          headerTemplate: '<div></div>',
          footerTemplate: `
            <div class="footer" style="width: 100%; font-size: 8px; padding: 30px; display: flex; justify-content: space-between; align-items: baseline;">
              <div>${shipment.venue?.code || ''}</div>
              <div>Página <span class="pageNumber"></span> / <span class="totalPages"></span></div>
              <div style="color: #999; display: flex; align-items: baseline;">
              Powered by
              ${OSA_LOGO_SVG}
              octimize.cl
              </div>
            </div>`,
          margin: { top: '70px', left: '30px', right: '30px', bottom: '70px' }
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-disposition', `inline; filename=Tarja-${shipment.plate}.pdf`);
        return res.send(pdfBuffer);
      } finally {
        await browser.close();
      }
    } catch (e) {
      return this.fail(res, e, 'webTarja', req);
    }
  }

  // ---------------------------------------------------------------- helpers

  /**
   * Respuesta de un formulario por `kindUpdate`. Es el mecanismo que ya usa el
   * sistema para mapear una respuesta a un campo, y lo que permite que el admin
   * reordene o reescriba las preguntas sin romper la Tarja.
   */
  private answerByKindUpdate(participant: any, kindUpdate: string): any {
    for (const section of participant?.sections || []) {
      for (const answer of section.answers || []) {
        if (answer.kindUpdate === kindUpdate) return answer;
      }
    }
    return null;
  }

  /**
   * Fotos de un formulario: las de las preguntas de imagen y las adjuntas a
   * cada daño.
   *
   * La URL vive en `file.url`, no en `url` — es la forma que guarda
   * mongoose-crate y la que usa el PDF de desconsolidado. Leerla del lugar
   * equivocado no rompe nada ruidosamente: simplemente sale un PDF sin fotos.
   */
  private extractPhotos(participant: any): any[] {
    const photos: any[] = [];
    for (const section of participant?.sections || []) {
      for (const answer of section.answers || []) {
        for (const image of answer.images || []) {
          if (image?.file?.url) photos.push(image);
        }
        for (const damage of answer.damagesSelected || []) {
          for (const image of damage.images || []) {
            if (image?.file?.url) photos.push(image);
          }
        }
      }
    }
    return photos;
  }

  /**
   * Daños como `parte-posición-tipo`, el mismo formato que arma el export de
   * stock (inventory.controller.ts, currentCompanyStockExport).
   */
  private extractDamages(participant: any): string[] {
    const damages: string[] = [];
    for (const section of participant?.sections || []) {
      for (const answer of section.answers || []) {
        for (const damage of answer.damagesSelected || []) {
          const text = [damage.part?.name, damage.position?.name, damage.kind?.name]
            .filter(Boolean)
            .join('-');
          if (text) damages.push(text);
        }
      }
    }
    return damages;
  }

  /**
   * Scope por company. El handler ve los envíos que despachó; el cliente, los
   * de sus unidades. Una company que es handler nunca es cliente de sí misma,
   * así que no se superponen.
   *
   * A propósito NO filtra por team: el envío lleva el team del handler y el
   * cliente suele estar en otro, así que filtrar por team lo dejaría sin ver
   * sus propios envíos. Es el mismo criterio de currentCompanyStock, que
   * también acota por company y no por team. La company ya pertenece a un
   * team, así que el filtro no se afloja.
   */
  private async scopeFilter(req: IRequest): Promise<any> {
    const userCompany: any = await Company.findById(req.user.company._id, { handler: 1 }).lean();
    return userCompany?.handler
      ? { handlerCompany: req.user.company._id }
      : { clientCompany: req.user.company._id };
  }

  /** Por qué se puede (o no) emitir la Tarja de este envío. */
  private tarjaAvailability(shipment: any): { tarjaReady: boolean; tarjaReason: string | null } {
    if (shipment.status === ChoicesStatusShipment.cancelled) {
      return { tarjaReady: false, tarjaReason: 'El envío fue cancelado.' };
    }
    if (shipment.status !== ChoicesStatusShipment.shipped) {
      return { tarjaReady: false, tarjaReason: 'El camión todavía no registró su salida.' };
    }
    if (!shipment.participant) {
      return {
        tarjaReady: false,
        tarjaReason: 'Falta que llegue el formulario de salida (nombre del chofer y foto del camión).'
      };
    }
    return { tarjaReady: true, tarjaReason: null };
  }

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
