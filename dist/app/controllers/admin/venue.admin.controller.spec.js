"use strict";
exports.__esModule = true;
var chai = require("chai");
var chaiHttp = require("chai-http");
var cheerio = require("cheerio");
require("mocha");
var server_1 = require("../../../server");
var request = require('supertest');
var randomstring = require("randomstring");
chai.use(chaiHttp);
var expect = chai.expect;
var authenticatedUser = request.agent(server_1["default"]);
describe('admin venues', function () {
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
    it('it should get list venues', function (done) {
        authenticatedUser
            .get('/settings/venues/')
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should get data in list venues', function (done) {
        authenticatedUser
            .get('/api/admin/venues/')
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
    var testVenue = {};
    it('it should create venue', function (done) {
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
            .end(function (err, res) {
            expect(res.status).to.equal(201);
            testVenue = res.body.venue;
            done();
        });
    });
    it('it should update venue', function (done) {
        authenticatedUser
            .patch("/api/admin/venues/" + testVenue._id)
            .send({
            company: '5b17f8f0346a450658b5721e',
            name: randomstring.generate({
                length: 17,
                charset: 'alphanumeric'
            }),
            type: 'receiver'
        })
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should delete venue', function (done) {
        authenticatedUser["delete"]("/api/admin/venues/" + testVenue._id)
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should delete venue again', function (done) {
        authenticatedUser["delete"]("/api/admin/venues/" + testVenue._id)
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
});
//# sourceMappingURL=venue.admin.controller.spec.js.map