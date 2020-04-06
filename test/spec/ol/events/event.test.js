import Event, {
  preventDefault,
  stopPropagation,
} from '../../../../src/ol/events/Event.js';

describe('ol.events.Event', function () {
  describe('constructor', function () {
    it('takes a type as argument', function () {
      const event = new Event('foo');
      expect(event.type).to.be('foo');
    });
    it('does not set the propagationStopped flag', function () {
      const event = new Event('foo');
      expect(event.propagationStopped).to.be(undefined);
    });
  });

  describe('#preventDefault', function () {
    it('sets the propagationStopped flag', function () {
      const event = new Event('foo');
      event.preventDefault();
      expect(event.propagationStopped).to.be(true);
    });
    it('does the same as #stopPropagation', function () {
      const event = new Event('foo');
      expect(event.stopPropagation()).to.equal(event.preventDefault());
    });
  });

  describe('ol.events.Event.preventDefault', function () {
    it('calls preventDefault on the event object', function () {
      const event = {
        preventDefault: sinon.spy(),
      };
      preventDefault(event);
      expect(event.preventDefault.called).to.be(true);
    });
  });

  describe('ol.events.Event.stopPropagation', function () {
    it('calls preventDefault on the event object', function () {
      const event = {
        stopPropagation: sinon.spy(),
      };
      stopPropagation(event);
      expect(event.stopPropagation.called).to.be(true);
    });
  });
});
