"use strict";
exports.__esModule = true;
var chai = require("chai");
var chaiHttp = require("chai-http");
var cheerio = require("cheerio");
require("mocha");
var server_1 = require("../../../server");
var request = require('supertest');
var randomstring = require("randomstring");
var user_model_1 = require("../../models/user.model");
chai.use(chaiHttp);
var expect = chai.expect;
var authenticatedUser = request.agent(server_1["default"]);
describe('admin users', function () {
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
        user_model_1["default"].find({ firstName: 'Prueba' }).remove(function (err) {
            if (err) {
                console.log(err);
            }
            done();
        });
    });
    it('it should get list users', function (done) {
        authenticatedUser
            .get('/settings/users/')
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should get data in list users', function (done) {
        authenticatedUser
            .get('/api/admin/users/')
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
    var testUser = {};
    it('it should create user', function (done) {
        authenticatedUser
            .post('/api/admin/users/')
            .send({
            company: { _id: '5b17f8f0346a450658b5721e' },
            email: "gmunoz+" + randomstring.generate({
                length: 5,
                charset: 'alphanumeric'
            }) + "@osacontrol.com",
            firstName: 'Prueba',
            lastName: 'Prueba',
            preferred: '5b0487db835536612bab1b61',
            userForms: [{ _id: '5b0487db835536612bab1b61', name: 'DESPACHO' }],
            userPermissions: [],
            venue: '5b1959faa9683b31cd2d8f11',
            venuesAccess: []
        })
            .end(function (err, res) {
            expect(res.status).to.equal(201);
            testUser = res.body.user;
            done();
        });
    });
    it('it should update user', function (done) {
        authenticatedUser
            .patch("/api/admin/users/" + testUser._id)
            .send(testUser)
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should delete user', function (done) {
        authenticatedUser["delete"]("/api/admin/users/" + testUser._id)
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should delete user again', function (done) {
        authenticatedUser["delete"]("/api/admin/users/" + testUser._id)
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
});
//# sourceMappingURL=user.admin.controller.spec.js.map