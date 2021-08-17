"use strict";
exports.__esModule = true;
var chai = require("chai");
var chaiHttp = require("chai-http");
var cheerio = require("cheerio");
require("mocha");
var server_1 = require("../../../server");
var request = require('supertest');
chai.use(chaiHttp);
chai.config.includeStack = true;
chai.config.showDiff = true;
var expect = chai.expect;
var authenticatedUser = request.agent(server_1["default"]);
describe('amin alert', function () {
    before(function (done) {
        authenticatedUser
            .get('/account/login/')
            .end(function (err, response) {
            var $html = cheerio(response.text);
            var csrf = $html.find('input[name=_csrf]').val();
            authenticatedUser
                .post('/account/login/')
                .set('cookie', response.header['set-cookie'][0])
                .send({
                username: 'gmunoz@osacontrol.com',
                password: '123',
                _csrf: csrf
            })
                .end(function (err, response) {
                expect(response.status).to.equal(302);
                done();
            });
        });
    });
    it('it should get list alerts', function (done) {
        authenticatedUser
            .get('/settings/alerts/')
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should get data in list alerts', function (done) {
        authenticatedUser
            .get('/api/admin/alerts/')
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
    var alertTest = {};
    it('it should create alerts', function (done) {
        authenticatedUser
            .post('/api/admin/alerts/')
            .send({
            gte: 0,
            lte: 10,
            name: 'prueba',
            type: 'lte',
            users: ['5af487b4f6a4c95ccd991466']
        })
            .end(function (err, res) {
            expect(res.status).to.equal(201);
            alertTest = res.body.alert;
            done();
        });
    });
    it('it should delete alerts', function (done) {
        authenticatedUser["delete"]("/api/admin/alerts/" + alertTest._id)
            .end(function (err, res) {
            alertTest = res.body.alert;
            expect(res.status).to.equal(200);
            done();
        });
    });
});
//# sourceMappingURL=alert.admin.controller.spec.js.map