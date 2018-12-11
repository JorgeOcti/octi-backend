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
describe('cars', () => {
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
    it('it should check vin', (done) => {
        chai.request(server_1.default)
            .post('/api/v1/check-vin/')
            .set('Authorization', `JWT ${token}`)
            .send({
            vin: '3BRBD33B7JK590498'
        })
            .end((err, res) => {
            expect(res.status).to.equal(200);
            // expect(res.body).have.property('message');
            // expect(res.body).have.property('status');
            // expect(res.body).to.have.all.keys([
            //   'message',
            //   'status'
            // ]);
            done();
        });
    });
});
//# sourceMappingURL=car.controller.spec.js.map