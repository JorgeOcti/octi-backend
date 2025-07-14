import * as express from 'express';
import CodeController from './controllers/code.controller';

const codeRouter = express.Router();

// PDF generation endpoint
codeRouter.post('/api/report/codes/pdf/', CodeController.pdfCode);

export default codeRouter;
