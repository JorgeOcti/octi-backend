"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const chaiHttp = require("chai-http");
require("mocha");
const request = require('supertest');
const cheerio = require("cheerio");
const server_1 = require("../../../server");
// chai.should();
chai.use(chaiHttp);
const expect = chai.expect;
const authenticatedUser = request.agent(server_1.default);
describe('admin formularies', () => {
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
    it('it should return list of forms', (done) => {
        authenticatedUser
            .get('/api/admin/forms/')
            .end((err, res) => {
            expect(res.status).to.equal(200);
            done();
        });
    });
});
//# sourceMappingURL=form.admin.controller.spec.js.map