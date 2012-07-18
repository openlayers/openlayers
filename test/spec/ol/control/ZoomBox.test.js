describe('ol.control.ZoomBox', function() {
    
    var map, zoomBox;
    
    beforeEach(function() {
        map = new ol.Map();
        map.viewport_ = goog.dom.createDom('div');
        map.mapOverlay_ = goog.dom.createDom('div');
        document.body.appendChild(map.mapOverlay_);
        zoomBox = new ol.control.ZoomBox();
        zoomBox.setMap(map);
    });
    
    afterEach(function() {
        document.body.removeChild(map.mapOverlay_);
        map.dispose();
    });
    
    it('creates a box and registers a drag listener on dragstart when shift key is pressed', function() {
        spyOn(goog.events, 'listen');
        map.dispatchEvent({
            type: 'dragstart',
            originalEvent: {browserEvent: {}}
        });
        map.dispatchEvent({
            type: 'dragstart',
            originalEvent: {
                clientX: 10,
                clientY: 20,
                browserEvent: {shiftKey: true}
            }
        });
        expect(goog.events.listen.calls.length).toBe(1);
        expect(goog.events.listen.calls[0].args[1]).toBe('drag');
        expect(zoomBox.box_).not.toBeNull();
        expect(zoomBox.pos_.x).toBe(10);
        expect(zoomBox.pos_.y).toBe(20);
    });
    
    it('listens to drag events and draws a box', function() {
        map.dispatchEvent({
            type: 'dragstart',
            originalEvent: {
                clientX: 10,
                clientY: 20,
                browserEvent: {shiftKey: true}
            }
        });
        map.dispatchEvent({
            type: 'drag',
            deltaX: 2,
            deltaY: 1
        });
        map.dispatchEvent({
            type: 'drag',
            deltaX: 2,
            deltaY: 1
        });
        expect(zoomBox.box_.style.width).toBe('4px');
        expect(zoomBox.box_.style.height).toBe('2px');
    });
    
    it ('cleans up and zooms on dragend', function() {
        map.renderer_ = {getResolution: function() { return 10; }};
        map.center_ = {
            getX: function() { return 5; },
            getY: function() { return 10; }
        };
        zoomBox.pos_ = {x: 5, y: 10};
        zoomBox.box_ = 'foo';
        zoomBox.width_ = 5;
        zoomBox.height_ = 10;
        spyOn(map, 'setCenterAndZoom');
        map.dispatchEvent('dragend');
        expect(zoomBox.box_).toBeNull();
        expect(zoomBox.width_).toBe(0);
        expect(zoomBox.height_).toBe(0);
        expect(map.setCenterAndZoom).toHaveBeenCalled();
    });
    
});