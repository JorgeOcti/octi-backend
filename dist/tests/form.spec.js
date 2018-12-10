"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const chaiHttp = require("chai-http");
require("mocha");
const server_1 = require("../server");
// chai.should();
chai.use(chaiHttp);
const expect = chai.expect;
let token = '';
describe('Formularies', () => {
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
    let firstForm = '';
    it('it should return list of forms', (done) => {
        chai.request(server_1.default)
            .get('/api/v1/forms/')
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
            firstForm = res.body.data[0];
            res.body.data.forEach((item) => {
                expect(item).to.have.all.keys([
                    '_id',
                    'name'
                ]);
            });
            done();
        });
    });
    it('it should return detail of the form', (done) => {
        chai.request(server_1.default)
            .get(`/api/v1/forms/${firstForm._id.toString()}`)
            .set('Authorization', `JWT ${token}`)
            .end((err, res) => {
            expect(res.status).to.equal(200);
            expect(res.body).have.property('data');
            expect(res.body).have.property('status');
            expect(res.body).to.have.all.keys([
                'data',
                'status'
            ]);
            expect(res.body.status).to.equal(200);
            expect(res.body.data).be.a('object');
            expect(res.body.data).to.have.all.keys([
                'extra',
                'form',
                'scales'
            ]);
            // validate form keys
            expect(res.body.data.form).to.have.all.keys([
                '_id',
                'name',
                'description',
                'sections',
                'team'
            ]);
            expect(res.body.data.form.sections).be.a('array');
            // validate sections keys
            expect(res.body.data.form.sections[0]).to.have.all.keys([
                '_id',
                'name',
                'weight',
                'questions',
                'order'
            ]);
            // validate question keys
            expect(res.body.data.form.sections[0].questions).be.a('array');
            expect(res.body.data.form.sections[0].questions[0]).to.have.all.keys([
                '_id',
                'question',
                'scale',
                'risk',
                'accessories',
                'conciliation',
                'observe',
                'weight',
                'order'
            ]);
            // validate scales keys
            expect(res.body.data.scales).be.a('array');
            expect(res.body.data.scales[0]).to.have.all.keys([
                '_id',
                'name',
                'choices',
                'team'
            ]);
            // validate choice keys
            expect(res.body.data.scales[0].choices).be.a('array');
            expect(res.body.data.scales[0].choices[0]).to.have.all.keys([
                '_id',
                'choice',
                'requireImage',
                'backgroundColor',
                'requireAccesories',
                'requireComment',
                'requireConciliation',
                'value',
                'order'
            ]);
            done();
        });
    });
});
//# sourceMappingURL=form.spec.js.map