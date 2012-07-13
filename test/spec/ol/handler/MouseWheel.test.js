describe('ol.handler.MouseWheel', function() {
    var map;

    beforeEach(function() {
        map = new ol.Map();
        var elt = new goog.events.EventTarget();
        map.viewport_ = elt;
    });

    describe('create a mouse wheel handler', function() {

        it('returns an ol.handler.MouseWheel instance', function() {
            var handler = new ol.handler.MouseWheel(map, {});
            expect(handler).toBeA(ol.handler.MouseWheel);
        });

    });

    describe('dispatching events', function() {

        var handler;

        beforeEach(function() {
            handler = new ol.handler.MouseWheel(map, {});
        });

        it('dispatches a mousewheel event', function() {
            var spy = spyOn(goog.events.Event, 'preventDefault').andCallThrough();
            goog.events.listen(map, ol.events.MapEventType.MOUSEWHEEL, spy);

            var evt = new goog.events.MouseWheelEvent(1, 'foo', 0, 1);
            handler.handler_.dispatchEvent(evt);

            expect(spy).toHaveBeenCalled();
            expect(spy.argsForCall[0][0].type).toEqual(ol.events.MapEventType.MOUSEWHEEL);
        });

        it('calls the default action', function() {
            var handler = new ol.handler.MouseWheel(map, {});
            spyOn(handler, 'defaultMouseWheel');

            var evt = new goog.events.MouseWheelEvent(1, 'foo', 0, 1);
            handler.handler_.dispatchEvent(evt);

            expect(handler.defaultMouseWheel).toHaveBeenCalled();
        });

    });
});
