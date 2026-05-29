import * as chai from 'chai';
import chaiHttp = require('chai-http');
import * as cheerio from 'cheerio';
import 'mocha';
import {SuperTest, Test} from 'supertest';
import server from '../../server';
const request = require('supertest');

chai.use(chaiHttp);
const expect = chai.expect;

let token: string = '';
const authenticatedUser: SuperTest<Test> = request.agent(server);
describe('users', () => {

  before((done) => {
    chai.request(server)
      .post('/api/v1/login/')
      .send({
        username: 'gmunoz@octimize.cl',
        password: '123'
      })
      .end((err, res) => {
        token = res.body.data.token;
        authenticatedUser
          .get('/account/login/')
          .end((err, response) => {
            const $html = cheerio(response.text);
            const csrf = $html.find('input[name=_csrf]').val();
            authenticatedUser
              .post('/account/login/')
              .set('cookie', response.header['set-cookie'][0])
              .send({
                username: 'gmunoz@octimize.cl',
                password: '123',
                _csrf: csrf
              })
              .end((err, response) => {
                expect(response.status).to.equal(302);
                done();
              });
          });
      });
  });

  it('it should change password', (done) => {
    chai.request(server)
      .post('/api/v1/change-password/')
      .set('Authorization', `JWT ${token}`)
      .send({
        password: '123',
        newPassword: '123'
      })
      .end((err, res) => {
        expect(res.status).to.equal(200);
        done();
      });
  });

  it('it should fail change password', (done) => {
    chai.request(server)
      .post('/api/v1/change-password/')
      .set('Authorization', `JWT ${token}`)
      .send({
        password: '1234',
        newPassword: '123'
      })
      .end((err, res) => {
        expect(res.status).to.equal(400);
        done();
      });
  });

});
