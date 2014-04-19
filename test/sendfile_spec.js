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

  describe("content headers:", function() {
    beforeEach(function() {
      app.use(function(req, res) {
        res.sendfile(path);
      });
    });

    it("sets content type", function(done) {
      request(app).get("/").expect("Content-Type","text/plain").end(done);
    });

    it("sets content length", function(done) {
      request(app).get("/").expect("Content-Length",4).end(done);
    });
  });

  describe("path checking:", function() {
    it("should 404 if fs.stat fails", function(done) {
      app.use(function(req, res) {
        res.sendfile(__dirname + "/" + file);
      });

      request(app).get("/").expect(404).end(done);
    });

    it("should 403 if file is a directory", function(done) {
      app.use(function(req, res) {
        res.sendfile(__dirname + "/data");
      });

      request(app).get("/").expect(403).end(done);
    });

    it("should 403 if path contains ..", function(done) {
      app.use(function(req, res) {
        res.sendfile(__dirname + "../package.json");
      });

      request(app).get("/").expect(403).end(done);
    });
  });

  describe("Range support", function() {
    beforeEach(function() {
      app.use(function(req, res) {
        res.sendfile(path);
      });      
    });

    it("sets Accept-Range", function(done) {
      request(app).get("/").expect("Accept-Range","bytes").end(done);
    });

    it("returns 206 for Range get", function(done) {
      request(app).get("/")
        .set("Range","bytes=0-1")
        .expect(206).end(done);
    });

    it("returns 416 for unsatisfiable range", function(done) {
      request(app).get("/")
        .set("Range","bytes=1-0")
        .expect(416).end(done);
    });

    it("ignores Range if it is invalid", function(done) {
      request(app).get("/")
        .set("Range","invalid range")
        .expect(200).end(done);
    });
  });
});
