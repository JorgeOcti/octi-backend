"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const chaiHttp = require("chai-http");
const cheerio = require("cheerio");
const fs = require("fs");
require("mocha");
const path = require("path");
const server_1 = require("../../server");
const inventory_model_1 = require("../models/inventory.model");
const request = require('supertest');
chai.use(chaiHttp);
const expect = chai.expect;
let token = '';
const authenticatedUser = request.agent(server_1.default);
let firstInventory;
const inventoryData = {
    name: 'InventoryTest',
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
describe('inventories', () => {
    before((done) => {
        chai.request(server_1.default)
            .post('/api/v1/login/')
            .send({
            username: 'gmunoz@osacontrol.com',
            password: '123'
        })
            .end((err, res) => {
            token = res.body.data.token;
            authenticatedUser
                .get('/account/login/')
                .end((err, res) => {
                expect(res.status).to.equal(200);
                const $html = cheerio(res.text);
                const csrf = $html.find('input[name=_csrf]').val();
                authenticatedUser
                    .post('/account/login/')
                    .set('cookie', res.header['set-cookie'][0])
                    .send({
                    username: 'gmunoz@osacontrol.com',
                    password: '123',
                    _csrf: csrf
                })
                    .end((err, res) => {
                    expect(res.status).to.equal(302);
                    done();
                });
            });
        });
    });
    it('it should return list of inventories api', (done) => {
        chai.request(server_1.default)
            .get('/api/v1/inventory/')
            .set('Authorization', `JWT ${token}`)
            .end((err, res) => {
            expect(res.status).to.equal(200);
            expect(res.body).have.property('status');
            expect(res.body.status).to.equal(200);
            expect(res.body).have.property('data');
            expect(res.body).to.have.all.keys([
                'data',
                'status'
            ]);
            expect(res.body.data).be.a('array');
            res.body.data.forEach((item) => {
                expect(item).to.have.all.keys([
                    '_id',
                    'name'
                ]);
            });
            firstInventory = res.body.data[0];
            done();
        });
    });
    it('it should enter in list of inventories', (done) => {
        authenticatedUser
            .get('/inventory/')
            .end((err, res) => {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should get list of inventories', (done) => {
        authenticatedUser
            .get('/api/inventory/')
            .end((err, res) => {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should get detail of inventories', (done) => {
        authenticatedUser
            .get(`/api/inventory/${firstInventory._id}`)
            .end((err, res) => {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should fail when get detail of inventories', (done) => {
        authenticatedUser
            .get(`/api/inventory/0af487b4f6a4c95ccd991400`)
            .end((err, res) => {
            expect(res.status).to.equal(404);
            done();
        });
    });
    it('it should enter in detail of inventories', (done) => {
        authenticatedUser
            .get(`/inventory/${firstInventory._id}`)
            .end((err, res) => {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should fail when enter in detail of inventories', (done) => {
        authenticatedUser
            .get(`/inventory/0af487b4f6a4c95ccd991400`)
            .end((err, res) => {
            expect(res.status).to.equal(404);
            done();
        });
    });
    let inventoryID = '';
    it('it should enter in create inventory', (done) => {
        authenticatedUser
            .get('/api/inventory/')
            .end((err, res) => {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should create inventory', (done) => {
        authenticatedUser
            .post('/api/inventory/')
            .send(inventoryData)
            .end((err, res) => {
            expect(res.status).to.equal(200);
            expect(res.body).have.property('message');
            expect(res.body).have.property('status');
            inventoryID = res.body._id;
            done();
        });
    });
    it('it should found car in my venue', (done) => {
        authenticatedUser
            .post(`/api/v1/inventory/${inventoryID}/`)
            .send({
            vin: inventoryData.carsByVenue[0].cars[0].vin,
            images: ['5b88332bd99c9365a40e0b63']
        })
            .end((err, res) => {
            expect(res.status).to.equal(200);
            expect(res.body).have.property('status');
            expect(res.body.status).to.equal(200);
            done();
        });
    });
    it('it should fail found repeat car in my venue', (done) => {
        authenticatedUser
            .post(`/api/v1/inventory/${inventoryID}/`)
            .send({
            vin: inventoryData.carsByVenue[0].cars[0].vin,
            images: []
        })
            .end((err, res) => {
            expect(res.status).to.equal(400);
            expect(res.body.status).to.equal(400);
            done();
        });
    });
    it('it should fail found when no exist inventary', (done) => {
        authenticatedUser
            .post(`/api/v1/inventory/0af487b4f6a4c95ccd991400`)
            .send({
            vin: inventoryData.carsByVenue[0].cars[0].vin,
            images: []
        })
            .end((err, res) => {
            expect(res.status).to.equal(400);
            expect(res.body.status).to.equal(400);
            done();
        });
    });
    it('it should found car in other venue', (done) => {
        authenticatedUser
            .post(`/api/v1/inventory/${inventoryID}/`)
            .send({
            vin: inventoryData.carsByVenue[1].cars[0].vin,
            images: []
        })
            .end((err, res) => {
            expect(res.status).to.equal(200);
            expect(res.body).have.property('status');
            expect(res.body.status).to.equal(200);
            done();
        });
    });
    it('it should comment car', (done) => {
        inventory_model_1.default.findById(inventoryID).exec((err, invetory) => {
            if (err) {
                console.log(err);
            }
            if (invetory) {
                authenticatedUser
                    .post(`/api/inventory/${inventoryID}/comment/`)
                    .send({
                    _id: invetory.cars[0]._id,
                    comment: 'Prueba comentario'
                })
                    .end((err, res) => {
                    expect(res.status).to.equal(200);
                    expect(res.body).have.property('message');
                    expect(res.body).have.property('status');
                    expect(res.body.status).to.equal(200);
                    done();
                });
            }
        });
    });
    it('it should report found car', (done) => {
        authenticatedUser
            .post(`/api/v1/inventory/${inventoryID}/report-car/`)
            .send({
            vin: '3BRBD33B7J159042',
            brand: 'GONZALO',
            denomination: 'DUSTER ZEN 2,0L 6MT 4X4',
            color: 'Blanco',
            images: ['5b88332bd99c9365a40e0b63']
        })
            .end((err, res) => {
            expect(res.status).to.equal(200);
            expect(res.body).have.property('status');
            expect(res.body.status).to.equal(200);
            done();
        });
    });
    it('it should fail report found car', (done) => {
        authenticatedUser
            .post(`/api/v1/inventory/0af487b4f6a4c95ccd991400/report-car/`)
            .send({
            vin: '3BRBD33B7J159042',
            brand: 'GONZALO',
            denomination: 'DUSTER ZEN 2,0L 6MT 4X4',
            color: 'Blanco',
            images: []
        })
            .end((err, res) => {
            expect(res.status).to.equal(400);
            done();
        });
    });
    it('it should upload photo', (done) => {
        authenticatedUser
            .post(`/api/v1/inventory/${inventoryID}/upload-file/`)
            .attach('file', fs.readFileSync(path.join(__dirname, '../../../test/assets/images/t_head_bg_america.jpg')), 't_head_bg_america.jpg')
            .end((err, res) => {
            expect(res.status).to.equal(201);
            expect(res.body).have.property('status');
            expect(res.body.status).to.equal(201);
            done();
        });
    });
    it('it should finish inventory', (done) => {
        authenticatedUser
            .post(`/api/inventory/0af487b4f6a4c95ccd991400/finish/`)
            .end((err, res) => {
            expect(res.status).to.equal(400);
            done();
        });
    });
    it('it should fail finish inventory', (done) => {
        authenticatedUser
            .post(`/api/inventory/${inventoryID}/finish/`)
            .end((err, res) => {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should fail delete inventory', (done) => {
        authenticatedUser
            .delete(`/api/inventory/0af487b4f6a4c95ccd991400/`)
            .end((err, res) => {
            expect(res.status).to.equal(400);
            done();
        });
    });
    it('it should delete inventory', (done) => {
        authenticatedUser
            .delete(`/api/inventory/${inventoryID}/`)
            .end((err, res) => {
            expect(res.status).to.equal(200);
            done();
        });
    });
});
//# sourceMappingURL=inventory.controller.spec.js.map