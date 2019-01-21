import * as chai from 'chai';
import chaiHttp = require('chai-http');
import * as cheerio from 'cheerio';
import 'mocha';
import {SuperTest, Test} from 'supertest';
import server from '../../../server';
const request = require('supertest');
import * as randomstring from 'randomstring';
import User from '../../models/user.model';

chai.use(chaiHttp);
const expect = chai.expect;

const authenticatedUser: SuperTest<Test> = request.agent(server);
describe('admin users', () => {

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

  after((done) => {
    User.find({firstName: 'Prueba'}).remove((err) => {
      if (err) {
        console.log(err);
      }
      done();
    });

  });

  it('it should get list users', (done) => {
    authenticatedUser
      .get('/settings/users/')
      .end((err, res) => {
        expect(res.status).to.equal(200);
        done();
      });
  });

  it('it should get data in list users', (done) => {
    authenticatedUser
      .get('/api/admin/users/')
      .end((err, res) => {
        expect(res.status).to.equal(200);
        done();
      });
  });

  let testUser: any = {};
  it('it should create user', (done) => {
    authenticatedUser
      .post('/api/admin/users/')
      .send({
        company: {_id: '5b17f8f0346a450658b5721e'},
        email: `gmunoz+${randomstring.generate({
          length: 5,
          charset: 'alphanumeric'
        })}@osacontrol.com`,
        firstName: 'Prueba',
        lastName: 'Prueba',
        preferred: '5b0487db835536612bab1b61',
        userForms: [{_id: '5b0487db835536612bab1b61', name: 'DESPACHO'}],
        userPermissions: [],
        venue: '5b1959faa9683b31cd2d8f11',
        venuesAccess: []
      })
      .end((err, res) => {
        expect(res.status).to.equal(201);
        testUser = res.body.user;
        done();
      });
  });

  it('it should update user', (done) => {
    authenticatedUser
      .patch(`/api/admin/users/${testUser._id}`)
      .send(testUser)
      .end((err, res) => {
        expect(res.status).to.equal(200);
        done();
      });
  });

  it('it should delete user', (done) => {
    authenticatedUser
      .delete(`/api/admin/users/${testUser._id}`)
      .end((err, res) => {
        expect(res.status).to.equal(200);
        done();
      });
  });

  it('it should delete user again', (done) => {
    authenticatedUser
      .delete(`/api/admin/users/${testUser._id}`)
      .end((err, res) => {
        expect(res.status).to.equal(200);
        done();
      });
  });

});
