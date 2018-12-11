import * as chai from 'chai';
import chaiHttp = require('chai-http');
import 'mocha';
const request = require('supertest');
import * as cheerio from 'cheerio';
import {SuperTest, Test} from 'supertest';
import server from '../../../server';

// chai.should();
chai.use(chaiHttp);

const expect = chai.expect;

const authenticatedUser: SuperTest<Test> = request.agent(server);
describe('admin formularies', () => {

  before((done) => {
    authenticatedUser
      .get('/account/login/')
      .end((err, response) => {
        const $html = cheerio(response.text);
        const csrf = $html.find('input[name=_csrf]').val();
        authenticatedUser
          .post('/account/login/')
          .set('cookie', response.header['set-cookie'][0])
          .send({
            username: 'gmunoz@osacontrol.com',
            password: '123',
            _csrf: csrf
          })
          .end((err, response) => {
            expect(response.status).to.equal(302);
            done();
          });
      });
  });

  it('it should return list of forms', (done) => {
    authenticatedUser
      .get('/api/admin/forms/')
      .end((err, res) => {
        expect(res.status).to.equal(200);
        done();
      });
  });

});
