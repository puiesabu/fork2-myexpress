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

describe("req.format", function() {
  var app;
  beforeEach(function() {
    app = express();
  });

  describe("Respond with different formats", function() {
    beforeEach(function() {
      app.use(function(req,res) {
        res.format({
          text: function() {
            res.end("text hello");
          },

          html: function() {
            res.end("html <b>hello</b>");
          }
        });
      })
    });

    it("responds to text request", function(done) {
      request(app).get("/")
        .set("Accept", "text/plain")
        .expect("text hello").end(done);
    });

    it("responds to html request", function(done) {
      request(app).get("/")
        .set("Accept", "text/html")
        .expect("html <b>hello</b>").end(done);
    });
  });

  it("responds with 406 if there is no matching type", function(done) {
    app.use(function(req,res) {
      res.format({});
    });

    request(app).get("/").expect(406).end(done);
  });
});
