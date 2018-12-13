import * as chai from 'chai';
import chaiHttp = require('chai-http');
import * as cheerio from 'cheerio';
import 'mocha';
import {SuperTest, Test} from 'supertest';
import server from '../../server';
import User from '../models/user.model';
const request = require('supertest');

chai.use(chaiHttp);
const expect = chai.expect;

const authenticatedUser: SuperTest<Test> = request.agent(server);
describe('app', () => {

  before((done) => {
    authenticatedUser
      .get('/account/login/')
      .end((err, res) => {
        const $html = cheerio(res.text);
        const csrf = $html.find('input[name=_csrf]').val();
        authenticatedUser
          .post('/account/login/')
          .set('cookie', res.header['set-cookie'][0])
          .send({
            username: 'gmunoz@osacontrol.com',
            password: '123',
            _csrf: csrf
          })
          .end((err, res) => {
            expect(res.status).to.equal(302);
            done();
          });
      });
  });

  it('it should get robots.txt', (done) => {
    chai.request(server)
      .get('/robots.txt')
      .end((err, res) => {
        expect(res.status).to.equal(200);
        done();
      });
  });

  it('it should get login web', (done) => {
    chai.request(server)
      .get('/account/login/')
      .end((err, res) => {
        expect(res.status).to.equal(200);
        done();
      });
  });

  it('it should login web redirect if user authenticated', (done) => {
    authenticatedUser
      .get('/account/login/')
      .end((err, res) => {
        expect(res.status).to.equal(302);
        done();
      });
  });

  it('it should get forgot password web', (done) => {
    chai.request(server)
      .get('/account/forgot-password/')
      .end((err, res) => {
        expect(res.status).to.equal(200);
        const $html = cheerio(res.text);
        const csrf = $html.find('input[name=_csrf]').val();
        chai.request(server)
          .post('/account/forgot-password/')
          .set('cookie', res.header['set-cookie'][0])
          .send({
            username: 'gmunoz@osacontrol.com',
            _csrf: csrf
          })
          .end((err, res) => {
            expect(res.status).to.equal(200);
            done();
          });
      });
  });

  it('it should enter in recovery page and process recovery', (done) => {
    User.findOne({email: 'gmunoz@osacontrol.com'}).exec((err, user) => {
      if (err) {
        console.log(err);
      }
      if (user) {
        chai.request(server)
          .get(`/account/recovery/${user.passwordResetToken}`)
          .end((err, res) => {
            expect(res.status).to.equal(200);
            const $html = cheerio(res.text);
            const csrf = $html.find('input[name=_csrf]').val();
            chai.request(server)
              .post(`/account/recovery/${user.passwordResetToken}`)
              .set('cookie', res.header['set-cookie'][0])
              .send({
                password: '123',
                password2: '123',
                _csrf: csrf
              })
              .end((err, res) => {
                console.log('res.status', res.status);
                expect(res.status).to.equal(200);
                done();
              });
          });
      }
    });
  });

  it('it should logout', (done) => {
    chai.request(server)
      .get('/account/logout/')
      .end((err, res) => {
        expect(res.status).to.equal(200);
        done();
      });
  });

});
