import * as express from 'express';

import Middlewares from '../middlewares/middlewares';
import UploadController from './controllers/upload.controller';

const uploadRouter = express.Router();

// Direct-to-S3 upload handshake. These two routes carry only JSON metadata —
// the image bytes go straight from the device to S3 in between them.
uploadRouter.post(
  '/api/v1/uploads/presign/',
  Middlewares.isJWTAuthenticated,
  UploadController.presign
);

uploadRouter.post(
  '/api/v1/uploads/confirm/',
  Middlewares.isJWTAuthenticated,
  UploadController.confirm
);

// Same handshake for inventory images. Kept as its own pair rather than a
// discriminator on the routes above so the live form path is untouched.
uploadRouter.post(
  '/api/v1/uploads/inventory/presign/',
  Middlewares.isJWTAuthenticated,
  UploadController.presignInventory
);

uploadRouter.post(
  '/api/v1/uploads/inventory/confirm/',
  Middlewares.isJWTAuthenticated,
  UploadController.confirmInventory
);

export { uploadRouter };
export default uploadRouter;
