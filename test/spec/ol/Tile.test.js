describe("ol.Tile", function() {

    describe("create a tile", function() {
        var tile;
        beforeEach(function() {
            tile = new ol.Tile('http://a.url');
        });
        it("creates a tile instance", function() {
            expect(tile).toBeA(ol.Tile);
        });
        it("sets an image node in the instance", function() {
            expect(tile.getImg()).toBeDefined();
        });
    });

    describe("handle image load", function() {
        var tile;
        beforeEach(function() {
            tile = new ol.Tile('http://a.url');
        });
        it("fires a load event", function() {
            var spy = jasmine.createSpy();
            tile.events_.register('load', spy);
            tile.handleImageLoad();
            expect(spy).toHaveBeenCalled();
        });
        it("sets the loaded flag", function() {
            tile.handleImageLoad();
            expect(tile.isLoaded()).toBeTruthy();
        });
    });

    describe("handle image error", function() {
        var tile;
        beforeEach(function() {
            tile = new ol.Tile('http://a.url');
        });
        it("fires a load event", function() {
            var spy = jasmine.createSpy();
            tile.events_.register('error', spy);
            tile.handleImageError();
            expect(spy).toHaveBeenCalled();
        });
    });
});
