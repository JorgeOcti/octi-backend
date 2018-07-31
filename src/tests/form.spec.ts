import * as chai from 'chai';
// import { expect } from 'chai';
import chaiHttp = require('chai-http');
import 'mocha';
process.env.ENV = 'testing';
import app from '../app';
app.set('env', 'testing');
import {IFormModel} from '../form/models/form.model';
import server from '../server';

// chai.should();
chai.use(chaiHttp);
const expect = chai.expect;

describe('Forms', () => {
  describe('/GET ', () => {
    let firstForm: any = '';
    it('get apiListAlerts forms', (done) => {
      chai.request(server)
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
          firstForm = res.body.data[0];
          res.body.data.forEach((item: IFormModel) => {
            expect(item).to.have.all.keys([
              '_id',
              'name'
            ]);
          });
          done();
        });
    });
    it('get detail form', (done) => {
      chai.request(server)
        .get(`/api/v1/forms/${firstForm._id.toString()}`)
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
            'form',
            'scales'
          ]);
          // validate form keys
          expect(res.body.data.form).to.have.all.keys([
            '_id',
            'name',
            'description',
            'sections'
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
            'observe',
            'weight',
            'order'
          ]);
          // validate scales keys
          expect(res.body.data.scales).be.a('array');
          expect(res.body.data.scales[0]).to.have.all.keys([
            '_id',
            'name',
            'choices'
          ]);
          // validate choice keys
          expect(res.body.data.scales[0].choices).be.a('array');
          expect(res.body.data.scales[0].choices[0]).to.have.all.keys([
            '_id',
            'choice',
            'requireImage',
            'backgroundColor',
            'requireComment',
            'value',
            'order'
          ]);
          done();
        });
    });
  });
});
