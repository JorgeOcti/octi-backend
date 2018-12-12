"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const chaiHttp = require("chai-http");
const cheerio = require("cheerio");
require("mocha");
const server_1 = require("../../server");
const request = require('supertest');
chai.use(chaiHttp);
const expect = chai.expect;
const authenticatedUser = request.agent(server_1.default);
describe('app', () => {
    before((done) => {
        authenticatedUser
            .get('/account/login/')
            .end((err, res) => {
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
    it('it should get robots.txt', (done) => {
        chai.request(server_1.default)
            .get('/robots.txt')
            .end((err, res) => {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should get login web', (done) => {
        chai.request(server_1.default)
            .get('/account/login/')
            .end((err, res) => {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should login web redirect if user authenticated', (done) => {
        authenticatedUser
            .get('/account/login/')
            .end((err, res) => {
            expect(res.status).to.equal(302);
            done();
        });
    });
    it('it should get forgot password web', (done) => {
        chai.request(server_1.default)
            .get('/account/forgot-password/')
            .end((err, res) => {
            expect(res.status).to.equal(200);
            const $html = cheerio(res.text);
            const csrf = $html.find('input[name=_csrf]').val();
            chai.request(server_1.default)
                .post('/account/forgot-password/')
                .set('cookie', res.header['set-cookie'][0])
                .send({
                username: 'gmunoz@osacontrol.com',
                _csrf: csrf
            })
                .end((err, res) => {
                expect(res.status).to.equal(200);
                done();
            });
        });
    });
    it('it should logout', (done) => {
        chai.request(server_1.default)
            .get('/account/logout/')
            .end((err, res) => {
            expect(res.status).to.equal(200);
            done();
        });
    });
});
//# sourceMappingURL=app.controller.spec.js.map