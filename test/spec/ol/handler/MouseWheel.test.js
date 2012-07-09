describe('ol.handler.MouseWheel', function() {
    var map, elt;

    beforeEach(function() {
        map = new ol.Map();
        elt = goog.dom.createDom('div');
    });

    describe('create a mouse wheel handler', function() {

        it('returns an ol.handler.MouseWheel instance', function() {
            var handler = new ol.handler.MouseWheel(map, elt);
            expect(handler).toBeA(ol.handler.MouseWheel);
        });

    });
});
