"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var chai = require("chai");
var chaiHttp = require("chai-http");
var cheerio = require("cheerio");
var fs = require("fs");
require("mocha");
var path = require("path");
var server_1 = require("../../server");
var inventory_model_1 = require("../models/inventory.model");
var request = require('supertest');
chai.use(chaiHttp);
chai.config.includeStack = true;
chai.config.showDiff = true;
var expect = chai.expect;
var token = '';
var authenticatedUser = request.agent(server_1["default"]);
var firstInventory;
var inventoryData = {
    name: 'Inventory test',
    notification: true,
    carsByVenue: [{
            name: 'Dercocenter Movicenter',
            cars: [{
                    brand: 'RENAULT',
                    color: 'GRIS PLATA - RE',
                    denomination: 'ALAS23C4INTENSMT',
                    internalNumber: '2507259',
                    vin: '3BRBD33B7JK590498'
                }, {
                    brand: 'RENAULT',
                    color: 'BLANCO GLACIER - RE1',
                    denomination: 'ORO20C2INTENSMT',
                    internalNumber: '2482921',
                    vin: '93Y9SR5A6KJ354343'
                }]
        }, {
            name: 'Dercocenter Movicenter',
            cars: [{
                    brand: 'RENAULT',
                    color: 'GRIS PLATA - RE',
                    denomination: 'ALAS23C4INTENSMT',
                    internalNumber: '2507258',
                    vin: '3BRBD33B7JK590492'
                }, {
                    brand: 'RENAULT',
                    color: 'BLANCO GLACIER - RE1',
                    denomination: 'ORO20C2INTENSMT',
                    internalNumber: '2482920',
                    vin: '93Y9SR5A6KJ354341'
                }]
        }]
};
describe('inventories', function () {
    before(function (done) {
        chai.request(server_1["default"])
            .post('/api/v1/login/')
            .send({
            username: 'gmunoz@osacontrol.com',
            password: '123'
        })
            .end(function (err, res) {
            token = res.body.data.token;
            authenticatedUser
                .get('/account/login/')
                .end(function (err, res) {
                expect(res.status).to.equal(200);
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
    });
    it('it should return list of inventories api', function (done) {
        chai.request(server_1["default"])
            .get('/api/v1/inventory/')
            .set('Authorization', "JWT " + token)
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            expect(res.body).have.property('status');
            expect(res.body.status).to.equal(200);
            expect(res.body).have.property('data');
            expect(res.body).to.have.all.keys([
                'data',
                'status'
            ]);
            expect(res.body.data).be.a('array');
            res.body.data.forEach(function (item) {
                expect(item).to.have.all.keys([
                    '_id',
                    'name',
                    'settings'
                ]);
            });
            firstInventory = res.body.data[0];
            done();
        });
    });
    it('it should enter in list of inventories', function (done) {
        authenticatedUser
            .get('/inventory/')
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should get list of inventories', function (done) {
        authenticatedUser
            .get('/api/inventory/')
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should get detail of inventories', function (done) {
        authenticatedUser
            .get("/api/inventory/" + firstInventory._id)
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should fail when get detail of inventories', function (done) {
        authenticatedUser
            .get("/api/inventory/0af487b4f6a4c95ccd991400")
            .end(function (err, res) {
            expect(res.status).to.equal(404);
            done();
        });
    });
    it('it should enter in detail of inventories', function (done) {
        authenticatedUser
            .get("/inventory/" + firstInventory._id)
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should fail when enter in detail of inventories', function (done) {
        authenticatedUser
            .get("/inventory/0af487b4f6a4c95ccd991400")
            .end(function (err, res) {
            expect(res.status).to.equal(404);
            done();
        });
    });
    var inventoryID = '';
    it('it should enter in create inventory', function (done) {
        authenticatedUser
            .get('/api/inventory/')
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should create inventory', function (done) {
        authenticatedUser
            .post('/api/inventory/')
            .send(__assign(__assign({}, inventoryData), { carsByVenue: JSON.stringify(inventoryData.carsByVenue), notification: inventoryData.notification.toString() }))
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            expect(res.body).have.property('message');
            expect(res.body).have.property('status');
            inventoryID = res.body._id;
            done();
        });
    });
    it('it should found car in my venue', function (done) {
        authenticatedUser
            .post("/api/v1/inventory/" + inventoryID + "/")
            .send({
            vin: inventoryData.carsByVenue[0].cars[0].vin,
            images: ['5b88332bd99c9365a40e0b63']
        })
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            expect(res.body).have.property('status');
            expect(res.body.status).to.equal(200);
            done();
        });
    });
    it('it should fail found repeat car in my venue', function (done) {
        authenticatedUser
            .post("/api/v1/inventory/" + inventoryID + "/")
            .send({
            vin: inventoryData.carsByVenue[0].cars[0].vin,
            images: []
        })
            .end(function (err, res) {
            expect(res.status).to.equal(400);
            expect(res.body.status).to.equal(400);
            done();
        });
    });
    it('it should fail found when no exist inventary', function (done) {
        authenticatedUser
            .post("/api/v1/inventory/0af487b4f6a4c95ccd991400")
            .send({
            vin: inventoryData.carsByVenue[0].cars[0].vin,
            images: []
        })
            .end(function (err, res) {
            expect(res.status).to.equal(404);
            expect(res.body.status).to.equal(404);
            done();
        });
    });
    it('it should found car in other venue', function (done) {
        authenticatedUser
            .post("/api/v1/inventory/" + inventoryID + "/")
            .send({
            vin: inventoryData.carsByVenue[1].cars[0].vin,
            images: []
        })
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            expect(res.body).have.property('status');
            expect(res.body.status).to.equal(200);
            done();
        });
    });
    it('it should comment car', function (done) {
        inventory_model_1["default"].findById(inventoryID).populate([{
                path: 'cars'
            }]).exec(function (err, invetory) {
            if (err) {
                console.log(err);
            }
            if (invetory) {
                authenticatedUser
                    .post("/api/inventory/" + inventoryID + "/comment/")
                    .send({
                    _id: invetory.cars[0]._id,
                    comment: 'Prueba comentario'
                })
                    .end(function (err, res) {
                    expect(res.status).to.equal(200);
                    expect(res.body).have.property('message');
                    expect(res.body).have.property('status');
                    expect(res.body.status).to.equal(200);
                    done();
                });
            }
        });
    });
    it('it should report found car', function (done) {
        authenticatedUser
            .post("/api/v1/inventory/" + inventoryID + "/report-car/")
            .send({
            vin: '3BRBD33B7J159042',
            brand: 'GONZALO',
            denomination: 'DUSTER ZEN 2,0L 6MT 4X4',
            color: 'Blanco',
            images: ['5b88332bd99c9365a40e0b63']
        })
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            expect(res.body).have.property('status');
            expect(res.body.status).to.equal(200);
            done();
        });
    });
    it('it should fail report found car', function (done) {
        authenticatedUser
            .post("/api/v1/inventory/0af487b4f6a4c95ccd991400/report-car/")
            .send({
            vin: '3BRBD33B7J159042',
            brand: 'GONZALO',
            denomination: 'DUSTER ZEN 2,0L 6MT 4X4',
            color: 'Blanco',
            images: []
        })
            .end(function (err, res) {
            expect(res.status).to.equal(404);
            done();
        });
    });
    it('it should upload photo', function (done) {
        authenticatedUser
            .post("/api/v1/inventory/" + inventoryID + "/upload-file/")
            .attach('file', fs.readFileSync(path.join(__dirname, '../../../test/assets/images/t_head_bg_america.jpg')), 't_head_bg_america.jpg')
            .end(function (err, res) {
            expect(res.status).to.equal(201);
            expect(res.body).have.property('status');
            expect(res.body.status).to.equal(201);
            done();
        });
    });
    it('it should finish inventory', function (done) {
        authenticatedUser
            .post("/api/inventory/0af487b4f6a4c95ccd991400/finish/")
            .end(function (err, res) {
            expect(res.status).to.equal(400);
            done();
        });
    });
    it('it should fail finish inventory', function (done) {
        authenticatedUser
            .post("/api/inventory/" + inventoryID + "/finish/")
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should fail delete inventory', function (done) {
        authenticatedUser["delete"]("/api/inventory/0af487b4f6a4c95ccd991400/")
            .end(function (err, res) {
            expect(res.status).to.equal(400);
            done();
        });
    });
    it('it should delete inventory', function (done) {
        authenticatedUser["delete"]("/api/inventory/" + inventoryID + "/")
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
});
//# sourceMappingURL=inventory.controller.spec.js.map