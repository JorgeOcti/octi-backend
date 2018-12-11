"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const chaiHttp = require("chai-http");
require("mocha");
const server_1 = require("../../server");
chai.use(chaiHttp);
const expect = chai.expect;
let token = '';
describe('login', () => {
    it('it should login successful', (done) => {
        chai.request(server_1.default)
            .post('/api/v1/login/')
            .send({
            username: 'gmunoz@osacontrol.com',
            password: '123'
        })
            .end((err, res) => {
            expect(res.status).to.equal(200);
            expect(res.body).have.property('data');
            expect(res.body.data).to.have.all.keys([
                'token',
                'refreshToken',
                'iosVersion',
                'androidVersion',
                'user'
            ]);
            expect(res.body.data.user).to.have.all.keys([
                '_id',
                'firstName',
                'lastName',
                'email',
                'preferred',
                'userPermissions',
                'userForms',
                'venue',
                'company',
                'team',
                'count'
            ]);
            token = res.body.data.token;
            done();
        });
    });
    it('it should refresh token successful', (done) => {
        chai.request(server_1.default)
            .post('/api/v1/token/')
            .send({
            refreshToken: token
        })
            .end((err, res) => {
            expect(res.status).to.equal(200);
            expect(res.body).have.property('data');
            expect(res.body.data).to.have.all.keys([
                'token',
                'refreshToken',
                'iosVersion',
                'androidVersion',
                'user'
            ]);
            expect(res.body.data.user).to.have.all.keys([
                '_id',
                'firstName',
                'lastName',
                'email',
                'preferred',
                'userPermissions',
                'userForms',
                'venue',
                'company',
                'team',
                'count'
            ]);
            done();
        });
    });
    it('it should forgot password successful', (done) => {
        chai.request(server_1.default)
            .post('/api/v1//forgot-password/')
            .send({
            username: 'gmunoz@osacontrol.com'
        })
            .end((err, res) => {
            expect(res.status).to.equal(200);
            done();
        });
    });
    it('it should forgot password fake user successful', (done) => {
        chai.request(server_1.default)
            .post('/api/v1//forgot-password/')
            .send({
            username: 'gmunoz+fake@osacontrol.com'
        })
            .end((err, res) => {
            expect(res.status).to.equal(200);
            done();
        });
    });
});
//# sourceMappingURL=jwt.controller.spec.js.map