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
