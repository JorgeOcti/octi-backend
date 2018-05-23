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
describe('Forms', () => {
    describe('/GET ', () => {
        it('it should restore an array with the forms', (done) => {
            chai.request(server_1.default)
                .get('/api/v1/forms/')
                .end((err, res) => {
                expect(res.status).to.equal(200);
                expect(res.body).to.have.all.keys([
                    'data',
                    'status'
                ]);
                expect(res.body).have.property('data');
                expect(res.body).have.property('status');
                expect(res.body.status).to.equal(200);
                expect(res.body.data).be.a('array');
                res.body.data.forEach((item) => {
                    expect(item).to.have.all.keys([
                        '_id',
                        'name'
                    ]);
                });
                done();
            });
        });
    });
});
//# sourceMappingURL=form.spec.js.map