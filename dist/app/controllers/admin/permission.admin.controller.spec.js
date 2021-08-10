"use strict";
exports.__esModule = true;
var chai = require("chai");
var chaiHttp = require("chai-http");
var cheerio = require("cheerio");
require("mocha");
var server_1 = require("../../../server");
var request = require('supertest');
chai.use(chaiHttp);
var expect = chai.expect;
var authenticatedUser = request.agent(server_1["default"]);
describe('admin permissions', function () {
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
    it('it should get data in list permissions', function (done) {
        authenticatedUser
            .get('/api/admin/permissions/')
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
});
//# sourceMappingURL=permission.admin.controller.spec.js.map