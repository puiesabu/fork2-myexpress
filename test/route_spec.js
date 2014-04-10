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
