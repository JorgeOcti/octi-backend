"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const chaiHttp = require("chai-http");
require("mocha");
const server_1 = require("../server");
chai.use(chaiHttp);
const expect = chai.expect;
let token = '';
describe('Inventories', () => {
    beforeEach((done) => {
        chai.request(server_1.default)
            .post('/api/v1/login/')
            .send({
            username: 'gmunoz@osacontrol.com',
            password: '123'
        })
            .end((err, res) => {
            token = res.body.data.token;
            done();
        });
    });
    it('it should return list of inventories', (done) => {
        chai.request(server_1.default)
            .get('/api/v1/inventory/')
            .set('Authorization', `JWT ${token}`)
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
//# sourceMappingURL=inventory.spec.js.map