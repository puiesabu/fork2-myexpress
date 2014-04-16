var express = require("../");
var request = require("supertest");
var http = require("http");
var expect = require("chai").expect;

describe("Setting Content-Type", function() {
  var app;
  beforeEach(function() {
    app = express();    
  });

  it("sets the content-type", function(done) {
    app.use(function(req,res) {
      res.type("json");
      res.end("[1,2,3]");
    });

    request(app).get("/")
      .expect("[1,2,3]")
      .expect("Content-Type", "application/json").end(done);
  });

  it("sets the default content type", function(done) {
    app.use(function(req,res) {
      res.default_type("text");
      res.default_type("json");
      res.end("[1,2,3]");
    });

    request(app).get("/")
      .expect("[1,2,3]")
      .expect("Content-Type", "text/plain").end(done);
  });
});
