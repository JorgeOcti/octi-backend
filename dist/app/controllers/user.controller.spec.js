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
describe('users', function () {
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
    it('it should change password', function (done) {
        chai.request(server_1["default"])
            .post('/api/v1/change-password/')
            .set('Authorization', "JWT " + token)
            .send({
            password: '123',
            newPassword: '123'
        })
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should fail change password', function (done) {
        chai.request(server_1["default"])
            .post('/api/v1/change-password/')
            .set('Authorization', "JWT " + token)
            .send({
            password: '1234',
            newPassword: '123'
        })
            .end(function (err, res) {
            expect(res.status).to.equal(400);
            done();
        });
    });
});
//# sourceMappingURL=user.controller.spec.js.map