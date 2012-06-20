describe("ol.TileSet", function() {
    describe("creating a tileset", function() {
        it("creates a tileset instance", function() {
            var tileset = new ol.TileSet();
            expect(tileset).toBeA(ol.TileSet);
        });
    });
    describe("getter methods", function() {
        var tileSet = new ol.TileSet([], 123, 456, 10);

        it("allows getting tile width", function() {
            expect(tileSet.getTileWidth()).toBe(123);
        });
        it("allows getting tile height", function() {
            expect(tileSet.getTileHeight()).toBe(456);
        });
        it("allows getting resolution", function() {
            expect(tileSet.getResolution()).toBe(10);
        });
    });
});
