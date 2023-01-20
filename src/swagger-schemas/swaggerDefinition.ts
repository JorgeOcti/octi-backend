
import { CarrierSchema } from './core/carrier.schema';
import { CarSchema } from './core/car.schema';
import { CompanySchema } from './core/company.schema';
import { ImageSchema } from './core/image.schema';
import { UserSchema } from './core/user.schema';
import { VenueSchema } from './core/venue.schema';
import { ListControlsSchema , ErrorSchema400, ErrorSchema401, ListCompaniesSchema, ListVenuesSchema, ErrorSchema403} from './core/responses.schema';
import {  PageSchema, PageSizeSchema, AuthorizationJWTSchema} from './core/parameters.schema';

import { AccesorySchema } from './form/accesory.schema';
import { AccessoryAnsweredSchema } from './form/accessoryAnswered.schema';
import { AnswerSchema } from './form/answer.schema';
import { ChoiseSchema } from './form/choice.schema';
import { DamagesSelectedSchema } from './form/damagesSelected.schema';
import { ParticipantSchema } from './form/participant.schema';
import { FormSchema } from './form/form.schema';
import { KindSchema } from './form/kind.schema';
import { PartSchema } from './form/part.schema';
import { PositionSchema } from './form/position.schema';
import { SectionSchema } from './form/section.schema';

export const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'OSA Developers',
    version: '1.1.0',
    description: `<h3>Documentación de la API, para desarrolladores de integraciones con OSA Andes.</h3>
    <p>Aquí encontrará las instrucciones para poder utilizar los servicios web RESTful de OSA Andes, es importante recalcar que el uso de estos requiere la habilitación de una token de acceso (JWT_TOKEN). Que debe ser aprobado tanto por nuestras áreas comerciales y técnicas.</p>
    <h3><strong>¿Cómo autenticarte?</strong></h3>
    <p>Se utiliza la autenticación basada en una API KEY, que debe estar en el <strong>header</strong> de la solicitud de la siguiente manera:</p>
     <table>
    <thead>
      <tr>
        <th>KEY<br></th>
        <th>VALUE</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class='tg-0pky'>Authorization</td>
        <td class='tg-0pky'>JWT {{JWT_TOKEN}}</td>
      </tr>
    </tbody>
    </table>
    <p>Está información es de uso exclusivo de nuestros clientes.</p>`,
    contact: {
      name: 'support',
      // url: 'https://www.osacontrol.com',
      email: 'soporte@osacontrol.com'

    }
  },
  components: {
    schemas: {
      Car: CarSchema,
      User: UserSchema,
      Company: CompanySchema,
      Venue: VenueSchema,
      Carrier: CarrierSchema,
      Image: ImageSchema,
      Position: PositionSchema,
      Kind: KindSchema,
      Part: PartSchema,
      DamageSelected: DamagesSelectedSchema,
      Choice: ChoiseSchema,
      Accessory: AccesorySchema,
      accessoryAnswered: AccessoryAnsweredSchema,
      Answer: AnswerSchema,
      Section: SectionSchema,
      Form: FormSchema,
      Participant: ParticipantSchema
    },
    responses: {
      ListControls: ListControlsSchema,
      ListCompanies: ListCompaniesSchema,
      ListVenues: ListVenuesSchema,
      Error400: ErrorSchema400,
      Error401: ErrorSchema401,
      Error403: ErrorSchema403,
    },
    parameters: {
      AuthorizationJWT: AuthorizationJWTSchema,
      DefaultPage: PageSchema,
      PageSize10: PageSizeSchema(10),
      PageSize100: PageSizeSchema(100)
    },
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization'
      }
    }
  },
  servers: [{
    url: process.env.SITE_URL,
    description: 'OSA server Production'
  }, {
    url: 'https://andes-stage.osacontrol.com/',
    description: 'OSA server Stage'
  }],
  externalDocs: {
    url: 'https://sites.google.com/osacontrol.com/doc-osa-api/inicio',
    description: 'Find more info here'
  }
};
