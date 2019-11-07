import {Response} from 'express';
import {PaginateOptions, PaginateResult} from 'mongoose';
import {IRequest} from '../../../interfaces/global.interface';
import Inventory from '../../../inventory/models/inventory.model';
import {io} from '../../../server';
import * as moment from 'moment';
import User from '../../models/user.model';
import Venue, {IVenueModel} from '../../models/venue.model';
import * as excel from "exceljs";
import * as tempfile from "tempfile";
import {Alignment} from "exceljs";

class AdminVenueController {

  constructor() {
    this.index = this.index.bind(this);
    this.getVenues = this.getVenues.bind(this);
    this.apiListVenues = this.apiListVenues.bind(this);
    this.apiCreateVenue = this.apiCreateVenue.bind(this);
    this.apiUpdateVenue = this.apiUpdateVenue.bind(this);
    this.apiDeleteVenue = this.apiDeleteVenue.bind(this);
  }

  public async index(req: IRequest, res: Response) {
    /* istanbul ignore else  */
    if (req.user.hasPermission('viewVenue')) {
      res.render('app/index', {token: await req.user.generateToken()});
    } else {
      res.status(403).render('403');
    }
  }

  public async accessByVenue(req: IRequest, res: Response) {
    const {team} = req.user;
    const workbook = new excel.Workbook();
    const worksheetSend = workbook.addWorksheet('Sucursales', {
      properties: {
        defaultRowHeight: 30
      },
      pageSetup: {
        fitToPage: true, fitToHeight: 100, fitToWidth: 1
      }
    });
    worksheetSend.views = [{
      state: 'frozen',
      xSplit: 1,
      ySplit: 1,
      topLeftCell: 'B2',
      activeCell: 'A1'
    }];
    const sendColumns: any[] = [{
      header: "Sucursal\r\n(FILAS ENVIAN / COLUMNAS RECIBEN)",
      key: "sucursal",
      width: 30,
      alignment: {
        wrapText: true
      }
    }];
    const sendRows = [];

    const venues = await Venue.find({deleted: false, team}).sort('name');
    for (const venue of venues) {
      sendColumns.push({
        header: venue.name, key: venue._id.toString(), width: 5,
        style: {
          alignment: {
          vertical: 'middle',
          horizontal: 'center'
          }
        }
      });
      let dataSend:any = {};
      for(const to of venue.sendTo){
        dataSend[to as any] = "X";
      }
      sendRows.push({
        sucursal: venue.name,
        ...dataSend
      });
    }

    worksheetSend.columns = sendColumns;
    worksheetSend.autoFilter = {
      from: 'A1',
      to: {
        row: 1,
        column: sendColumns.length
      }
    };
    worksheetSend.addRows(sendRows);
    worksheetSend.getColumn(1).eachCell((cell) => {
      cell.alignment = {
        vertical: 'middle',
        textRotation: 0,
        wrapText: true
      };
      cell.font = {
        bold: true,
      };
    });
    worksheetSend.getRow(1).eachCell((cell) => {
      const alignment:Partial<Alignment> = {
        vertical: 'middle',
        horizontal: 'center',
        textRotation: 0,
        wrapText: true
      };
      if(parseInt(cell.col, 10) !== 1){
        alignment.textRotation=  90
      }
      cell.alignment = alignment;
      cell.font = {
        bold: true,
      };
    });

    const tempFilePath = tempfile('.xlsx');
    await workbook.xlsx.writeFile(tempFilePath);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=acceso-sucursales-${moment().format('YYYY-MM-DD')}.xlsx`
    );
    return res.sendFile(tempFilePath);
  }

  public async apiListVenues(req: IRequest, res: Response): Promise<any> {
    if (!req.user.hasPermission('viewVenue') && !req.user.hasPermission('viewUser')) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }
    const {team} = req.user;
    const {page, pageSize} = req.query;
    // paginate options
    const options: PaginateOptions = {
      select: {
        _id: true,
        name: true,
        lat: true,
        lng: true,
        receptionCarriers: true,
        shippingCarriers: true,
        sendTo: true,
        receiveFrom: true,
        type: true,
        updatedAt: true,
        createdAt: true
      },
      populate: [{
        path: 'receptionCarriers',
        select: ['_id', 'name']
      }, {
        path: 'shippingCarriers',
        select: ['_id', 'name']
      }, {
        path: 'sendTo',
        select: ['_id', 'name']
      }, {
        path: 'receiveFrom',
        select: ['_id', 'name']
      }, {
        path: 'users',
        select: ['_id']
      }, {
        path: 'participants',
        select: ['_id']
      }, {
        path: 'region',
        select: ['name']
      }, {
        path: 'company',
        select: ['name']
      }],
      lean: true,
      sort: {
        name: 1
      },
      page: parseInt(page ? page : 1, 10),
      limit: parseInt(pageSize ? pageSize : 20, 10)
    };
    try {
      const venues = await this.getVenues({
        deleted: false,
        team
      }, options);
      /* istanbul ignore if  */
      if (options.page && venues.pages && venues.pages < options.page) {
        res.status(400).json({
          message: 'La página solicitada no existe.',
          status: 400
        });
      } else {
        res.json({
          count: venues.total,
          pages: venues.pages,
          hasPrevious: options.page && options.page > 1 && venues.pages && venues.pages >= options.page,
          hasNext: options.page && venues.pages && venues.pages > options.page,
          results: venues.docs,
          status: 200
        });
      }
    } catch (e) {
      /* istanbul ignore next  */
      if (e) {
        res.status(500).json(e);
      }
    }
  }

  public async apiCreateVenue(req: IRequest, res: Response): Promise<any> {
    if (!req.user.hasPermission('addVenue')) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }
    const {
      name, lat, lng, type, company, sendTo, receiveFrom,
      receptionCarriers, shippingCarriers, region
    } = req.body;
    const {team} = req.user;
    if (!name || !name.trim().length) {
      res.status(400).json({
        message: 'El nombre es requerido.',
        status: 400
      });
    }
    try {
      const existVenue = await Venue.find({
        name,
        team
      });
      if (existVenue.length) {
        res.status(400).json({
          message: 'Sucursal ya existe.',
          status: 400
        });
      } else {
        const newVenue = await new Venue({
          name,
          lat,
          lng,
          team,
          company,
          region,
          sendTo,
          receiveFrom,
          receptionCarriers,
          shippingCarriers,
          type
        }).save();
        // reverse assing send to and reveive from
        const id = newVenue._id;
        await Venue.update({_id: {$in: receiveFrom}, team, sendTo: {$ne: id}}, {$push: {sendTo: id}}, {multi: true});
        await Venue.update({_id: {$nin: receiveFrom}, team, sendTo: id}, {$pull: {sendTo: id}}, {multi: true});
        await Venue.update({_id: {$in: sendTo}, team, receiveFrom: {$ne: id}}, {$push: {receiveFrom: id}}, {multi: true});
        await Venue.update({_id: {$nin: sendTo}, team, receiveFrom: id}, {$pull: {receiveFrom: id}}, {multi: true});
        io.to(`venue-list-${team}`).emit('REFRESH', {
          update: true,
          updatedBy: req.user._id
        });
        res.status(201).json({
          message: 'Sucursal agregada satisfactoriamente.',
          venue: await newVenue.populate([{
            path: 'company',
            select: ['_id', 'name']
          }, {
            path: 'region',
            select: ['_id', 'name']
          }, {
            path: 'sendTo',
            select: ['_id', 'name']
          }, {
            path: 'receiveFrom',
            select: ['_id', 'name']
          }, {
            path: 'receptionCarriers',
            select: ['_id', 'name']
          }, {
            path: 'shippingCarriers',
            select: ['_id', 'name']
          }])
        });
      }
    } catch (e) {
      /* istanbul ignore next  */
      console.log(e);
      /* istanbul ignore next  */
      res.status(500).json(e);
    }
  }

  public async apiUpdateVenue(req: IRequest, res: Response): Promise<any> {
    /* istanbul ignore next  */
    if (!req.user.hasPermission('changeVenue')) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }
    const {id} = req.params;
    const {team} = req.user;
    const {
      name, lat, lng, type, company, sendTo, receiveFrom,
      receptionCarriers, shippingCarriers, region
    } = req.body;
    if (!name || !name.length) {
      res.status(400).json({
        message: 'The name is are required',
        status: 400
      });
    }
    try {
      const venue = await Venue.findOneAndUpdate({
        _id: id,
        team
      }, {
        name,
        lat,
        lng,
        company,
        region,
        sendTo,
        receiveFrom,
        shippingCarriers,
        receptionCarriers,
        type
      }, {
        new: true
      }).populate([{
        path: 'company',
        select: ['_id', 'name']
      }, {
        path: 'region',
        select: ['_id', 'name']
      }, {
        path: 'sendTo',
        select: ['_id', 'name']
      }, {
        path: 'receiveFrom',
        select: ['_id', 'name']
      }, {
        path: 'receptionCarriers',
        select: ['_id', 'name']
      }, {
        path: 'shippingCarriers',
        select: ['_id', 'name']
      }]);
      if (venue) {
        // fix the "company" to users in this venue
        await User.update({venue: id}, {company: venue.company._id}, {multi: true});
        // reverse assing send to and reveive from
        await Venue.update({_id: {$in: receiveFrom}, team, sendTo: {$ne: id}}, {$push: {sendTo: id}}, {multi: true});
        await Venue.update({_id: {$nin: receiveFrom}, team, sendTo: id}, {$pull: {sendTo: id}}, {multi: true});
        await Venue.update({_id: {$in: sendTo}, team, receiveFrom: {$ne: id}}, {$push: {receiveFrom: id}}, {multi: true});
        await Venue.update({_id: {$nin: sendTo}, team, receiveFrom: id}, {$pull: {receiveFrom: id}}, {multi: true});
        const response = {
          message: 'Sucursal editada satisfactoriamente.',
          venue
        };
        io.to(`venue-list-${team}`).emit('REFRESH', {
          update: true,
          updatedBy: req.user._id
        });
        res.status(200).json(response);
      } else {
        const response = {
          id,
          message: 'Sucursal no encontrada'
        };
        res.status(400).json(response);
      }
    } catch (e) {
      /* istanbul ignore next  */
      console.log(e);
      /* istanbul ignore next  */
      res.status(500).json(e);
    }
  }

  public async apiDeleteVenue(req: IRequest, res: Response): Promise<any> {
    if (!req.user.hasPermission('deleteVenue')) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }
    const {id} = req.params;
    const {company, team} = req.user;
    try {
      const inventories = await Inventory.find({
        $or: [{
          venues: id
        }, {
          'cars.venue': id
        }, {
          'cars.venueFound': id
        }], company
      }, {
        name: true
      });
      if (inventories && inventories.length) {
        const textInventories = inventories.map((inventory) => (inventory.name)).join('\n- ');
        res.status(400).json({
          message: `La sucursal no ha podido ser eliminada porque está utilizada en los siguientes inventarios : \n- ${textInventories}`
        });
      } else {
        const venue = await Venue.findOne({
          _id: id,
          team
        }).populate([{
          path: 'users',
          select: ['_id']
        }, {
          path: 'participants',
          select: ['_id']
        }]);
        if (venue) {
          if (venue.users && venue.users.length) {
            res.status(400).json({
              message: 'La sucursal no ha podido ser eliminada porque aún tiene usuarios asignados.'
            });
          } else if (venue.participants && venue.participants.length) {
            res.status(400).json({
              message: 'La sucursal no ha podido ser eliminada porque aún tiene revisiones asignadas.'
            });
          } else {
            await venue.remove();
            // clear venues
            await Venue.update({team, sendTo: id}, {$pull: {sendTo: id}}, {multi: true});
            await Venue.update({team, receiveFrom: id}, {$pull: {receiveFrom: id}}, {multi: true});
            const response = {
              message: 'Sucursal eliminada satisfactoriamente.',
              id: venue._id
            };
            io.to(`venue-list-${team}`).emit('REFRESH', {
              update: true,
              updatedBy: req.user._id
            });
            res.status(200).json(response);
          }
        } else {
          const response = {
            id,
            message: 'Esta sucursal ya ha sido eliminada.'
          };
          res.status(200).json(response);
        }
      }
    } catch (e) {
      /* istanbul ignore next  */
      res.status(500).json(e);
    }
  }

  private getVenues(filter: any, options: PaginateOptions): Promise<PaginateResult<IVenueModel>> {
    return new Promise((resolve, reject) => {
      Venue.paginate(filter, options, (err, result) => {
        /* istanbul ignore next  */
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }
}

export default new AdminVenueController();
