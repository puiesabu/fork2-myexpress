var express = require("../");
var request = require("supertest");
var http = require("http");
var expect = require("chai").expect;

describe("res.send:", function() {
  var app;
  beforeEach(function() {
    app = express();
  });

  describe("support buffer and string body:", function() {
    beforeEach(function() {
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

  describe("sets content-length:", function() {
    beforeEach(function() {
      app.use("/buffer",function(req,res) {
        res.send(new Buffer("你好吗"));
      });

      app.use("/string",function(req,res) {
        res.send("你好吗");
      });
    });

    it("responds with the byte length of unicode string", function(done) {
      request(app).get("/string")
        .expect(200)
        .expect("Content-Length", 9).end(done);
    });
    it("responds with the byte length of buffer", function(done) {
      request(app).get("/buffer")
        .expect(200)
        .expect("Content-Length", 9).end(done);
    });
  });

  describe("sets status code:", function() {
    beforeEach(function() {
      app.use("/foo",function(req,res) {
        res.send("foo ok"); // default status is 200
      });
      app.use("/bar",function(req,res) {
        res.send(201,"bar created");
      });
      app.use("/201",function(req,res) {
        res.send(201);
      });
    });

    it("defaults status code to 200", function(done) {
      request(app).get("/foo").expect(200).end(done);
    });
    it("can respond with a given status code", function(done) {
      request(app).get("/bar").expect(201).end(done);
    });
    it("reponds with default status code body is only status code is given", function(done) {
      request(app).get("/201").expect(201).expect("Created").end(done);
    });
  });

  describe("JSON response:", function() {
    it("returns a JSON as response", function(done) {
      app.use(function(req,res) {
        res.send({foo: [1,2,3]});
      });

      request(app).get("/")
        .expect("Content-Type", "application/json")
        .expect({"foo": [1,2,3]}).end(done);
    });
  });
});

describe("Conditional get:", function() {
  var app;
  beforeEach(function() {
    app = express();
  });

  describe("Calculate Etag:", function() {
    beforeEach(function() {
      app.use("/plumless",function(req,res) {
        res.send("plumless");
      });
      app.use("/buckeroo",function(req,res) {
        res.setHeader("Etag","buckeroo");
        res.send("buckeroo");
      });
    });

    it("generates ETag", function(done) {
      request(app).get("/plumless").expect("ETag", '"1306201125"').end(done);
    });

    it("doesn't generate ETag for non GET requests", function(done) {
      request(app).post("/plumless").expect(function(res) {
        expect(res.headers).to.not.have.property("etag")
      }).end(done);
    });

    it("doesn't generate ETag if already set", function(done) {
      request(app).get("/buckeroo").expect("ETag", "buckeroo").end(done);
    });

    it("doesn't generate ETag for empty body", function(done) {
      request(app).post("/").expect(function(res) {
        expect(res.headers).to.not.have.property("etag")
      }).end(done);
    });
  });

  describe("ETag 304:", function() {
    beforeEach(function() {
      app.use("/",function(req,res) {
        res.setHeader("Etag","foo-v1")
        res.send("foo-v1");
      });
    });

    it("returns 304 if ETag matches", function(done) {
      request(app).get("/").set("If-None-Match", "foo-v1").expect(304).end(done);
    });

    it("returns 200 if ETag doesn't match", function(done) {
      request(app).get("/").set("If-None-Match", "foo-v0").expect(200).end(done);
    });
  });
});
