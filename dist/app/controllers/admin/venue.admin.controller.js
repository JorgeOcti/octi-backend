"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const inventory_model_1 = require("../../../inventory/models/inventory.model");
const venue_model_1 = require("../../models/venue.model");
const user_model_1 = require("../../models/user.model");
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
        if (req.user.hasPermission('viewVenue')) {
            res.render('app/index', { token: await req.user.generateToken() });
        }
        else {
            res.status(403).render('403');
        }
    }
    async apiListVenues(req, res) {
        const { team } = req.user;
        const { page, pageSize } = req.query;
        // paginate options
        const options = {
            select: {
                _id: true,
                name: true,
                type: true,
                updatedAt: true,
                createdAt: true
            },
            populate: [{
                    path: 'users',
                    select: ['_id']
                }, {
                    path: 'participants',
                    select: ['_id']
                }, {
                    path: 'company',
                    select: ['name']
                }],
            lean: true,
            sort: {
                createdAt: -1
            },
            page: parseInt(page ? page : 1, 10),
            limit: parseInt(pageSize ? pageSize : 20, 10)
        };
        try {
            const venues = await this.getVenues({
                deleted: false,
                team
            }, options);
            // validate exist page
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
        const { name, type, company } = req.body;
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
                    company,
                    type,
                    team
                }).save();
                res.status(201).json({
                    message: 'Sucursal agregada satisfactoriamente.',
                    venue: newVenue
                });
            }
        }
        catch (e) {
            console.log(e);
            res.status(500).json(e);
        }
    }
    async apiUpdateVenue(req, res) {
        if (!req.user.hasPermission('changeVenue')) {
            return res.status(403).json({
                message: 'No tienes permisos para esta operación'
            });
        }
        const { id } = req.params;
        const { team } = req.user;
        const { name, type, company } = req.body;
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
                company,
                type
            }, {
                new: true
            }).populate([{
                    path: 'company',
                    select: ['_id', 'name']
                }]);
            if (venue) {
                // fix users in venue
                await user_model_1.default.update({ venue: id }, { company: venue.company._id }, { multi: true });
                const response = {
                    message: 'Sucursal editada satisfactoriamente.',
                    venue
                };
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
            console.log(e);
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
                        const response = {
                            message: 'Sucursal eliminada satisfactoriamente.',
                            id: venue._id
                        };
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
            res.status(500).json(e);
        }
    }
    getVenues(filter, options) {
        return new Promise((resolve, reject) => {
            venue_model_1.default.paginate(filter, options, (err, result) => {
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