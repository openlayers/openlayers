

import _ol_events_EventTarget_ from '../../../src/ol/events/eventtarget';
import _ol_Observable_ from '../../../src/ol/observable';


describe('ol.Observable', function() {

  describe('constructor', function() {

    it('creates a new observable', function() {
      var observable = new _ol_Observable_();
      expect(observable).to.be.a(_ol_Observable_);
      expect(observable).to.be.a(_ol_events_EventTarget_);
    });

  });

  describe('#on()', function() {
    var observable, listener;
    beforeEach(function() {
      observable = new _ol_Observable_();
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

      expect(typeof key).to.be('object');
    });

  });

  describe('#once()', function() {
    var observable, listener;
    beforeEach(function() {
      observable = new _ol_Observable_();
      listener = sinon.spy();
    });

    it('registers a listener that is only called once', function() {
      observable.once('foo', listener);

      observable.dispatchEvent('foo');
      expect(listener.calledOnce).to.be(true);

      observable.dispatchEvent('foo');
      expect(listener.callCount).to.be(1);
    });

    it('is safe to dispatch events of same type in a once listener', function() {
      var callCount = 0;
      observable.once('change', function() {
        observable.changed();
        observable.changed();
      });
      observable.on('change', function() {
        ++callCount;
      });
      expect(function() {
        observable.changed();
      }).to.not.throwException();
      expect(callCount).to.be(3);
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

      expect(typeof key).to.be('object');
    });

  });

  describe('#un()', function() {
    var observable, listener;
    beforeEach(function() {
      observable = new _ol_Observable_();
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

  describe('ol.Observable.unByKey()', function() {
    var observable, listener;
    beforeEach(function() {
      observable = new _ol_Observable_();
      listener = sinon.spy();
    });

    it('unregisters a listener given the key returned by `on`', function() {
      var key = observable.on('foo', listener);

      observable.dispatchEvent('foo');
      expect(listener.calledOnce).to.be(true);

      _ol_Observable_.unByKey(key);
      observable.dispatchEvent('foo');
      expect(listener.callCount).to.be(1);
    });

  });

});
