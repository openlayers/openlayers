import Disposable from '../../../../src/ol/Disposable.js';
import {listen} from '../../../../src/ol/events.js';
import Event from '../../../../src/ol/events/Event.js';
import EventTarget from '../../../../src/ol/events/Target.js';


describe('ol.events.EventTarget', function() {
  let called, events, eventTarget, spy1, spy2, spy3;

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
    eventTarget = new EventTarget();
  });

  describe('constructor', function() {
    it('creates an instance', function() {
      expect(eventTarget).to.be.a(EventTarget);
      expect(eventTarget).to.be.a(Disposable);
    });
    it('creates an empty listeners_ object', function() {
      expect(Object.keys(eventTarget.listeners_)).to.have.length(0);
    });
    it('accepts a default target', function(done) {
      const defaultTarget = {};
      const target = new EventTarget(defaultTarget);
      target.addEventListener('my-event', function(event) {
        expect(event.target).to.eql(defaultTarget);
        done();
      });
      target.dispatchEvent('my-event');
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

  describe('#addEventListener()', function() {
    it('has listeners for each registered type', function() {
      eventTarget.addEventListener('foo', spy1);
      eventTarget.addEventListener('bar', spy2);
      expect(eventTarget.hasListener('foo')).to.be(true);
      expect(eventTarget.hasListener('bar')).to.be(true);
    });
  });

  describe('#removeEventListener()', function() {
    it('keeps the listeners registry clean', function() {
      eventTarget.addEventListener('foo', spy1);
      eventTarget.removeEventListener('foo', spy1);
      expect(eventTarget.hasListener('foo')).to.be(false);
    });
    it('removes added listeners from the listeners registry', function() {
      eventTarget.addEventListener('foo', spy1);
      eventTarget.addEventListener('foo', spy2);
      eventTarget.removeEventListener('foo', spy1, false);
      expect(eventTarget.listeners_['foo']).to.have.length(1);
    });
    it('does not remove listeners when the specified listener is not found', function() {
      eventTarget.addEventListener('foo', spy1);
      eventTarget.addEventListener('foo', spy2);
      eventTarget.removeEventListener('foo', undefined);
      eventTarget.removeEventListener('foo', spy2);
      eventTarget.removeEventListener('foo', spy2);
      expect(eventTarget.listeners_['foo']).to.eql([spy1]);
    });
  });

  describe('#dispatchEvent()', function() {
    it('calls listeners in the correct order', function() {
      eventTarget.addEventListener('foo', spy1);
      eventTarget.addEventListener('foo', spy2);
      eventTarget.dispatchEvent('foo');
      expect(called).to.eql([1, 2]);
    });
    it('stops propagation when listeners return false', function() {
      eventTarget.addEventListener('foo', spy1);
      eventTarget.addEventListener('foo', function(evt) {
        spy2();
        return false;
      }, false);
      eventTarget.addEventListener('foo', spy3);
      eventTarget.dispatchEvent('foo');
      expect(called).to.eql([1, 2]);
    });
    it('stops propagation when listeners call preventDefault()', function() {
      eventTarget.addEventListener('foo', function(evt) {
        spy2();
        evt.preventDefault();
      });
      eventTarget.addEventListener('foo', spy1);
      eventTarget.dispatchEvent('foo');
      expect(called).to.eql([2]);
    });
    it('passes a default ol.events.Event object to listeners', function() {
      eventTarget.addEventListener('foo', spy1);
      eventTarget.dispatchEvent('foo');
      expect(events[0]).to.be.a(Event);
      expect(events[0].type).to.be('foo');
      expect(events[0].target).to.equal(eventTarget);
    });
    it('passes a custom event object with target to listeners', function() {
      eventTarget.addEventListener('foo', spy1);
      const event = {
        type: 'foo'
      };
      eventTarget.dispatchEvent(event);
      expect(events[0]).to.equal(event);
      expect(events[0].target).to.equal(eventTarget);
    });
    it('is safe to remove listeners in listeners', function() {
      eventTarget.addEventListener('foo', spy3);
      eventTarget.addEventListener('foo', function() {
        eventTarget.removeEventListener('foo', spy1);
        eventTarget.removeEventListener('foo', spy2);
        eventTarget.removeEventListener('foo', spy3);
      });
      eventTarget.addEventListener('foo', spy1);
      eventTarget.addEventListener('foo', spy2);
      expect(function() {
        eventTarget.dispatchEvent('foo');
      }).not.to.throwException();
      expect(called).to.eql([3]);
      expect(eventTarget.listeners_['foo']).to.have.length(1);
    });
    it('is safe to do weird things in listeners', function() {
      eventTarget.addEventListener('foo', spy2);
      eventTarget.addEventListener('foo', function weird(evt) {
        eventTarget.removeEventListener('foo', weird);
        eventTarget.removeEventListener('foo', spy1);
        eventTarget.dispatchEvent('foo');
        eventTarget.removeEventListener('foo', spy2);
        eventTarget.dispatchEvent('foo');
        evt.preventDefault();
      });
      eventTarget.addEventListener('foo', spy1);
      expect(function() {
        eventTarget.dispatchEvent('foo');
      }).not.to.throwException();
      expect(called).to.eql([2, 2]);
      expect(eventTarget.listeners_['foo']).to.be(undefined);
    });
  });

  describe('#dispose()', function() {
    it('cleans up foreign references', function() {
      listen(eventTarget, 'foo', spy1, document);
      expect(eventTarget.hasListener('foo')).to.be(true);
      eventTarget.dispose();
      expect(eventTarget.hasListener('foo')).to.be(false);
    });
  });
});
