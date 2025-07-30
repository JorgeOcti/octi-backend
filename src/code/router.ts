import * as express from 'express';
import CodeController from './controllers/code.controller';
import { customCors } from '../middlewares/cors';

const codeRouter = express.Router();

codeRouter.options('/api/report/codes/pdf/', customCors);
codeRouter.post('/api/report/codes/pdf/', customCors, CodeController.pdfCode);

export default codeRouter;
