describe('ol.handler.Drag', function() {
    var map, elt;

    beforeEach(function() {
        map = new ol.Map();
        elt = new goog.events.EventTarget();
        map.viewport_ = elt;
        listener = {fn: function() {}};
        spyOn(listener, 'fn');
    });

    describe('creating a drag handler', function() {

        it('returns an ol.handler.Drag instance', function() {
            var handler = new ol.handler.Drag(map, {});
            expect(handler).toBeA(ol.handler.Drag);
        });

    });

    describe('dispatching events', function() {

        it('dragstart, drag and dragend events', function() {
            var handler = new ol.handler.Drag(map, {});
            goog.events.listen(map, 'dragstart', listener.fn);
            goog.events.listen(map, 'drag', listener.fn);
            goog.events.listen(map, 'dragend', listener.fn);

            handler.dragger_.dispatchEvent({type: 'start'});
            handler.dragger_.dispatchEvent({type: 'drag'});
            handler.dragger_.dispatchEvent({type: 'end'});

            expect(listener.fn.calls[0].args[0].type).toBe('dragstart');
            expect(listener.fn.calls[1].args[0].type).toBe('drag');
            expect(listener.fn.calls[2].args[0].type).toBe('dragend');
        });

        it('sets the dragged state during a drag sequence', function() {
            var states = {};
            var handler = new ol.handler.Drag(map, states);

            handler.dragger_.dispatchEvent({type: 'drag'});
            expect(states.dragged).toBe(true);

            handler.dragger_.dispatchEvent({type: 'start'});
            expect(states.dragged).toBe(false);
        });

        it('sets deltaX and deltaY on the ol.event.MapEvent', function() {
            var handler = new ol.handler.Drag(map, {});
            goog.events.listen(map, 'drag', listener.fn);

            handler.dragger_.dispatchEvent({type: 'start', clientX: 2, clientY: 4});
            handler.dragger_.dispatchEvent({type: 'drag', clientX: 1, clientY: 2});
            handler.dragger_.dispatchEvent({type: 'drag', clientX: 2, clientY: 4});

            expect(listener.fn.calls[0].args[0].deltaX).toBe(-1);
            expect(listener.fn.calls[0].args[0].deltaY).toBe(-2);
            expect(listener.fn.calls[1].args[0].deltaX).toBe(1);
            expect(listener.fn.calls[1].args[0].deltaY).toBe(2);
        });

        it('calls the default action on the default control', function() {
            var control = new ol.control.DefaultControl();
            spyOn(control, 'defaultDrag');
            map.setDefaultControl(control);
            var handler = new ol.handler.Drag(map, {});

            handler.dragger_.dispatchEvent({type: 'drag'});
            expect(control.defaultDrag).toHaveBeenCalled();
        });
    });
});
