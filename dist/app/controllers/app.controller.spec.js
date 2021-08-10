"use strict";
exports.__esModule = true;
var chai = require("chai");
var chaiHttp = require("chai-http");
var cheerio = require("cheerio");
require("mocha");
var server_1 = require("../../server");
var user_model_1 = require("../models/user.model");
var request = require('supertest');
chai.use(chaiHttp);
var expect = chai.expect;
var authenticatedUser = request.agent(server_1["default"]);
describe('app', function () {
    before(function (done) {
        authenticatedUser
            .get('/account/login/')
            .end(function (err, res) {
            var $html = cheerio(res.text);
            var csrf = $html.find('input[name=_csrf]').val();
            authenticatedUser
                .post('/account/login/')
                .set('cookie', res.header['set-cookie'][0])
                .send({
                username: 'gmunoz@osacontrol.com',
                password: '123',
                _csrf: csrf
            })
                .end(function (err, res) {
                expect(res.status).to.equal(302);
                done();
            });
        });
    });
    it('it should get robots.txt', function (done) {
        chai.request(server_1["default"])
            .get('/robots.txt')
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should get login web', function (done) {
        chai.request(server_1["default"])
            .get('/account/login/')
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should login web redirect if user authenticated', function (done) {
        authenticatedUser
            .get('/account/login/')
            .end(function (err, res) {
            expect(res.status).to.equal(302);
            done();
        });
    });
    it('it should get forgot password web', function (done) {
        chai.request(server_1["default"])
            .get('/account/forgot-password/')
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            var $html = cheerio(res.text);
            var csrf = $html.find('input[name=_csrf]').val();
            chai.request(server_1["default"])
                .post('/account/forgot-password/')
                .set('cookie', res.header['set-cookie'][0])
                .send({
                username: 'gmunoz@osacontrol.com',
                _csrf: csrf
            })
                .end(function (err, res) {
                expect(res.status).to.equal(200);
                done();
            });
        });
    });
    it('it should enter in recovery page and process recovery', function (done) {
        user_model_1["default"].findOne({ email: 'gmunoz@osacontrol.com' }).exec(function (err, user) {
            if (err) {
                console.log(err);
            }
            if (user) {
                chai.request(server_1["default"])
                    .get("/account/recovery/" + user.passwordResetToken)
                    .end(function (err, res) {
                    expect(res.status).to.equal(200);
                    var $html = cheerio(res.text);
                    var csrf = $html.find('input[name=_csrf]').val();
                    chai.request(server_1["default"])
                        .post("/account/recovery/" + user.passwordResetToken)
                        .set('cookie', res.header['set-cookie'][0])
                        .send({
                        password: '123',
                        password2: '123',
                        _csrf: csrf
                    })
                        .end(function (err, res) {
                        console.log('res.status', res.status);
                        expect(res.status).to.equal(200);
                        done();
                    });
                });
            }
        });
    });
    it('it should logout', function (done) {
        chai.request(server_1["default"])
            .get('/account/logout/')
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
});
//# sourceMappingURL=app.controller.spec.js.map