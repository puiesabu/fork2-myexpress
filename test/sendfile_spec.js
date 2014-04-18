var express = require("../");
var request = require("supertest");
var http = require("http");
var expect = require("chai").expect;
var fs = require("fs");

describe("Basic res.sendfile", function() {
  var app, path, file;
  beforeEach(function() {
    app = express();
    file = "sendfile_data.txt";
    path = __dirname + "/data/" + file;
  });

  describe("stream data:", function() {
    beforeEach(function() {
      app.use(function(req, res) {
        var stream = fs.createReadStream(path);
        res.stream(stream);
      });
    });

    it("can stream data to client", function(done) {
      request(app).get("/").expect("test").end(done);
    });

    it("returns empty body for head", function(done) {
      request(app).head("/").expect("").end(done);
    });
  });

  describe("stream file data:", function() {
    it("reads file from path", function(done) {
      app.use(function(req, res) {
        res.sendfile(path);
      });

      request(app).get("/").expect("test").end(done);
    });
    it("reads file from path relative to root", function(done) {
      app.use(function(req, res) {
        res.sendfile(file, {root: __dirname + "/data/"});
      });

      request(app).get("/").expect("test").end(done);      
    });
  });
});
