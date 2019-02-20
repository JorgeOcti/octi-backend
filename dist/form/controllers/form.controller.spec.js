"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const chaiHttp = require("chai-http");
const fs = require("fs");
require("mocha");
const path = require("path");
const server_1 = require("../../server");
// chai.should();
chai.use(chaiHttp);
const expect = chai.expect;
let token = '';
describe('formularies', () => {
    beforeEach((done) => {
        chai.request(server_1.default)
            .post('/api/v1/login/')
            .send({
            username: 'gmunoz@osacontrol.com',
            password: '123'
        })
            .end((err, res) => {
            expect(res.status).to.equal(200);
            token = res.body.data.token;
            done();
        });
    });
    afterEach((done) => {
        done();
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
            if (res.body.data.hasOwnProperty('venues')) {
                expect(res.body.data).to.have.all.keys([
                    'extra',
                    'form',
                    'scales',
                    'venues'
                ]);
            }
            else {
                expect(res.body.data).to.have.all.keys([
                    'extra',
                    'form',
                    'scales'
                ]);
            }
            // validate form keys
            expect(res.body.data.form).to.have.all.keys([
                '_id',
                'name',
                'description',
                'sections',
                'team',
                'shippingVenue'
            ]);
            expect(res.body.data.form.sections).be.a('array');
            // validate sections keys
            for (const section of res.body.data.form.sections) {
                expect(section).to.have.all.keys([
                    '_id',
                    'name',
                    'weight',
                    'questions',
                    'order'
                ]);
                // validate question keys
                expect(section.questions).be.a('array');
                for (const question of section.questions) {
                    expect(question).to.have.all.keys([
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
                }
            }
            // validate scales keys
            expect(res.body.data.scales).be.a('array');
            for (const scale of res.body.data.scales) {
                expect(scale).to.have.all.keys([
                    '_id',
                    'name',
                    'choices'
                ]);
            }
            // validate choice keys
            expect(res.body.data.scales[0].choices).be.a('array');
            expect(res.body.data.scales[0].choices[0]).to.have.all.keys([
                '_id',
                'choice',
                'requireImage',
                'backgroundColor',
                'requireAccesories',
                'requireComment',
                'requireVenue',
                'requireConciliation',
                'value',
                'order'
            ]);
            done();
        });
    });
    it('it should change preferred successful', (done) => {
        chai.request(server_1.default)
            .put('/api/v1/forms/preferred/')
            .set('Authorization', `JWT ${token}`)
            .send({
            form: firstForm._id.toString()
        })
            .end((err, res) => {
            expect(res.status).to.equal(200);
            expect(res.body).have.property('message');
            expect(res.body).have.property('status');
            expect(res.body).to.have.all.keys([
                'message',
                'status'
            ]);
            done();
        });
    });
    it('it should upload image successful in the check', (done) => {
        chai.request(server_1.default)
            .post(`/api/v1/forms/${firstForm._id.toString()}/upload-file/`)
            .set('Authorization', `JWT ${token}`)
            .type('form')
            .attach('file', fs.readFileSync(path.join(__dirname, '../../../test/assets/images/t_head_bg_america.jpg')), 't_head_bg_america.jpg')
            .end((err, res) => {
            expect(res.status).to.equal(201);
            expect(res.body).have.property('data');
            expect(res.body).have.property('status');
            expect(res.body.data).to.have.all.keys([
                '_id',
                'file'
            ]);
            done();
        });
    });
    it('it should complete check successful', (done) => {
        chai.request(server_1.default)
            .post(`/api/v1/forms/${firstForm._id.toString()}`)
            .set('Authorization', `JWT ${token}`)
            .send({
            answers: {
                '5b0487db835536612bab1b64': {
                    value: '5b0585dacb2e96db24b13bd6',
                    images: []
                },
                '5b0487db835536612bab1b63': {
                    value: '5b05858aad76a6ce5c78416a',
                    images: ['5b88332bd99c9365a40e0b63']
                },
                '5b057c99a919c4080c3c72b5': {
                    value: '5b0585aada89396d6b949cf7',
                    images: []
                },
                '5b057c9a0b8f005aba1cb620': {
                    value: '5b0585aada89396d6b949cf7'
                },
                '5b057c9bf00aedb18b509746': {
                    value: '5b0585f82d0ee0f448101482'
                },
                '5b057c9c301d11c354b034b3': {
                    value: '5b0585aada89396d6b949cf7'
                },
                '5b1ae3ccc75044fd882b3fd9': {
                    value: '5b44d0ee20fd864f3e2e16e4',
                    accesories: ['5b44c893ab45fb3ed8dd3872', '5b44c893ab45fb3ed8dd3871', '5b44ce2dda3c560e72d1544c']
                },
                '5b33f60b831b91692e04e0a8': {
                    value: '5b0585f82d0ee0f448101482'
                },
                'reception': {
                    value: 'true',
                    images: []
                },
                'conciliation': {
                    value: 'true',
                    images: ['5b883677d99c9365a40e1399']
                }
            },
            vin: '3BRBD33B7J1590498'
        })
            .end((err, res) => {
            expect(res.status).to.equal(200);
            expect(res.body).have.property('data');
            expect(res.body).have.property('status');
            expect(res.body.data).to.have.all.keys([
                'id',
                'count',
                'vin',
                'qualification'
            ]);
            done();
        });
    });
});
//# sourceMappingURL=form.controller.spec.js.map