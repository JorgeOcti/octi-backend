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

const dataImportCar: any[] = [{
  NInterno: '1020',
  color: 'Rojo',
  denominacion: 'Prueba',
  destino: '',
  id: '9e5f05b0-feea-11e8-a20e-e7aa870cc5aa',
  marca: 'Prueba',
  status: 1,
  vin: randomstring.generate({
    length: 17,
    charset: 'alphanumeric'
  })
}];

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

  it('it should enter in list cars', (done) => {
    authenticatedUser
      .get('/settings/cars/')
      .end((err, res) => {
        expect(res.status).to.equal(200);
        done();
      });
  });

  it('it should enter in import cars', (done) => {
    authenticatedUser
      .get('/settings/cars/import/')
      .end((err, res) => {
        expect(res.status).to.equal(200);
        done();
      });
  });

  it('it should import cars', (done) => {
    authenticatedUser
      .post('/api/admin/import-cars/')
      .send({cars: dataImportCar})
      .end((err, res) => {
        expect(res.status).to.equal(200);
        done();
      });
  });

  it('it should re import cars', (done) => {
    authenticatedUser
      .post('/api/admin/import-cars/')
      .send({cars: dataImportCar})
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
