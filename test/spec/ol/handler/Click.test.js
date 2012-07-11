describe('ol.handler.Click', function() {
    var map, elt;

    beforeEach(function() {
        map = new ol.Map();
        elt = goog.dom.createDom('div');
    });

    describe('create a drag handler', function() {

        it('returns an ol.handler.Click instance', function() {
            var handler = new ol.handler.Click(map, elt, {});
            expect(handler).toBeA(ol.handler.Click);
        });

    });
});
