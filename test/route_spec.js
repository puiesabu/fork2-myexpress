var express = require("../");
var makeRoute = require("../lib/route");
var request = require("supertest");
var http = require("http");
var expect = require("chai").expect;

describe("Add handlers to a route:", function() {
  var route, handler1, handler2;
  beforeEach(function() {
    route = makeRoute();
    handler1 = function(){};
    handler2 = function(){};
    route.use("get", handler1);
    route.use("post", handler2);
  });

  it("adds multiple handlers, to route", function() {
    expect(route.stack).to.have.length(2);
  });

  it("pushes action object to the stack", function() {
    var action1 = route.stack[0];
    expect(action1).to.have.property("verb", "get");
    expect(action1).to.have.property("handler", handler1);

    var action2 = route.stack[1];
    expect(action2).to.have.property("verb", "post");
    expect(action2).to.have.property("handler", handler2);
  });
});

describe("Implement Route Handlers Invokation:", function() {
  var app, route;
  beforeEach(function() {
    app = express()
    route = makeRoute();
    app.use(route);
  });

  describe("calling next():", function() {
    it("goes to the next handler", function(done) {
      route.use("get", function(req, res, next) {
        next();
      });
      route.use("get", function(req, res, next) {
        res.end("handler2");
      })
      request(app).get("/").expect("handler2").end(done);
    });

    it("exits the route if there's no more handler", function(done) {
      request(app).get("/").expect(404).end(done);
    });
  });

  describe("error handling:", function() {
    it("exits the route if there's an error", function(done) {
      route.use("get", function(req, res, next) {
        next(new Error("boom!"));
      });
      route.use("get", function(req, res, next) {
        res.end();
      })
      request(app).get("/").expect(500).end(done);
    });
  });

  describe("verb matching:", function() {
    beforeEach(function() {
      route.use("get", function(req, res) {
        res.end("got");
      });
      route.use("post", function(req, res) {
        res.end("posted");
      });
    });

    it("matches GET to the get handler", function(done) {
      request(app).get("/").expect("got").end(done);
    });

    it("matches POST to the post handler", function(done) {
      request(app).post("/").expect("posted").end(done);
    });

    it("returns 404 for PUT request", function(done) {
      request(app).put("/").expect(404).end(done);
    })
  });

  describe("match any verb:", function() {
    beforeEach(function() {
      route.use("all", function(req, res) {
        res.end("all");
      });
    });

    it("matches POST to the all handler", function(done) {
      request(app).post("/").expect("all").end(done);
    });

    it("matches GET to the all handler", function(done) {
      request(app).get("/").expect("all").end(done);
    });
  });

  describe("calling next(route):", function() {
    beforeEach(function() {
      route.use("get",function(req,res,next) {
        next('route');
      });
      route.use("get",function() {
        // won't get here
      });
      app.use(route);
      app.use(function(req,res) {
        res.end("middleware");
      });      
    });

    it("skip remaining handlers", function(done) {
      request(app).get("/").expect("middleware").end(done);
    });
  });
});

describe("Implement Verbs For Route", function() {
  var app, route, methods;

  try {
    methods = require("methods").concat("all");
  } catch(e) {
    methods = [];
  }

  beforeEach(function() {
    app = express();
    route = makeRoute();
    app.use(route);
  });

  methods.forEach(function(method) {
    it("should respond to " + method, function(done) {
      route[method](function(req, res) {
        res.end("done");
      });

      if (method == "delete") {
        method = "del";
      } 

      if (method == "all") {
        method = "get";
      }

      request(route)[method]("/").expect(200).end(done);
    });
  });

  it("should be able to chain verbs", function(done) {
    route.get(function(req, res) {
      next();
    }).get(function(req, res) {
      res.end("got");
    });

    request(app).get("/").expect("got").end(done);
  });
});
