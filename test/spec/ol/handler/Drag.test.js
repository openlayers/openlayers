describe('ol.handler.Drag', function() {
    var map, elt;

    beforeEach(function() {
        map = new ol.Map();
        elt = goog.dom.createDom('div');
    });

    describe('create a drag handler', function() {

        it('returns an ol.handler.Drag instance', function() {
            var handler = new ol.handler.Drag(map, elt);
            expect(handler).toBeA(ol.handler.Drag);
        });

    });
});
