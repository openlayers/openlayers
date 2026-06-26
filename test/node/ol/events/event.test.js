import {assert} from 'chai';
import {spy as sinonSpy} from 'sinon';
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
        preventDefault: sinonSpy(),
      };
      preventDefault(event);
      assert.strictEqual(event.preventDefault.called, true);
    });
  });

  describe('ol.events.Event.stopPropagation', function () {
    it('calls preventDefault on the event object', function () {
      const event = {
        stopPropagation: sinonSpy(),
      };
      stopPropagation(event);
      assert.strictEqual(event.stopPropagation.called, true);
    });
  });
});
