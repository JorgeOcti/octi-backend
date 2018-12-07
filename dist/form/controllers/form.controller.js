"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bson_1 = require("bson");
const GraphicsMagick = require("gm");
const moment = require("moment-timezone");
const app_1 = require("../../app");
const alert_model_1 = require("../../app/models/alert.model");
const car_model_1 = require("../../app/models/car.model");
const user_model_1 = require("../../app/models/user.model");
const user_model_2 = require("../../app/models/user.model");
const server_1 = require("../../server");
const redis_service_1 = require("../../services/redis.service");
const form_model_1 = require("../models/form.model");
const participant_model_1 = require("../models/participant.model");
const participantFile_model_1 = require("../models/participantFile.model");
const scale_model_1 = require("../models/scale.model");
// import * as cp from 'console-probe';
class FormController {
    constructor() {
        this.list = this.list.bind(this);
        this.detail = this.detail.bind(this);
        this.complete = this.complete.bind(this);
        this.changePreferred = this.changePreferred.bind(this);
        this.uploadFile = this.uploadFile.bind(this);
    }
    async list(req, res) {
        const { team } = req.user;
        try {
            const updatedUser = await user_model_2.default.findById(req.user._id).populate([{
                    path: 'userForms',
                    select: ['_id']
                }]);
            if (updatedUser) {
                const forms = await this.getForms({
                    _id: {
                        $in: updatedUser.userForms.map((form) => form._id)
                    },
                    team
                });
                res.json({
                    data: forms,
                    status: 200
                });
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
                message: 'Ha ocurrido un error',
                status: 400
            });
        }
    }
    async detail(req, res) {
        const { id } = req.params;
        const { team } = req.user;
        if (req.user.userForms.filter((form) => form._id.toString() === id).length === 0) {
            return res.status(403).json({
                message: 'No tienes permisos para esta operación'
            });
        }
        try {
            const form = await this.getForm({ _id: id, team });
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
            const extra = {
                accessories: []
            };
            const extraSection = {
                _id: '',
                name: '',
                questions: [],
                order: form.sections.length + 1
            };
            const extraScales = [];
            if (form.shipping) {
                extraSection.questions.push({
                    _id: 'shipping',
                    question: form.shippingText,
                    scale: 'shipping',
                    conciliation: false
                });
                extraScales.push({
                    _id: 'shipping',
                    name: 'shipping',
                    choices: [
                        {
                            _id: 'false',
                            choice: 'No',
                            backgroundColor: 'red',
                            requireImage: false,
                            requireComment: false,
                            requireAccesories: false,
                            requireConciliation: false,
                            value: 0,
                            order: 1
                        }, {
                            _id: 'true',
                            choice: 'Si',
                            backgroundColor: 'green',
                            requireImage: form.shippingImage,
                            requireComment: false,
                            requireAccesories: false,
                            requireConciliation: false,
                            value: 1,
                            order: 2
                        }
                    ],
                    order: extraScales.length + 1
                });
            }
            if (form.reception) {
                extraSection.questions.push({
                    _id: 'reception',
                    question: form.receptionText,
                    scale: 'reception',
                    conciliation: false
                });
                extraScales.push({
                    _id: 'reception',
                    name: 'reception',
                    choices: [
                        {
                            _id: 'false',
                            choice: 'No',
                            backgroundColor: 'red',
                            requireImage: form.receptionImage,
                            requireComment: false,
                            requireAccesories: false,
                            requireConciliation: false,
                            value: 0,
                            order: 1
                        }, {
                            _id: 'true',
                            choice: 'Si',
                            backgroundColor: 'green',
                            requireImage: false,
                            requireComment: false,
                            requireAccesories: false,
                            requireConciliation: false,
                            value: 1,
                            order: 2
                        }
                    ],
                    order: extraScales.length + 1
                });
            }
            if (form.conciliation) {
                extraSection.questions.push({
                    _id: 'conciliation',
                    question: form.conciliationText,
                    scale: 'conciliation',
                    conciliation: true
                });
                extraScales.push({
                    _id: 'conciliation',
                    name: 'conciliation',
                    choices: [
                        {
                            _id: 'false',
                            choice: 'No',
                            backgroundColor: 'red',
                            requireImage: false,
                            requireComment: false,
                            requireAccesories: false,
                            requireConciliation: false,
                            value: 0,
                            order: 1
                        }, {
                            _id: 'true',
                            choice: 'Si',
                            backgroundColor: 'green',
                            requireImage: form.conciliationImage,
                            requireComment: false,
                            requireAccesories: false,
                            requireConciliation: false,
                            value: 1,
                            order: 2
                        }
                    ],
                    order: extraScales.length + 1
                });
            }
            // delete keys from object returned by api
            const deleteKeys = ['shipping', 'shippingText', 'shippingImage', 'reception', 'receptionText', 'receptionImage', 'conciliation', 'conciliationText', 'conciliationImage'];
            deleteKeys.forEach((key) => {
                if (form.hasOwnProperty(key)) {
                    delete form[key];
                }
            });
            let scales = await this.getScales({
                _id: {
                    $in: scalesIds
                },
                team
            });
            scales = [...scales, ...extraScales];
            if (extraSection.questions.length) {
                form.sections = [...form.sections, extraSection];
            }
            // get scales from db
            res.json({
                data: {
                    form,
                    scales,
                    extra
                },
                status: 200
            });
        }
        catch (e) {
            console.log('e', e);
            res.status(400).json({
                message: 'No se encontro formularío',
                status: 400
            });
        }
    }
    async complete(req, res) {
        const { id } = req.params;
        let { vin } = req.body;
        const { answers } = req.body;
        const { team, venue, company } = req.user;
        // validate answers in body
        if (!answers) {
            return res.status(400).json({
                message: 'Debes enviar las respuestas',
                status: 400
            });
        }
        // validate vin in body
        if (!vin) {
            return res.status(400).json({
                message: 'Debes enviar el vin',
                status: 400
            });
        }
        vin = vin.replace(/[\W_]+/g, '');
        try {
            const car = await car_model_1.default.findOne({
                $or: [{ vin: { $eq: vin } }, { vin2: { $eq: vin } }],
                team
            });
            if (car) {
                const form = await this.getFormWithScale({
                    _id: id,
                    team
                });
                if (form) {
                    // initialize participant
                    const participantObject = {
                        name: form.name,
                        team,
                        company,
                        form: form._id,
                        car,
                        description: form.description,
                        user: req.user._id,
                        venue,
                        active: form.active
                    };
                    if (form.reception && 'reception' in answers) {
                        const reception = answers.reception;
                        participantObject.reception = [true, 'true'].includes(reception.value);
                        participantObject.receptionText = form.receptionText;
                        if (reception.images) {
                            participantObject.receptionImages = reception.images.map((image) => (new bson_1.ObjectID(image)));
                        }
                    }
                    if (form.shipping && 'shipping' in answers) {
                        const shipping = answers.shipping;
                        participantObject.shipping = [true, 'true'].includes(shipping.value);
                        participantObject.shippingText = form.shippingText;
                        if (shipping.images) {
                            participantObject.shippingImages = shipping.images.map((image) => (new bson_1.ObjectID(image)));
                        }
                    }
                    if (form.conciliation && 'conciliation' in answers) {
                        const conciliation = answers.conciliation;
                        participantObject.conciliation = [true, 'true'].includes(conciliation.value);
                        participantObject.conciliationText = form.conciliationText;
                        if (conciliation.images) {
                            participantObject.conciliationImages = conciliation.images.map((image) => (new bson_1.ObjectID(image)));
                        }
                    }
                    const newParticipant = new participant_model_1.default(participantObject);
                    // var sum sections
                    let sumSectionWeigths = 0;
                    let sumSectionQualifications = 0;
                    // array images ids
                    let allImages = [];
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
                            // no apply
                            let na = false;
                            if (choice && choice.na) {
                                na = true;
                            }
                            else {
                                sumQualifications += (qualification * question.weight);
                                sumWeigths += question.weight;
                            }
                            // concat allImages
                            if (choice && choice.requireImage && answer && answer.images && answer.images.length) {
                                allImages = [...answer.images, ...allImages];
                            }
                            // delete images no used
                            if (choice && !choice.requireImage && answer && answer.images && answer.images.length) {
                                answer.images.forEach(async (image) => {
                                    const deleteFile = await participantFile_model_1.default.findById(image);
                                    if (deleteFile) {
                                        await deleteFile.remove();
                                    }
                                });
                            }
                            // generate answer
                            newAnswers.push({
                                _id: question._id,
                                question: question.question,
                                shortName: question.shortName,
                                scale: question.scale,
                                conciliation: question.conciliation,
                                accessories: question.accessories,
                                accesoriesSelected: choice && choice.requireAccesories && answer && answer.accesories ? answer.accesories.map((accesory) => new bson_1.ObjectID(accesory)) : [],
                                risk: question.risk,
                                observe: question.observe,
                                answer: answer ? new bson_1.ObjectID(answer.value) : null,
                                // images: answer.images && answer.images.length ? await ParticipantFile.find({_id: {$in: answer.images}}, {_id:1}) : [],
                                images: answer && answer.images && answer.images.length ? answer.images.map((image) => (new bson_1.ObjectID(image))) : [],
                                qualification,
                                na,
                                weight: question.weight,
                                order: question.order
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
                            order: section.order
                        });
                    }
                    // calculate participant qualification
                    const formQualification = sumSectionQualifications ? sumSectionQualifications / sumSectionWeigths : 0;
                    newParticipant.qualification = formQualification;
                    try {
                        // save the participant
                        await newParticipant.save();
                        // associate file to participant
                        if (allImages.length) {
                            await participantFile_model_1.default.update({ _id: { $in: allImages } }, { participant: newParticipant }, { multi: true });
                        }
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
                        /* Search alerts */
                        const alerts = await alert_model_1.default
                            .find({
                            company,
                            $or: [
                                { $and: [{ lte: { $gte: formQualification } }, { lte: { $gt: 0 } }] },
                                { $and: [{ gte: { $lte: formQualification } }, { gte: { $gt: 0 } }] }
                            ]
                        }).populate([{
                                path: 'users',
                                select: ['firstName', 'lastName', 'email', 'venue']
                            }]);
                        /* Send alerts if exist */
                        if (alerts.length) {
                            alerts.forEach((alert) => {
                                alert.users.forEach((user) => {
                                    const userName = `${user.firstName} ${user.lastName}`;
                                    // console.log('venue._id.toString()', venue._id.toString());
                                    // console.log('user.venue.toString()', user.venue.toString());
                                    if (venue._id.toString() === user.venue.toString() && user.email && user.email.length) {
                                        app_1.queue.create('email', {
                                            from: '',
                                            title: `Alert qualification`,
                                            to: `""<${user.email}>`,
                                            subject: `ALERTA: ${alert.name}`,
                                            text: `Hola ${userName}
                        Se ha evaluado un VIN con calificación ${formQualification.toFixed(0)}%

                        Datos del Vehiculo
                        VIN: ${car ? car.vin : ''}
                        MARCA: ${car && car.brand ? car.brand : ''}

                        Para ver el detalle has click aquí
                        ${process.env.SITE_URL}cars/${car._id}

                        © 2018 OSA SpA. Todos los derechos reservados.`,
                                            view: 'alerts/lowQualification',
                                            context: {
                                                userName,
                                                brand: car && car.brand ? car.brand : '',
                                                vin: car && car.vin ? car.vin : '',
                                                qualification: formQualification.toFixed(0),
                                                url: `${process.env.SITE_URL}cars/${car._id}`
                                            }
                                        }).priority('high').attempts(5).save();
                                    }
                                });
                            });
                        }
                        // send refresh with websocket to dashboard list
                        server_1.io.to(`dashboard-vin-view-${company._id}`).emit('REFRESH', {
                            update: true,
                            car: car._id
                        });
                        // send refresh with websocket to dashboard detail
                        server_1.io.to(`dashboard-vin-detail-${car._id}`).emit(`ADD_PARTICIPANT`, await participant_model_1.default
                            .findById(newParticipant._id, { name: 1, user: 1, createdAt: 1, qualification: 1 })
                            .populate({
                            path: 'user',
                            select: ['firstName', 'lastName']
                        }));
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
                        console.log(e);
                        // return error, if the form could not be recorded
                        return res.status(400).json({
                            message: e,
                            status: 400
                        });
                    }
                }
                else {
                    // return error, if the form could not find
                    return res.status(400).json({
                        message: 'No se ha encontrado el formularío',
                        status: 400
                    });
                }
            }
            else {
                return res.status(400).json({
                    message: 'VIN no encontrado.',
                    status: 400
                });
            }
        }
        catch (e) {
            return res.status(400).json({
                message: e,
                status: 400
            });
        }
    }
    async uploadFile(req, res) {
        const { id } = req.params;
        const company = req.user.company;
        if (req.file) {
            const file = req.file;
            try {
                const participantFile = new participantFile_model_1.default();
                /*
                  {
                    fieldname: 'file',
                    originalname: 'Captura de pantalla 2018-06-28 a la(s) 11.59.58.png',
                    encoding: '7bit',
                    mimetype: 'image/png',
                    destination: '/tmp/',
                    filename: 'Captura de pantalla 2018-06-28 a la(s) 11.59.58.png',
                    path: '/tmp/Captura de pantalla 2018-06-28 a la(s) 11.59.58.png',
                    size: 794429
                  }
                */
                // fix exif
                if (new RegExp('\\bimage\\b').test(file.mimetype)) {
                    await this.autoRotate(file.path);
                }
                file.headers = {
                    'Content-Type': file.mimetype
                };
                file.company = company._id;
                file.form = id;
                participantFile.user = req.user._id;
                participantFile.company = company._id;
                participantFile.attach('file', file, async (error) => {
                    if (error) {
                        res.status(400).json(error);
                    }
                    else {
                        await participantFile.save();
                        res.status(201).json({
                            data: {
                                _id: participantFile._id,
                                file: participantFile.file
                            },
                            status: 201
                        });
                    }
                });
            }
            catch (e) {
                res.status(400).json(e);
            }
        }
        else {
            res.status(400).json({
                message: 'La imagen es obligatoria.',
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
                message: 'Ha ocurrido un error',
                status: 400
            });
        }
    }
    autoRotate(path) {
        // doc http://aheckmann.github.io/gm/docs.html
        /**** REQUIRE *****
          brew install imagemagick
          brew install graphicsmagick
        * */
        return new Promise((resolve, reject) => {
            GraphicsMagick(path)
                .autoOrient()
                .write(path, (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }
    getForms(filter) {
        return new Promise((resolve, reject) => {
            form_model_1.default
                .find(filter, {
                _id: 1,
                name: 1
            })
                .lean()
                .exec((err, forms) => {
                if (err) {
                    return reject(err);
                }
                return resolve(forms);
            });
        });
    }
    getForm(filter) {
        const keyCache = `form-${filter._id}`;
        return new Promise((resolve, reject) => {
            redis_service_1.default.get(keyCache, async (error, result) => {
                if (result) {
                    console.log(`cache: ${keyCache}`);
                    resolve(JSON.parse(result));
                }
                else {
                    form_model_1.default
                        .findOne(filter, {
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
    getFormWithScale(filter) {
        return new Promise((resolve, reject) => {
            form_model_1.default
                .findOne(filter)
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
    getScales(filter) {
        const keyCache = `scales-${JSON.stringify(filter)}`;
        return new Promise((resolve, reject) => {
            redis_service_1.default.get(keyCache, async (error, result) => {
                if (result) {
                    resolve(JSON.parse(result));
                }
                else {
                    scale_model_1.default
                        .find(filter, {
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