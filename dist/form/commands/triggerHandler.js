"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const participant_model_1 = require("../models/participant.model");
const logger_service_1 = require("../../services/logger.service");
const trigger_model_1 = require("../models/trigger.model");
const app_1 = require("../../app");
const HtmlPdf = require("html-pdf");
const fs = require("fs");
const path = require("path");
const general_utils_1 = require("../../utils/general.utils");
const moment = require("moment-timezone");
const form_model_1 = require("../models/form.model");
const participantFile_model_1 = require("../models/participantFile.model");
const AWS = require("aws-sdk");
const s3Config = require("../../../s3-config.json");
class TriggerHandler {
    form;
    participant;
    answers;
    constructor(form, participant, answers) {
        this.form = form;
        this.participant = participant;
        this.answers = answers ? answers : this.getAnswers();
    }
    async getParticipantFullData() {
        this.participant = await participant_model_1.default
            .findOne({
            _id: this.participant._id,
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
                select: ['firstName', 'lastName', 'venue', 'email'],
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
    }
    getAnswers() {
        let answers = {};
        this.participant.sections.map((s) => {
            s.answers.map(a => {
                answers[a._id.toString()] = a.kind === form_model_1.KindQuestion.image ? a.images : a.comment;
            });
        });
        return answers;
    }
    async execute(payload = {}) {
        await this.getParticipantFullData();
        for (const trigger of this.form.triggers) {
            if (!trigger.enabled) {
                logger_service_1.default.info(`Trigger: ${trigger.name} deactivated`);
                continue;
            }
            let triggerDelegate = this.getTrigger(trigger);
            payload = await triggerDelegate.trigger(trigger, this.answers, { ...payload, participant: this.participant, user: this.participant.user });
        }
    }
    getTrigger(trigger) {
        let delegate = new NullTriggerDelegate();
        switch (trigger.kind) {
            case trigger_model_1.KindTrigger.email: {
                delegate = new EmailTriggerDelegate();
                break;
            }
            case trigger_model_1.KindTrigger.file: {
                delegate = new FileTriggerDelegate();
                break;
            }
        }
        return delegate;
    }
}
exports.default = TriggerHandler;
class NullTriggerDelegate {
    processTrigerConfig(trigger, answers) {
        let data = {};
        Object.keys(trigger.config.toJSON()).map((k) => {
            data[k] = answers.hasOwnProperty(trigger.config[k].toString()) ?
                answers[trigger.config[k].toString()] : trigger.config[k].toString();
        });
        return data;
    }
    trigger(trigger, answers, payload) {
        logger_service_1.default.error(`Kind Trigger: ${trigger.kind} not implemented `);
    }
}
class EmailTriggerDelegate extends NullTriggerDelegate {
    validateEmail(email) {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }
    trigger(trigger, answers, payload) {
        logger_service_1.default.info(`Kind Trigger: ${trigger.kind} performing`);
        let data = this.processTrigerConfig(trigger, { ...answers, ...payload.user });
        if (!this.validateEmail(data.email))
            return payload;
        app_1.queue.create('email', {
            from: '',
            title: `"${data.subject} | ${data.fullname}`,
            to: `"${data.fullname}"<${data.email}>`,
            subject: `${data.subject}`,
            text: ``,
            attachments: payload.files || [],
            view: trigger.config.template,
            context: {
                ...data,
                ...answers,
            }
        }).priority('high').attempts(5).save();
        return payload;
    }
}
class FileTriggerDelegate extends NullTriggerDelegate {
    async uploadFile(filePath, filename) {
        try {
            AWS.config.update({
                accessKeyId: process.env.S3_KEY || s3Config.accessKeyId,
                secretAccessKey: process.env.S3_SECRET || s3Config.secretAccessKey,
                region: process.env.S3_REGION || s3Config.region, // defaults to us-standard
            });
            let s3 = new AWS.S3({
                bucket: process.env.S3_BUCKET || s3Config.bucket,
                acl: 'public-read',
                region: process.env.S3_REGION || s3Config.region, // defaults to us-standard
            });
            let data = await fs.readFileSync(filePath);
            let s3FileOptions = {
                Key: `/tmp/${filename}`,
                Bucket: process.env.S3_BUCKET || s3Config.bucket,
                ACL: "public-read",
                Body: data
            };
            const upload = () => new Promise(((resolve, reject) => {
                s3.upload(s3FileOptions, (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(data.Location);
                    }
                });
            }));
            return await upload();
        }
        catch (e) {
            logger_service_1.default.error(e.stack);
            return "";
        }
    }
    async trigger(trigger, answers, payload) {
        logger_service_1.default.info(`Kind Trigger: ${trigger.kind} performing`);
        let data = this.processTrigerConfig(trigger, answers);
        let filename = `${moment().unix()}_${data.filename}`;
        let participant = payload.participant;
        const participantCompany = participant.user.venue && participant.user.venue.company || {};
        const config = {
            format: 'Letter',
            orientation: 'portrait',
            border: {
                top: '0.3in',
                right: '0.5in',
                bottom: '0.3in',
                left: '0.5in'
            },
            type: 'pdf',
            quality: '75'
        };
        data.signature = (await participantFile_model_1.default.find({ _id: { $in: data.signature } })).map(f => f.file.url)[0];
        moment.locale('es');
        moment.tz.setDefault('America/Santiago');
        const css = fs.readFileSync(path.join(__dirname, '../../../views/') + 'form/carDetail/style.css', 'utf8');
        const templatePath = path.join(__dirname, '../../../views/') + data.template; // 'form/carDetail/index.pug';
        const html = general_utils_1.default.generateHtmlFromPugFile(templatePath, {
            ...payload,
            ...answers,
            ...data,
            css: css.replace(/(\r\n|\n|\r)/gm, ''),
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
        const createPDF = (html, options) => new Promise(((resolve, reject) => {
            HtmlPdf.create(html, options).toFile(`/tmp/${filename}`, (err, file) => {
                if (err !== null) {
                    reject(err);
                }
                else {
                    resolve(file.filename);
                }
            });
        }));
        const PDF = await createPDF(html, config);
        const URL = await this.uploadFile(PDF, filename);
        if (payload.hasOwnProperty('files')) {
            payload.file.push({ filename, path: URL });
        }
        else {
            payload['files'] = [{ filename, path: URL }];
        }
        return payload;
    }
}
//# sourceMappingURL=triggerHandler.js.map