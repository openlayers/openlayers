import Event, {preventDefault, stopPropagation} from '../../../../src/ol/events/Event.js';

describe('ol.events.Event', () => {

  describe('constructor', () => {
    test('takes a type as argument', () => {
      const event = new Event('foo');
      expect(event.type).toBe('foo');
    });
    test('does not set the propagationStopped flag', () => {
      const event = new Event('foo');
      expect(event.propagationStopped).toBe(undefined);
    });
  });

  describe('#preventDefault', () => {
    test('sets the propagationStopped flag', () => {
      const event = new Event('foo');
      event.preventDefault();
      expect(event.propagationStopped).toBe(true);
    });
    test('does the same as #stopPropagation', () => {
      const event = new Event('foo');
      expect(event.stopPropagation()).toBe(event.preventDefault());
    });
  });

  describe('ol.events.Event.preventDefault', () => {
    test('calls preventDefault on the event object', () => {
      const event = {
        preventDefault: sinon.spy()
      };
      preventDefault(event);
      expect(event.preventDefault.called).toBe(true);
    });
  });

  describe('ol.events.Event.stopPropagation', () => {
    test('calls preventDefault on the event object', () => {
      const event = {
        stopPropagation: sinon.spy()
      };
      stopPropagation(event);
      expect(event.stopPropagation.called).toBe(true);
    });
  });

});
