"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const setting_model_1 = require("../models/setting.model");
const api_1 = require("../services/api");
const logger_1 = require("../services/logger");
class DnsController {
    constructor() {
        this.login = this.login.bind(this);
    }
    async login(req, res) {
        const { username, password } = req.body;
        if (username && password && username.length) {
            logger_1.default.info(`username ${username}`);
            try {
                const domain = await this.findDomainByUser(username);
                logger_1.default.info(`domain ${domain}`);
                api_1.default.login(`${domain}/api/1.1/users/login/`, {
                    username,
                    password
                }).then((response) => {
                    const { data, status } = response.data;
                    data.domain = domain;
                    res.json({
                        status,
                        data
                    });
                }).catch((err) => {
                    const { status, error } = err.response ? err.response.data : { status: 500, error: '' };
                    // logger.error( err.response ? error : '');
                    res.status(status || 500).json({
                        status: status || 500,
                        error: err.response ? error : ''
                    });
                });
            }
            catch (e) {
                logger_1.default.error(e);
            }
        }
        else {
            logger_1.default.info('Username and password are required');
            res.status(401).json({
                status: 401,
                error: 'Username and password are required'
            });
        }
    }
    findDomainByUser(username) {
        return new Promise((resolve, reject) => {
            const defaulDomain = 'https://www.osacontrol.com';
            this.findByEqual(username)
                .then((setting) => {
                if (setting) {
                    resolve(setting.equal[0].domain);
                }
                else if (username.includes('@')) {
                    this.findByContain(username.split('@')[1])
                        .then((setting) => {
                        if (setting) {
                            resolve(setting.contain[0].domain);
                        }
                        else {
                            resolve(defaulDomain);
                        }
                    })
                        .catch((error) => {
                        logger_1.default.error(error);
                        reject(error);
                    });
                }
                else {
                    resolve(defaulDomain);
                }
            })
                .catch((error) => {
                logger_1.default.error(error);
                reject(error);
            });
        });
    }
    findByEqual(username) {
        return new Promise((resolve, reject) => {
            setting_model_1.default.findOne({ 'equal.text': username }, { 'equal.$.domain': 1 }, (err, setting) => {
                if (err) {
                    reject(err);
                }
                resolve(setting);
            });
        });
    }
    findByContain(domain) {
        return new Promise((resolve, reject) => {
            setting_model_1.default.findOne({ 'contain.text': domain }, { 'contain.$.domain': 1 }, (err, setting) => {
                if (err) {
                    reject(err);
                }
                resolve(setting);
            });
        });
    }
}
exports.default = new DnsController();
//# sourceMappingURL=dns.controller.js.map