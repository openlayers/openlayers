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

        describe('with tileOriginX and tileOriginY', function() {

            beforeEach(function() {
                layer.setTileOrigin(1, 2);
            });

            it('returns the expected origin', function() {
                var origin = layer.getTileOrigin();
                expect(origin).toEqual([1, 2]);
            });

        });

        describe('with extent', function() {

            beforeEach(function() {
                layer.setExtent(new ol.Bounds(-180, -90, 180, 90));
            });

            it('returns the expected origin', function() {
                var origin = layer.getTileOrigin();
                expect(origin).toEqual([-180, -90]);
            });

        });

        describe('with tileOriginCorner and extent', function() {

            beforeEach(function() {
                layer.setExtent(new ol.Bounds(-180, -90, 180, 90));
                layer.setTileOriginCorner('tr');
            });

            it('returns the expected origin', function() {
                var origin = layer.getTileOrigin();
                expect(origin).toEqual([180, 90]);
            });

        });

        describe('with tileOriginCorner, without extent', function() {

            beforeEach(function() {
                layer.setTileOriginCorner('tr');
            });

            it('throws an error or return null', function() {
                var origin;
                if (goog.DEBUG) {
                    expect(function() {
                        origin = layer.getTileOrigin();
                    }).toThrow();
                } else {
                    expect(function() {
                        origin = layer.getTileOrigin();
                    }).not.toThrow();
                    expect(origin).toBeNull();
                }
            });

        });

        describe('with bad tileOriginCorner', function() {

            beforeEach(function() {
                layer.setTileOriginCorner('foo');
            });

            it('returns the expected origin', function() {
                if (goog.DEBUG) {
                    expect(function() {
                        var origin = layer.getTileOrigin();
                    }).toThrow();
                } else {
                    expect(function() {
                        var origin = layer.getTileOrigin();
                    }).not.toThrow();
                }
            });

        });
    });

    describe('get resolutions', function() {
        var layer;

        beforeEach(function() {
            layer = new ol.layer.TileLayer();
        });

        describe('with resolutions set', function() {

            beforeEach(function() {
                layer.setResolutions([1, 0.5, 0.25]);
            });

            it('returns the expected resolutions', function() {
                var resolutions = layer.getResolutions();
                expect(resolutions).toEqual([1, 0.5, 0.25]);
            });

        });

        describe('with maxResolution and numZoomLevels set', function() {

            beforeEach(function() {
                layer.setMaxResolution(1);
                layer.setNumZoomLevels(3);
            });

            it('returns the expected resolutions', function() {
                var resolutions = layer.getResolutions();
                expect(resolutions).toEqual([1, 0.5, 0.25]);
            });

        });
    });
});
