"use strict";
exports.__esModule = true;
var chai = require("chai");
var chaiHttp = require("chai-http");
var cheerio = require("cheerio");
require("mocha");
var server_1 = require("../../../server");
var request = require('supertest');
var randomstring = require("randomstring");
var car_model_1 = require("../../models/car.model");
chai.use(chaiHttp);
var expect = chai.expect;
var dataImportCar = [{
        NInterno: '1020',
        color: 'Rojo',
        denominacion: 'Prueba',
        destino: '',
        id: '9e5f05b0-feea-11e8-a20e-e7aa870cc5aa',
        marca: 'Prueba',
        status: 1,
        vin: randomstring.generate({
            length: 17,
            charset: 'alphanumeric'
        })
    }];
var authenticatedUser = request.agent(server_1["default"]);
describe('admin cars', function () {
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
    after(function (done) {
        car_model_1["default"].find({ denomination: 'Prueba' }).remove(function (err) {
            if (err) {
                console.log(err);
            }
            done();
        });
    });
    it('it should enter in list cars', function (done) {
        authenticatedUser
            .get('/settings/cars/')
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should enter in import cars', function (done) {
        authenticatedUser
            .get('/settings/cars/import/')
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should import cars', function (done) {
        authenticatedUser
            .post('/api/admin/import-cars/')
            .send({ cars: dataImportCar })
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should re import cars', function (done) {
        authenticatedUser
            .post('/api/admin/import-cars/')
            .send({ cars: dataImportCar })
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should get data in list cars', function (done) {
        authenticatedUser
            .get('/api/admin/cars/')
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
});
//# sourceMappingURL=car.admin.controller.spec.js.map