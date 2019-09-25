import Disposable from '../../../../src/ol/Disposable.js';
import {listen} from '../../../../src/ol/events.js';
import Event from '../../../../src/ol/events/Event.js';
import EventTarget from '../../../../src/ol/events/Target.js';


describe('ol.events.EventTarget', () => {
  let testContext;

  beforeEach(() => {
    testContext = {};
  });

  let called, events, eventTarget, spy1, spy2, spy3;

  beforeEach(() => {
    called = [];
    events = [];
    function spy(evt) {
      called.push(testContext.id);
      events.push(evt);
    }
    spy1 = spy.bind({id: 1});
    spy2 = spy.bind({id: 2});
    spy3 = spy.bind({id: 3});
    eventTarget = new EventTarget();
  });

  describe('constructor', () => {
    test('creates an instance', () => {
      expect(eventTarget).toBeInstanceOf(EventTarget);
      expect(eventTarget).toBeInstanceOf(Disposable);
    });
    test('creates an empty listeners_ object', () => {
      expect(Object.keys(eventTarget.listeners_)).toHaveLength(0);
    });
  });

  describe('#hasListener', () => {
    test('reports any listeners when called without argument', () => {
      expect(eventTarget.hasListener()).toBe(false);
      eventTarget.listeners_['foo'] = [function() {}];
      expect(eventTarget.hasListener()).toBe(true);
    });
    test('reports listeners for the type passed as argument', () => {
      eventTarget.listeners_['foo'] = [function() {}];
      expect(eventTarget.hasListener('foo')).toBe(true);
      expect(eventTarget.hasListener('bar')).toBe(false);
    });
  });

  describe('#addEventListener()', () => {
    test('has listeners for each registered type', () => {
      eventTarget.addEventListener('foo', spy1);
      eventTarget.addEventListener('bar', spy2);
      expect(eventTarget.hasListener('foo')).toBe(true);
      expect(eventTarget.hasListener('bar')).toBe(true);
    });
  });

  describe('#removeEventListener()', () => {
    test('keeps the listeners registry clean', () => {
      eventTarget.addEventListener('foo', spy1);
      eventTarget.removeEventListener('foo', spy1);
      expect(eventTarget.hasListener('foo')).toBe(false);
    });
    test('removes added listeners from the listeners registry', () => {
      eventTarget.addEventListener('foo', spy1);
      eventTarget.addEventListener('foo', spy2);
      eventTarget.removeEventListener('foo', spy1, false);
      expect(eventTarget.listeners_['foo']).toHaveLength(1);
    });
  });

  describe('#dispatchEvent()', () => {
    test('calls listeners in the correct order', () => {
      eventTarget.addEventListener('foo', spy1);
      eventTarget.addEventListener('foo', spy2);
      eventTarget.dispatchEvent('foo');
      expect(called).toEqual([1, 2]);
    });
    test('stops propagation when listeners return false', () => {
      eventTarget.addEventListener('foo', spy1);
      eventTarget.addEventListener('foo', function(evt) {
        spy2();
        return false;
      }, false);
      eventTarget.addEventListener('foo', spy3);
      eventTarget.dispatchEvent('foo');
      expect(called).toEqual([1, 2]);
    });
    test('stops propagation when listeners call preventDefault()', () => {
      eventTarget.addEventListener('foo', function(evt) {
        spy2();
        evt.preventDefault();
      });
      eventTarget.addEventListener('foo', spy1);
      eventTarget.dispatchEvent('foo');
      expect(called).toEqual([2]);
    });
    test('passes a default ol.events.Event object to listeners', () => {
      eventTarget.addEventListener('foo', spy1);
      eventTarget.dispatchEvent('foo');
      expect(events[0]).toBeInstanceOf(Event);
      expect(events[0].type).toBe('foo');
      expect(events[0].target).toBe(eventTarget);
    });
    test('passes a custom event object with target to listeners', () => {
      eventTarget.addEventListener('foo', spy1);
      const event = {
        type: 'foo'
      };
      eventTarget.dispatchEvent(event);
      expect(events[0]).toBe(event);
      expect(events[0].target).toBe(eventTarget);
    });
    test('is safe to remove listeners in listeners', () => {
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
      }).not.toThrow();
      expect(called).toEqual([3]);
      expect(eventTarget.listeners_['foo']).toHaveLength(1);
    });
    test('is safe to do weird things in listeners', () => {
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
      }).not.toThrow();
      expect(called).toEqual([2, 2]);
      expect(eventTarget.listeners_['foo']).toBe(undefined);
    });
  });

  describe('#dispose()', () => {
    test('cleans up foreign references', () => {
      listen(eventTarget, 'foo', spy1, document);
      expect(eventTarget.hasListener('foo')).toBe(true);
      eventTarget.dispose();
      expect(eventTarget.hasListener('foo')).toBe(false);
    });
  });
});
