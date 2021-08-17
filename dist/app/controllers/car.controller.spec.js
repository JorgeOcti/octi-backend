"use strict";
exports.__esModule = true;
var chai = require("chai");
var chaiHttp = require("chai-http");
var cheerio = require("cheerio");
require("mocha");
var server_1 = require("../../server");
var request = require('supertest');
chai.use(chaiHttp);
var expect = chai.expect;
var token = '';
var authenticatedUser = request.agent(server_1["default"]);
describe('cars', function () {
    before(function (done) {
        chai.request(server_1["default"])
            .post('/api/v1/login/')
            .send({
            username: 'gmunoz@osacontrol.com',
            password: '123'
        })
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            token = res.body.data.token;
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
    });
    it('it should check vin', function (done) {
        chai.request(server_1["default"])
            .post('/api/v1/check-vin/')
            .set('Authorization', "JWT " + token)
            .send({
            vin: '3BRBD33B7JK590498'
        })
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should check vin with vin2', function (done) {
        chai.request(server_1["default"])
            .post('/api/v1/check-vin/')
            .set('Authorization', "JWT " + token)
            .send({
            vin2: '590498'
        })
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should fail check vin fake inventory', function (done) {
        chai.request(server_1["default"])
            .post('/api/v1/check-vin/')
            .set('Authorization', "JWT " + token)
            .send({
            vin: '3BRBD33B7JK590498',
            inventory: '0af487b4f6a4c95ccd991400'
        })
            .end(function (err, res) {
            expect(res.status).to.equal(404);
            done();
        });
    });
    it('it should get dashboard principal', function (done) {
        authenticatedUser
            .get('/')
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should get data to dashboard principal', function (done) {
        authenticatedUser
            .get("/api/participants-per-date/")
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should get dashboard cars', function (done) {
        authenticatedUser
            .get('/cars/')
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
    var cars = [];
    it('it should get data to dashboard cars', function (done) {
        authenticatedUser
            .get('/api/cars/')
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            cars = res.body.results;
            done();
        });
    });
    it('it should get dashboard car detail', function (done) {
        authenticatedUser
            .get("/cars/" + cars[0]._id)
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should fail by bad id when get dashboard car detail', function (done) {
        authenticatedUser
            .get("/cars/0af487b4f6a4c95ccd991400")
            .end(function (err, res) {
            expect(res.status).to.equal(302);
            done();
        });
    });
    it('it should get data to dashboard car detail', function (done) {
        authenticatedUser
            .get("/api/cars/" + cars[0]._id)
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should fail get data to dashboard car detail', function (done) {
        authenticatedUser
            .get("/api/cars/0af487b4f6a4c95ccd991400")
            .end(function (err, res) {
            expect(res.status).to.equal(404);
            done();
        });
    });
    it('it should get data to participant detail', function (done) {
        authenticatedUser
            .get("/api/participant/" + cars[0].lastForm._id)
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            cars = res.body.results;
            done();
        });
    });
    it('it should fail get data to participant detail', function (done) {
        authenticatedUser
            .get("/api/participant/0af487b4f6a4c95ccd991400")
            .end(function (err, res) {
            expect(res.status).to.equal(404);
            cars = res.body.results;
            done();
        });
    });
});
//# sourceMappingURL=car.controller.spec.js.map