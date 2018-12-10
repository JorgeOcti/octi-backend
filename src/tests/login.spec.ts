import * as chai from 'chai';
import chaiHttp = require('chai-http');
import 'mocha';
import server from '../server';

chai.use(chaiHttp);
const expect = chai.expect;

describe('login', () => {

  it('it should login successful', (done) => {
    chai.request(server)
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
        // token = res.body.data.token;
        done();
      });
  });

});
