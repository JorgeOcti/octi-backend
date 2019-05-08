import {IAnyObject} from '../../interfaces/global.interface';

declare global {
    namespace Express {
        interface Request {
            context: IAnyObject;
        }
    }
}
