describe('ol.layer.XYZ', function() {

    describe('create a xyz layer', function() {

        it('returns an ol.layer.XYZ instance', function() {
            var layer = new ol.layer.XYZ();
            expect(layer instanceof ol.layer.XYZ).toBe(true);
        });

    });

    describe('get data from the layer', function() {
        var layer;

        beforeEach(function() {
            layer = new ol.layer.XYZ('/{z}/{x}/{y}');
            layer.setResolutions([1, 0.5, 0.25]);
            layer.setTileOrigin(-128, 128);
        });

        describe('extent -128,-128,128,128, resolution 1', function() {

            it('returns the expected data', function() {
                var tileset = layer.getData(
                    new ol.Bounds(-128, -128, 128, 128), 1);

                var tiles = tileset.getTiles();
                expect(tiles.length).toEqual(1);
                expect(tiles[0].length).toEqual(1);

                var tile = tiles[0][0];
                expect(tile.getUrl()).toEqual('/0/0/0');
                expect(tile.getImg()).toBeDefined();
            });
        });

        describe('extent -128,-128,128,128, resolution 0.5', function() {

            it('returns the expected data', function() {
                var tileset = layer.getData(
                    new ol.Bounds(-128, -128, 128, 128), 0.5);

                var tiles = tileset.getTiles();
                expect(tiles.length).toEqual(2);
                expect(tiles[0].length).toEqual(2);

                var tile;

                tile = tiles[0][0];
                expect(tile.getUrl()).toEqual('/1/0/0');
                expect(tile.getImg()).toBeDefined();

                tile = tiles[0][1];
                expect(tile.getUrl()).toEqual('/1/1/0');
                expect(tile.getImg()).toBeDefined();

                tile = tiles[1][0];
                expect(tile.getUrl()).toEqual('/1/0/1');
                expect(tile.getImg()).toBeDefined();

                tile = tiles[1][1];
                expect(tile.getUrl()).toEqual('/1/1/1');
                expect(tile.getImg()).toBeDefined();
            });
        });

        describe('extent -64,-64,64,64, resolution 0.5', function() {

            it('returns the expected data', function() {
                var tileset = layer.getData(
                    new ol.Bounds(-64, -64, 64, 64), 0.5);

                var tiles = tileset.getTiles();
                expect(tiles.length).toEqual(2);
                expect(tiles[0].length).toEqual(2);

                var tile;

                tile = tiles[0][0];
                expect(tile.getUrl()).toEqual('/1/0/0');
                expect(tile.getImg()).toBeDefined();

                tile = tiles[0][1];
                expect(tile.getUrl()).toEqual('/1/1/0');
                expect(tile.getImg()).toBeDefined();

                tile = tiles[1][0];
                expect(tile.getUrl()).toEqual('/1/0/1');
                expect(tile.getImg()).toBeDefined();

                tile = tiles[1][1];
                expect(tile.getUrl()).toEqual('/1/1/1');
                expect(tile.getImg()).toBeDefined();
            });
        });

        describe('extent -96,32,-32,96, resolution 0.5', function() {

            it('returns the expected data', function() {
                var tileset = layer.getData(
                    new ol.Bounds(-96, 32, -32, 96), 0.5);

                var tiles = tileset.getTiles();
                expect(tiles.length).toEqual(1);
                expect(tiles[0].length).toEqual(1);

                var tile;

                tile = tiles[0][0];
                expect(tile.getUrl()).toEqual('/1/0/0');
                expect(tile.getImg()).toBeDefined();
            });
        });

        describe('extent -32,32,32,96, resolution 0.5', function() {

            it('returns the expected data', function() {
                var tileset = layer.getData(
                    new ol.Bounds(-32, 32, 32, 96), 0.5);

                var tiles = tileset.getTiles();
                expect(tiles.length).toEqual(1);
                expect(tiles[0].length).toEqual(2);

                var tile;

                tile = tiles[0][0];
                expect(tile.getUrl()).toEqual('/1/0/0');
                expect(tile.getImg()).toBeDefined();

                tile = tiles[0][1];
                expect(tile.getUrl()).toEqual('/1/1/0');
                expect(tile.getImg()).toBeDefined();
            });
        });

        describe('extent 32,-32,96,32, resolution 0.5', function() {

            it('returns the expected data', function() {
                var tileset = layer.getData(
                    new ol.Bounds(32, -32, 96, 32), 0.5);

                var tiles = tileset.getTiles();
                expect(tiles.length).toEqual(2);
                expect(tiles[0].length).toEqual(1);
                expect(tiles[1].length).toEqual(1);

                var tile;

                tile = tiles[0][0];
                expect(tile.getUrl()).toEqual('/1/1/0');
                expect(tile.getImg()).toBeDefined();

                tile = tiles[1][0];
                expect(tile.getUrl()).toEqual('/1/1/1');
                expect(tile.getImg()).toBeDefined();
            });
        });

    });
});
