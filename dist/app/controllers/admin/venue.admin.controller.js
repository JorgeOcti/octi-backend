"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const inventory_model_1 = require("../../../inventory/models/inventory.model");
const server_1 = require("../../../server");
const moment = require("moment");
const user_model_1 = require("../../models/user.model");
const venue_model_1 = require("../../models/venue.model");
const excel = require("exceljs");
const tempfile = require("tempfile");
class AdminVenueController {
    constructor() {
        this.index = this.index.bind(this);
        this.getVenues = this.getVenues.bind(this);
        this.apiListVenues = this.apiListVenues.bind(this);
        this.apiCreateVenue = this.apiCreateVenue.bind(this);
        this.apiUpdateVenue = this.apiUpdateVenue.bind(this);
        this.apiDeleteVenue = this.apiDeleteVenue.bind(this);
    }
    async index(req, res) {
        /* istanbul ignore else  */
        if (req.user.hasPermission('viewVenue')) {
            res.render('app/index', { token: await req.user.generateToken() });
        }
        else {
            res.status(403).render('403');
        }
    }
    async accessByVenue(req, res) {
        const { team } = req.user;
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
        const sendColumns = [{
                header: "Sucursal\r\n(FILAS ENVIAN / COLUMNAS RECIBEN)",
                key: "sucursal",
                width: 30,
                alignment: {
                    wrapText: true
                }
            }];
        const sendRows = [];
        const venues = await venue_model_1.default.find({ deleted: false, team }).sort('name');
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
            let dataSend = {};
            for (const to of venue.sendTo) {
                dataSend[to] = "X";
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
            const alignment = {
                vertical: 'middle',
                horizontal: 'center',
                textRotation: 0,
                wrapText: true
            };
            if (parseInt(cell.col, 10) !== 1) {
                alignment.textRotation = 90;
            }
            cell.alignment = alignment;
            cell.font = {
                bold: true,
            };
        });
        const tempFilePath = tempfile('.xlsx');
        await workbook.xlsx.writeFile(tempFilePath);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=acceso-sucursales-${moment().format('YYYY-MM-DD')}.xlsx`);
        return res.sendFile(tempFilePath);
    }
    async apiListVenues(req, res) {
        const { team } = req.user;
        const { page, pageSize, noPopulate } = req.query;
        // paginate options
        let options = {
            select: {
                _id: true,
                name: true,
                abbreviation: true,
                lat: true,
                lng: true,
                receptionCarriers: true,
                shippingCarriers: true,
                shippingMaxDays: true,
                sendToDays: true,
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
                    path: 'sendToDays.venue',
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
                    select: ['name', "marker"]
                }],
            lean: true,
            sort: {
                name: 1
            },
            page: parseInt(page ? page : "1", 10),
            limit: parseInt(pageSize ? pageSize : "20", 10)
        };
        if (noPopulate) {
            delete options.populate;
        }
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
            }
            else {
                res.json({
                    count: venues.total,
                    pages: venues.pages,
                    hasPrevious: options.page && options.page > 1 && venues.pages && venues.pages >= options.page,
                    hasNext: options.page && venues.pages && venues.pages > options.page,
                    results: venues.docs,
                    status: 200
                });
            }
        }
        catch (e) {
            /* istanbul ignore next  */
            if (e) {
                res.status(500).json(e);
            }
        }
    }
    async apiCreateVenue(req, res) {
        if (!req.user.hasPermission('addVenue')) {
            return res.status(403).json({
                message: 'No tienes permisos para esta operación'
            });
        }
        const { name, abbreviation, lat, lng, type, company, sendToDays, receiveFrom, shippingMaxDays, receptionCarriers, shippingCarriers, region } = req.body;
        const sendTo = sendToDays.map((venueDay) => venueDay.venue._id);
        const { team } = req.user;
        if (!name || !name.trim().length) {
            res.status(400).json({
                message: 'El nombre es requerido.',
                status: 400
            });
        }
        try {
            const existVenue = await venue_model_1.default.find({
                name,
                team
            });
            if (existVenue.length) {
                res.status(400).json({
                    message: 'Sucursal ya existe.',
                    status: 400
                });
            }
            else {
                const newVenue = await new venue_model_1.default({
                    name,
                    abbreviation,
                    lat,
                    lng,
                    team,
                    company,
                    region,
                    shippingMaxDays,
                    sendToDays,
                    sendTo,
                    receiveFrom,
                    receptionCarriers,
                    shippingCarriers,
                    type
                }).save();
                // reverse assing send to and reveive from
                const id = newVenue._id;
                await venue_model_1.default.update({ _id: { $in: receiveFrom }, team, sendTo: { $ne: id } }, { $push: { sendTo: id } }, { multi: true });
                await venue_model_1.default.update({ _id: { $nin: receiveFrom }, team, sendTo: id }, { $pull: { sendTo: id } }, { multi: true });
                await venue_model_1.default.update({ _id: { $in: sendTo }, team, receiveFrom: { $ne: id } }, { $push: { receiveFrom: id } }, { multi: true });
                await venue_model_1.default.update({ _id: { $nin: sendTo }, team, receiveFrom: id }, { $pull: { receiveFrom: id } }, { multi: true });
                server_1.io.to(`venue-list-${team}`).emit('REFRESH', {
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
        }
        catch (e) {
            /* istanbul ignore next  */
            console.log(e);
            /* istanbul ignore next  */
            res.status(500).json(e);
        }
    }
    async apiUpdateVenue(req, res) {
        /* istanbul ignore next  */
        if (!req.user.hasPermission('changeVenue')) {
            return res.status(403).json({
                message: 'No tienes permisos para esta operación'
            });
        }
        const { id } = req.params;
        const { team } = req.user;
        const { name, abbreviation, lat, lng, type, company, sendToDays, receiveFrom, receptionCarriers, shippingCarriers, region, shippingMaxDays } = req.body;
        const sendTo = sendToDays.map((venueDay) => venueDay.venue._id);
        if (!name || !name.length) {
            res.status(400).json({
                message: 'The name is are required',
                status: 400
            });
        }
        try {
            const venue = await venue_model_1.default.findOneAndUpdate({
                _id: id,
                team
            }, {
                name,
                abbreviation,
                lat,
                lng,
                company,
                region,
                shippingMaxDays,
                sendToDays,
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
                await user_model_1.default.update({ venue: id }, { company: venue.company._id }, { multi: true });
                // reverse assing send to and reveive from
                await venue_model_1.default.update({ _id: { $in: receiveFrom }, team, sendTo: { $ne: id } }, { $push: { sendTo: id } }, { multi: true });
                await venue_model_1.default.update({ _id: { $nin: receiveFrom }, team, sendTo: id }, { $pull: { sendTo: id } }, { multi: true });
                await venue_model_1.default.update({ _id: { $in: sendTo }, team, receiveFrom: { $ne: id } }, { $push: { receiveFrom: id } }, { multi: true });
                await venue_model_1.default.update({ _id: { $nin: sendTo }, team, receiveFrom: id }, { $pull: { receiveFrom: id } }, { multi: true });
                const response = {
                    message: 'Sucursal editada satisfactoriamente.',
                    venue
                };
                server_1.io.to(`venue-list-${team}`).emit('REFRESH', {
                    update: true,
                    updatedBy: req.user._id
                });
                res.status(200).json(response);
            }
            else {
                const response = {
                    id,
                    message: 'Sucursal no encontrada'
                };
                res.status(400).json(response);
            }
        }
        catch (e) {
            /* istanbul ignore next  */
            console.log(e);
            /* istanbul ignore next  */
            res.status(500).json(e);
        }
    }
    async apiDeleteVenue(req, res) {
        if (!req.user.hasPermission('deleteVenue')) {
            return res.status(403).json({
                message: 'No tienes permisos para esta operación'
            });
        }
        const { id } = req.params;
        const { company, team } = req.user;
        try {
            const inventories = await inventory_model_1.default.find({
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
            }
            else {
                const venue = await venue_model_1.default.findOne({
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
                    }
                    else if (venue.participants && venue.participants.length) {
                        res.status(400).json({
                            message: 'La sucursal no ha podido ser eliminada porque aún tiene revisiones asignadas.'
                        });
                    }
                    else {
                        await venue.remove();
                        // clear venues
                        await venue_model_1.default.update({ team, sendTo: id }, { $pull: { sendTo: id } }, { multi: true });
                        await venue_model_1.default.update({ team, receiveFrom: id }, { $pull: { receiveFrom: id } }, { multi: true });
                        const response = {
                            message: 'Sucursal eliminada satisfactoriamente.',
                            id: venue._id
                        };
                        server_1.io.to(`venue-list-${team}`).emit('REFRESH', {
                            update: true,
                            updatedBy: req.user._id
                        });
                        res.status(200).json(response);
                    }
                }
                else {
                    const response = {
                        id,
                        message: 'Esta sucursal ya ha sido eliminada.'
                    };
                    res.status(200).json(response);
                }
            }
        }
        catch (e) {
            /* istanbul ignore next  */
            res.status(500).json(e);
        }
    }
    getVenues(filter, options) {
        return new Promise((resolve, reject) => {
            venue_model_1.default.paginate(filter, options, (err, result) => {
                /* istanbul ignore next  */
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        });
    }
}
exports.default = new AdminVenueController();
//# sourceMappingURL=venue.admin.controller.js.map