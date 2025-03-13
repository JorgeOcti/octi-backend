import { Response } from 'express';
import { PaginateOptions, PaginateResult, Types } from 'mongoose';
import { IRequest } from '../../../interfaces/global.interface';
import { socket } from '../../../services/socket.service';
import Car, { ChoicesStatusCar, ICarModel } from '../../models/car.model';
// import carTracker from '../tracker/car.tracker';
import logger from '../../../services/logger.service';
import History from '../../models/history.model';
import { ModuleHistory, StatusHistory } from '../../models/history.types';

class AdminCarController {
  constructor() {
    this.index = this.index.bind(this);
    this.indexDetail = this.indexDetail.bind(this);
    this.imports = this.imports.bind(this);
    this.importCars = this.importCars.bind(this);
    this.apiListCars = this.apiListCars.bind(this);
  }

  public async index(req: IRequest, res: Response) {
    /* istanbul ignore else */
    if (req.user.hasPermission('viewCar')) {
      res.render('app/index', { token: await req.user.generateToken() });
    } else {
      res.status(403).render('403');
    }
  }

  public async indexDetail(req: IRequest, res: Response) {
    const { id } = req.params;
    const team = req.user.team._id;
    /* istanbul ignore else */
    if (
      req.user.hasPermission('viewCar') &&
      Types.ObjectId.isValid(id) &&
      (await Car.find({ _id: id, team }).countDocuments())
    ) {
      res.render('app/index', { token: await req.user.generateToken() });
    } else {
      res.redirect('/settings/cars/');
    }
  }

  public async imports(req: IRequest, res: Response): Promise<any> {
    /* istanbul ignore else */
    if (req.user.hasPermission('addCar')) {
      res.render('app/index', {
        token: await req.user.generateToken()
      });
    } else {
      res.status(403).render('403');
    }
  }

  public async importCars(req: IRequest, res: Response): Promise<any> {
    /* istanbul ignore next  */
    if (!req.user.hasPermission('addCar')) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }
    let carsToInsert: ICarModel[] = [];

    const { company } = req.user;
    const { team } = req.user;
    logger.info(`CarController.importCars email: ${req.user.email}`);
    const { cars } = req.body;
    try {
      if (cars && cars.length) {
        logger.info(`CarController.importCars cars: ${JSON.stringify(cars)}`);
        for (const car of cars) {
          if (car.vin && car.vin.length) {
            const vin2 = car.vin
              .toUpperCase()
              .trim()
              .substr(car.vin.length - 6);
            let newCar = await Car.findOne(
              {
                vin: car.vin.toUpperCase().trim(),
                team: team._id
              },
              {
                _id: true,
                type: true,
                NInterno: true,
                property: true,
                color: true,
                denomination: true,
                brand: true,
                patent: true,
                internalNumber: true,
                createdBy: true,
                createdAt: true,
                status: true
              }
            );
            if (newCar) {
              logger.info(
                `CarController.importCars updated: ${JSON.stringify(car)}`
              );
              newCar.vin2 = vin2;
              newCar.type = car.tipo ? car.tipo : newCar.type;
              newCar.property = car.propiedad ? car.propiedad : newCar.property;
              newCar.color = car.color ? car.color : newCar.color;
              newCar.denomination = car.denominacion
                ? car.denominacion
                : newCar.denomination;
              newCar.brand = car.marca ? car.marca : newCar.brand;
              newCar.patent = car.patente ? car.patente : newCar.patent;
              newCar.internalNumber = car.NInterno
                ? car.NInterno
                : newCar.internalNumber;
              newCar.createdBy = req.user;
              newCar.status = ChoicesStatusCar.active;
              await newCar.save();
            } else {
              carsToInsert.push({
                vin: car.vin,
                vin2,
                type: car.tipo ? car.tipo : '',
                color: car.color ? car.color : '',
                property: car.propiedad ? car.propiedad : '',
                denomination: car.denominacion ? car.denominacion : '',
                brand: car.marca ? car.marca : '',
                patent: car.patente ? car.patente : '',
                internalNumber: car.NInterno ? car.NInterno : '',
                company: company._id,
                team: team._id,
                createdBy: req.user,
                status: ChoicesStatusCar.active
              } as ICarModel);
            }
            // io.to(req.user._id).emit('STATUS-CARS', {newCar});
          }
        }

        const data = await Car.insertMany(carsToInsert);
        for (let car of data) {
          logger.info(
            `CarController.importCars created: ${JSON.stringify(car)}`
          );
          let history = await new History({
            status: StatusHistory.created,
            module: ModuleHistory.import,
            car: car._id,
            team: team._id,
            company: company._id,
            createdBy: car.createdBy,
            executedAt: car.createdAt,
            current: true
          }).save();
          await Car.updateOne(
            {
              _id: car
            },
            {
              $set: {
                event: history._id
              }
            }
          );
        }
        socket().to(req.user._id).emit('FINISH-IMPORT', { finish: true });
      }
      logger.info(`CarController.importCars: Finish importing`);
      res.json({
        status: 200
      });
    } catch (e) {
      /* istanbul ignore next */
      console.log(e);
    }
  }

  public async apiListCars(req: IRequest, res: Response): Promise<any> {
    /* istanbul ignore next */
    if (!req.user.hasPermission('viewCar')) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }
    const { page, pageSize, search, brands } = req.query as {
      page: string;
      pageSize: string;
      search: string;
      brands: string;
    };
    const team = req.user.team._id;
    // paginate options
    const options: PaginateOptions = {
      select: {
        vin: true,
        vin2: true,
        brand: true,
        patent: true,
        denomination: true,
        color: true,
        internalNumber: true,
        invoice: true,
        entry: true,
        material: true,
        client: true,
        bl: true,
        createdAt: true,
        updatedAt: true
      },
      sort: {
        createdAt: -1
      },
      customLabels: {
        totalDocs: 'total',
        docs: 'docs',
        limit: 'perPage',
        page: 'currentPage',
        nextPage: 'next',
        prevPage: 'prev',
        totalPages: 'pages',
        pagingCounter: 'si'
      },
      allowDiskUse: true,
      page: parseInt(page ? page : '1', 10),
      limit: parseInt(pageSize ? pageSize : '20', 10),
      lean: true
    };
    try {
      logger.info(
        `CarController.apiListCars email: ${
          req.user.email
        }, query: ${JSON.stringify(req.query)}`
      );

      let filter: any = req.user.company.handler ?
        { $or: [{company: req.user.company._id }, {handlerCompany: req.user.company._id}] } :
        {
          $and: [
            {
              vin: {
                $nin: ['', null]
              },
              team
            }
          ]
        }



      if ((req.user.userBrands && req.user.userBrands.length > 0) || brands) {
        let brandRelated = req.user.userBrands ?
          req.user.userBrands :
          brands.split(',').map((brand: string) => new Types.ObjectId(brand));
        filter = {
          $and: [
            {
              vin: {
                $nin: ['', null]
              },
              team,
              brandRelated: {
                $in: brandRelated
              }
            }
          ]
        };
      }

      logger.info(`CarController.apiListCars filter: ${JSON.stringify(filter)}`);

      const cars = await this.getCars(
        filter,
        options,
        search
      );
      // validate exist page
      /* istanbul ignore if  */
      if (options.page && cars.pages && cars.pages < options.page) {
        res.status(400).json({
          error: 'La página solicitada no existe.',
          status: 200
        });
      } else {
        res.json({
          count: cars.total,
          pages: cars.pages,
          hasPrevious: cars.hasPrevious,
          hasNextPage: cars.hasNextPage,
          results: cars.docs,
          status: 200
        });
      }
    } catch (e) {
      /* istanbul ignore next  */
      if (e) {
        console.log('e', e);
        res.status(500).json(e);
      }
    }
  }

  private getCars(
    filter: any,
    options: PaginateOptions,
    search?: string
  ): Promise<PaginateResult<ICarModel>> {
    if (search && search.length) {
      if (search && search.length) {
        filter = {
          ...filter,
          $text: { $search: search }
        };
        options = {
          ...options,
          sort: { score: { $meta: 'textScore' } }
        };
      }
    }

    return new Promise((resolve, reject) => {
      Car.paginate!(filter, options, (err, result) => {
        /* istanbul ignore if */
        if (err) {
          reject(err);
        }
        resolve(result);
      });
    });
  }
}

export default new AdminCarController();
