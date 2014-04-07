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

describe("Implement App Embedding As Middleware", function() {
  it("should pass unhandled request to parent", function(done) {
    app = new express();
    subApp = new express();

    function m2(req,res,next) {
      res.end("m2");
    }

    app.use(subApp);
    app.use(m2);
    request(app).get("/").expect("m2").end(done);
  });

  it("should pass unhandled error to parent", function(done) {
    app = new express();
    subApp = new express();

    function m1(req,res,next) {
      next("m1 error");
    }

    function e1(err,req,res,next) {
      res.end(err);
    }

    subApp.use(m1);

    app.use(subApp);
    app.use(e1);
    request(app).get("/").expect("m1 error").end(done);
  });
});

describe("Layer class and the match method", function() {
  var layer, m1;
  beforeEach(function() {
    Layer = require("../lib/layer");
    m1 = function(){};

    layer = new Layer("/foo", m1);      
  });

  it("sets layer.handle to be the middleware", function() {
    expect(layer.handle).to.be.equal(m1);
  });

  it("returns undefined if path doesn't match", function() {
    expect(layer.match("/bar")).to.be.undefined;
  });

  it("returns matched path if layer matches the request path exactly", function() {
    var match = layer.match("/foo");
    expect(match).to.not.be.undefined;
    expect(match).to.have.property("path","/foo");
  });

  it("returns matched prefix if the layer matches the prefix of the request path", function() {
    var match = layer.match("/foo/bar");
    expect(match).to.not.be.undefined;
    expect(match).to.have.property("path","/foo");    
  });
});

describe("app.use should add a Layer to stack", function() {
  var app;
  beforeEach(function() {
    app = express();
    Layer = require("../lib/layer");
    app.use(function() {});
    app.use("/foo", function() {});
  });

  it("first layer's path should be /", function() {
    expect(app.stack[0].match("/")).to.have.property("path", "/");
  });

  it("second layer's path should be /foo", function() {
    expect(app.stack[1].match("/foo")).to.have.property("path", "/foo");
  });
});

describe("The middlewares called should match request path:", function() {
  var app;
  beforeEach(function() {
    app = express();
    Layer = require("../lib/layer");
    app.use(function(request, responds) { 
      responds.end("root");
    });
    app.use("/foo", function(request, responds) { 
      responds.end("foo");
    });
  });

  it("returns root for GET /", function(done) {
    request(app).get("/").expect("root").end(done);
  });

  it("returns foo for GET /foo", function(done) {
    request(app).get("/foo").expect("foo").end(done);
  });

  it("returns foo for GET /foo/bar", function(done) {
    request(app).get("/foo/bar").expect("foo").end(done);
  });
});

describe("The error handlers called should match request path", function() {
  var app;
  beforeEach(function() {
    app = express();
    Layer = require("../lib/layer");
    app.use("/foo",function(req,res,next) {
      throw "boom!"
    });

    app.use("/foo/a",function(err,req,res,next) {
      res.end("error handled /foo/a");
    });

    app.use("/foo/b",function(err,req,res,next) {
      res.end("error handled /foo/b");
    });
  });

  it("returns error handled /foo/a for GET /foo/a", function(done) {
    request(app).get("/foo/a").expect("error handled /foo/a").end(done);
  });

  it("returns error handled /foo/b for GET /foo/b", function(done) {
    request(app).get("/foo/b").expect("error handled /foo/b").end(done);
  });

  it("returns 500 for GET /foo", function(done) {
    request(app).get("/foo").expect(500).end(done);
  });
});
