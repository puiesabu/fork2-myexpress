var express = require("../");
var request = require("supertest");
var http = require("http");
var expect = require("chai").expect;

describe("Monkey patch req and res", function() {
  it("adds isExpress to req and res", function(done) {
    var app = express();
    app.use(function(req,res) {
      app.monkey_patch(req,res);
      res.end(req.isExpress + "," + res.isExpress);
    });

    request(app).get("/").expect("true,true").end(done);
  });
});

describe("Monkey patch before serving", function() {
  it("adds isExpress to req and res", function(done) {
    var app = express();
    app.use(function(req,res) {
      res.end(req.isExpress + "," + res.isExpress);
    });

    request(app).get("/").expect("true,true").end(done);    
  });
});

describe("Setting req.app", function() {
  var app;
  beforeEach(function() {
    app = express();
  });

  it("sets req.app when entering an app", function(done) {
    var _app;
    app.use(function(req,res,next) {
      _app = req.app;
      res.end("ok");
    });

    request(app).get("/").expect(200).end(function() {
      expect(_app).to.equal(app);
      done();
    });
  });
  
  it("resets req.app to parent app when exiting a subapp", function(done) {
    var _app, _subapp;
    var subapp = express();
    subapp.use(function(req,res,next) {
      _subapp = req.app;
      next();
    });    
    app.use(subapp);
    app.use(function(req,res,next) {
      _app = req.app;
      res.end("ok");
    });

    request(app).get("/").expect(200).end(function() {
      expect(_app).to.equal(app);
      expect(_subapp).to.equal(subapp);
      done();
    })
  });    
});

describe("req.res and res.req", function() {
  it("makes request and response accessible to each other", function(done) {
    var app = express();
    var _req, _res;
    app.use(function(req,res) {
      _res = res;
      _req = req;

      res.end("ok");
    });

    request(app).get("/").expect(200).end(function() {
      expect(_res).to.equal(_req.res);
      expect(_req).to.equal(_res.req);
      done();
    })
  });
});
