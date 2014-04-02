var express = require("../");
var request = require("supertest");
var http = require("http");

describe("app",function() {
  var app = express();

  describe("create http server",function() {
    var server = http.createServer(app);

    it("responds to /foo with 404", function(done) {
      request(server).get("/foo").expect(404).end(done);    
    });
  });
});
