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
    it('it should restore an array with the forms', (done) => {
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
          res.body.data.forEach((item: IFormModel) => {
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
