import * as AWS from 'aws-sdk';
import { Response } from 'express';
import mongoose from 'mongoose';
import * as path from 'path';
import * as uuid from 'uuid';

import ParticipantFile from '../../form/models/participantFile.model';
import { IRequest } from '../../interfaces/global.interface';
import InventoryFile from '../../inventory/models/inventoryFile.model';
import logger from '../../services/logger.service';

/**
 * Direct-to-S3 upload API.
 *
 * The legacy route (`POST /api/v1/forms/:id/upload-file/`) streams the image
 * through the container: multer spools the body to /tmp, GraphicsMagick
 * rewrites it, then mongoose-crate-s3 uploads it. The client's connection is
 * held for the whole chain — on a bad mobile link that measured 6–28s per
 * photo (ALB target_processing_time) while the handler itself took ~290ms.
 *
 * Here the bytes never touch us:
 *   1. POST /api/v1/uploads/presign/  -> we mint the key + a presigned PUT
 *   2. PUT <uploadUrl>                -> device sends bytes straight to S3
 *   3. POST /api/v1/uploads/confirm/  -> we verify with HeadObject, then save
 *
 * The legacy route stays in place: field devices update slowly, so both paths
 * must coexist and MUST produce indistinguishable ParticipantFile documents.
 */

// Generous ceiling — real photos from the app are ~62KB (p50), 109KB (max).
const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES || 20 * 1024 * 1024);

// Presigned URLs are requested per upload attempt, immediately before the PUT,
// so this only has to outlive a single (possibly very slow) transfer.
const PRESIGN_EXPIRES_SECONDS = Number(process.env.PRESIGN_EXPIRES_SECONDS || 900);

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/heic',
  'image/heif',
  'image/webp'
];

class UploadController {
  private s3: AWS.S3 | null = null;

  constructor() {
    this.presign = this.presign.bind(this);
    this.confirm = this.confirm.bind(this);
    this.presignInventory = this.presignInventory.bind(this);
    this.confirmInventory = this.confirmInventory.bind(this);
  }

  /**
   * Lazily built so importing this module doesn't require S3 env vars (tests,
   * migrations and the billing task all import the app graph).
   */
  private getS3(): AWS.S3 {
    if (!this.s3) {
      this.s3 = new AWS.S3({
        region: process.env.S3_REGION || process.env.AWS_REGION,
        signatureVersion: 'v4'
      });
    }
    return this.s3;
  }

  private get bucket(): string {
    return process.env.S3_BUCKET as string;
  }

  /**
   * Replicates the key layout of `participantFileSchema`'s crate `path()` so
   * objects from both upload paths live side by side:
   *   forms/files/{company}/{form}/{uuidv1}-{originalname}
   *
   * Note there is no leading slash: knox strips it, and the objects already in
   * the bucket are stored as `forms/files/...`.
   */
  private buildKey(company: string, form: string, name: string): string {
    return `forms/files/${company}/${form}/${uuid.v1()}-${name}`;
  }

  /**
   * Same idea as [buildKey] but for the inventory layout, mirroring
   * `inventoryFileSchema`'s crate `path()`:
   *   inventories/files/{team}/{inventory}/{venue}/{uuidv1}-{originalname}
   *
   * Note the different segment order and the extra venue level — inventory
   * objects are grouped by team, not company.
   */
  private buildInventoryKey(
    team: string,
    inventory: string,
    venue: string,
    name: string
  ): string {
    return `inventories/files/${team}/${inventory}/${venue}/${uuid.v1()}-${name}`;
  }

  /**
   * Legacy URL shape produced by mongoose-crate-s3. The web app and the mobile
   * app both read `file.url`, so this must stay byte-identical to what the old
   * route writes — note `s3-<region>` with a dash, not a dot.
   */
  private buildUrl(key: string): string {
    const region = process.env.S3_REGION || process.env.AWS_REGION;
    return `https://${this.bucket}.s3-${region}.amazonaws.com/${key}`;
  }

  /**
   * Filenames end up in an S3 key and in `file.name`. Keep the basename only so
   * a crafted name can't climb out of the intended prefix.
   */
  private sanitizeName(name: string): string {
    const base = path.basename(String(name)).replace(/[\\/]/g, '');
    return base.slice(0, 180) || `${uuid.v1()}.jpg`;
  }

  private isValidObjectId(value: any): boolean {
    return mongoose.Types.ObjectId.isValid(String(value));
  }

  /**
   * Step 1 — mint a key and a presigned PUT for it.
   *
   * The client never chooses the key: it is derived from the authenticated
   * user's company plus the form, so a device can only write inside its own
   * prefix no matter what it sends.
   */
  public async presign(req: IRequest, res: Response): Promise<any> {
    try {
      const { company } = req.user;
      const { form, name, type, size } = req.body;

      if (!this.isValidObjectId(form)) {
        return res.status(400).json({ message: 'Formulario no válido', status: 400 });
      }
      if (!type || !ALLOWED_MIME_TYPES.includes(String(type).toLowerCase())) {
        return res.status(400).json({ message: 'Tipo de archivo no permitido', status: 400 });
      }
      const declaredSize = Number(size);
      if (!Number.isFinite(declaredSize) || declaredSize <= 0 || declaredSize > MAX_UPLOAD_BYTES) {
        return res.status(400).json({ message: 'Tamaño de archivo no válido', status: 400 });
      }

      const safeName = this.sanitizeName(name);
      const contentType = String(type).toLowerCase();
      const key = this.buildKey(String(company._id), String(form), safeName);

      // The client should send this exact Content-Type on the PUT. S3 does NOT
      // enforce it (only `host` is in SignedHeaders, so a mismatched PUT still
      // returns 200) — but whatever header the client sends becomes the stored
      // object's Content-Type. Get it wrong and browsers download the image
      // instead of rendering it from the public URL. No ACL is signed: the
      // bucket is BucketOwnerEnforced and rejects any x-amz-acl with
      // AccessControlListNotSupported.
      const uploadUrl = await this.getS3().getSignedUrlPromise('putObject', {
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
        Expires: PRESIGN_EXPIRES_SECONDS
      });

      logger.info(
        `UploadController.presign email: ${req.user.email} form: ${form} ` +
        `key: ${key} type: ${contentType} size: ${declaredSize}`
      );

      return res.status(200).json({
        data: {
          key,
          uploadUrl,
          contentType,
          expiresIn: PRESIGN_EXPIRES_SECONDS
        },
        status: 200
      });
    } catch (e) {
      logger.error(`UploadController.presign: error`);
      logger.error(e);
      return res.status(400).json({ message: 'No se pudo preparar la subida', status: 400 });
    }
  }

  /**
   * Step 3 — verify the object really landed, then record it.
   *
   * Without the HeadObject check a client could register a key it never
   * uploaded and we'd persist a ParticipantFile pointing at nothing.
   */
  public async confirm(req: IRequest, res: Response): Promise<any> {
    try {
      const { company } = req.user;
      const { form, key, name, type } = req.body;

      if (!this.isValidObjectId(form)) {
        return res.status(400).json({ message: 'Formulario no válido', status: 400 });
      }

      // Only keys inside this company's + form's prefix are acceptable, which is
      // exactly what presign() can produce for this caller.
      const expectedPrefix = `forms/files/${company._id}/${form}/`;
      if (typeof key !== 'string' || !key.startsWith(expectedPrefix) || key.includes('..')) {
        logger.error(
          `UploadController.confirm: rejected key ${key} for company ${company._id} form ${form}`
        );
        return res.status(403).json({ message: 'Clave de archivo no válida', status: 403 });
      }

      const url = this.buildUrl(key);

      // Idempotent: a client that retries confirm (or whose 201 response was
      // lost on a flaky link) must not create a second document.
      const existing = await ParticipantFile.findOne({ 'file.url': url });
      if (existing) {
        logger.info(`UploadController.confirm: already registered ${key}`);
        return res.status(201).json({
          data: { _id: existing._id, file: existing.file },
          status: 201
        });
      }

      let head: AWS.S3.HeadObjectOutput;
      try {
        head = await this.getS3()
          .headObject({ Bucket: this.bucket, Key: key })
          .promise();
      } catch (e) {
        logger.error(`UploadController.confirm: object missing ${key}`);
        return res.status(409).json({
          message: 'El archivo no se encuentra en el almacenamiento',
          status: 409
        });
      }

      const size = Number(head.ContentLength || 0);
      if (size <= 0 || size > MAX_UPLOAD_BYTES) {
        return res.status(400).json({ message: 'Tamaño de archivo no válido', status: 400 });
      }

      // `file.type` comes from the client's declared (whitelisted) type, which
      // mirrors what multer reported on the legacy route. head.ContentType is
      // only whatever header the device happened to send on the PUT, so it is a
      // fallback — but a mismatch means the stored object will serve with the
      // wrong type, so it is worth surfacing.
      const declaredType = String(type || '').toLowerCase();
      const resolvedType = ALLOWED_MIME_TYPES.includes(declaredType)
        ? declaredType
        : head.ContentType || declaredType;
      if (head.ContentType && declaredType && head.ContentType !== declaredType) {
        logger.error(
          `UploadController.confirm: Content-Type mismatch on ${key} — ` +
          `stored "${head.ContentType}" vs declared "${declaredType}"`
        );
      }

      const participantFile = new ParticipantFile();
      participantFile.user = req.user._id;
      participantFile.company = company._id;
      // Set `file` one leaf at a time — assigning the whole object throws.
      //
      // participantFileSchema declares `file: fileSchema` (a single nested
      // subdocument) and then mongoose-crate's plugin runs
      // `schema.add({ file: { url, type, name, size } })` on top of it. Mongoose
      // keeps the SubdocumentPath at `file` AND registers `file.*` as nested
      // paths, so every new document starts with a plain `{}` at `_doc.file`.
      // A whole-object assign then hits SubdocumentPath.cast, which passes that
      // plain `{}` in as `priorDoc` and blows up on `priorDoc.$__getValue is not
      // a function` — surfacing as `ValidationError: file: Cast to Embedded
      // failed ... because of "TypeError"`.
      //
      // Writing the leaves goes through the crate-registered `file.*` paths and
      // produces exactly the document the legacy route persists (four scalars,
      // no `file._id`), which is what mongoose-crate itself does when it mutates
      // `model.file.url = ...` inside FileProcessor.process. Assigned in that
      // same order so the stored subdocument's key order matches too.
      participantFile.set('file.size', size);
      participantFile.set('file.name', this.sanitizeName(name || path.basename(key)));
      participantFile.set('file.type', resolvedType);
      participantFile.set('file.url', url);

      await participantFile.save();

      logger.info(
        `UploadController.confirm email: ${req.user.email} form: ${form} ` +
        `key: ${key} size: ${size} participantFile: ${participantFile._id}`
      );

      return res.status(201).json({
        data: { _id: participantFile._id, file: participantFile.file },
        status: 201
      });
    } catch (e) {
      logger.error(`UploadController.confirm: error`);
      logger.error(e);
      return res.status(400).json({ message: 'No se pudo registrar el archivo', status: 400 });
    }
  }

  /**
   * Inventory step 1 — mint a key and a presigned PUT for an inventory image.
   *
   * Mirrors [presign]. The key is built from the authenticated user's team and
   * venue plus the inventory in the path, so a device can only write inside its
   * own prefix regardless of what it sends.
   */
  public async presignInventory(req: IRequest, res: Response): Promise<any> {
    try {
      const { team, venue } = req.user;
      const { inventory, name, type, size } = req.body;

      if (!this.isValidObjectId(inventory)) {
        return res.status(400).json({ message: 'Inventario no válido', status: 400 });
      }
      if (!team?._id || !venue?._id) {
        logger.error(
          `UploadController.presignInventory: user ${req.user._id} has no team/venue`
        );
        return res.status(400).json({ message: 'Usuario sin equipo o sucursal', status: 400 });
      }
      if (!type || !ALLOWED_MIME_TYPES.includes(String(type).toLowerCase())) {
        return res.status(400).json({ message: 'Tipo de archivo no permitido', status: 400 });
      }
      const declaredSize = Number(size);
      if (!Number.isFinite(declaredSize) || declaredSize <= 0 || declaredSize > MAX_UPLOAD_BYTES) {
        return res.status(400).json({ message: 'Tamaño de archivo no válido', status: 400 });
      }

      const safeName = this.sanitizeName(name);
      const contentType = String(type).toLowerCase();
      const key = this.buildInventoryKey(
        String(team._id),
        String(inventory),
        String(venue._id),
        safeName
      );

      const uploadUrl = await this.getS3().getSignedUrlPromise('putObject', {
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
        Expires: PRESIGN_EXPIRES_SECONDS
      });

      logger.info(
        `UploadController.presignInventory email: ${req.user.email} inventory: ${inventory} ` +
        `key: ${key} type: ${contentType} size: ${declaredSize}`
      );

      return res.status(200).json({
        data: {
          key,
          uploadUrl,
          contentType,
          expiresIn: PRESIGN_EXPIRES_SECONDS
        },
        status: 200
      });
    } catch (e) {
      logger.error(`UploadController.presignInventory: error`);
      logger.error(e);
      return res.status(400).json({ message: 'No se pudo preparar la subida', status: 400 });
    }
  }

  /**
   * Inventory step 3 — verify the object landed, then record it.
   *
   * Unlike the legacy `InventoryController.uploadFile`, no `thumbnail` is
   * produced: the bytes never reach us, so there is nothing to hand to
   * GraphicsMagick. Nothing reads `InventoryFile.thumbnail` today, so the field
   * is simply left unset on this path.
   *
   * `comment` and `damage` arrive in the JSON body here; the legacy route took
   * them as query params.
   */
  public async confirmInventory(req: IRequest, res: Response): Promise<any> {
    try {
      const { company, team, venue } = req.user;
      const { inventory, key, name, type, comment, damage } = req.body;

      if (!this.isValidObjectId(inventory)) {
        return res.status(400).json({ message: 'Inventario no válido', status: 400 });
      }
      if (!team?._id || !venue?._id) {
        return res.status(400).json({ message: 'Usuario sin equipo o sucursal', status: 400 });
      }

      // Only keys inside this user's team/inventory/venue prefix are acceptable,
      // which is exactly what presignInventory() can produce for this caller.
      const expectedPrefix = `inventories/files/${team._id}/${inventory}/${venue._id}/`;
      if (typeof key !== 'string' || !key.startsWith(expectedPrefix) || key.includes('..')) {
        logger.error(
          `UploadController.confirmInventory: rejected key ${key} for team ${team._id} ` +
          `inventory ${inventory} venue ${venue._id}`
        );
        return res.status(403).json({ message: 'Clave de archivo no válida', status: 403 });
      }

      const url = this.buildUrl(key);

      // Idempotent for the same reason confirm() is: a retry on a flaky link
      // must not create a second document.
      const existing = await InventoryFile.findOne({ 'file.url': url });
      if (existing) {
        logger.info(`UploadController.confirmInventory: already registered ${key}`);
        return res.status(201).json({
          data: { _id: existing._id, file: existing.file },
          status: 201
        });
      }

      let head: AWS.S3.HeadObjectOutput;
      try {
        head = await this.getS3()
          .headObject({ Bucket: this.bucket, Key: key })
          .promise();
      } catch (e) {
        logger.error(`UploadController.confirmInventory: object missing ${key}`);
        return res.status(409).json({
          message: 'El archivo no se encuentra en el almacenamiento',
          status: 409
        });
      }

      const size = Number(head.ContentLength || 0);
      if (size <= 0 || size > MAX_UPLOAD_BYTES) {
        return res.status(400).json({ message: 'Tamaño de archivo no válido', status: 400 });
      }

      const declaredType = String(type || '').toLowerCase();
      const resolvedType = ALLOWED_MIME_TYPES.includes(declaredType)
        ? declaredType
        : head.ContentType || declaredType;

      const inventoryFile = new InventoryFile();
      inventoryFile.inventory = inventory;
      inventoryFile.user = req.user._id;
      inventoryFile.company = company._id;
      // Same trailing-comment applies as in confirm(): assign `file` one leaf at
      // a time. inventoryFileSchema also declares `file: fileSchema` with the
      // crate plugin adding `file.*` on top, so a whole-object assign hits
      // SubdocumentPath.cast and throws.
      inventoryFile.set('file.size', size);
      inventoryFile.set('file.name', this.sanitizeName(name || path.basename(key)));
      inventoryFile.set('file.type', resolvedType);
      inventoryFile.set('file.url', url);

      if (comment && String(comment) !== 'null' && String(comment).trim().length) {
        inventoryFile.comment = String(comment).trim();
      }
      // Accepts 1 or '1', matching the legacy route's `damage === '1'` query check.
      if (damage !== undefined && damage !== null && String(damage) === '1') {
        inventoryFile.showDamage = true;
      }

      await inventoryFile.save();

      logger.info(
        `UploadController.confirmInventory email: ${req.user.email} inventory: ${inventory} ` +
        `key: ${key} size: ${size} inventoryFile: ${inventoryFile._id}`
      );

      return res.status(201).json({
        data: { _id: inventoryFile._id, file: inventoryFile.file },
        status: 201
      });
    } catch (e) {
      logger.error(`UploadController.confirmInventory: error`);
      logger.error(e);
      return res.status(400).json({ message: 'No se pudo registrar el archivo', status: 400 });
    }
  }
}

export default new UploadController();
