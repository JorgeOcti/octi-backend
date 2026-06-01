import * as chai from 'chai';
import chaiHttp = require('chai-http');
import * as cheerio from 'cheerio';
import 'mocha';
import {SuperTest, Test} from 'supertest';
import server from '../../../server';
const request = require('supertest');
import * as randomstring from 'randomstring';

chai.use(chaiHttp);
const expect = chai.expect;

const authenticatedUser: SuperTest<Test> = request.agent(server);
describe('admin venues', () => {

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

  it('it should get list venues', (done) => {
    authenticatedUser
      .get('/settings/venues/')
      .end((err, res) => {
        expect(res.status).to.equal(200);
        done();
      });
  });

  it('it should get data in list venues', (done) => {
    authenticatedUser
      .get('/api/admin/venues/')
      .end((err, res) => {
        expect(res.status).to.equal(200);
        done();
      });
  });

  let testVenue: any = {};
  it('it should create venue', (done) => {
    authenticatedUser
      .post('/api/admin/venues/')
      .send({
        company: {
          _id: '5b17f8f0346a450658b5721e'
        },
        name: randomstring.generate({
          length: 17,
          charset: 'alphanumeric'
        }),
        type: 'receiver'
      })
      .end((err, res) => {

        expect(res.status).to.equal(201);
        testVenue = res.body.venue;
        done();
      });
  });

  it('it should update venue', (done) => {
    authenticatedUser
      .patch(`/api/admin/venues/${testVenue._id}`)
      .send({
        company: '5b17f8f0346a450658b5721e',
        name: randomstring.generate({
          length: 17,
          charset: 'alphanumeric'
        }),
        type: 'receiver'
      })
      .end((err, res) => {
        expect(res.status).to.equal(200);
        done();
      });
  });

  it('it should delete venue', (done) => {
    authenticatedUser
      .delete(`/api/admin/venues/${testVenue._id}`)
      .end((err, res) => {
        expect(res.status).to.equal(200);
        done();
      });
  });

  it('it should delete venue again', (done) => {
    authenticatedUser
      .delete(`/api/admin/venues/${testVenue._id}`)
      .end((err, res) => {
        expect(res.status).to.equal(200);
        done();
      });
  });

});
