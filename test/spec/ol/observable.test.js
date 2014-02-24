goog.provide('ol.test.Observable');

describe('ol.Observable', function() {

  describe('constructor', function() {

    it('creates a new observable', function() {
      var observable = new ol.Observable();
      expect(observable).to.be.a(ol.Observable);
      expect(observable).to.be.a(goog.events.EventTarget);
    });

  });

  describe('#on()', function() {
    var observable, listener;
    beforeEach(function() {
      observable = new ol.Observable();
      listener = sinon.spy();
    });

    it('registers a listener for events of the given type', function() {
      observable.on('foo', listener);

      observable.dispatchEvent('foo');
      expect(listener.calledOnce).to.be(true);

      observable.dispatchEvent('foo');
      expect(listener.callCount).to.be(2);
    });

    it('accepts an array of event types', function() {
      observable.on(['foo', 'bar'], listener);

      observable.dispatchEvent('foo');
      expect(listener.calledOnce).to.be(true);

      observable.dispatchEvent('bar');
      expect(listener.callCount).to.be(2);
    });

    it('accepts an optional `this` arg for the listener', function() {
      var thisArg = {};
      observable.on('foo', listener, thisArg);

      observable.dispatchEvent('foo');
      expect(listener.calledOnce).to.be(true);
      expect(listener.calledOn(thisArg)).to.be(true);
    });

    it('returns a listener key', function() {
      var key = observable.on('foo', listener);

      expect(key).to.be.a(goog.events.Listener);
    });

  });

  describe('#once()', function() {
    var observable, listener;
    beforeEach(function() {
      observable = new ol.Observable();
      listener = sinon.spy();
    });

    it('registers a listener that is only called once', function() {
      observable.once('foo', listener);

      observable.dispatchEvent('foo');
      expect(listener.calledOnce).to.be(true);

      observable.dispatchEvent('foo');
      expect(listener.callCount).to.be(1);
    });

    it('accepts an array of event types (called once for each)', function() {
      observable.once(['foo', 'bar'], listener);

      observable.dispatchEvent('foo');
      expect(listener.calledOnce).to.be(true);

      observable.dispatchEvent('foo');
      expect(listener.callCount).to.be(1);

      observable.dispatchEvent('bar');
      expect(listener.callCount).to.be(2);

      observable.dispatchEvent('bar');
      expect(listener.callCount).to.be(2);
    });

    it('accepts an optional `this` arg for the listener', function() {
      var thisArg = {};
      observable.once('foo', listener, thisArg);

      observable.dispatchEvent('foo');
      expect(listener.calledOnce).to.be(true);
      expect(listener.calledOn(thisArg)).to.be(true);
    });

    it('returns a listener key', function() {
      var key = observable.once('foo', listener);

      expect(key).to.be.a(goog.events.Listener);
    });

  });

  describe('#un()', function() {
    var observable, listener;
    beforeEach(function() {
      observable = new ol.Observable();
      listener = sinon.spy();
    });

    it('unregisters a previously registered listener', function() {
      observable.on('foo', listener);

      observable.dispatchEvent('foo');
      expect(listener.calledOnce).to.be(true);

      observable.un('foo', listener);
      observable.dispatchEvent('foo');
      expect(listener.calledOnce).to.be(true);
    });

    it('accepts a `this` arg', function() {
      var thisArg = {};
      observable.on('foo', listener, thisArg);

      observable.dispatchEvent('foo');
      expect(listener.calledOnce).to.be(true);

      // will not unregister without the same thisArg
      observable.un('foo', listener);
      observable.dispatchEvent('foo');
      expect(listener.callCount).to.be(2);

      // properly unregister by providing the same thisArg
      observable.un('foo', listener, thisArg);
      observable.dispatchEvent('foo');
      expect(listener.callCount).to.be(2);
    });

  });

  describe('#unByKey()', function() {
    var observable, listener;
    beforeEach(function() {
      observable = new ol.Observable();
      listener = sinon.spy();
    });

    it('unregisters a listener given the key returned by `on`', function() {
      var key = observable.on('foo', listener);

      observable.dispatchEvent('foo');
      expect(listener.calledOnce).to.be(true);

      observable.unByKey(key);
      observable.dispatchEvent('foo');
      expect(listener.callCount).to.be(1);
    });

  });

});


goog.require('goog.events.EventTarget');
goog.require('goog.events.Listener');
goog.require('ol.Observable');
