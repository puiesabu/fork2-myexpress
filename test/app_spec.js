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

  describe(".use",function() {
    it("should be able to add middlewares to stack", function() {
      var m1 = function() {};
      var m2 = function() {};
      app.use(m1);
      app.use(m2);
      expect(app.stack).with.length(2);
      expect(app.stack[0]).to.equal(m1);
      expect(app.stack[1]).to.equal(m2);
    });
  });
});

describe("calling middleware stack",function() {
  var app;
  beforeEach(function() {
    app = express();
  });

  it("should be able to call a single middleware", function(done) {
    var m1 = function(req, res, next) {
      res.end("hello from m1");
    }

    app.use(m1);
    request(app).get("/").expect("hello from m1").end(done);
  });

  it("should be able to call next to go to the next middleware", function(done) {
    var m1 = function(req,res,next) {
      next();
    };

    var m2 = function(req,res,next) {
      res.end("hello from m2");
    };
    app.use(m1);
    app.use(m2);
    request(app).get("/").expect("hello from m2").end(done);
  });

  it("should 404 at the end of middleware chain", function(done) {
    var m1 = function(req,res,next) {
      console.log("calling m1");
      next();
    };

    var m2 = function(req,res,next) {
      console.log("calling m2");
      next();
    };
    app.use(m1);
    app.use(m2);
    request(app).get("/").expect(404).end(done);
  });

  it("should 404 if no middleware is added", function(done) {
    request(app).get("/").expect(404).end(done);
  });
});

describe("Implement Error Handling", function() {
  var app;
  beforeEach(function() {
    app = express();
  });

  it("should return 500 for unhandled error", function(done) {
    var m1 = function(req,res,next) {
      next(new Error("boom!"));
    }
    app.use(m1);

    request(app).get("/").expect(500).end(done);
  });

  it("should return 500 for uncaught error", function(done) {
    var m1 = function(req,res,next) {
      throw new Error("boom!");
    };
    app.use(m1);
    request(app).get("/").expect(500).end(done);
  });

  it("should skip error handlers when next is called without an error", function(done) {
    var m1 = function(req,res,next) {
      next();
    }

    var e1 = function(err,req,res,next) {
      // timeout
    }

    var m2 = function(req,res,next) {
      res.end("m2");
    }
    app.use(m1);
    app.use(e1); // should skip this. will timeout if called.
    app.use(m2);
    request(app).get("/").expect("m2").end(done);
  });

  it("should skip normal middlewares if next is called with an error", function(done) {
    var m1 = function(req,res,next) {
      next(new Error("boom!"));
    }

    var m2 = function(req,res,next) {
      // timeout
    }

    var e1 = function(err,req,res,next) {
      res.end("e1");
    }

    app.use(m1);
    app.use(m2); // should skip this. will timeout if called.
    app.use(e1);
    request(app).get("/").expect("e1").end(done);
  })
});