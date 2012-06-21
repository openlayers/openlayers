describe('ol.layer.osm', function() {

    describe('create an OSM layer', function() {

        it('returns an ol.layer.OSM instance', function() {
            var layer = ol.layer.osm();
            expect(layer).toBeA(ol.layer.OSM);
        });

    });

});
