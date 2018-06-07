"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_service_1 = require("../../services/redis.service");
const form_model_1 = require("../models/form.model");
const scale_model_1 = require("../models/scale.model");
const participant_model_1 = require("../models/participant.model");
const user_model_1 = require("../../app/models/user.model");
const car_model_1 = require("../../app/models/car.model");
const bson_1 = require("bson");
const moment = require("moment-timezone");
class FormController {
    constructor() {
        this.list = this.list.bind(this);
        this.detail = this.detail.bind(this);
        this.complete = this.complete.bind(this);
        this.changePreferred = this.changePreferred.bind(this);
    }
    async list(req, res) {
        const company = req.user.company;
        try {
            const forms = await this.getForms(company);
            res.json({
                data: forms,
                status: 200
            });
        }
        catch (e) {
            res.status(400).json({
                error: 'Ha ocurrido un error',
                status: 400
            });
        }
    }
    async detail(req, res) {
        const { id } = req.params;
        const company = req.user.company;
        try {
            const form = await this.getForm(id, company);
            // generate array of scale ids
            const scalesIds = [];
            form.sections.forEach((section) => {
                section.questions.forEach((question) => {
                    const scaleID = question.scale.toString();
                    if (!scalesIds.includes(scaleID)) {
                        scalesIds.push(scaleID);
                    }
                });
            });
            // get scales from db
            const scales = await this.getScales(scalesIds, company);
            res.json({
                data: {
                    form,
                    scales
                },
                status: 200
            });
        }
        catch (e) {
            res.status(400).json({
                error: 'No se encontro formularío  400',
                status: 400
            });
        }
    }
    async complete(req, res) {
        const { id } = req.params;
        const { answers, vin } = req.body;
        const company = req.user.company;
        // validate answers in body
        if (!answers) {
            return res.status(400).json({
                error: 'Debes enviar las respuestas',
                status: 400
            });
        }
        // validate vin in body
        if (!vin) {
            return res.status(400).json({
                error: 'Debes enviar el vin',
                status: 400
            });
        }
        try {
            const form = await this.getFormWithScale(id, company);
            if (form) {
                // initialize participant
                const car = await car_model_1.default.findOneOrCreate({ vin }, { vin, company });
                const newParticipant = new participant_model_1.default({
                    name: form.name,
                    company,
                    form: form._id,
                    car: car,
                    description: form.description,
                    user: req.user._id,
                    active: form.active,
                });
                // var sum sections
                let sumSectionWeigths = 0;
                let sumSectionQualifications = 0;
                for (const section of form.sections) {
                    // var sum questions
                    let sumWeigths = 0;
                    let sumQualifications = 0;
                    // array of answers
                    const newAnswers = [];
                    for (const question of section.questions) {
                        // calculate qualification and set vars of the answer
                        const questionID = question._id.toString();
                        // get selected answer
                        const answer = answers.hasOwnProperty(questionID) ? answers[questionID] : null;
                        // find choice selected
                        const choice = question.scale.choices.find((choice) => {
                            return answer ? choice._id.toString() === answer.value : false;
                        });
                        // calculate qualification
                        let qualification = 0;
                        if (choice) {
                            qualification = (100 / question.scale.maxValue) * choice.value;
                        }
                        sumQualifications += (qualification * question.weight);
                        sumWeigths += question.weight;
                        // generate answer
                        newAnswers.push({
                            _id: question._id,
                            question: question.question,
                            shortName: question.shortName,
                            scale: question.scale,
                            risk: question.risk,
                            observe: question.observe,
                            answer: answer ? new bson_1.ObjectID(answer.value) : null,
                            qualification,
                            weight: question.weight,
                            order: question.order,
                        });
                    }
                    // calculate section qualification
                    const sectionQualification = sumQualifications ? sumQualifications / sumWeigths : 0;
                    sumSectionQualifications += (sectionQualification * section.weight);
                    sumSectionWeigths += section.weight;
                    // generate answer section
                    newParticipant.sections.push({
                        _id: section._id,
                        name: section.name,
                        shortName: section.shortName,
                        answers: newAnswers,
                        qualification: sectionQualification,
                        weight: section.weight,
                        order: section.order,
                    });
                }
                // calculate participant qualification
                const formQualification = sumSectionQualifications ? sumSectionQualifications / sumSectionWeigths : 0;
                newParticipant.qualification = formQualification;
                try {
                    // save the participant
                    await newParticipant.save();
                    car.lastForm = newParticipant;
                    await car.save();
                    const today = moment().startOf('day');
                    const tomorrow = moment(today).add(1, 'days');
                    const count = await participant_model_1.default.count({
                        user: req.user,
                        createdAt: {
                            $gte: today.toDate(),
                            $lt: tomorrow.toDate()
                        }
                    });
                    return res.json({
                        data: {
                            id,
                            count,
                            vin,
                            qualification: formQualification
                        },
                        status: 200
                    });
                }
                catch (e) {
                    // return error, if the form could not be recorded
                    return res.status(400).json({
                        error: e,
                        status: 400
                    });
                }
            }
            else {
                // return error, if the form could not find
                return res.status(400).json({
                    error: 'No se ha encontrado el formularío',
                    status: 400
                });
            }
        }
        catch (e) {
            return res.status(400).json({
                error: e,
                status: 400
            });
        }
    }
    async changePreferred(req, res) {
        let { form } = req.body;
        const company = req.user.company;
        try {
            const user = await user_model_1.default.findOne({ _id: req.user._id, company, active: true });
            // validate exist user
            if (user) {
                form = await form_model_1.default.findOne({ _id: form, company });
                // validate exist form
                if (form) {
                    user.preferred = form;
                    await user.save();
                    res.status(200).json({
                        message: 'Se ha actualizado',
                        status: 200
                    });
                }
                else {
                    res.status(400).json({
                        message: 'Formualrio no encontrado',
                        status: 400
                    });
                }
            }
            else {
                res.status(400).json({
                    message: 'Usuario no encontrado',
                    status: 400
                });
            }
        }
        catch (e) {
            res.status(400).json({
                error: 'Ha ocurrido un error',
                status: 400
            });
        }
    }
    getForms(company) {
        const keyCache = `forms`;
        return new Promise((resolve, reject) => {
            redis_service_1.default.get(keyCache, async (error, result) => {
                if (result) {
                    console.log(`cache: ${keyCache}`);
                    resolve(JSON.parse(result));
                }
                else {
                    form_model_1.default
                        .find({
                        company
                    }, {
                        _id: 1,
                        name: 1
                    })
                        .lean()
                        .exec((err, forms) => {
                        if (err) {
                            return reject(err);
                        }
                        redis_service_1.default.setex(keyCache, 60 * 2, JSON.stringify(forms));
                        return resolve(forms);
                    });
                }
            });
        });
    }
    getForm(id, company) {
        const keyCache = `form-${id}`;
        return new Promise((resolve, reject) => {
            redis_service_1.default.get(keyCache, async (error, result) => {
                if (result) {
                    console.log(`cache: ${keyCache}`);
                    resolve(JSON.parse(result));
                }
                else {
                    form_model_1.default
                        .findOne({ _id: id, company }, {
                        'company': false,
                        'updatedAt': false,
                        'createdAt': false,
                        'active': false,
                        'sections.shortName': false,
                        'sections.questions.shortName': false,
                        '__v': false
                    })
                        .lean()
                        .exec((err, form) => {
                        if (err) {
                            return reject(err);
                        }
                        if (form) {
                            redis_service_1.default.setex(keyCache, 60 * 2, JSON.stringify(form));
                            return resolve(form);
                        }
                        return reject('No se encontro formularío');
                    });
                }
            });
        });
    }
    getFormWithScale(id, company) {
        return new Promise((resolve, reject) => {
            form_model_1.default
                .findOne({ _id: id, company })
                .populate('sections.questions.scale')
                .exec((err, form) => {
                if (err) {
                    return reject(err);
                }
                if (form) {
                    return resolve(form);
                }
                return reject('No se encontro formularío');
            });
        });
    }
    getScales(ids, company) {
        const keyCache = `scales-${ids.toString()}`;
        return new Promise((resolve, reject) => {
            redis_service_1.default.get(keyCache, async (error, result) => {
                if (result) {
                    resolve(JSON.parse(result));
                }
                else {
                    scale_model_1.default
                        .find({
                        _id: { $in: ids },
                        company
                    }, {
                        'updatedAt': false,
                        'createdAt': false,
                        'active': false,
                        'company': false,
                        'minValue': false,
                        'maxValue': false,
                        'choices.na': false,
                        '__v': false
                    })
                        .lean()
                        .exec((err, scales) => {
                        if (err) {
                            return reject(err);
                        }
                        redis_service_1.default.setex(keyCache, 30, JSON.stringify(scales));
                        return resolve(scales);
                    });
                }
            });
        });
    }
}
exports.default = new FormController();
//# sourceMappingURL=form.controller.js.map