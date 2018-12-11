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
describe('cars', () => {

  before((done) => {
    chai.request(server)
      .post('/api/v1/login/')
      .send({
        username: 'gmunoz@osacontrol.com',
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
  });

  it('it should check vin', (done) => {
    chai.request(server)
      .post('/api/v1/check-vin/')
      .set('Authorization', `JWT ${token}`)
      .send({
        vin: '3BRBD33B7JK590498'
      })
      .end((err, res) => {
        expect(res.status).to.equal(200);
        done();
      });
  });

  it('it should check vin with vin2', (done) => {
    chai.request(server)
      .post('/api/v1/check-vin/')
      .set('Authorization', `JWT ${token}`)
      .send({
        vin2: '590498'
      })
      .end((err, res) => {
        expect(res.status).to.equal(200);
        done();
      });
  });

  it('it should fail check vin fake inventory', (done) => {
    chai.request(server)
      .post('/api/v1/check-vin/')
      .set('Authorization', `JWT ${token}`)
      .send({
        vin: '3BRBD33B7JK590498',
        inventory: '0af487b4f6a4c95ccd991400'
      })
      .end((err, res) => {
        expect(res.status).to.equal(404);
        done();
      });
  });

  it('it should get dashboard principal', (done) => {
    authenticatedUser
      .get('/')
      .end((err, res) => {
        expect(res.status).to.equal(200);
        done();
      });
  });

  it('it should get data to dashboard principal', (done) => {
    authenticatedUser
      .get(`/api/participants-per-date/`)
      .end((err, res) => {
        expect(res.status).to.equal(200);
        done();
      });
  });

  it('it should get dashboard cars', (done) => {
    authenticatedUser
      .get('/cars/')
      .end((err, res) => {
        expect(res.status).to.equal(200);
        done();
      });
  });

  let cars: any[] = [];
  it('it should get data to dashboard cars', (done) => {
    authenticatedUser
      .get('/api/cars/')
      .end((err, res) => {
        expect(res.status).to.equal(200);
        cars = res.body.results;
        done();
      });
  });

  it('it should get dashboard car detail', (done) => {
    authenticatedUser
      .get(`/cars/${cars[0]._id}`)
      .end((err, res) => {
        expect(res.status).to.equal(200);
        done();
      });
  });

  it('it should fail by bad id when get dashboard car detail', (done) => {
    authenticatedUser
      .get(`/cars/0af487b4f6a4c95ccd991400`)
      .end((err, res) => {
        expect(res.status).to.equal(404);
        done();
      });
  });

  it('it should get data to dashboard car detail', (done) => {
    authenticatedUser
      .get(`/api/cars/${cars[0]._id}`)
      .end((err, res) => {
        expect(res.status).to.equal(200);
        done();
      });
  });

  it('it should fail get data to dashboard car detail', (done) => {
    authenticatedUser
      .get(`/api/cars/0af487b4f6a4c95ccd991400`)
      .end((err, res) => {
        expect(res.status).to.equal(404);
        done();
      });
  });

  it('it should get data to participant detail', (done) => {
    authenticatedUser
      .get(`/api/participant/${cars[0].lastForm._id}`)
      .end((err, res) => {
        expect(res.status).to.equal(200);
        cars = res.body.results;
        done();
      });
  });

  it('it should fail get data to participant detail', (done) => {
    authenticatedUser
      .get(`/api/participant/0af487b4f6a4c95ccd991400`)
      .end((err, res) => {
        expect(res.status).to.equal(404);
        cars = res.body.results;
        done();
      });
  });

});
