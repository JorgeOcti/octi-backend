"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_service_1 = require("../../services/logger.service");
const trigger_model_1 = require("../models/trigger.model");
const app_1 = require("../../app");
const HtmlPdf = require("html-pdf");
const fs = require("fs");
const path = require("path");
const general_utils_1 = require("../../utils/general.utils");
const moment = require("moment");
const form_model_1 = require("../models/form.model");
const participantFile_model_1 = require("../models/participantFile.model");
class TriggerHandler {
    constructor(form, participant, answers) {
        this.form = form;
        this.participant = participant;
        this.answers = answers ? answers : this.getAnswers();
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
    execute(payload = {}) {
        this.form.triggers.reduce((payload, trigger) => {
            return this.executeTrigger(trigger).trigger(trigger, this.answers, { ...payload, participant: this.participant });
        }, payload);
    }
    executeTrigger(trigger) {
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
        logger_service_1.default.info(JSON.stringify(answers));
        logger_service_1.default.info(JSON.stringify(trigger.config));
        logger_service_1.default.info(JSON.stringify(Object.keys(trigger.config.toJSON())));
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
    trigger(trigger, answers, payload) {
        logger_service_1.default.info(`Kind Trigger: ${trigger.kind} performing`);
        logger_service_1.default.info(trigger.config.template);
        let data = this.processTrigerConfig(trigger, answers);
        app_1.queue.create('email', {
            from: '',
            title: `Welcome email for ${data.fullname}`,
            to: `"${data.fullname}"<${data.email}>`,
            subject: `${data.fullname} bienvenido(a) a OSA Andes`,
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
    async trigger(trigger, answers, payload) {
        logger_service_1.default.info(`Kind Trigger: ${trigger.kind} performing`);
        let data = this.processTrigerConfig(trigger, answers);
        let filename = `${moment().unix()}_${data.filename}`;
        let filePath = `/tmp/${filename}`;
        let participant = payload.participant;
        const participantCompany = participant.user.venue && participant.user.venue.company || {};
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
            type: 'pdf',
            quality: '75'
        };
        logger_service_1.default.info("DATA:" + JSON.stringify(data));
        data.signature = (await participantFile_model_1.default.find({ _id: { $in: data.signature } })).map(f => f.file.url)[0];
        logger_service_1.default.info("DATA:" + JSON.stringify(data));
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
        await HtmlPdf.create(html, config).toFile(filePath);
        // });
        if (payload.hasOwnProperty('files')) {
            payload.file.push({ filename, path: filePath });
        }
        else {
            payload['files'] = [{ filename, path: filePath }];
        }
        return payload;
    }
}
//# sourceMappingURL=triggerHandler.js.map