import * as Queue from 'bull';
import * as moment from 'moment';
import * as mongoose from 'mongoose';
import { IUser } from '../../app/interfaces/user.interface';
import { IVenue } from '../../app/interfaces/venue.interface';
import Company from '../../app/models/company.model';
import Team from '../../app/models/team.model';
import User from '../../app/models/user.model';
import Venue from '../../app/models/venue.model';
import { IForm } from '../../form/interfaces/form.interface';
import Form from '../../form/models/form.model';
import logger from '../../services/logger.service';
import { createRedisClient } from '../../services/redis.service';
import IXnetClient from '../clients/IXnet.client';
import FormImporter from '../importers/form.importer';
import {
  IIntegration,
  IIntegrationAction
} from '../interfaces/integration.interface';
import Integration from '../models/integrations.model';

export default class ImportIXnetQueue {
  public queue: Queue.Queue;

  constructor() {
    this.queue = new Queue('importIXnet', {
      createClient: () => {
        return createRedisClient();
      },
      prefix: '{andes}',
      // Limit queue to max 10 jobs per 1 second
      limiter: {
        max: 500,
        duration: 1000
      }
    });
    mongoose.set('debug', false);
    new Company();
    new Team();
    this.main = this.main.bind(this);
    this.start = this.start.bind(this);
    this.processEntradasAction = this.processEntradasAction.bind(this);
    this.importForm = this.importForm.bind(this);
  }

  public run() {
    this.queue.process('main', this.main);
    this.queue.process('entradas-action', this.processEntradasAction);
    this.queue.process('import-forms', this.importForm);
  }

  async importForm(job: Queue.Job<any>, done: Queue.DoneCallback) {
    const { action, integration, venue, form, user, records } = job.data;
    logger.debug(
      `ImportIXnetQueue.import-forms ${integration.name} -> ${action.name}`
    );
    // console.dir(job.data, { depth: 2 })
    const importer = new FormImporter('ixnet', integration, action);
    const parserRecords = [];
    for (const record of records) {
      const { VIN, Fecha, FechaEnt, IdRevision, ...rest } = record;
      parserRecords.push({
        vin: VIN,
        externalId: IdRevision?.toString() ?? '',
        createdAt: Fecha ?? FechaEnt,
        venue,
        user,
        form,
        rest
      });
    }
    // console.dir(parserRecords, { depth: 2 })
    await importer.import({
      data: parserRecords
    });
    done();
  }

  async processEntradasAction(
    job: Queue.Job<{
      action: IIntegrationAction;
      integration: IIntegration;
      venue: IVenue;
      form: IForm;
      user: IUser;
    }>,
    done: Queue.DoneCallback
  ) {
    return new Promise(async (resolve, reject) => {
      try {
        const { action, integration, venue, form, user } = job.data;
        logger.debug(
          `ImportIXnetQueue.entradas-action ${integration.name} -> ${action.name}`
        );
        const client = new IXnetClient(integration);
        let records = await client.getFrom(action);
        while (records.length) {
          const batch = records.splice(0, 10);
          this.queue.add(
            'import-forms',
            {
              records: batch,
              action,
              integration,
              venue,
              form,
              user
            },
            {
              attempts: 3,
              removeOnComplete: true
            }
          );
        }
        // if (records?.length) {
        //   logger.info(
        //     `ImportIXnetQueue.entradas-action ${integration.name} -> ${action.name}: found ${records?.length}!`
        //   );
        //   const importer = new FormImporter('ixnet', integration, action);

        //   const parserRecords = [];
        //   for (const record of records) {
        //     const { VIN, Fecha, FechaEnt, IdRevision, ...rest } = record;
        //     parserRecords.push({
        //       vin: VIN,
        //       externalId: IdRevision?.toString(),
        //       createdAt: Fecha ?? FechaEnt,
        //       venue,
        //       user,
        //       form,
        //       importedFrom: 'ixnet',
        //       rest
        //     });
        //   }
        //   const show = parserRecords[0];
        //   logger.info(
        //     `ImportIXnetQueue.entradas-action ${integration.name} -> ${action.name}: importing ${records.length}`
        //   );
        //   console.dir(show, { depth: 2 });
        //   await importer.import({
        //     data: parserRecords
        //   });

        //   logger.info(
        //     `ImportIXnetQueue.entradas-action ${integration.name} -> ${action.name}: importing success!`
        //   );
        // }
        logger.info(
          `ImportIXnetQueue.entradas-action ${integration.name} -> ${action.name}: success!`
        );
        done();
        resolve({});
      } catch (err) {
        console.log(err);
        done(err);
        reject(err);
      }
    });
  }

  async start(_job: Queue.Job<any>, done: Queue.DoneCallback) {
    return new Promise(async (resolve, reject) => {
      try {
        logger.debug(`ImportIXnetQueue.start`);
        const integrations = await Integration.find({
          type: 'ixnet',
        });
        for (const integration of integrations) {
          for (const action of integration.actions) {
            const venue = await Venue.findById(action.venue, {
              _id: 1,
              name: 1
            }).populate([
              {
                path: 'company',
                select: { _id: 1, name: 1 },
                populate: [
                  {
                    path: 'team',
                    select: { _id: 1, name: 1 }
                  }
                ]
              }
            ]);
            const form = await Form.findById(action.form).populate([
              {
                path: 'sections.questions.scale'
              },
              {
                path: 'sections.questions.damages',
                select: ['name', 'positions', 'kinds', 'parts'],
                populate: [
                  {
                    path: 'positions',
                    select: ['name']
                  },
                  {
                    path: 'kinds',
                    select: ['name']
                  },
                  {
                    path: 'parts',
                    select: ['name']
                  }
                ]
              }
            ]);
            const user = await User.findById(action.user, {
              _id: 1,
              email: 1
            });
            if (venue && form && user) {
              this.queue.add(
                'entradas-action',
                {
                  integration,
                  action,
                  venue: {
                    _id: venue._id,
                    name: venue.name,
                    company: {
                      _id: venue.company._id,
                      name: venue.company.name,
                      team: {
                        _id: venue.company.team._id,
                        name: venue.company.team.name
                      }
                    }
                  },
                  user: {
                    _id: user._id,
                    email: user.email
                  },
                  form
                },
                {
                  attempts: 3,
                  removeOnComplete: true
                }
              );
              logger.info(
                `ImportIXnetQueue.start ${integration.name} -> ${action.name} added success!');`
              );
            } else {
              logger.error(
                `ImportIXnetQueue.start ${integration.name} -> ${
                  action.name
                } error: Cant start action: ${JSON.stringify({
                  venue,
                  user,
                  form
                })}`
              );
            }
          }
        }
        done();
        resolve({});
      } catch (err) {
        console.log(err);
        done(err);
        reject(err);
      }
    });
  }

  private async main(job: Queue.Job<any>, done: Queue.DoneCallback) {
    return new Promise(async (resolve, reject) => {
      logger.info(
        `start ImportIXnetQueue.main ${moment().format('YYYY-MM-DD HH:mm:ss')}`
      );
      await this.start(job, done);
      resolve({});
    });
  }
}
