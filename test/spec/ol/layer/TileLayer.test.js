describe('ol.layer.TileLayer', function() {

    describe('create a tile layer', function() {

        it('returns an ol.layer.TileLayer instance', function() {
            var layer = new ol.layer.TileLayer();
            expect(layer instanceof ol.layer.TileLayer).toBe(true);
        });

    });

    describe('get tile origin', function() {
        var layer;

        beforeEach(function() {
            layer = new ol.layer.TileLayer();
        });

        describe('with tileOriginX and tileOriginY set', function() {

            beforeEach(function() {
                layer.setTileOrigin(1, 2);
            });

            it('returns the expected origin', function() {
                var origin = layer.getTileOrigin();
                expect(origin).toEqual([1, 2]);
            });

        });

        describe('with extent set', function() {

            beforeEach(function() {
                layer.setExtent(new ol.Bounds(-180, -90, 180, 90));
            });

            it('returns the expected origin', function() {
                var origin = layer.getTileOrigin();
                expect(origin).toEqual([-180, -90]);
            });

        });

        describe('with extent and tileOriginCorner set', function() {

            beforeEach(function() {
                layer.setExtent(new ol.Bounds(-180, -90, 180, 90));
                layer.setTileOriginCorner('tr');
            });

            it('returns the expected origin', function() {
                var origin = layer.getTileOrigin();
                expect(origin).toEqual([180, 90]);
            });

        });

    });

});
