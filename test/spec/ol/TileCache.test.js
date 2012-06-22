describe('ol.TileCache', function() {

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
