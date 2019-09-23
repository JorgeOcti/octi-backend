"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const excel = require("exceljs");
const tempfile = require("tempfile");
const bson_1 = require("bson");
const fs = require("fs");
const GraphicsMagick = require("gm");
const HtmlPdf = require("html-pdf");
const Joi = require("joi");
const moment = require("moment-timezone");
const path = require("path");
const QRCode = require("qrcode");
const Raven = require("raven");
const app_1 = require("../../app");
const alert_model_1 = require("../../app/models/alert.model");
const car_model_1 = require("../../app/models/car.model");
const team_model_1 = require("../../app/models/team.model");
const user_model_1 = require("../../app/models/user.model");
const user_model_2 = require("../../app/models/user.model");
const venue_model_1 = require("../../app/models/venue.model");
const gpsPosition_model_1 = require("../models/gpsPosition.model");
const server_1 = require("../../server");
const logger_service_1 = require("../../services/logger.service");
const redis_service_1 = require("../../services/redis.service");
const general_utils_1 = require("../../utils/general.utils");
const form_model_1 = require("../models/form.model");
const participant_model_1 = require("../models/participant.model");
const participantFile_model_1 = require("../models/participantFile.model");
const scale_model_1 = require("../models/scale.model");
const bluebird = require("bluebird");
// import * as puppeteer from 'puppeteer';
class FormController {
    constructor() {
        this.list = this.list.bind(this);
        this.detail = this.detail.bind(this);
        this.pdf = this.pdf.bind(this);
        this.complete = this.complete.bind(this);
        this.changePreferred = this.changePreferred.bind(this);
        this.uploadFile = this.uploadFile.bind(this);
        this.damagesDashboardPerDay = this.damagesDashboardPerDay.bind(this);
        this.participantWithDamages = this.participantWithDamages.bind(this);
    }
    async pdf(req, res) {
        const { debug, timezone } = req.query;
        const { id } = req.params;
        const { team } = req.user;
        try {
            const config = {
                directory: '/tmp',
                format: 'Letter',
                orientation: 'portrait',
                border: {
                    top: '0.3in',
                    right: '0.5in',
                    bottom: '0.3in',
                    left: '0.5in'
                },
                /*
                header: {
                  height: '2mm',
                  contents: `<div class="header">
                      Reporte generado por OSA Andes. Página <span>{{page}}</span>/<span>{{pages}}</span>
                  </div>`
                },
                footer: {
                  contents: {
                    default: `<div class="footer">
                        Reporte generado por OSA Andes. Página <span>{{page}}</span>/<span>{{pages}}</span>
                    </div>`
                  }
                },
                */
                type: 'pdf',
                quality: '75'
            };
            const venuesPermissions = req.user.venuesPermissions();
            const participant = await participant_model_1.default
                .findOne({
                _id: id,
                team,
                $or: [{
                        venue: {
                            $in: venuesPermissions
                        }
                    }, {
                        venue: {
                            $exists: false
                        }
                    }, {
                        venue: null
                    }]
            }, {
                name: true,
                number: true,
                user: true,
                sections: true,
                qualification: true,
                shipping: true,
                shippingText: true,
                shippingImages: true,
                carrier: true,
                reception: true,
                receptionText: true,
                receptionImages: true,
                conciliation: true,
                conciliationText: true,
                conciliationImages: true,
                createdAt: true
            })
                .populate([{
                    path: 'user',
                    select: ['firstName', 'lastName', 'venue'],
                    populate: [{
                            path: 'venue',
                            populate: [{
                                    path: 'company'
                                }]
                        }]
                }, {
                    path: 'receiveFrom',
                    select: 'name'
                }, {
                    path: 'venue',
                    select: 'name'
                }, {
                    path: 'sendTo',
                    select: 'name'
                }, {
                    path: 'carrierBy',
                    select: 'name'
                }, {
                    path: 'car',
                    select: ['vin', 'internalNumber', 'engineNumber', 'brand', 'denomination', 'color', 'patent']
                }, {
                    path: 'sections.answers.images'
                }, {
                    path: 'shippingImages'
                }, {
                    path: 'receptionImages'
                }, {
                    path: 'conciliationImages'
                }]).lean();
            moment.locale('es');
            moment.tz.setDefault(timezone ? timezone : 'America/Santiago');
            const css = fs.readFileSync(path.join(__dirname, '../../../views/') + 'form/carDetail/style.css', 'utf8');
            const templatePath = path.join(__dirname, '../../../views/') + 'form/carDetail/index.pug';
            const participantCompany = participant.user.venue && participant.user.venue.company || {};
            const html = general_utils_1.default.generateHtmlFromPugFile(templatePath, {
                css: css.replace(/(\r\n|\n|\r)/gm, ''),
                participant,
                qr: await QRCode.toDataURL(participant.car.vin, {
                    errorCorrectionLevel: 'H',
                    margin: 0,
                    rendererOpts: {
                        quality: 1
                    }
                }),
                moment,
                origin: () => {
                    if (participant.reception && participant.receiveFrom) {
                        return participant.receiveFrom.name;
                    }
                    if (participant.shipping && participant.venue) {
                        return participant.venue.name;
                    }
                    return false;
                },
                destination: () => {
                    if (participant.reception && participant.venue) {
                        return participant.venue.name;
                    }
                    if (participant.shipping && participant.sendTo) {
                        return participant.sendTo.name;
                    }
                    return false;
                },
                carrier: () => {
                    if (participant.carrier && participant.carrierBy) {
                        return participant.carrierBy.name;
                    }
                    return false;
                },
                getAnswer: ((scale, answer) => {
                    if (answer && answer.hasOwnProperty('answer') && answer.answer) {
                        const choice = scale.choices.find((choice) => choice._id.toString() === answer.answer.toString());
                        return choice ? choice.choice : '';
                    }
                    return '';
                }),
                requireAccesory: ((scale, answer) => {
                    if (answer && answer.hasOwnProperty('answer') && answer.answer) {
                        const choice = scale.choices.find((choice) => choice._id.toString() === answer.answer.toString());
                        return choice ? choice.requireAccesories : false;
                    }
                    return false;
                }),
                getDamageItem: ((items, item) => {
                    if (item) {
                        const result = items.find((i) => i._id.toString() === item.toString());
                        if (result && result.hasOwnProperty('name')) {
                            return result.name;
                        }
                    }
                    return '-';
                }),
                logo: participantCompany.image && participantCompany.image.hasOwnProperty('url') ? decodeURI(participantCompany.image.url) : false,
                accesorySelected: (answer, item) => {
                    return item && answer.accesoriesAnswered ? answer.accesoriesAnswered.find((accesory) => {
                        return accesory.item === item._id.toString();
                    }) : false;
                }
            });
            if (debug) {
                res.send(html);
            }
            else {
                /*const browser = await puppeteer.launch();
                const page = await browser.newPage();
                await page.goto(`http://localhost:3030/report/forms/pdf/${id}.pdf?debug=true`);
                const buffer = await page.pdf({
                  format: 'Letter',
                  margin: {
                    top: '0.3in',
                    right: '0.5in',
                    bottom: '0.3in',
                    left: '0.5in'
                  }
                });
                res.type('application/pdf');
                res.send(buffer);
                browser.close();
                */
                HtmlPdf.create(html, config).toStream((err, pdfStream) => {
                    if (err) {
                        console.log(err);
                        res.sendStatus(500);
                    }
                    else {
                        // set header
                        res.setHeader('Content-Type', 'application/pdf');
                        res.setHeader('Content-disposition', `inline; filename=${participant._id.toString()}.pdf`);
                        // res.setHeader('Content-disposition', `attachment; filename=${participant._id.toString()}.pdf`);
                        // send a status code of 200 OK
                        res.statusCode = 200;
                        // once we are done reading end the response
                        pdfStream.on('end', () => {
                            // done reading
                            res.end();
                        });
                        // pipe the contents of the PDF directly to the response
                        pdfStream.pipe(res);
                    }
                });
            }
        }
        catch (e) {
            Raven.captureException(e, { req });
            res.status(500).json(e.message);
        }
    }
    async list(req, res) {
        const { team } = req.user;
        logger_service_1.default.info(`list forms`);
        logger_service_1.default.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
        try {
            const updatedUser = await user_model_1.default.findById(req.user._id).populate([{
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
                /* istanbul ignore next */
                res.status(400).json({
                    message: 'Usuario no encontrado',
                    status: 400
                });
            }
        }
        catch (e) {
            Raven.captureException(e, { req });
            /* istanbul ignore next */
            logger_service_1.default.error(`Async Error.`);
            res.status(400).json({
                message: 'Ha ocurrido un error',
                status: 400
            });
        }
    }
    async detail(req, res) {
        const { id } = req.params;
        const { team } = req.user;
        logger_service_1.default.info(`detail forms`);
        logger_service_1.default.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, {form: ${id}}}`);
        try {
            if (await user_model_1.default.find({ _id: req.user._id, userForms: id }).count() < 1) {
                return res.status(403).json({
                    message: 'No tienes permisos para esta operación'
                });
            }
            const user = await user_model_2.default.findById(req.user._id, {
                venue: true
            }).populate([{
                    path: 'venue',
                    populate: [{
                            path: 'sendTo',
                            select: ['name'],
                            options: {
                                sort: {
                                    name: 1
                                }
                            }
                        }, {
                            path: 'receiveFrom',
                            select: ['name'],
                            options: {
                                sort: {
                                    name: 1
                                }
                            }
                        }, {
                            path: 'receptionCarriers',
                            select: ['name'],
                            options: {
                                sort: {
                                    name: 1
                                }
                            }
                        }, {
                            path: 'shippingCarriers',
                            select: ['name'],
                            options: {
                                sort: {
                                    name: 1
                                }
                            }
                        }]
                }]);
            const form = await this.getForm({
                _id: id,
                team
            });
            // generate array of scale ids
            const scalesIds = [];
            form.sections.forEach((section) => {
                section.questions.forEach((question) => {
                    const scaleID = question.scale ? question.scale.toString() : null;
                    if (scaleID && !scalesIds.includes(scaleID)) {
                        scalesIds.push(scaleID);
                    }
                });
            });
            const extra = {
                accessories: []
            };
            const extraSection = {
                _id: 'extraSection',
                name: '',
                questions: [],
                weight: 0,
                order: form.sections.length + 1
            };
            const extraScales = [];
            const response = {};
            if (form.shippingVenue) {
                extraSection.questions.push({
                    _id: 'shippingVenue',
                    question: form.shippingVenueText,
                    venues: user.venue.sendTo,
                    kind: form_model_1.KindQuestion.venue,
                    order: extraSection.questions.length + 1
                });
            }
            if (form.shipping) {
                extraSection.questions.push({
                    _id: 'shipping',
                    question: form.shippingText,
                    scale: 'shipping',
                    kind: form_model_1.KindQuestion.scale,
                    order: extraSection.questions.length + 1
                });
                extraScales.push({
                    _id: 'shipping',
                    name: 'shipping',
                    choices: [
                        {
                            _id: 'false',
                            choice: 'No',
                            backgroundColor: 'red',
                            requireImage: form.shippingImage,
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
                    ]
                });
            }
            if (form.receptionVenue) {
                extraSection.questions.push({
                    _id: 'receptionVenue',
                    question: form.receptionVenueText,
                    venues: user.venue.receiveFrom,
                    kind: form_model_1.KindQuestion.venue,
                    order: extraSection.questions.length + 1
                });
            }
            if (form.reception) {
                extraSection.questions.push({
                    _id: 'reception',
                    question: form.receptionText,
                    scale: 'reception',
                    kind: form_model_1.KindQuestion.scale,
                    order: extraSection.questions.length + 1
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
                    ]
                });
            }
            if (form.carrier && (form.reception || form.shipping)) {
                extraSection.questions.push({
                    _id: 'carrier',
                    question: form.carrierText,
                    carriers: form.reception ? user.venue.receptionCarriers : user.venue.shippingCarriers,
                    kind: form_model_1.KindQuestion.carrier,
                    order: extraSection.questions.length + 1
                });
            }
            if (form.conciliation) {
                extraSection.questions.push({
                    _id: 'conciliation',
                    question: form.conciliationText,
                    scale: 'conciliation',
                    kind: form_model_1.KindQuestion.scale,
                    order: extraSection.questions.length + 1
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
                    ]
                });
            }
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
            const baseQuestion = {
                _id: '',
                question: '',
                scale: null,
                risk: '',
                observe: '',
                accessories: null,
                damages: null,
                venues: [],
                carriers: [],
                conciliation: false,
                kind: '',
                weight: 0,
                order: 0
            };
            // get scales from db
            res.json({
                data: {
                    form: {
                        _id: form._id,
                        name: form.name,
                        description: form.description,
                        // norrmalize questions in sections
                        sections: form.sections.map((section) => {
                            return {
                                _id: section._id,
                                name: section.name,
                                questions: section.questions.map((question) => {
                                    return {
                                        ...baseQuestion,
                                        ...question
                                    };
                                }),
                                weight: section.weight,
                                order: section.order
                            };
                        })
                    },
                    scales,
                    extra,
                    ...response
                },
                status: 200
            });
        }
        catch (e) {
            Raven.captureException(e, { req });
            /* istanbul ignore next */
            logger_service_1.default.error(`detail form: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            /* istanbul ignore next */
            logger_service_1.default.error(e);
            /* istanbul ignore next */
            Raven.captureException(e, { req });
            /* istanbul ignore next */
            res.status(500).json({
                message: 'No se encontro formularío',
                status: 500
            });
        }
    }
    async complete(req, res) {
        const { id } = req.params;
        let { vin } = req.body;
        const { answers } = req.body;
        const { team, venue, company } = req.user;
        logger_service_1.default.info(`complete`);
        logger_service_1.default.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, body: ${JSON.stringify(req.body)}}`);
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
            const updatedUser = await user_model_1.default.findById(req.user._id);
            if (!updatedUser) {
                return res.status(404).json({
                    message: 'No se ha encontrado el formulario solicitado.',
                    status: 404
                });
            }
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
                        venue: updatedUser.venue,
                        active: form.active
                    };
                    if (form.reception) {
                        participantObject.reception = form.reception;
                        participantObject.receptionText = form.receptionText;
                        participantObject.receptionVenue = form.receptionVenue;
                        participantObject.receptionVenueText = form.receptionVenueText;
                        if ('reception' in answers) {
                            const { reception } = answers;
                            participantObject.receptionConfirmation = [true, 'true'].includes(reception.value);
                            if (reception.images) {
                                participantObject.receptionImages = reception.images.map((image) => (new bson_1.ObjectID(image)));
                            }
                        }
                        if ('receptionVenue' in answers) {
                            const { receptionVenue } = answers;
                            participantObject.receiveFrom = receptionVenue.value;
                        }
                    }
                    if (form.shipping) {
                        participantObject.shipping = form.shipping;
                        participantObject.shippingText = form.shippingText;
                        participantObject.shippingVenue = form.shippingVenue;
                        participantObject.shippingVenueText = form.shippingVenueText;
                        if ('shipping' in answers) {
                            const { shipping } = answers;
                            participantObject.shippingConfirmation = [true, 'true'].includes(shipping.value);
                            if (shipping.images) {
                                participantObject.shippingImages = shipping.images.map((image) => (new bson_1.ObjectID(image)));
                            }
                        }
                        if ('shippingVenue' in answers) {
                            const { shippingVenue } = answers;
                            participantObject.sendTo = shippingVenue.value;
                        }
                    }
                    if (form.carrier) {
                        participantObject.carrier = form.carrier;
                        participantObject.carrierText = form.carrierText;
                        if ('carrier' in answers) {
                            const { carrier } = answers;
                            participantObject.carrierBy = carrier.value;
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
                    // array of images ids
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
                            const answer = general_utils_1.default.getObjectProperty(answers, questionID, null);
                            // find choice selected
                            const choice = question.scale ? question.scale.choices.find((choice) => {
                                return answer ? choice._id.toString() === answer.value : false;
                            }) : null;
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
                                damages: question.damages,
                                damagesSelected: answer && answer.damages ? answer.damages : [],
                                accesoriesAnswered: (question.kind === form_model_1.KindQuestion.accessory || choice && choice.requireAccesories) && answer && answer.accesories ?
                                    await this.processAccesoryItems(answer.accesories) : [],
                                risk: question.risk,
                                comment: (question.kind === form_model_1.KindQuestion.text || choice && choice.requireComment) && answer && answer.comment ?
                                    answer.comment
                                    : '',
                                observe: question.observe,
                                answer: answer ? new bson_1.ObjectID(answer.value) : null,
                                images: answer && answer.images && answer.images.length ?
                                    answer.images.map((image) => (new bson_1.ObjectID(image)))
                                    : [],
                                qualification,
                                na,
                                weight: question.weight,
                                kind: question.kind,
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
                        const updateTeam = await team_model_1.default.findOneAndUpdate({ _id: team._id }, { $inc: { formsNumber: 1 } }, { new: true });
                        if (updateTeam) {
                            newParticipant.number = updateTeam.formsNumber;
                        }
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
                            team,
                            $or: [
                                { $and: [{ lte: { $gte: formQualification } }, { lte: { $gt: 0 } }] },
                                { $and: [{ gte: { $lte: formQualification } }, { gte: { $gt: 0 } }] }
                            ]
                        }).populate([{
                                path: 'users',
                                select: ['firstName', 'lastName', 'email', 'venue', 'venuesAccess']
                            }]);
                        /* Send alerts if exist */
                        if (alerts.length) {
                            alerts.forEach((alert) => {
                                alert.users.forEach((user) => {
                                    const userName = `${user.firstName} ${user.lastName}`;
                                    if (user.venuesPermissions(true).includes(venue._id) && user.email && user.email.length) {
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

                        © 2019 OSA SpA. Todos los derechos reservados.`,
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
                        server_1.io.to(`dashboard-vin-view-${team._id}`).emit('REFRESH', {
                            update: true,
                            car: car._id
                        });
                        // send refresh with websocket to dashboard detail
                        server_1.io.to(`dashboard-vin-detail-${car._id}`).emit(`ADD_PARTICIPANT`, await participant_model_1.default
                            .findById(newParticipant._id, { number: 1, name: 1, user: 1, venue: 1, createdAt: 1, qualification: 1 })
                            .populate([{
                                path: 'user',
                                select: ['firstName', 'lastName']
                            }, {
                                path: 'venue',
                                select: ['name']
                            }]));
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
                        /* istanbul ignore next */
                        console.log(e);
                        // return error, if the form could not be recorded
                        /* istanbul ignore next */
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
            Raven.captureException(e, { req });
            /* istanbul ignore next */
            console.log(e);
            /* istanbul ignore next */
            return res.status(400).json({
                message: e,
                status: 400
            });
        }
    }
    async uploadFile(req, res) {
        const { id } = req.params;
        const company = req.user.company;
        const file = general_utils_1.default.getFileFromRequest(req.files, 'file');
        logger_service_1.default.info(`uploadFile`);
        logger_service_1.default.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, {form: ${id}, file: ${JSON.stringify(file)}}}`);
        if (file) {
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
                        /* istanbul ignore next */
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
                Raven.captureException(e, { req });
                /* istanbul ignore next */
                logger_service_1.default.error(`async error:`);
                /* istanbul ignore next */
                logger_service_1.default.error(e);
                /* istanbul ignore next */
                res.status(400).json(e);
            }
        }
        else {
            logger_service_1.default.error(`uploadFile: La imagen es obligatoria.`);
            res.status(400).json({
                message: 'La imagen es obligatoria.',
                status: 400
            });
        }
    }
    async changePreferred(req, res) {
        let { form } = req.body;
        const { team } = req.user;
        logger_service_1.default.info(`changePreferred`);
        logger_service_1.default.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, body: ${JSON.stringify(req.body)}}`);
        try {
            const user = await user_model_2.default.findOne({ _id: req.user._id, team, active: true });
            // validate exist user
            if (user) {
                form = await form_model_1.default.findOne({ _id: form, team });
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
                    logger_service_1.default.error(`changePreferred: Formulario no encontrado`);
                    logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
                    res.status(400).json({
                        message: 'Formulario no encontrado',
                        status: 400
                    });
                }
            }
            else {
                logger_service_1.default.error(`changePreferred: Usuario no encontrado`);
                logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
                res.status(400).json({
                    message: 'Usuario no encontrado',
                    status: 400
                });
            }
        }
        catch (e) {
            Raven.captureException(e, { req });
            /* istanbul ignore next */
            logger_service_1.default.error(`changePreferred: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            /* istanbul ignore next */
            logger_service_1.default.error(e);
            res.status(400).json({
                message: 'Ha ocurrido un error',
                status: 400
            });
        }
    }
    async damagesDashboard(req, res) {
        try {
            const { team } = req.user;
            const damaged = await participant_model_1.default.aggregate([{
                    $match: {
                        team,
                        'venue': {
                            $in: req.user.venuesPermissions()
                        },
                        'sections.answers.kind': 'damage',
                        'sections.answers.damagesSelected._id': { $exists: true }
                    }
                }, {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                        },
                        count: { $sum: 1 }
                    }
                }]);
            const undamaged = await participant_model_1.default.aggregate([{
                    $match: {
                        team,
                        'venue': {
                            $in: req.user.venuesPermissions()
                        },
                        'sections.answers.kind': 'damage',
                        'sections.answers.damagesSelected._id': { $exists: false }
                    }
                }, {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                        },
                        count: { $sum: 1 }
                    }
                }]);
            const allVenues = [];
            if (damaged) {
                damaged.forEach((item) => {
                    if (item._id.venue && !allVenues.includes(item._id.venue.toString())) {
                        allVenues.push(item._id.venue.toString());
                    }
                });
            }
            undamaged.forEach((item) => {
                if (item._id.venue && !allVenues.includes(item._id.venue.toString())) {
                    allVenues.push(item._id.venue.toString());
                }
            });
            const venuesPermissions = req.user.venuesPermissions(true);
            const venues = [];
            venuesPermissions.forEach((v) => {
                if (allVenues.includes(v) && !venues.includes(v)) {
                    venues.push(v);
                }
            });
            const damagesData = {};
            venues.forEach((venue) => damagesData[venue] = { damaged: 0, undamaged: 0 });
            damaged.forEach((item) => {
                if (item._id.venue in damagesData) {
                    damagesData[item._id.venue].damaged = item.count;
                }
            });
            undamaged.forEach((item) => {
                if (item._id.venue in damagesData) {
                    damagesData[item._id.venue].undamaged = item.count;
                }
            });
            const data = {
                damaged: venues.map((v) => damagesData[v].damaged),
                undamaged: venues.map((v) => damagesData[v].undamaged),
                venues
            };
            res.json(data);
        }
        catch (e) {
            Raven.captureException(e, { req });
            /* istanbul ignore next */
            logger_service_1.default.error(`dashboard damages: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            /* istanbul ignore next */
            logger_service_1.default.error(e);
            res.status(400).json({
                message: 'Ha ocurrido un error',
                status: 400
            });
        }
    }
    participantWithDamages(participant) {
        return new Promise((resolve) => {
            participant.hasDamages = participant.sections.some((section) => {
                return section.answers.some((answer) => {
                    return answer.damagesSelected.length > 0;
                });
            });
            resolve(participant);
        });
    }
    async damagesDashboardPerDay(req, res) {
        try {
            const days = 15;
            moment.locale('es');
            moment.tz.setDefault('America/Santiago');
            const participants = await participant_model_1.default.find({
                venue: {
                    $in: req.user.venuesPermissions()
                },
                createdAt: {
                    $gte: moment().endOf('day').subtract(days, 'd').toDate()
                }
            }, {
                _id: true,
                venue: true,
                // user: true,
                createdAt: true,
                'sections.answers.damagesSelected': true
            }).populate([{
                    path: 'venue',
                    select: ['_id', 'name']
                } /*,{
                  path: 'user',
                  select: ['_id', 'email']
                }*/
            ]).lean();
            const data = {};
            for (let i = 0; i < days; i++) {
                const key = moment()
                    .subtract(i, 'days')
                    .startOf('day')
                    .format('YYYY-MM-DD');
                data[key] = {
                    damaged: 0,
                    undamaged: 0
                };
            }
            const promises = [];
            for (const participant of participants) {
                promises.push(this.participantWithDamages(participant));
            }
            let participantsWithDamages = [];
            while (promises.length) {
                participantsWithDamages = [
                    ...participantsWithDamages,
                    ...await bluebird.all(promises.splice(0, 500))
                ];
            }
            for (const participant of participantsWithDamages) {
                const venueId = participant.venue._id.toString();
                // const userId = participant.user._id.toString();
                const dayKey = moment(participant.createdAt).format('YYYY-MM-DD');
                if (!data.hasOwnProperty(dayKey)) {
                    data[dayKey] = {
                        damaged: 0,
                        undamaged: 0
                    };
                }
                if (!data[dayKey].hasOwnProperty(venueId)) {
                    data[dayKey][venueId] = {
                        name: participant.venue.name,
                        damaged: 0,
                        undamaged: 0
                    };
                }
                // if (!data[dayKey][venueId].hasOwnProperty(userId)) {
                //   data[dayKey][venueId][userId] = {
                //     email: participant.user.email,
                //     damaged: 0,
                //     undamaged: 0
                //   };
                // }
                data[dayKey][participant.hasDamages ? 'damaged' : 'undamaged']++;
                data[dayKey][venueId][participant.hasDamages ? 'damaged' : 'undamaged']++;
                // data[dayKey][venueId][userId][participant.hasDamages ? 'damaged' : 'undamaged']++;
            }
            res.json(data);
        }
        catch (e) {
            Raven.captureException(e, { req });
            /* istanbul ignore next */
            logger_service_1.default.error(`dashboard damages: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            /* istanbul ignore next */
            logger_service_1.default.error(e);
            res.status(400).json({
                message: 'Ha ocurrido un error',
                status: 400
            });
        }
    }
    async timingDerco(req, res) {
        try {
            const { team } = req.user;
            let userObject = await user_model_1.default.findOne({ _id: req.user._id });
            // Derco
            if (userObject && userObject.team.toString() === '5bf2de34caf8ef7096105cda') {
                const total = 2;
                // el lead time supuesto es de 48 horas
                const threshold = 60 * 24 * 3;
                // despacho:  5b0487db835536612bab1b61
                // recepcion: 5b1ae5799ebea419025b3e41
                let reception = await form_model_1.default.findOne({ _id: "5b0487db835536612bab1b61" });
                let cars = await car_model_1.default.find({
                    team,
                    lastForm: { $ne: null },
                });
                let carsDict = {};
                for (const car of cars) {
                    carsDict[car._id.toString()] = car;
                }
                let receptions = [];
                for (let i = 0; i < total; i++) {
                    const aux = await participant_model_1.default.find({
                        team,
                        form: reception._id,
                        createdAt: {
                            $gt: moment().subtract((i + 1) * 30, 'days').toDate(),
                            $lt: moment().subtract(i * 30, 'days').toDate()
                        }
                    }, ['car', 'createdAt'], {
                        sort: {
                            createdAt: -1
                        }
                    });
                    console.log("found. ", aux.length);
                    receptions = receptions.concat(aux);
                }
                const workbook = new excel.Workbook();
                const worksheet = workbook.addWorksheet('Revisiones', {
                    properties: {
                        defaultRowHeight: 30
                    }, pageSetup: {
                        fitToPage: true, fitToHeight: 100, fitToWidth: 1
                    }
                });
                worksheet.columns = [{
                        header: 'VIN', key: 'vin', width: 30
                    }, {
                        header: 'Marca', key: 'brand', width: 30
                    }, {
                        header: 'Fecha carga', key: 'createdAt', width: 30
                    }, {
                        header: 'Mes carga', key: 'createdAtMonth', width: 30
                    }, {
                        header: 'Fecha revisión', key: 'checkedAt', width: 30
                    }, {
                        header: 'Mes revisión', key: 'checkedAtMonth', width: 30
                    }, {
                        header: 'Delta tiempo', key: 'leadtime', width: 20
                    }, {
                        header: 'On time', key: 'ontime', width: 20
                    }
                ];
                for (const reception of receptions) {
                    let carID = reception.car.toString();
                    if (carID in carsDict) {
                        const car = carsDict[carID];
                        const t0 = moment(car.createdAt).subtract(4, 'hours');
                        const t1 = moment(reception.createdAt).subtract(4, 'hours');
                        const hour = parseInt(t0.format('HH'));
                        if (hour >= 20 || hour <= 2)
                            continue;
                        const dm = t1.diff(t0, 'minutes');
                        if (dm > 10) {
                            const ontime = dm < threshold ? 1 : 0;
                            worksheet.addRow({
                                vin: car.vin,
                                brand: car.brand,
                                createdAt: t0.format('YYYY-MM-DD HH:mm:ss'),
                                createdAtMonth: t0.format('MM'),
                                checkedAt: t1.format('YYYY-MM-DD HH:mm:ss'),
                                checkedAtMonth: t1.format('MM'),
                                leadtime: dm,
                                ontime: ontime
                            });
                        }
                    }
                }
                const tempFilePath = tempfile('.xlsx');
                await workbook.xlsx.writeFile(tempFilePath);
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', 'attachment; filename=revisiones-03-07-2019.xlsx');
                return res.sendFile(tempFilePath);
            }
        }
        catch (e) {
            Raven.captureException(e, { req });
            /* istanbul ignore next */
            logger_service_1.default.error(`dashboard timing derco: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            /* istanbul ignore next */
            logger_service_1.default.error(e);
            res.status(400).json({
                message: 'Ha ocurrido un error',
                status: 400
            });
        }
    }
    async timingDashboard(req, res) {
        try {
            const { team } = req.user;
            let userObject = await user_model_1.default.findOne({ _id: req.user._id });
            // Derco
            if (userObject && userObject.team.toString() === '5bf2de34caf8ef7096105cda') {
                const total = 6;
                // el lead time supuesto es de 48 horas
                const threshold = 60 * 24 * 7;
                let reception = await form_model_1.default.findOne({ _id: "5b1ae5799ebea419025b3e41" });
                let cars = await car_model_1.default.find({
                    team,
                    lastForm: { $ne: null },
                    createdAt: {
                        $gte: moment().subtract(total, 'months').startOf('month').toDate()
                    }
                });
                let carsCreatedAt = {};
                for (const car of cars) {
                    carsCreatedAt[car._id.toString()] = car.createdAt;
                }
                const months = [];
                const receivedPerMonth = {};
                for (let i = 0; i <= total; i++) {
                    const month = moment()
                        .subtract(total - i, 'months')
                        .startOf('month')
                        .format('YYYY-MM');
                    months.push(month);
                    receivedPerMonth[month] = {
                        overdue: 0,
                        ontime: 0
                    };
                }
                const receptions = await participant_model_1.default.find({
                    team,
                    form: reception._id,
                    createdAt: {
                        $gte: moment().subtract(total, 'months').startOf('month').toDate()
                    }
                }, ['car', 'venue', 'createdAt'], {
                    sort: {
                        createdAt: -1
                    }
                });
                for (const reception of receptions) {
                    let car = reception.car.toString();
                    if (car in carsCreatedAt) {
                        const carCreatedAt = carsCreatedAt[car];
                        const t0 = moment(carCreatedAt);
                        const t1 = moment(reception.createdAt);
                        const dm = t1.diff(t0, 'minutes');
                        const month = t0.format('YYYY-MM');
                        if (dm > 10) {
                            if (dm < threshold)
                                receivedPerMonth[month].ontime += 1;
                            else
                                receivedPerMonth[month].overdue += 1;
                        }
                    }
                }
                const data = { months, overdue: [], ontime: [] };
                data.overdue = Array(months.length).fill(0);
                data.ontime = Array(months.length).fill(0);
                // tslint:disable-next-line:forin
                for (const index in months) {
                    const month = months[index];
                    data.overdue[index] = receivedPerMonth[month].overdue;
                    data.ontime[index] = receivedPerMonth[month].ontime;
                }
                res.json(data);
            }
            else {
                const distributor = await venue_model_1.default.findOne({ team, type: 'distributor' });
                const receivers = await venue_model_1.default.find({ team, type: 'receiver' });
                const total = 6;
                // autos que han llegado al distribuidor
                const threshold = 60 * 24 * 5;
                const participants = await participant_model_1.default.find({
                    venue: distributor,
                    createdAt: {
                        $gte: moment().subtract(total, 'months').startOf('month').toDate()
                    }
                }, ['car', 'createdAt']);
                const months = [];
                const receivedPerMonth = {};
                for (let i = 0; i <= total; i++) {
                    const month = moment()
                        .subtract(total - i, 'months')
                        .startOf('month')
                        .format('YYYY-MM');
                    months.push(month);
                    receivedPerMonth[month] = {
                        overdue: 0,
                        ontime: 0
                    };
                }
                const receiverVenues = [];
                const receptions = await participant_model_1.default.find({
                    team,
                    venue: { $in: receivers.map((v) => v._id) },
                    receiveFrom: distributor._id,
                    createdAt: {
                        $gte: moment().subtract(total, 'months').startOf('month').toDate()
                    }
                }, ['car', 'venue', 'createdAt'], {
                    sort: {
                        createdAt: 1
                    }
                });
                const firstReceptions = {};
                for (const reception of receptions) {
                    const car = reception.car.toString();
                    if (car in firstReceptions) {
                    }
                    else {
                        firstReceptions[car] = reception;
                    }
                }
                for (const participant of participants) {
                    const received = firstReceptions[participant.car.toString()];
                    if (received) {
                        if (!receiverVenues.includes(received.venue.toString())) {
                            receiverVenues.push(received.venue);
                        }
                        const t0 = moment(participant.createdAt);
                        const month = t0.format('YYYY-MM');
                        const t1 = moment(received.createdAt);
                        const dm = t1.diff(t0, 'minutes');
                        if (dm < threshold) {
                            receivedPerMonth[month].ontime += 1;
                        }
                        else {
                            receivedPerMonth[month].overdue += 1;
                        }
                    }
                }
                const data = { months, overdue: [], ontime: [] };
                data.overdue = Array(months.length).fill(0);
                data.ontime = Array(months.length).fill(0);
                // tslint:disable-next-line:forin
                for (const index in months) {
                    const month = months[index];
                    data.overdue[index] = receivedPerMonth[month].overdue;
                    data.ontime[index] = receivedPerMonth[month].ontime;
                }
                res.json(data);
            }
        }
        catch (e) {
            Raven.captureException(e, { req });
            /* istanbul ignore next */
            logger_service_1.default.error(`dashboard timing: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            /* istanbul ignore next */
            logger_service_1.default.error(e);
            res.status(400).json({
                message: 'Ha ocurrido un error',
                status: 400
            });
        }
    }
    async timingDashboardPerVenue(req, res) {
        try {
            const { team } = req.user;
            const { period } = req.query;
            // TODO: how to setup this?
            const distributor = await venue_model_1.default.findOne({ team, type: 'distributor' });
            if (distributor) {
                const receivers = await venue_model_1.default.find({ team, type: 'receiver' });
                const receiversDict = {};
                receivers.forEach((r) => receiversDict[r._id.toString()] = r);
                // autos que han llegado al distribuidor
                const t0 = moment(period).startOf('month');
                const t1 = moment(period).endOf('month');
                const threshold = 60 * 24 * 5;
                const participants = await participant_model_1.default.find({
                    venue: distributor._id,
                    createdAt: { $gt: t0.toDate(), $lt: t1.toDate() }
                }, ['car', 'createdAt']);
                const receptions = await participant_model_1.default.find({
                    team,
                    venue: { $in: receivers.map((v) => v._id) },
                    receiveFrom: distributor._id,
                    createdAt: { $gt: t0.toDate() }
                }, ['car', 'venue', 'createdAt'], {
                    sort: {
                        createdAt: 1
                    }
                });
                const firstReceptions = {};
                for (const reception of receptions) {
                    const car = reception.car.toString();
                    if (car in firstReceptions) {
                    }
                    else {
                        firstReceptions[car] = reception;
                    }
                }
                const receivedPerVenue = {};
                const venues = [];
                for (const participant of participants) {
                    const received = firstReceptions[participant.car.toString()];
                    if (received) {
                        if (received.createdAt < participant.createdAt) {
                            continue;
                        }
                        const venue = received.venue.toString();
                        if (!venues.includes(venue)) {
                            venues.push(venue);
                            receivedPerVenue[venue] = 0;
                        }
                        const t0 = moment(participant.createdAt);
                        const t1 = moment(received.createdAt);
                        const dm = t1.diff(t0, 'minutes');
                        receivedPerVenue[venue] += 1;
                        if (dm < threshold) {
                            // receivedPerMonth[month].ontime += 1;
                        }
                        else {
                            // receivedPerMonth[month].overdue += 1;
                        }
                    }
                }
                const perVenue = venues.map((v) => receivedPerVenue[v]);
                const data = { venues, perVenue };
                res.json(data);
            }
        }
        catch (e) {
            Raven.captureException(e, { req });
            /* istanbul ignore next */
            logger_service_1.default.error(`dashboard timing: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            /* istanbul ignore next */
            logger_service_1.default.error(e);
            res.status(400).json({
                message: 'Ha ocurrido un error',
                status: 400
            });
        }
    }
    async apiRevisionsGapExport(req, res) {
        if (!req.user.hasPermission('exportRevisionsGap')) {
            return res.status(403).json({
                message: 'No tienes permisos para esta operación'
            });
        }
        try {
            const workbook = new excel.Workbook();
            const worksheet = workbook.addWorksheet('Daños', {
                properties: {
                    defaultRowHeight: 30
                }, pageSetup: {
                    fitToPage: true, fitToHeight: 100, fitToWidth: 1
                }
            });
            worksheet.autoFilter = { from: 'A1', to: 'F1' };
            worksheet.columns = [{
                    header: 'VIN', key: 'vin', width: 30
                }, {
                    header: 'Marca', key: 'brand', width: 30
                }, {
                    header: 'Fecha despacho', key: 'p0CreatedAt', width: 30
                }, {
                    header: 'Sucursal despacho', key: 'p0Venue', width: 30
                }, {
                    header: 'Calificación despacho', key: 'p0Qualification', width: 30
                }, {
                    header: 'Gas despacho', key: 'p0Gas', width: 30
                }, {
                    header: 'Pintura despacho', key: 'p0Paint', width: 30
                }, {
                    header: 'Lata despacho', key: 'p0SheetMetal', width: 30
                }, {
                    header: 'Fecha recepción', key: 'p1CreatedAt', width: 30
                }, {
                    header: 'Sucursal recepción', key: 'p1Venue', width: 30
                }, {
                    header: 'Calificación recepción', key: 'p1Qualification', width: 30
                }, {
                    header: 'Gas recepción', key: 'p1Gas', width: 30
                }, {
                    header: 'Pintura recepción', key: 'p1Paint', width: 30
                }, {
                    header: 'Lata recepción', key: 'p1SheetMetal', width: 30
                }];
            const { team } = req.user;
            let periods = 6;
            for (let i = 0; i < periods; i++) {
                const t0 = moment().subtract(i + 1, 'months');
                const t1 = moment().subtract(i, 'months');
                let cars = await car_model_1.default.find({
                    team,
                    lastForm: { $exists: true },
                    createdAt: {
                        $gte: t0,
                        $lte: t1,
                    }
                }).populate({
                    path: 'participants',
                    populate: {
                        path: 'venue',
                        model: 'Venue'
                    }
                });
                let f0 = '5b0487db835536612bab1b61';
                let f1 = '5b1ae5799ebea419025b3e41';
                let gasQuestion = '5b64b543cee543c2afda41bd';
                let paintQuestion = '5b64b1f6cc5e14f59724f8d1';
                let sheetMetalQuestion = '5b64b22245f69e40fc5713fb';
                for (const car of cars) {
                    if (car.participants.length > 0) {
                        let participants = car.participants.sort((p0, p1) => p0.createdAt >= p1.createdAt ? 1 : 0);
                        let p0 = null;
                        let p1 = null;
                        // only one form
                        if (participants.length < 2) {
                            if (participants[0].form.toString() == f0)
                                p0 = participants[0];
                            else if (participants[0].form.toString() == f1)
                                p1 = participants[0];
                        }
                        else {
                            p0 = participants[0];
                            p1 = participants[1];
                        }
                        let choice0Gas = null;
                        let choice1Gas = null;
                        if (p0) {
                            const answer0Gas = p0.sections.map((s) => s.answers).reduce((x, y) => [...x, ...y], []).find((a) => a._id.toString() == gasQuestion);
                            if (answer0Gas)
                                choice0Gas = answer0Gas.scale.choices.find((c) => c._id.toString() == answer0Gas.answer.toString());
                        }
                        if (p1) {
                            const answer1Gas = p1.sections.map((s) => s.answers).reduce((x, y) => [...x, ...y], []).find((a) => a._id.toString() == gasQuestion);
                            if (answer1Gas)
                                choice1Gas = answer1Gas.scale.choices.find((c) => c._id.toString() == answer1Gas.answer.toString());
                        }
                        let choice0Paint = null;
                        let choice1Paint = null;
                        if (p0) {
                            const answer0Paint = p0.sections.map((s) => s.answers).reduce((x, y) => [...x, ...y], []).find((a) => a._id.toString() == paintQuestion);
                            if (answer0Paint)
                                choice0Paint = answer0Paint.scale.choices.find((c) => c._id.toString() == answer0Paint.answer.toString());
                        }
                        if (p1) {
                            const answer1Paint = p1.sections.map((s) => s.answers).reduce((x, y) => [...x, ...y], []).find((a) => a._id.toString() == paintQuestion);
                            if (answer1Paint)
                                choice1Paint = answer1Paint.scale.choices.find((c) => c._id.toString() == answer1Paint.answer.toString());
                        }
                        // lata
                        let choice0SheetMetal = null;
                        let choice1SheetMetal = null;
                        if (p0) {
                            const answer0SheetMetal = p0.sections.map((s) => s.answers).reduce((x, y) => [...x, ...y], []).find((a) => a._id.toString() == sheetMetalQuestion);
                            if (answer0SheetMetal)
                                choice0SheetMetal = answer0SheetMetal.scale.choices.find((c) => c._id.toString() == answer0SheetMetal.answer.toString());
                        }
                        if (p1) {
                            const answer1SheetMetal = p1.sections.map((s) => s.answers).reduce((x, y) => [...x, ...y], []).find((a) => a._id.toString() == sheetMetalQuestion);
                            if (answer1SheetMetal)
                                choice1SheetMetal = answer1SheetMetal.scale.choices.find((c) => c._id.toString() == answer1SheetMetal.answer.toString());
                        }
                        const row = {
                            vin: car.vin,
                            brand: car.brand,
                            p0CreatedAt: p0 ? p0.createdAt : '-',
                            p0Venue: p0 ? p0.venue.name : '-',
                            p0Qualification: p0 ? p0.qualification : '-',
                            p0Gas: choice0Gas ? choice0Gas.choice : '-',
                            p0Paint: choice0Paint ? choice0Paint.choice : '-',
                            p0SheetMetal: choice0SheetMetal ? choice0SheetMetal.choice : '-',
                            p1CreatedAt: p1 ? p1.createdAt : '-',
                            p1Venue: p1 ? p1.venue.name : '-',
                            p1Qualification: p1 ? p1.qualification : '-',
                            p1Gas: choice1Gas ? choice1Gas.choice : '-',
                            p1Paint: choice1Paint ? choice1Paint.choice : '-',
                            p1SheetMetal: choice1SheetMetal ? choice1SheetMetal.choice : '-',
                        };
                        worksheet.addRow(row);
                    }
                }
                /* formats */
                worksheet.getRow(1).eachCell((cell) => {
                    cell.font = {
                        bold: true
                    };
                });
                // const idCol = worksheet.getColumn('id');
                // idCol.eachCell({includeEmpty: true}, (cell) => {
                //   cell.alignment = {vertical: 'middle', horizontal: 'center'};
                // });
                const tempFilePath = tempfile('.xlsx');
                await workbook.xlsx.writeFile(tempFilePath);
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename=revisiones-${moment().format('YYYY-MM-DD')}.xlsx`);
                return res.sendFile(tempFilePath);
            }
        }
        catch (e) {
            res.status(400).json({
                message: 'Ha ocurrido un error',
                status: 400
            });
        }
    }
    async cleaningDashboard(req, res) {
        try {
            const { team } = req.user;
            let form = await form_model_1.default.findById("5b0487db835536612bab1b61");
            let answer = new bson_1.ObjectID("5b64b2e8de5557c85fa14fa0");
            let days = [];
            let daysDict = {};
            if (form) {
                const total = 30 * 6;
                const t0 = moment().subtract(total, 'days');
                for (let i = 0; i < total; i++) {
                    const day = moment().subtract(total - i, 'days').format('YYYY-MM-DD');
                    daysDict[day] = {
                        'clean': 0,
                        'notClean': 0
                    };
                    days.push(day);
                }
                const cleanDispatch = await participant_model_1.default.aggregate([
                    {
                        $match: {
                            team,
                            form: form._id,
                            "sections.answers.answer": answer,
                            createdAt: { $gt: t0.toDate() }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                            },
                            count: { $sum: 1 }
                        }
                    }
                ]);
                for (let datum of cleanDispatch) {
                    const day = datum._id;
                    const sum = datum.count;
                    console.log(datum);
                    daysDict[day].clean = sum;
                }
                const notCleanDispatch = await participant_model_1.default.aggregate([
                    {
                        $match: {
                            team,
                            form: form._id,
                            "sections.answers.answer": { $ne: answer },
                            createdAt: { $gt: t0.toDate() }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                            },
                            count: { $sum: 1 }
                        }
                    }
                ]);
                for (let datum of notCleanDispatch) {
                    const day = datum._id;
                    const sum = datum.count;
                    console.log(day);
                    daysDict[day].notClean = sum;
                }
            }
            res.json({
                days: days,
                clean: days.map((d) => daysDict[d].clean),
                notClean: days.map((d) => daysDict[d].notClean),
            });
        }
        catch (e) {
            Raven.captureException(e, { req });
            /* istanbul ignore next */
            logger_service_1.default.error(`dashboard timing: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            /* istanbul ignore next */
            logger_service_1.default.error(e);
            res.status(400).json({
                message: 'Ha ocurrido un error',
                status: 400
            });
        }
    }
    autoRotate(path) {
        // doc http://aheckmann.github.io/gm/docs.html
        /**** REQUIRE: imagemagick and graphicsmagick *****
         brew install imagemagick
         brew install graphicsmagick
         * */
        return new Promise((resolve, reject) => {
            GraphicsMagick(path)
                .autoOrient()
                .write(path, (err) => {
                if (err) {
                    /* istanbul ignore next */
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
                    /* istanbul ignore next */
                    return reject(err);
                }
                return resolve(forms);
            });
        });
    }
    getForm(filter) {
        const keyCache = `form-${filter._id}`;
        console.log('keyCache', keyCache);
        return new Promise((resolve, reject) => {
            redis_service_1.default.get(keyCache, async (error, result) => {
                if (result) {
                    console.log('FROM CACHE');
                    resolve(JSON.parse(result));
                }
                else {
                    console.log('NEW CACHE');
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
                        .populate([{
                            path: 'sections.questions.damages',
                            select: ['name', 'positions', 'kinds', 'parts'],
                            populate: [{
                                    path: 'positions',
                                    select: ['name'],
                                    options: {
                                        sort: {
                                            name: 1
                                        }
                                    }
                                }, {
                                    path: 'kinds',
                                    select: ['name'],
                                    options: {
                                        sort: {
                                            name: 1
                                        }
                                    }
                                }, {
                                    path: 'parts',
                                    select: ['name'],
                                    options: {
                                        sort: {
                                            name: 1
                                        }
                                    }
                                }]
                        }])
                        .lean()
                        .exec((err, form) => {
                        if (err) {
                            /* istanbul ignore next */
                            return reject(err);
                        }
                        if (form) {
                            redis_service_1.default.set(keyCache, JSON.stringify(form), "ex", 60);
                            return resolve(form);
                        }
                        return reject('No se encontro formularío');
                    });
                }
            });
        });
    }
    async processAccesoryItems(accesories) {
        const accesorySchema = Joi.object({
            item: Joi.string(),
            amount: Joi.number()
        });
        const newAccesories = [];
        accesories.map(async (accesory) => {
            try {
                const newAccesory = await accesorySchema.validate(accesory);
                newAccesories.push({
                    item: newAccesory.item,
                    amount: newAccesory.amount
                });
            }
            catch (e) {
                newAccesories.push({
                    item: accesory,
                    amount: 1
                });
            }
        });
        return newAccesories;
    }
    getFormWithScale(filter) {
        return new Promise((resolve, reject) => {
            form_model_1.default
                .findOne(filter)
                .populate([{
                    path: 'sections.questions.scale'
                }, {
                    path: 'sections.questions.damages',
                    select: ['name', 'positions', 'kinds', 'parts'],
                    populate: [{
                            path: 'positions',
                            select: ['name']
                        }, {
                            path: 'kinds',
                            select: ['name']
                        }, {
                            path: 'parts',
                            select: ['name']
                        }]
                }])
                .exec((err, form) => {
                if (err) {
                    /* istanbul ignore next */
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
                        'team': false,
                        '__v': false
                    })
                        .lean()
                        .exec((err, scales) => {
                        if (err) {
                            /* istanbul ignore next */
                            return reject(err);
                        }
                        redis_service_1.default.set(keyCache, JSON.stringify(scales), "ex", 30);
                        return resolve(scales);
                    });
                }
            });
        });
    }
    async createPosition(req, res) {
        try {
            const { team, company, venue } = req.user;
            const { lat, lng, accuracy, provider } = req.body;
            let os = "user-agent" in req.headers ? req.headers["user-agent"] : "";
            let gpsPosition = new gpsPosition_model_1.default({
                lat,
                lng,
                user: req.user,
                company,
                team,
                venue,
                os,
                accuracy,
                provider
            });
            await gpsPosition.save();
            res.json({
                status: 200
            });
        }
        catch (e) {
            Raven.captureException(e, { req });
            /* istanbul ignore next */
            logger_service_1.default.error(`position create. Error`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            /* istanbul ignore next */
            logger_service_1.default.error(e);
            res.status(400).json({
                message: 'Ha ocurrido un error',
                status: 400
            });
        }
    }
}
exports.default = new FormController();
//# sourceMappingURL=form.controller.js.map