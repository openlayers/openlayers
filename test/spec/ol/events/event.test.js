

import _ol_events_Event_ from '../../../../src/ol/events/event';

describe('ol.events.Event', function() {

  describe('constructor', function() {
    it('takes a type as argument', function() {
      var event = new _ol_events_Event_('foo');
      expect(event.type).to.be('foo');
    });
    it('does not set the propagationStopped flag', function() {
      var event = new _ol_events_Event_('foo');
      expect(event.propagationStopped).to.be(undefined);
    });
  });

  describe('#preventDefault', function() {
    it('sets the propagationStopped flag', function() {
      var event = new _ol_events_Event_('foo');
      event.preventDefault();
      expect(event.propagationStopped).to.be(true);
    });
    it('is the same as #stopPropagation', function() {
      var event = new _ol_events_Event_('foo');
      expect(event.stopPropagation).to.equal(event.preventDefault);
    });
  });

  describe('ol.events.Event.preventDefault', function() {
    it('calls preventDefault on the event object', function() {
      var event = {
        preventDefault: sinon.spy()
      };
      _ol_events_Event_.preventDefault(event);
      expect(event.preventDefault.called).to.be(true);
    });
  });

  describe('ol.events.Event.stopPropagation', function() {
    it('calls preventDefault on the event object', function() {
      var event = {
        stopPropagation: sinon.spy()
      };
      _ol_events_Event_.stopPropagation(event);
      expect(event.stopPropagation.called).to.be(true);
    });
  });

});
