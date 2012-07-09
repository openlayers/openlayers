describe("ol.Tile", function() {

    describe("create a tile constructor", function() {
        it("returns a constructor than can create tiles with expected properties", function() {
            var Tile = ol.Tile.createConstructor(100, 100);
            expect(typeof Tile).toEqual("function");
            var tile = new Tile('url');
            expect(tile).toBeA(ol.Tile);
            expect(tile.getImg().className).toEqual('olTile');
            expect(tile.getImg().style.width).toEqual("100px");
            expect(tile.getImg().style.height).toEqual("100px");
        });
    });

    describe("create a tile", function() {
        var tile;
        beforeEach(function() {
            var Tile = ol.Tile.createConstructor(200, 200);
            tile = new Tile('http://a.url');
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
            var Tile = ol.Tile.createConstructor(200, 200);
            tile = new Tile('http://a.url');
        });
        it("fires a load event", function() {
            var spy = jasmine.createSpy();
            goog.events.listen(tile, 'load', spy);
            tile.handleImageLoad();
            expect(spy).toHaveBeenCalled();
        });
        it("sets the loaded flag", function() {
            tile.handleImageLoad();
            expect(tile.isLoaded()).toBeTruthy();
        });
        it("unsets the loading flag", function() {
            tile.loading_ = true;
            tile.handleImageLoad();
            expect(tile.isLoading()).toBeFalsy();
        });
    });

    describe("handle image error", function() {
        var tile;
        beforeEach(function() {
            var Tile = ol.Tile.createConstructor(200, 200);
            tile = new Tile('http://a.url');
        });
        it("fires a load event", function() {
            var spy = jasmine.createSpy();
            goog.events.listen(tile, 'error', spy);
            tile.handleImageError();
            expect(spy).toHaveBeenCalled();
        });
        it("unsets the loading flag", function() {
            tile.loading_ = true;
            tile.handleImageError();
            expect(tile.isLoading()).toBeFalsy();
        });
    });
});
