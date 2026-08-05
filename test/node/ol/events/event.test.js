import {assert} from 'chai';
import Event, {
  preventDefault,
  stopPropagation,
} from '../../../../src/ol/events/Event.js';

describe('ol/events/Event.js', function () {
  describe('constructor', function () {
    it('takes a type as argument', function () {
      const event = new Event('foo');
      assert.strictEqual(event.type, 'foo');
    });
    it('does not set the propagationStopped flag', function () {
      const event = new Event('foo');
      assert.strictEqual(event.propagationStopped, undefined);
    });
  });

  describe('#preventDefault', function () {
    it('sets the defaultPrevented flag', function () {
      const event = new Event('foo');
      event.preventDefault();
      assert.strictEqual(event.defaultPrevented, true);
    });
    it('does the same as #stopPropagation', function () {
      const event = new Event('foo');
      assert.equal(event.stopPropagation(), event.preventDefault());
    });
  });

  describe('ol.events.Event.preventDefault', function () {
    it('calls preventDefault on the event object', function () {
      const event = {
        preventDefault: vi.fn(),
      };
      preventDefault(event);
      assert.isAbove(event.preventDefault.mock.calls.length, 0);
    });
  });

  describe('ol.events.Event.stopPropagation', function () {
    it('calls preventDefault on the event object', function () {
      const event = {
        stopPropagation: vi.fn(),
      };
      stopPropagation(event);
      assert.isAbove(event.stopPropagation.mock.calls.length, 0);
    });
  });
});
