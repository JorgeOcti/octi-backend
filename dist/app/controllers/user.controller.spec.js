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
let token = '';
const authenticatedUser = request.agent(server_1.default);
describe('users', () => {
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
    });
    it('it should change password', (done) => {
        chai.request(server_1.default)
            .post('/api/v1/change-password/')
            .set('Authorization', `JWT ${token}`)
            .send({
            password: '123',
            newPassword: '123'
        })
            .end((err, res) => {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should fail change password', (done) => {
        chai.request(server_1.default)
            .post('/api/v1/change-password/')
            .set('Authorization', `JWT ${token}`)
            .send({
            password: '1234',
            newPassword: '123'
        })
            .end((err, res) => {
            expect(res.status).to.equal(400);
            done();
        });
    });
});
//# sourceMappingURL=user.controller.spec.js.map