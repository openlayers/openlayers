describe('ol.layer.XYZ', function() {

    describe('create a xyz layer', function() {

        it('returns an ol.layer.XYZ instance', function() {
            var layer = new ol.layer.XYZ();
            expect(layer instanceof ol.layer.XYZ).toBe(true);
        });

    });

});
