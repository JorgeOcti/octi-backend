import * as Queue from 'bull';

import CarModel, { ChoicesStatusCar } from '../../app/models/car.model';
import Inventory, {
  ChoicesStatusInventory,
  IInventoryModel
} from '../models/inventory.model';
import Venue, { IVenueModel } from '../../app/models/venue.model';

import ActivityHistory from '../../billing/models/activityHistory.model';
import { ChoicesTypeActivity } from '../../billing/models/activiHistory.types';
import { IActivityHistoryInterface } from '../../billing/interfaces/activityHistory.interface';
import { IContentDetail, IInventoryCar } from '../interfaces/inventory.interface';
import { IUserModel } from '../../app/schemas/user.schema';
import InventoryCar from '../models/inventoryCar.model';
import Team from '../../app/models/team.model';
import User from '../../app/models/user.model';
import { createRedisClient } from '../../services/redis.service';
import emailQueue from '../../app/tasks/email.task';
import logger from '../../services/logger.service';
import pushService from '../../services/push.service';
import { socket } from '../../services/socket.service';
import moment = require('moment');
import VirtualInventory from '../models/virtualInventory.model';
import Company from '../../app/models/company.model';
import { ModuleHistory, StatusHistory } from '../../app/models/history.types';
import History from '../../app/models/history.model';

interface IInventoryQueueData {
  userID: string;
  name: string;
  manualPhoto: boolean;
  reportPhoto: boolean;
  notification: boolean;
  carsByVenue: any[];
  venuesIDs: string[];
  inventoryID: any;
}

interface IContainerInventoryQueueData {
  userID: string;
  name: string;
  inventoryID: string;
  carsByContainer: any;
  venueID: string;
}

class InventoryQueue {
  public queue: Queue.Queue;
  readonly processJob: boolean = true;
  readonly debug: boolean = false;

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
    this.queue.process('createContainerInventory', this.processCreateContainerInventory);
    this.queue.process('updateCar', this.processUpdateCar);
  }

  private async processCreateContainerInventory(
    job: Queue.Job<IContainerInventoryQueueData>,
    done: Queue.DoneCallback
  ) {
    const { userID, inventoryID, venueID } = job.data;
    logger.info(`InventoryQueue.processCreateContainerInventory userID: ${userID}`);
    let { carsByContainer } = job.data;
    let user = (await User.findById(userID).populate([
      { path: 'company' },
      { path: 'team' }
    ])) as IUserModel;
    let venue = (await Venue.findById(venueID)) as IVenueModel;
    try{
      const { company, team } = user;
      const activityHistories: IActivityHistoryInterface[] = [];
      const inventory = await Inventory.findById(inventoryID)
      let containersByBIC: any = {};
      let inventoryContainers = [];
      let virtualInventories: any = {};

      for (const BIC of Object.keys(carsByContainer)) {
        let container = carsByContainer[BIC].container;
        let currentContainer = await CarModel.findOne({
          team,
          vin: container.vin.trim()
        });
        if (!currentContainer) {
          currentContainer = new CarModel({
            ...container,
            team,
            company
          })
          await currentContainer.save();
        }

        const rutCompany:string = container.extra["RUT Cliente"];
        let clientCompanyId = null;

        let clientCompany =  await Company.findOne({
          rut: rutCompany.trim(),
        });
        // extra nave - extra cliente
        if(clientCompany) {
          container.extra["Cliente Razón Social"] = clientCompany.name
          clientCompanyId = clientCompany._id
        } else {
          // Creo el company
          let existCompanyTeam = await Team.findOne({
            name: rutCompany.trim()
          });

          if (!existCompanyTeam) {
            const newTeam = await new Team({
              name: rutCompany.trim()
            }).save();
            existCompanyTeam = newTeam;
          }

          clientCompany = new Company({
            name: container.extra["Cliente Razón Social"],
            businessName: container.extra["Cliente Razón Social"],
            rut: rutCompany.trim(),
            team: existCompanyTeam,
            createdBy: user._id,
            active: true,
            deleted: false,
            handler: false,
          });

          clientCompany = await clientCompany.save();

          clientCompanyId = clientCompany._id
        }

        let virtualInventoryName = `${container.extra["Nave"]} - ${container.extra["Cliente Razón Social"]}`;
        if (!Object.hasOwn(virtualInventories, virtualInventoryName)) {
          let virtualInventory = await VirtualInventory.findOne({
            team,
            company,
            //clientCompany: clientCompanyId,
            name: virtualInventoryName
          });
          if (!virtualInventory) {
            virtualInventory = new VirtualInventory({
              team,
              company,
              clientCompany: clientCompanyId,
              name: virtualInventoryName,
              status: ChoicesStatusInventory.inProcess
            });
            await virtualInventory.save();
          }else if(virtualInventory.status === ChoicesStatusInventory.finalized){
            await VirtualInventory.updateOne({_id: virtualInventory._id}, {status:ChoicesStatusInventory.inProcess})
          }
          virtualInventories[virtualInventoryName] = virtualInventory;
        }
        containersByBIC[BIC] = currentContainer._id;

        let contentDetails: IContentDetail[] = [];
        carsByContainer[BIC].cars.map((item: any)=> {
          if (!item.isCar) {
            let qty = parseInt(item.extra['Cantidad'])
            contentDetails.push({
              code: '',
              item: item.description,
              quantity: isNaN(qty) ? 1 : qty,
              extra: item.extra
            })
          } else {
            contentDetails.push({
              code: item.vin,
              item: `${item.denomination} - ${item.brand} - ${item.vin}`,
              quantity: 1,
              extra: item.extra
            })
          }
        });


        inventoryContainers.push({
          inventory: inventory!._id,
          virtualInventory: virtualInventories[virtualInventoryName]._id,
          venue: venue._id,
          car: currentContainer._id,
          extra: container.extra,
          comments: [],
          images: [],
          contentDescription: carsByContainer[BIC].cars.filter((c: any) => !c.isCar).map((c: any) => `${c.description} - ${c.brand}`),
          contentDetails,
        });
        activityHistories.push({
          team: team._id,
          company: company._id,
          user: user._id,
          type: ChoicesTypeActivity.inventory,
          car: {
            _id: container._id,
            vin: container.vin
          },
          inventory: {
            _id: inventoryID,
            name: job.data.name
          }
        });
      }

      logger.info(
        `InventoryQueue.processCreateContainerInventory {venue: ${venue._id}, inventoryContainers: ${inventoryContainers.length}}`
      );

      inventoryContainers = await InventoryCar.insertMany(inventoryContainers);
      inventoryContainers.forEach((container: any) => {
        containersByBIC[container.extra.BIC] = container._id;
      })

      let inventoryCars = [];

      for (const BIC of Object.keys(carsByContainer)) {
        let container = carsByContainer[BIC].container;
        const rutContainerCompany:string = container.extra["RUT Cliente"];
        let clientContainerCompany =  await Company.findOne({
          rut: rutContainerCompany.trim(),
        });
        if(clientContainerCompany) container.extra["Cliente Razón Social"] = clientContainerCompany.name
        let virtualInventoryName = `${container.extra["Nave"]} - ${container.extra["Cliente Razón Social"]}`;
        let virtualInventory = virtualInventories[virtualInventoryName];
        const cars = carsByContainer[BIC].cars.filter((c: any) => c.isCar);

        for (const car of cars) {

          const rutCompany:string = car.extra["RUT Cliente"];
          const companyName = car.extra["Cliente Razón Social"];

          let clientCompany =  await Company.findOne({
            rut: rutCompany.trim(),
          });

          if (!clientCompany) {

            let existCompanyTeam = await Team.findOne({
              name: rutCompany.trim()
            });

            if (!existCompanyTeam) {
              const newTeam = await new Team({
                name: rutCompany.trim()
              }).save();
              existCompanyTeam = newTeam;
            }

            clientCompany = new Company({
              name: companyName,
              businessName: companyName,
              rut: rutCompany.trim(),
              team: existCompanyTeam,
              createdBy: user._id,
              active: true,
              deleted: false,
              handler: false,
            });

            clientCompany = await clientCompany.save();
          }

          // add client company to clientCompanies
          if (!company.clientCompanies.includes(clientCompany._id)) {
            company.clientCompanies.push(clientCompany._id);
          }

          // add handler company to handlerCompanies
          if (Array.isArray(clientCompany.handlerCompanies) && !clientCompany.handlerCompanies.includes(company._id)) {
            clientCompany.handlerCompanies.push(company._id);
          }
          await company.save();
          await clientCompany.save();

          let currentCar = await CarModel.findOne({
            team: clientCompany.team,
            company: clientCompany._id,
            handlerCompany: company,
            vin: car.vin.trim()
          });

          if (!currentCar) {
            currentCar = new CarModel({
              team: clientCompany.team,
              company: clientCompany._id,
              handlerCompany: company,
              vin: car.vin,
              vin2: car.vin.substr(car.vin.length - 6),
              color: car.color,
              type: car.type,
              property: car.property,
              denomination: car.denomination,
              brand: car.brand,
              patent: car.patent,
              createdBy: user._id,
              status: ChoicesStatusCar.active,
            });
            await currentCar.save();
          }

          inventoryCars.push({
            inventory: inventory!._id,
            virtualInventory: virtualInventory._id,
            venue: venue._id,
            car: currentCar._id,
            container: containersByBIC[BIC],
            extra: car.extra,
            comments: [],
            images: []
          });
          activityHistories.push({
            team: team._id,
            company: company._id,
            user: user._id,
            type: ChoicesTypeActivity.inventory,
            car: {
              _id: currentCar._id,
              vin: currentCar.vin
            },
            inventory: {
              _id: inventoryID,
              name: job.data.name
            }
          });
        }
      }

      logger.info(
        `InventoryQueue.processCreateContainerInventory {inventoryID: ${inventoryID}, totalInventoryCars: ${inventoryCars.length}}`
      );

      const inventoryCarSaved = await InventoryCar.insertMany(inventoryCars);
      await ActivityHistory.insertMany(activityHistories);

      await Inventory.findByIdAndUpdate(inventoryID, {
        status: ChoicesStatusInventory.inProcess,
        virtualInventories: Object.values(virtualInventories).map((virtualInventory: any) => virtualInventory._id),
        virtual: true
      });

      const promiseHistories: Promise<any>[] = [];


      inventoryCarSaved.forEach(inventoryCar => {

        promiseHistories.push((async()=>{

          await inventoryCar.populate([
            {path: 'car'}
          ]);

          return {
            status: StatusHistory.created,
            module: ModuleHistory.inventory,
            car: inventoryCar.car,
            team: inventoryCar.car.team,
            company: inventoryCar.car.company,
            handlerCompany: inventoryCar.car.handlerCompany,
            venue: inventoryCar.venue,
            inventoryCar,
            inventory: inventoryCar.inventory,
            createdBy: inventoryCar.car.createdBy,
            executedAt: inventoryCar.car.createdAt,
            current: true
          }
        })());
      });

      const resolvedHistories = await Promise.all(promiseHistories);

      if(resolvedHistories.length > 0){

        const updateHistories = resolvedHistories.map(history=>{
          return {
              car: history.car,
              team: history.team,
              company: history.company
          }
        })

        await History.updateMany(
          { $and: updateHistories },
          { $set: {current: false}}
        );

        await History.insertMany( resolvedHistories );
      }

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

  private async processCreateInventory(
    job: Queue.Job<IInventoryQueueData>,
    done: Queue.DoneCallback
  ) {
    const { userID, venuesIDs, inventoryID } = job.data;
    logger.info(`InventoryQueue.processCreateInventory userID: ${userID}`);
    let { carsByVenue, notification } = job.data;
    let user = (await User.findById(userID).populate([
      { path: 'company' },
      { path: 'team' }
    ])) as IUserModel;
    try {
      const { company, team } = user;
      const activityHistories: IActivityHistoryInterface[] = [];

      let refresh = moment();

      const inventory = await Inventory.findById(inventoryID);
      socket().to(`inventory-list-${team._id.toString()}`).emit('REFRESH', {
        update: true
      });
      socket().to(`stock-${team._id.toString()}`).emit('REFRESH', {
        update: true
      });

      const updateCars: any[] = [];
      let totalInventoryCars = 0;
      for (const venue of carsByVenue) {
        const inventoryCars: Partial<IInventoryCar>[] = [];
        const { name } = venue;
        const currentVenue = await this.checkExistVenue(name, team, company);

        // let vins: string[] = venue?.cars
        //   ?.filter((car: Partial<ICar>) => car.vin?.length)
        //   .map((car: Partial<ICar>) => car?.vin);

        // logger.info(`InventoryQueue.processCreateInventory {venue: ${currentVenue._id}, vins: ${vins.length}}`)

        const dataByVIN = venue?.cars.reduce((acc: any, cur: any) => {
          return {
            ...acc,
            [cur.vin]: cur
          };
        }, {});

        for (const car of venue.cars) {
          let currentCar = await CarModel.findOne({
            team,
            vin: car.vin.trim()
          });
          if (!currentCar) {
            currentCar = new CarModel({
              team,
              company,
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
            await currentCar.save();
          } else {
            updateCars.push({
              name: 'updateCar',
              data: {
                title: `updateCar ${car.vin}`,
                currentCar: currentCar._id,
                car: dataByVIN[car.vin]
              }
            });
          }
          inventoryCars.push({
            inventory: inventory!._id,
            venue: currentVenue._id,
            car: currentCar._id,
            comments: [],
            images: []
          });
          activityHistories.push({
            team: team._id,
            company: company._id,
            user: user._id,
            type: ChoicesTypeActivity.inventory,
            car: {
              _id: currentCar._id,
              vin: currentCar.vin
            },
            inventory: {
              _id: inventoryID,
              name: job.data.name
            }
          });
        }

        logger.info(
          `InventoryQueue.processCreateInventory {venue: ${currentVenue._id}, inventoryCars: ${inventoryCars.length}}`
        );

        totalInventoryCars += inventoryCars.length;
        await ActivityHistory.insertMany(activityHistories);
        await InventoryCar.insertMany(inventoryCars);

        if (moment().isSameOrAfter(refresh)) {
          refresh = refresh.clone().add(3, 'seconds');
          socket().to(`inventory-list-${team._id.toString()}`).emit('REFRESH', {
            update: true
          });
          socket().to(`stock-${team._id.toString()}`).emit('REFRESH', {
            update: true
          });
        }
      }

      logger.info(
        `InventoryQueue.processCreateInventory {inventoryID: ${inventoryID}, totalInventoryCars: ${totalInventoryCars}}`
      );

      // mongoose.set('debug', true);
      await Inventory.findByIdAndUpdate(inventoryID, {
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
          inventoryID,
          user,
          venuesIDs,
          team
        )
      ]);
      await this.queue.addBulk(updateCars);
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
          { attempts: 3, backoff: 1000, removeOnComplete: true }
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
