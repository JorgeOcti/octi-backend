"use strict";
exports.__esModule = true;
var chai = require("chai");
var chaiHttp = require("chai-http");
var cheerio = require("cheerio");
require("mocha");
var randomstring = require("randomstring");
var server_1 = require("../../../server");
var request = require('supertest');
chai.use(chaiHttp);
var expect = chai.expect;
var authenticatedUser = request.agent(server_1["default"]);
describe('admin companies', function () {
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
    it('it should get list companies', function (done) {
        authenticatedUser
            .get('/settings/companies/')
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should get data in list companies', function (done) {
        authenticatedUser
            .get('/api/admin/companies/')
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
    var testCompamny = {};
    it('it should create company', function (done) {
        authenticatedUser
            .post('/api/admin/companies/')
            .send({
            name: randomstring.generate({
                length: 17,
                charset: 'alphanumeric'
            })
        })
            .end(function (err, res) {
            expect(res.status).to.equal(201);
            testCompamny = res.body.company;
            done();
        });
    });
    it('it should update company', function (done) {
        authenticatedUser
            .patch("/api/admin/companies/" + testCompamny._id)
            .send({
            name: randomstring.generate({
                length: 17,
                charset: 'alphanumeric'
            })
        })
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should delete company', function (done) {
        authenticatedUser["delete"]("/api/admin/companies/" + testCompamny._id)
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should delete company again', function (done) {
        authenticatedUser["delete"]("/api/admin/companies/" + testCompamny._id)
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
});
//# sourceMappingURL=company.admin.controller.spec.js.map