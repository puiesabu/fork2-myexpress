var express = require("../");
var request = require("supertest");
var http = require("http");
var expect = require("chai").expect;

describe("res.send:", function() {
  var app;
  beforeEach(function() {
    app = express();
    app.use("/buffer",function(req,res) {
      res.send(new Buffer("binary data"));
    });
    app.use("/string",function(req,res) {
      res.send("string data");
    });
    app.use("/json",function(req,res) {
      res.type("json");
      res.send("[1,2,3]");
    });
  });

  describe("support buffer and string body:", function() {
    it("responds to buffer", function(done) {
      request(app).get("/buffer")
        .expect(200)
        .expect("Content-Type", "application/octet-stream").end(done);
    });

    it("responds to string", function(done) {
      request(app).get("/string")
        .expect(200)
        .expect("Content-Type", "text/html").end(done);
    });

    it("should not override existing content-type", function(done) {
      request(app).get("/json")
        .expect("[1,2,3]")
        .expect("Content-Type", "application/json").end(done);
    });
  });
});
