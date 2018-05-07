import * as express from 'express';
import JWTController from './controllers/jwt.controller';

const router = express.Router();
router.post('/login/', JWTController.login);
router.post('/test/', JWTController.isJWTAuthenticated, JWTController.test);
router.post('/create/', JWTController.createUser);

export default router;
