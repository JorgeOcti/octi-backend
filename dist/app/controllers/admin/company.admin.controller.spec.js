"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const chaiHttp = require("chai-http");
const cheerio = require("cheerio");
require("mocha");
const randomstring = require("randomstring");
const server_1 = require("../../../server");
const request = require('supertest');
chai.use(chaiHttp);
const expect = chai.expect;
const authenticatedUser = request.agent(server_1.default);
describe('admin companies', () => {
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
    it('it should get list companies', (done) => {
        authenticatedUser
            .get('/settings/companies/')
            .end((err, res) => {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should get data in list companies', (done) => {
        authenticatedUser
            .get('/api/admin/companies/')
            .end((err, res) => {
            expect(res.status).to.equal(200);
            done();
        });
    });
    let testCompamny = {};
    it('it should create company', (done) => {
        authenticatedUser
            .post('/api/admin/companies/')
            .send({
            name: randomstring.generate({
                length: 17,
                charset: 'alphanumeric'
            })
        })
            .end((err, res) => {
            expect(res.status).to.equal(201);
            testCompamny = res.body.company;
            done();
        });
    });
    it('it should update company', (done) => {
        authenticatedUser
            .patch(`/api/admin/companies/${testCompamny._id}`)
            .send({
            name: randomstring.generate({
                length: 17,
                charset: 'alphanumeric'
            })
        })
            .end((err, res) => {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should delete company', (done) => {
        authenticatedUser
            .delete(`/api/admin/companies/${testCompamny._id}`)
            .end((err, res) => {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should delete company again', (done) => {
        authenticatedUser
            .delete(`/api/admin/companies/${testCompamny._id}`)
            .end((err, res) => {
            expect(res.status).to.equal(200);
            done();
        });
    });
});
//# sourceMappingURL=company.admin.controller.spec.js.map