"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const chaiHttp = require("chai-http");
const cheerio = require("cheerio");
require("mocha");
const server_1 = require("../../../server");
const request = require('supertest');
const randomstring = require("randomstring");
chai.use(chaiHttp);
const expect = chai.expect;
const authenticatedUser = request.agent(server_1.default);
describe('admin venues', () => {
    before((done) => {
        authenticatedUser
            .get('/account/login/')
            .end((err, response) => {
            const $html = cheerio(response.text);
            const csrf = $html.find('input[name=_csrf]').val();
            authenticatedUser
                .post('/account/login/')
                .set('cookie', response.header['set-cookie'][0])
                .send({
                username: 'gmunoz@osacontrol.com',
                password: '123',
                _csrf: csrf
            })
                .end((err, response) => {
                expect(response.status).to.equal(302);
                done();
            });
        });
    });
    it('it should get list venues', (done) => {
        authenticatedUser
            .get('/settings/venues/')
            .end((err, res) => {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should get data in list venues', (done) => {
        authenticatedUser
            .get('/api/admin/venues/')
            .end((err, res) => {
            expect(res.status).to.equal(200);
            done();
        });
    });
    let testVenue = {};
    it('it should create venue', (done) => {
        authenticatedUser
            .post('/api/admin/venues/')
            .send({
            company: {
                _id: '5b17f8f0346a450658b5721e'
            },
            name: randomstring.generate({
                length: 17,
                charset: 'alphanumeric'
            }),
            type: 'receiver'
        })
            .end((err, res) => {
            expect(res.status).to.equal(201);
            testVenue = res.body.venue;
            done();
        });
    });
    it('it should update venue', (done) => {
        authenticatedUser
            .patch(`/api/admin/venues/${testVenue._id}`)
            .send({
            company: '5b17f8f0346a450658b5721e',
            name: randomstring.generate({
                length: 17,
                charset: 'alphanumeric'
            }),
            type: 'receiver'
        })
            .end((err, res) => {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should delete venue', (done) => {
        authenticatedUser
            .delete(`/api/admin/venues/${testVenue._id}`)
            .end((err, res) => {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should delete venue again', (done) => {
        authenticatedUser
            .delete(`/api/admin/venues/${testVenue._id}`)
            .end((err, res) => {
            expect(res.status).to.equal(200);
            done();
        });
    });
});
//# sourceMappingURL=venue.admin.controller.spec.js.map