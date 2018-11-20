"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const inventory_model_1 = require("../../../inventory/models/inventory.model");
const venue_model_1 = require("../../models/venue.model");
class AdminVenueController {
    constructor() {
        this.index = this.index.bind(this);
        this.getVenues = this.getVenues.bind(this);
        this.apiVenues = this.apiVenues.bind(this);
        this.apiAddVenue = this.apiAddVenue.bind(this);
        this.apiEditVenue = this.apiEditVenue.bind(this);
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
    async apiVenues(req, res) {
        const company = req.user.company;
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
                }],
            lean: true,
            sort: {
                createdAt: -1
            },
            page: parseInt(page ? page : 1, 10),
            limit: parseInt(pageSize ? pageSize : 20, 10)
        };
        try {
            const venues = await this.getVenues(company, options);
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
    async apiAddVenue(req, res) {
        if (!req.user.hasPermission('addVenue')) {
            return res.status(403).json({
                message: 'No tienes permisos para esta operación'
            });
        }
        const { name, type } = req.body;
        const company = req.user.company;
        if (!name || !name.trim().length) {
            res.status(400).json({
                message: 'El nombre es requerido.',
                status: 400
            });
        }
        try {
            const existVenue = await venue_model_1.default.find({
                name,
                company
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
                    type,
                    company
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
    async apiEditVenue(req, res) {
        if (!req.user.hasPermission('changeVenue')) {
            return res.status(403).json({
                message: 'No tienes permisos para esta operación'
            });
        }
        const { id } = req.params;
        const { company } = req.user;
        const { name, type } = req.body;
        if (!name || !name.length) {
            res.status(400).json({
                message: 'The name is are required',
                status: 400
            });
        }
        try {
            const venue = await venue_model_1.default.findOneAndUpdate({
                _id: id,
                company
            }, {
                name,
                type
            }, {
                new: true
            });
            if (venue) {
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
                res.status(200).json(response);
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
        const company = req.user.company;
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
                    company
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
                            message: 'La sucursal no ha podido ser eliminada porque aún tiene revisiones asignados.'
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
    getVenues(company, options) {
        return new Promise((resolve, reject) => {
            venue_model_1.default.paginate({ company }, options, (err, result) => {
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