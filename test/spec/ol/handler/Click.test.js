describe('ol.handler.Click', function() {
    var map, elt, listener;

    beforeEach(function() {
        map = new ol.Map();
        elt = new goog.events.EventTarget();
        map.viewport_ = elt;
        listener = {fn: function() {}};
        spyOn(listener, 'fn');
    });

    describe('creating a drag handler', function() {

        it('returns an ol.handler.Click instance', function() {
            var handler = new ol.handler.Click(map, {});
            expect(handler).toBeA(ol.handler.Click);
        });
        
    });
    
    describe('dispatching events', function() {
        
        it('dispatches a click event which is an ol.events.MapEvent', function() {
            new ol.handler.Click(map, {});
            goog.events.listen(map, 'click', listener.fn);
            
            goog.events.fireListeners(elt, 'click', false, 'foo');
            var evt = listener.fn.calls[0].args[0];
            expect(evt).toBeA(ol.events.MapEvent);
            expect(evt.originalEvent).toBe('foo');
        });
        
        it('ignores click events when the dragged state is set', function() {
            var states = {};
            new ol.handler.Click(map, states);
            goog.events.listen(map, 'click', listener.fn);
            
            goog.events.fireListeners(elt, 'click', false);
            expect(listener.fn.calls.length).toBe(1);
            
            states.dragged = true;
            goog.events.fireListeners(elt, 'click', false);
            expect(listener.fn.calls.length).toBe(1);
        });
        
    });
});
