describe('ol.TileCache', function() {

    describe('add tiles to cache', function() {
        var Tile, tilecache;

        beforeEach(function() {
            Tile = ol.Tile.createConstructor(200, 200);
            tilecache = new ol.TileCache(5);
        });

        it('does add tiles, without exceeding cache size', function() {
            for (var i=0; i<6; i++) {
                var url = 'url' + i;
                var tile = new Tile(url);
                tilecache.set(url, tile);
            }
            expect(tilecache.getCount()).toEqual(5);
        });
    });

    describe('exceed the cache capacity', function() {

        var Tile, tilecache, tile;

        beforeEach(function() {
            Tile = ol.Tile.createConstructor(200, 200);
            tilecache = new ol.TileCache(1);
            tile = new Tile('url1');
            tilecache.set('url1', tile);
            spyOn(tile, 'destroy');
        });

        it('calls tile.destroy', function() {
            tilecache.set('url2', new Tile('url2'));
            expect(tile.destroy).toHaveBeenCalled();
        });
    });

});
