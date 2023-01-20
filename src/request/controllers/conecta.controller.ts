import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import type { ICar } from '../../app/interfaces/car.interface';
import logger from '../../services/logger.service';

class ConectaController {

  public async searchVinContecta(vin: string): Promise<{ data: ICar[] }> {
    logger.debug(`RequestController.searchVinContecta ${vin}`);
    return new Promise((resolve, reject) => {
      try {
        const data = `<soapenv:Envelope xmlns:soapenv='http://schemas.xmlsoap.org/soap/envelope/' xmlns:urn='urn:sap-com:document:sap:rfc:functions'><soapenv:Header/><soapenv:Body><urn:ZPM_GET_EQUIPMENTS><LAST_PART_EQUIPMENT_NO>${vin}</LAST_PART_EQUIPMENT_NO></urn:ZPM_GET_EQUIPMENTS></soapenv:Body></soapenv:Envelope>`;
        const config = {
          headers: {
            'Content-Type': 'text/xml',
            'SOAPAction': 'http://sap.com/xi/WebService/soap1.1',
            'Content-Length': `${Buffer.byteLength(data)}`
          },
          auth: {
            username: 'USR_SOA_PI',
            password: 'Inicio.2130'
          }
        };
        const instance = axios.create(config);
        instance.post(`${process.env.SALFA_SOAP}/XISOAPAdapter/MessageServlet?senderParty=&senderService=BC_OBTENER_EQUIPOS&receiverParty=&receiverService=&interface=ObtenerEquiposRequestConfirmation_Out&interfaceNamespace=urn:salfa.cl:salfa:ObtenerEquipos`,
          data
        )
          .then(async (response) => {
            try {
              const parser = new XMLParser({
                ignoreAttributes: true
              });
              let jObj = parser.parse(response.data);
              const data = [];
              const cars = jObj['SOAP:Envelope']['SOAP:Body']['ns0:ZPM_GET_EQUIPMENTS.Response']['EQUIPMENTS_INFO']['item'];
              for (const car of cars.length ? cars : [cars]) {
                let {
                  EQUIPMENT_NO: vin,
                  BRAND: brand,
                  MODEL: denomination,
                  VERSION: version,
                  MATERIAL: material,
                  COLOR: color
                } = car;
                data.push({
                  vin,
                  brand,
                  denomination: `${denomination}${version ? ` ${version}` : ''}`,
                  material: material.toString(),
                  color
                } as ICar);
              }
              logger.info(`RequestController.searchVinContecta\x1b[90m data: ${JSON.stringify(data)}`);
              resolve({ data });

            } catch (e) {
              logger.error(`RequestController.parser\x1b[90m error: ${JSON.stringify(e)}`);
              logger.error(e);
              resolve({ data: [] });
            }
          })
          .catch(function(e) {
            logger.debug(`RequestController.searchVin\x1b[90m: There are no records.`);
            resolve({ data: [] });
          });
      } catch (e) {
        logger.error(`RequestController.searchVin\x1b[90m: catch error.`);
        logger.error(e);
        resolve({ data: [] });
      }
    });
  }

}
const conectaController =  new ConectaController();
export default conectaController;
