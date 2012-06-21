describe('ol.TileCache', function() {

    describe('exceed the cache capacity', function() {

        var tilecache, tile;

        beforeEach(function() {
            tilecache = new ol.TileCache(1);
            tile = new ol.Tile('url1');
            tilecache.set('url1', tile);
            spyOn(tile, 'destroy');
        });

        it('calls tile.destroy', function() {
            tilecache.set('url2', new ol.Tile('url2'));
            expect(tile.destroy).toHaveBeenCalled();
        });
    });

});
