process.env.NODE_ENV = 'development';

const chai = require('chai');
const should = chai.should();
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const server = require('../../src/server/index');

describe('routes : index', () => {

  describe('GET /', () => {
    it('should return json', (done) => {
      chai.request(server)
      .get('/')
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.eql(200);
        res.type.should.eql('application/json');
        done();
      });
    });
  });

  describe('GET /?date=2019-40-01', () => {
    it('should return 400 invalid date', (done) => {
      chai.request(server)
      .get('/?date=2019-40-01')
      .end((err, res) => {
        should.exist(err);
        res.status.should.eql(400);
        done();
      });
    });
  });

});
