"use strict";
exports.__esModule = true;
var chai = require("chai");
var chaiHttp = require("chai-http");
require("mocha");
var request = require('supertest');
var cheerio = require("cheerio");
var server_1 = require("../../../server");
// chai.should();
chai.use(chaiHttp);
var expect = chai.expect;
var authenticatedUser = request.agent(server_1["default"]);
describe('admin formularies', function () {
    before(function (done) {
        authenticatedUser
            .get('/account/login/')
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            var $html = cheerio(res.text);
            var csrf = $html.find('input[name=_csrf]').val();
            authenticatedUser
                .post('/account/login/')
                .set('cookie', res.header['set-cookie'][0])
                .send({
                username: 'gmunoz@osacontrol.com',
                password: '123',
                _csrf: csrf
            })
                .end(function (err, res) {
                expect(res.status).to.equal(302);
                done();
            });
        });
    });
    it('it should return list of forms', function (done) {
        authenticatedUser
            .get('/api/admin/forms/')
            .end(function (err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });
});
//# sourceMappingURL=form.admin.controller.spec.js.map