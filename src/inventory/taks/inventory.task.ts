import * as Queue from 'bull';
import moment = require('moment');
// import * as mongoose from 'mongoose';
import { ICar } from '../../app/interfaces/car.interface';
import CarModel, { Car, ChoicesStatusCar } from '../../app/models/car.model';
import Team from '../../app/models/team.model';
import User from '../../app/models/user.model';
import Venue, { IVenueModel } from '../../app/models/venue.model';
import { IUserModel } from '../../app/schemas/user.schema';
import emailQueue from '../../app/tasks/email.task';
import { IActivityHistoryInterface } from '../../billing/interfaces/activityHistory.interface';
import { ChoicesTypeActivity } from '../../billing/models/activiHistory.types';
import ActivityHistory from '../../billing/models/activityHistory.model';
import logger from '../../services/logger.service';
import pushService from '../../services/push.service';
import { createRedisClient } from '../../services/redis.service';
import { socket } from '../../services/socket.service';
import { IInventoryCar } from '../interfaces/inventory.interface';
import Inventory, {
  ChoicesStatusInventory,
  IInventoryModel
} from '../models/inventory.model';
import InventoryCar from '../models/inventoryCar.model';

interface IInventoryQueueData {
  userID: string;
  name: string;
  manualPhoto: boolean;
  reportPhoto: boolean;
  notification: boolean;
  carsByVenue: any[];
}

class InventoryQueue {
  public queue: Queue.Queue;
  readonly processJob: boolean = true;

  constructor() {
    this.queue = new Queue('inventory', {
      createClient: () => {
        return createRedisClient();
      },
      prefix: '{andes}'
    });
    this.processUpdateCar = this.processUpdateCar.bind(this);
    this.processCreateInventory = this.processCreateInventory.bind(this);
    this.checkExistVenue = this.checkExistVenue.bind(this);
    this.sendNotification = this.sendNotification.bind(this);
  }

  public run() {
    this.queue.process('create', this.processCreateInventory);
    this.queue.process('updateCar', this.processUpdateCar);
  }

  private async processCreateInventory(
    job: Queue.Job<IInventoryQueueData>,
    done: Queue.DoneCallback
  ) {
    const { userID, name, manualPhoto, reportPhoto } = job.data;
    let { carsByVenue, notification } = job.data;
    let user = (await User.findById(userID).populate([
      { path: 'company' },
      { path: 'team' }
    ])) as IUserModel;
    try {
      const { company, team } = user;
      const activityHistories: IActivityHistoryInterface[] = [];

      const venuesIDs: string[] = await Promise.all(
        carsByVenue.map(async (venue: any) => {
          const { name } = venue;
          const currentVenue = await this.checkExistVenue(name, team, company);
          return currentVenue._id.toString();
        })
      );
      let refresh = moment();

      const inventory = new Inventory({
        name,
        company: company._id,
        team: team._id,
        venues: venuesIDs,
        createdBy: user!._id,
        status: ChoicesStatusInventory.pending,
        settings: {
          photos: {
            manual: manualPhoto,
            report: reportPhoto
          }
        }
      });
      await inventory.save();

      const updateCars: any[] = [];
      for (const venue of carsByVenue) {
        const inventoryCars: Partial<IInventoryCar>[] = [];
        const { name } = venue;
        const currentVenue = await this.checkExistVenue(name, team, company);

        let vins: string[] = venue?.cars
          ?.filter((car: Partial<ICar>) => car.vin?.length)
          .map((car: Partial<ICar>) => car?.vin);
        const dataByVIN = venue?.cars.reduce((acc: any, cur: any) => {
          return {
            ...acc,
            [cur.vin]: cur
          };
        }, {});

        let carCursor = Car.find({
          team: team._id,
          vin: {
            $in: vins
          }
        }).cursor();

        const vinsCreated: string[] = [];

        await carCursor.eachAsync(
          async (car) => {
            try {
              inventoryCars.push({
                inventory: inventory._id,
                venue: currentVenue._id,
                car: car._id,
                comments: [],
                images: []
              });
              activityHistories.push({
                team: team._id,
                company: company._id,
                user: user._id,
                type: ChoicesTypeActivity.inventory,
                car: {
                  _id: car._id,
                  vin: car.vin
                },
                inventory: {
                  _id: inventory._id,
                  name: inventory.name
                }
              });
              vinsCreated.push(car.vin);
              vins = vins.filter((vin) => vin !== car.vin);
              updateCars.push({
                name: 'updateCar',
                data: {
                  title: `updateCar ${car.vin}`,
                  currentCar: car._id,
                  car: dataByVIN[car.vin]
                }
              });
            } catch (error) {
              console.log(error);
            }
          },
          { parallel: 20 }
        );

        const createCars = [];
        for (const vin of vins) {
          const car = dataByVIN[vin];
          createCars.push({
            team: team._id,
            company: company._id,
            vin: car.vin,
            vin2: car.vin.substr(car.vin.length - 6),
            color: car.color,
            type: car.type,
            property: car.property,
            denomination: car.denomination,
            brand: car.brand,
            patent: car.patent,
            createdBy: user._id,
            status: ChoicesStatusCar.active
          });
        }
        carCursor = Car.find({
          team: team._id,
          vin: {
            $in: vins
          }
        }).cursor();
        await carCursor.eachAsync(
          async (car) => {
            try {
              inventoryCars.push({
                inventory: inventory._id,
                venue: currentVenue._id,
                car: car._id,
                comments: [],
                images: []
              });
              activityHistories.push({
                team: team._id,
                company: company._id,
                user: user._id,
                type: ChoicesTypeActivity.inventory,
                car: {
                  _id: car._id,
                  vin: car.vin
                },
                inventory: {
                  _id: inventory._id,
                  name: inventory.name
                }
              });
            } catch (error) {
              console.log(error);
            }
          },
          { parallel: 20 }
        );
        console.log('inventoryCars', inventoryCars.length);
        await InventoryCar.insertMany(inventoryCars);
        if (moment().isSameOrAfter(refresh)) {
          refresh = refresh.clone().add(2, 'seconds');
          socket().to(`inventory-list-${team._id.toString()}`).emit('REFRESH', {
            update: true
          });
          socket().to(`stock-${team._id.toString()}`).emit('REFRESH', {
            update: true
          });
        }
      }

      // mongoose.set('debug', true);
      await Inventory.findByIdAndUpdate(inventory._id, {
        status: ChoicesStatusInventory.inProcess
      });
      socket().to(`inventory-list-${team._id.toString()}`).emit('REFRESH', {
        update: true
      });
      socket().to(`stock-${team._id.toString()}`).emit('REFRESH', {
        update: true
      });

      await Promise.all([
        await ActivityHistory.insertMany(activityHistories),
        await this.sendNotification(
          notification,
          inventory,
          user,
          venuesIDs,
          team
        )
      ]);
      this.queue.addBulk(updateCars);
      // mongoose.set('debug', false);
      done(null, {});
    } catch (e) {
      logger.error(`create: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${user._id}, email: ${user.email}}`);
      /* istanbul ignore next */
      console.log(e);
      done(e);
    }
  }

  private async sendNotification(
    notification: boolean,
    inventory: IInventoryModel,
    user: IUserModel,
    venuesIDs: string[],
    team: any
  ) {
    return new Promise(async (resolve) => {
      if (process.env.ENV === 'production' && notification) {
        const usersIDs = await User.find(
          {
            venue: {
              $in: venuesIDs
            },
            team
          },
          {
            _id: true
          }
        );
        pushService.massiveSend(
          'Nuevo inventario',
          `Se ha iniciado el inventario "${inventory.name}"`,
          'Ya puedes empezar a escanear',
          usersIDs.map((user) => user._id.toString())
        );
      }
      if (process.env.ENV === 'production') {
        const currentTeam = await Team.findById(user.team._id);
        emailQueue.queue.add(
          'email',
          {
            from: '',
            title: `Inventory Notification`,
            to: `"Soporte"<soporte@osacontrol.com>`,
            subject: `${user.firstName} ha creado un inventario en ${
              currentTeam!.name
            }`,
            text: `Hola Soporte

          Se ha creado un nuevo inventario.

          Team: ${team.name}
          Usuario: ${user.firstName} ${user.lastName}
          ENV: ${process.env.ENV}

          En caso de dudas o consultas puedes contactarte a soporte@osacontrol.com o a nuestro twitter@TaskforceOSA.`,
            view: 'alerts/inventoryNotification',
            context: {
              team: currentTeam,
              user: user,
              env: process.env.ENV
            }
          },
          { attempts: 3, backoff: 1000 }
        );
      }
      resolve({});
    });
  }

  private async checkExistVenue(
    name: string,
    team: any,
    company: any
  ): Promise<IVenueModel> {
    const venueRegExp = new RegExp(`^${name.trim()}$`, 'i');
    let venue: IVenueModel | null = await Venue.findOne({
      team,
      company,
      $or: [
        {
          name: venueRegExp
        },
        {
          name: { $regex: venueRegExp }
        },
        {
          name: name
        }
      ]
    });
    // if you are not in the company, try in the team
    if (!venue) {
      venue = await Venue.findOne({
        team,
        $or: [
          {
            name: venueRegExp
          },
          {
            name: { $regex: venueRegExp }
          },
          {
            name: name
          }
        ]
      });
    }
    // if you are not in the company or in the team, it will be created
    if (!venue) {
      venue = new Venue({
        name: name.trim(),
        team,
        company
      });
      await venue.save();
    }
    return venue;
  }

  private async processUpdateCar(
    job: Queue.Job<any>,
    done: Queue.DoneCallback
  ) {
    if (this.processJob) {
      const { car } = job.data;
      try {
        const carToUpdate = await CarModel.findById(job.data.currentCar);
        let update = false;
        if (carToUpdate) {
          if (
            car.color?.length &&
            carToUpdate.color?.trim()?.toUpperCase() !==
              car.color?.trim()?.toUpperCase()
          ) {
            update = true;
            carToUpdate.color = car.color;
          }
          if (
            car.denomination?.length &&
            carToUpdate.denomination?.trim()?.toUpperCase() !==
              car.denomination?.trim()?.toUpperCase()
          ) {
            update = true;
            carToUpdate.denomination = car.denomination;
          }
          if (
            car.brand?.length &&
            carToUpdate.brand?.trim()?.toUpperCase() !==
              car.brand?.trim()?.toUpperCase()
          ) {
            update = true;
            carToUpdate.brand = car.brand;
          }
          if (
            car.property?.length &&
            carToUpdate.property?.trim()?.toUpperCase() !==
              car.property?.trim()?.toUpperCase()
          ) {
            update = true;
            carToUpdate.property = car.property;
          }
          if (
            car.type?.length &&
            carToUpdate.type?.trim()?.toUpperCase() !==
              car.type?.trim()?.toUpperCase()
          ) {
            update = true;
            carToUpdate.type = car.type;
          }
          if (
            car.patent?.length &&
            carToUpdate.patent?.trim()?.toUpperCase() !==
              car.patent?.trim()?.toUpperCase()
          ) {
            update = true;
            carToUpdate.patent = car.patent;
          }
          // mongoose.set('debug', true);
          if (update) {
            await carToUpdate.save();
            logger.info(
              `InventoryQueue.updateCar ${job.data.car.vin} updated.`
            );
          } else {
            logger.info(
              `InventoryQueue.updateCar ${job.data.car.vin} no updated`
            );
          }
          // mongoose.set('debug', false);
        }
        done(null, {});
      } catch (e) {
        done(e);
      }
    }
  }
}

const inventoryQueue = new InventoryQueue();
export default inventoryQueue;
