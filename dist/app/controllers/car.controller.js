"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const car_model_1 = require("../models/car.model");
const mongoose = require("mongoose");
const participant_model_1 = require("../../form/models/participant.model");
class AdminCompaniesController {
    constructor() {
        this.vinDashboard = this.vinDashboard.bind(this);
        this.vinDashboardDetail = this.vinDashboardDetail.bind(this);
        this.apiCars = this.apiCars.bind(this);
        this.apiCarDetail = this.apiCarDetail.bind(this);
        this.getCars = this.getCars.bind(this);
        this.apiParticipantDetail = this.apiParticipantDetail.bind(this);
        this.apiParticipantsPerDate = this.apiParticipantsPerDate.bind(this);
    }
    vinDashboard(req, res) {
        res.render('app/index');
    }
    async vinDashboardDetail(req, res) {
        const { id } = req.params;
        const company = req.user.company;
        // validate params
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).render('404');
        }
        try {
            // validate car exist
            const car = await car_model_1.default.findOne({
                _id: id, company
            });
            if (!car) {
                return res.status(404).render('404');
            }
            else {
                res.render('app/index');
            }
        }
        catch (e) {
            if (e)
                res.status(500).send(e);
        }
    }
    async apiParticipantsPerDate(req, res) {
        const company = req.user.company;
        try {
            const participantPerDay = await participant_model_1.default
                .aggregate([{
                    $match: {
                        company
                    }
                }, {
                    $group: {
                        // _id: {
                        //   $dateToString: {
                        //     format: '%Y-%m-%d',
                        //     date: '$createdAt'
                        //   },
                        // },
                        _id: {
                            category: {
                                $dateToString: {
                                    format: '%Y-%m-%d',
                                    date: '$createdAt'
                                },
                            },
                            user: "$user",
                        },
                        total: {
                            $sum: 1
                        }
                    }
                }, {
                    $lookup: {
                        from: "users",
                        localField: "_id.user",
                        foreignField: "_id",
                        as: "userInfo",
                    }
                }, {
                    $unwind: "$userInfo"
                }, {
                    $project: {
                        '_id.category': 1,
                        '_id.user': 1,
                        'total': 1,
                        'userInfo._id': 1,
                        'userInfo.firstName': 1,
                        'userInfo.lastName': 1,
                    }
                }, {
                    $group: {
                        _id: "$_id.category",
                        users: {
                            $push: {
                                user: "$_id.user",
                                userInfo: "$userInfo",
                                total: "$total"
                            }
                        },
                        total: { $sum: "$total" }
                    }
                }, {
                    $sort: {
                        _id: 1
                    }
                }]);
            res.json({
                data: participantPerDay,
                status: 200
            });
        }
        catch (e) {
            if (e)
                res.status(500).json(e);
        }
    }
    async apiParticipantDetail(req, res) {
        const { id } = req.params;
        const company = req.user.company;
        try {
            const participant = await participant_model_1.default
                .findOne({
                _id: id, company
            }, {
                name: true,
                user: true,
                sections: true,
                qualification: true,
                createdAt: true
            })
                .populate([{
                    path: 'user',
                    select: ['firstName', 'lastName']
                }]);
            // validate exist participant
            if (!participant) {
                res.status(404).json({
                    messsage: 'Formulario no encontrado.',
                    status: 404
                });
            }
            else {
                res.json({
                    data: participant,
                    status: 200
                });
            }
        }
        catch (e) {
            if (e)
                res.status(500).json(e);
        }
    }
    async apiCarDetail(req, res) {
        const company = req.user.company;
        const { id } = req.params;
        try {
            const car = await car_model_1.default
                .findOne({
                _id: id,
                company
            }, {
                vin: true
            })
                .populate([{
                    // reverse populate
                    path: 'participants',
                    select: ['name', 'user', 'createdAt', 'qualification'],
                    options: {
                        sort: {
                            createdAt: -1
                        }
                    },
                    // deep populate user
                    populate: [{
                            path: 'user',
                            select: ['firstName', 'lastName']
                        }]
                }]).lean();
            if (!car) {
                res.status(404).json({
                    messsage: 'Auto no encontrado.',
                    status: 404
                });
            }
            else {
                res.json({
                    data: car,
                    status: 200
                });
            }
        }
        catch (e) {
            if (e)
                res.status(500).json(e);
        }
    }
    async apiCars(req, res) {
        const company = req.user.company;
        const { page, pageSize } = req.query;
        // paginate options
        const options = {
            select: {
                vin: true
            },
            populate: [{
                    path: 'lastForm',
                    select: ['createdAt', 'user'],
                    populate: [{
                            path: 'user',
                            select: ['firstName', 'lastName']
                        }]
                }],
            sort: {
                createdAt: -1
            },
            page: parseInt(page ? page : 1),
            limit: parseInt(pageSize ? pageSize : 20),
        };
        try {
            const cars = await this.getCars(company, options);
            // validate exist page
            if (options.page && cars.pages && cars.pages < options.page) {
                res.status(400).json({
                    message: 'La página solicitada no existe.',
                    status: 200,
                });
            }
            else {
                res.json({
                    count: cars.total,
                    pages: cars.pages,
                    hasPrevious: options.page && options.page > 1 && cars.pages && cars.pages >= options.page,
                    hasNext: options.page && cars.pages && cars.pages > options.page,
                    results: cars.docs,
                    status: 200,
                });
            }
        }
        catch (e) {
            if (e)
                res.status(500).json(e);
        }
    }
    getCars(company, options) {
        return new Promise((resolve, reject) => {
            car_model_1.default.paginate({ company }, options, (err, result) => {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        });
    }
}
exports.default = new AdminCompaniesController();
//# sourceMappingURL=car.controller.js.map