import type { ICar } from '../../app/interfaces/car.interface';
import logger from '../../services/logger.service';

class ConectaController {

  public async searchVinContecta(vin: string): Promise<{ data: ICar[] }> {
    logger.debug(`RequestController.searchVinContecta ${vin}`);
    return new Promise((resolve, reject) => {
      reject({ error: Error("Conecta integration not implemented") });
    });
  }

}
const conectaController =  new ConectaController();
export default conectaController;
