describe('ol.handler.MouseWheel', function() {
    var map, elt;

    beforeEach(function() {
        map = new ol.Map();
        elt = new goog.events.EventTarget();
        map.viewport_ = elt;
        listener = {fn: function() {}};
        spyOn(listener, 'fn');
    });

    describe('create a mouse wheel handler', function() {

        it('returns an ol.handler.MouseWheel instance', function() {
            var handler = new ol.handler.MouseWheel(map, {});
            expect(handler).toBeA(ol.handler.MouseWheel);
        });

    });
    
    describe('dispatching events', function() {
        
        it('dispatches a mousewheel event', function() {
            var handler = new ol.handler.MouseWheel(map, {});
            goog.events.listen(map, 'mousewheel', listener.fn);
            
            var evt = new goog.events.MouseWheelEvent(1, 'foo', 0, 1);
            handler.handleMouseWheel(evt);
            
            expect(listener.fn.calls[0].args[0].type).toBe('mousewheel');
            expect(listener.fn.calls[0].args[0].originalEvent).toBe(evt);
        });
        
        it('calls the default action on the default control', function() {
            var control = new ol.control.DefaultControl();
            spyOn(control, 'defaultMouseWheel');
            map.setDefaultControl(control);
            var handler = new ol.handler.MouseWheel(map, {});
            
            handler.handleMouseWheel(new goog.events.MouseWheelEvent(1, 'foo', 0, 1));
            expect(control.defaultMouseWheel).toHaveBeenCalled();
        });
        
    });
});
