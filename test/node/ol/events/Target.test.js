import {assert} from 'chai';
import Disposable from '../../../../src/ol/Disposable.js';
import {listen} from '../../../../src/ol/events.js';
import Event from '../../../../src/ol/events/Event.js';
import EventTarget from '../../../../src/ol/events/Target.js';

describe('ol/events/Target.js', function () {
  let called, events, eventTarget, spy1, spy2, spy3;

  beforeEach(function () {
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

  describe('constructor', function () {
    it('creates an instance', function () {
      assert.instanceOf(eventTarget, EventTarget);
      assert.instanceOf(eventTarget, Disposable);
    });
    it('accepts a default target', function (done) {
      const defaultTarget = {};
      const target = new EventTarget(defaultTarget);
      target.addEventListener('my-event', function (event) {
        assert.deepEqual(event.target, defaultTarget);
        done();
      });
      target.dispatchEvent('my-event');
    });
    it('does not initialize objects in advance', function () {
      assert.strictEqual(eventTarget.pendingRemovals_, null);
      assert.strictEqual(eventTarget.dispatching_, null);
      assert.strictEqual(eventTarget.listeners_, null);
    });
  });

  describe('#hasListener', function () {
    it('reports any listeners when called without argument', function () {
      assert.strictEqual(eventTarget.hasListener(), false);
      eventTarget.addEventListener('foo', function () {});
      assert.strictEqual(eventTarget.hasListener(), true);
    });
    it('reports listeners for the type passed as argument', function () {
      eventTarget.addEventListener('foo', function () {});
      assert.strictEqual(eventTarget.hasListener('foo'), true);
      assert.strictEqual(eventTarget.hasListener('bar'), false);
    });
  });

  describe('#addEventListener()', function () {
    it('has listeners for each registered type', function () {
      eventTarget.addEventListener('foo', spy1);
      eventTarget.addEventListener('bar', spy2);
      assert.strictEqual(eventTarget.hasListener('foo'), true);
      assert.strictEqual(eventTarget.hasListener('bar'), true);
    });
  });

  describe('#removeEventListener()', function () {
    it('keeps the listeners registry clean', function () {
      eventTarget.addEventListener('foo', spy1);
      eventTarget.removeEventListener('foo', spy1);
      assert.strictEqual(eventTarget.hasListener('foo'), false);
    });
    it('removes added listeners from the listeners registry', function () {
      eventTarget.addEventListener('foo', spy1);
      eventTarget.addEventListener('foo', spy2);
      eventTarget.removeEventListener('foo', spy1, false);
      assert.lengthOf(eventTarget.listeners_['foo'], 1);
    });
    it('does not remove listeners when the specified listener is not found', function () {
      eventTarget.addEventListener('foo', spy1);
      eventTarget.addEventListener('foo', spy2);
      eventTarget.removeEventListener('foo', undefined);
      eventTarget.removeEventListener('foo', spy2);
      eventTarget.removeEventListener('foo', spy2);
      assert.deepEqual(eventTarget.listeners_['foo'], [spy1]);
    });
  });

  describe('#dispatchEvent()', function () {
    it('calls listeners in the correct order', function () {
      eventTarget.addEventListener('foo', spy1);
      eventTarget.addEventListener('foo', spy2);
      eventTarget.dispatchEvent('foo');
      assert.deepEqual(called, [1, 2]);
    });
    it('stops propagation when listeners return false', function () {
      eventTarget.addEventListener('foo', spy1);
      eventTarget.addEventListener(
        'foo',
        function (evt) {
          spy2();
          return false;
        },
        false,
      );
      eventTarget.addEventListener('foo', spy3);
      eventTarget.dispatchEvent('foo');
      assert.deepEqual(called, [1, 2]);
    });
    it('stops propagation when listeners call stopPropagation()', function () {
      eventTarget.addEventListener('foo', function (evt) {
        spy2();
        evt.stopPropagation();
      });
      eventTarget.addEventListener('foo', spy1);
      eventTarget.dispatchEvent('foo');
      assert.deepEqual(called, [2]);
    });
    it('passes a default ol.events.Event object to listeners', function () {
      eventTarget.addEventListener('foo', spy1);
      eventTarget.dispatchEvent('foo');
      assert.instanceOf(events[0], Event);
      assert.strictEqual(events[0].type, 'foo');
      assert.equal(events[0].target, eventTarget);
    });
    it('passes a custom event object with target to listeners', function () {
      eventTarget.addEventListener('foo', spy1);
      const event = {
        type: 'foo',
      };
      eventTarget.dispatchEvent(event);
      assert.equal(events[0], event);
      assert.equal(events[0].target, eventTarget);
    });
    it('is safe to remove listeners in listeners', function () {
      eventTarget.addEventListener('foo', spy3);
      eventTarget.addEventListener('foo', function () {
        eventTarget.removeEventListener('foo', spy1);
        eventTarget.removeEventListener('foo', spy2);
        eventTarget.removeEventListener('foo', spy3);
      });
      eventTarget.addEventListener('foo', spy1);
      eventTarget.addEventListener('foo', spy2);
      assert.doesNotThrow(function () {
        eventTarget.dispatchEvent('foo');
      });
      assert.deepEqual(called, [3]);
      assert.lengthOf(eventTarget.listeners_['foo'], 1);
    });
    it('is safe to do weird things in listeners', function () {
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
      assert.doesNotThrow(function () {
        eventTarget.dispatchEvent('foo');
      });
      assert.deepEqual(called, [2, 2]);
      assert.strictEqual(eventTarget.listeners_['foo'], undefined);
    });
  });

  describe('#dispose()', function () {
    it('cleans up foreign references', function () {
      listen(eventTarget, 'foo', spy1);
      assert.strictEqual(eventTarget.hasListener('foo'), true);
      eventTarget.dispose();
      assert.strictEqual(eventTarget.hasListener('foo'), false);
    });
  });
});
