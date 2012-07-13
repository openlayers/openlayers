describe('ol.handler.Drag', function() {
    var map;

    beforeEach(function() {
        map = new ol.Map();
        var elt = new goog.events.EventTarget();
        map.viewport_ = elt;
    });

    describe('creating a drag handler', function() {

        it('returns an ol.handler.Drag instance', function() {
            var handler = new ol.handler.Drag(map, {});
            expect(handler).toBeA(ol.handler.Drag);
        });

    });

    describe('dispatching events', function() {
        var handler, states;

        beforeEach(function() {
            states = {};
            handler = new ol.handler.Drag(map, states);
        });

        it('dragstart, drag and dragend events', function() {
            var spy = spyOn(goog.events.Event, 'preventDefault').andCallThrough();
            goog.events.listen(map, ol.events.MapEventType.DRAGSTART, spy);
            goog.events.listen(map, ol.events.MapEventType.DRAG, spy);
            goog.events.listen(map, ol.events.MapEventType.DRAGEND, spy);

            handler.dragger_.dispatchEvent({type: goog.fx.Dragger.EventType.START});
            handler.dragger_.dispatchEvent({type: goog.fx.Dragger.EventType.DRAG});
            handler.dragger_.dispatchEvent({type: goog.fx.Dragger.EventType.END});

            expect(spy.callCount).toEqual(3);
            expect(spy.argsForCall[0][0].type).toEqual(ol.events.MapEventType.DRAGSTART);
            expect(spy.argsForCall[1][0].type).toEqual(ol.events.MapEventType.DRAG);
            expect(spy.argsForCall[2][0].type).toEqual(ol.events.MapEventType.DRAGEND);
        });

        it('sets the dragged state during a drag sequence', function() {
            handler.dragger_.dispatchEvent({type: goog.fx.Dragger.EventType.DRAG});
            expect(states.dragged).toBeTruthy();

            handler.dragger_.dispatchEvent({type: goog.fx.Dragger.EventType.START});
            expect(states.dragged).toBeFalsy();
        });

        it('sets deltaX and deltaY on the ol.event.MapEvent', function() {
            var spy = spyOn(goog.events.Event, 'preventDefault').andCallThrough();
            goog.events.listen(map, ol.events.MapEventType.DRAG, spy);

            handler.dragger_.dispatchEvent({type: goog.fx.Dragger.EventType.START,
                                            clientX: 2, clientY: 4});
            handler.dragger_.dispatchEvent({type: goog.fx.Dragger.EventType.DRAG,
                                            clientX: 1, clientY: 2});
            handler.dragger_.dispatchEvent({type: goog.fx.Dragger.EventType.DRAG,
                                            clientX: 2, clientY: 4});

            expect(spy.callCount).toEqual(2);
            expect(spy.argsForCall[0][0].deltaX).toEqual(-1);
            expect(spy.argsForCall[0][0].deltaY).toEqual(-2);
            expect(spy.argsForCall[1][0].deltaX).toEqual(1);
            expect(spy.argsForCall[1][0].deltaY).toEqual(2);
        });

        it('calls the default action', function() {
            var handler = new ol.handler.Drag(map, {});
            var spy spyOn(handler, 'defaultDrag');

            handler.dragger_.dispatchEvent({type: goog.fx.Dragger.EventType.DRAG});
            expect(spy).toHaveBeenCalled();
        });
    });
});
