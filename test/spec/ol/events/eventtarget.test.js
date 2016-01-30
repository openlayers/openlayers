goog.provide('ol.test.events.EventTarget');


describe('ol.events.EventTarget', function() {
  var called, events, eventTarget, spy1, spy2, spy3;

  beforeEach(function() {
    called = [];
    events = [];
    function spy(evt) {
      called.push(this.id);
      events.push(evt);
    }
    spy1 = spy.bind({id: 1});
    spy2 = spy.bind({id: 2});
    spy3 = spy.bind({id: 3});
    eventTarget = new ol.events.EventTarget();
  });

  describe('constructor', function() {
    it('creates an instance', function() {
      expect(eventTarget).to.be.a(ol.events.EventTarget);
    });
    it('creates an empty listeners_ object', function() {
      expect(Object.keys(eventTarget.listeners_)).to.have.length(0);
    });
  });

  describe('#hasListener', function() {
    it('reports any listeners when called without argument', function() {
      expect(eventTarget.hasListener()).to.be(false);
      eventTarget.listeners_['foo'] = [function() {}];
      expect(eventTarget.hasListener()).to.be(true);
    });
    it('reports listeners for the type passed as argument', function() {
      eventTarget.listeners_['foo'] = [function() {}];
      expect(eventTarget.hasListener('foo')).to.be(true);
      expect(eventTarget.hasListener('bar')).to.be(false);
    });
  });

  describe('#getListeners', function() {
    it('returns listeners for a type or undefined if none', function() {
      expect(eventTarget.getListeners('foo')).to.be(undefined);
      var listeners = [function() {}];
      eventTarget.listeners_['foo'] = listeners;
      expect(eventTarget.getListeners('foo')).to.equal(listeners);
    });
  });


  describe('#addEventListener()', function() {
    it('has listeners for each registered type', function() {
      eventTarget.addEventListener('foo', spy1, false);
      eventTarget.addEventListener('bar', spy2, false);
      expect(eventTarget.hasListener('foo')).to.be(true);
      expect(eventTarget.hasListener('bar')).to.be(true);
    });
    it('registers listeners in the order determined by useCapture', function() {
      eventTarget.addEventListener('foo', spy1, false);
      eventTarget.addEventListener('foo', spy2, false);
      eventTarget.addEventListener('foo', spy3, true);
      expect(eventTarget.getListeners('foo')).to.eql([spy2, spy1, spy3]);
    });
    it('does not re-add existing listeners, ignoring useCapture', function() {
      eventTarget.addEventListener('foo', spy1, false);
      eventTarget.addEventListener('foo', spy2, false);
      eventTarget.addEventListener('foo', spy3, true);
      eventTarget.addEventListener('foo', spy2);
      eventTarget.addEventListener('foo', spy1, true);
      eventTarget.addEventListener('foo', spy3, false);
      expect(eventTarget.getListeners('foo')).to.eql([spy2, spy1, spy3]);
    });
  });

  describe('#removeEventListener()', function() {
    it('keeps the listeners registry clean', function() {
      eventTarget.addEventListener('foo', spy1, false);
      eventTarget.removeEventListener('foo', spy1, false);
      expect(eventTarget.hasListener('foo')).to.be(false);
    });
    it('removes added listeners from the listeners registry', function() {
      eventTarget.addEventListener('foo', spy1, false);
      eventTarget.addEventListener('foo', spy2, false);
      eventTarget.removeEventListener('foo', spy1, false);
      expect(eventTarget.getListeners('foo')).to.have.length(1);
    });
    it('ignores the useCapture setting when removing listeners', function() {
      eventTarget.addEventListener('foo', spy1, false);
      eventTarget.addEventListener('foo', spy2, false);
      eventTarget.addEventListener('foo', spy3, true);
      eventTarget.removeEventListener('foo', spy1, true);
      eventTarget.removeEventListener('foo', spy2);
      eventTarget.removeEventListener('foo', spy3, false);
      expect(eventTarget.getListeners('foo')).to.be(undefined);
    });
  });

  describe('#dispatchEvent()', function() {
    it('calls listeners in the correct order', function() {
      eventTarget.addEventListener('foo', spy1, false);
      eventTarget.addEventListener('foo', spy2, false);
      eventTarget.addEventListener('foo', spy3, true);
      eventTarget.dispatchEvent('foo');
      expect(called).to.eql([3, 1, 2]);
    });
    it('stops propagation when listeners return false', function() {
      eventTarget.addEventListener('foo', spy1, false);
      eventTarget.addEventListener('foo', function(evt) {
        spy2();
        return false;
      }, false);
      eventTarget.addEventListener('foo', spy3, false);
      eventTarget.dispatchEvent('foo');
      expect(called).to.eql([1, 2]);
    });
    it('stops propagation when listeners call preventDefault()', function() {
      eventTarget.addEventListener('foo', spy1, false);
      eventTarget.addEventListener('foo', function(evt) {
        spy2();
        evt.preventDefault();
      }, true);
      eventTarget.addEventListener('foo', spy3, false);
      eventTarget.dispatchEvent('foo');
      expect(called).to.eql([2]);
    });
    it('passes a default ol.events.Event object to listeners', function() {
      eventTarget.addEventListener('foo', spy1, false);
      eventTarget.dispatchEvent('foo');
      expect(events[0]).to.be.a(ol.events.Event);
      expect(events[0].type).to.be('foo');
      expect(events[0].target).to.equal(eventTarget);
    });
    it('passes a custom event object with target to listeners', function() {
      eventTarget.addEventListener('foo', spy1, false);
      var event = {
        type: 'foo'
      };
      eventTarget.dispatchEvent(event);
      expect(events[0]).to.equal(event);
      expect(events[0].target).to.equal(eventTarget);
    });
  });

  describe('#dispose()', function() {
    it('cleans up foreign references', function() {
      ol.events.listen(eventTarget, 'foo', spy1, false, document);
      expect(eventTarget.hasListener('foo')).to.be(true);
      eventTarget.dispose();
      expect(eventTarget.hasListener('foo')).to.be(false);
    });
  });
});


goog.require('ol.events');
goog.require('ol.events.Event');
goog.require('ol.events.EventTarget');
