var express = require("../");
var request = require("supertest");
var http = require("http");
var expect = require("chai").expect;

describe("app",function() {
  var app = express();

  describe("create http server",function() {
    var server = http.createServer(app);

    it("responds to /foo with 404", function(done) {
      request(server).get("/foo").expect(404).end(done);    
    });
  });

  describe("#listen",function() {
    it("should return an http.Server", function() {
      expect(app.listen(7000)).to.be.an.instanceof(http.Server);
    });

    it("responds to /foo with 404", function(done) {
      request("http://localhost:7000").get("/foo").expect(404).end(done);
    });
  });
});
