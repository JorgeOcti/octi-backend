"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
// import { expect } from 'chai';
const chaiHttp = require("chai-http");
require("mocha");
process.env.ENV = 'testing';
const app_1 = require("../app");
app_1.default.set('env', 'testing');
const server_1 = require("../server");
// chai.should();
chai.use(chaiHttp);
const expect = chai.expect;
describe('Login', () => {
    describe('/POST login ', () => {
        it('it should log in successfully', (done) => {
            chai.request(server_1.default)
                .post('/login/')
                .set('Autorization', 'Bear $%&/=3kdoighfbsajejrhlksdkjdajfb12')
                .type('form')
                .field('username', 'gmunoz@osacontrol.com')
                .field('password', '123456')
                .end((err, res) => {
                // console.log('res.body', res.body);
                // expect(res).to.have.header('content-type', 'text/plain');
                expect(res.status).to.equal(200);
                // expect(res.body).to.exist;
                expect(res.body).to.have.all.keys([
                    'data',
                    'status'
                ]);
                expect(res.body).have.property('data');
                expect(res.body.data).be.a('object');
                expect(res.body).have.property('status');
                // expect(res.body).to.be.json;
                // expect(res.body).to.be.an('array');
                // expect(res.body).to.have.length(5);
                // res.should.have.status(200);
                // res.body.data.should.be.a('object');
                // res.body.should.have.property('data');
                // res.body.should.be.a('array');
                // res.body.length.should.be.eql(0);
                // res.should.have.status(200);
                // res.body.should.be.a('object');
                // res.body.should.have.property('message').eql('Book successfully added!');
                // res.body.book.should.have.property('title');
                done();
            });
        });
        it('it should not log in', (done) => {
            chai.request(server_1.default)
                .post('/login/')
                .field('username', 'gmunoz@osacontrol.com')
                .field('password', '1234567')
                .end((err, res) => {
                // console.log('res.body', res.body);
                expect(res.status).to.equal(401);
                expect(res.body).have.property('error');
                expect(res.body.error).be.a('string');
                expect(res.body).have.property('status');
                done();
            });
        });
        it('it should not log in', (done) => {
            chai.request(server_1.default)
                .post('/login/')
                .field('password', '123')
                .end((err, res) => {
                // console.log('res.body', res.body);
                expect(res.status).to.equal(401);
                expect(res.body).have.property('error');
                expect(res.body.error).be.a('string');
                expect(res.body).have.property('status');
                done();
            });
        });
    });
    describe('/GET login', () => {
        it('it should return 404', (done) => {
            chai.request(server_1.default)
                .get('/login/')
                .end((err, res) => {
                // console.log('res.body', res.body);
                expect(res.status).to.equal(404);
                // res.should.have.status(404);
                // res.body.should.have.property('status');
                // res.body.should.have.property('error');
                done();
            });
        });
    });
});
//# sourceMappingURL=dns.spec.js.map