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
describe('amin alert', () => {

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

  it('it should get list alerts', (done) => {
    authenticatedUser
      .get('/settings/alerts/')
      .end((err, res) => {
        expect(res.status).to.equal(200);
        done();
      });
  });

  it('it should get data in list alerts', (done) => {
    authenticatedUser
      .get('/api/admin/alerts/')
      .end((err, res) => {
        expect(res.status).to.equal(200);
        done();
      });
  });

  let alertTest: any = {};
  it('it should create alerts', (done) => {
    authenticatedUser
      .post('/api/admin/alerts/')
      .send({
        gte: 0,
        lte: 10,
        name: 'prueba',
        type: 'lte',
        users: ['5af487b4f6a4c95ccd991466']
      })
      .end((err, res) => {
        expect(res.status).to.equal(201);
        alertTest = res.body.alert;
        done();
      });
  });

  it('it should delete alerts', (done) => {
    authenticatedUser
      .delete(`/api/admin/alerts/${alertTest._id}`)
      .end((err, res) => {
        alertTest = res.body.alert;
        expect(res.status).to.equal(200);
        done();
      });
  });

});
