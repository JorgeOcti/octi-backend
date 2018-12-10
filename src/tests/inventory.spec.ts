import * as chai from 'chai';
import chaiHttp = require('chai-http');
import 'mocha';
import {IInventory} from '../interfaces/inventory.interface';
import server from '../server';

chai.use(chaiHttp);
const expect = chai.expect;

let token = '';
describe('inventories', () => {

  beforeEach((done) => {
    chai.request(server)
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
    chai.request(server)
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
        res.body.data.forEach((item: IInventory) => {
          expect(item).to.have.all.keys([
            '_id',
            'name'
          ]);
        });
        done();
      });
  });

});
