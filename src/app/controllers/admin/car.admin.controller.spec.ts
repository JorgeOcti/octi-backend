import * as chai from 'chai';
import chaiHttp = require('chai-http');
import * as cheerio from 'cheerio';
import 'mocha';
import {SuperTest, Test} from 'supertest';
import server from '../../../server';
const request = require('supertest');

chai.use(chaiHttp);
const expect = chai.expect;

const authenticatedUser: SuperTest<Test> = request.agent(server);
describe('admin cars', () => {

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

  it('it should get list cars', (done) => {
    authenticatedUser
      .get('/settings/cars/')
      .end((err, res) => {
        expect(res.status).to.equal(200);
        done();
      });
  });

  it('it should get data in list cars', (done) => {
    authenticatedUser
      .get('/api/admin/cars/')
      .end((err, res) => {
        expect(res.status).to.equal(200);
        done();
      });
  });

});
