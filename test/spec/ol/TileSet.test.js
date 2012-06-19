describe("ol.TileSet", function() {
    describe("creating a tileset", function() {
        it("creates a tileset instance", function() {
            var tileset = new ol.TileSet();
            expect(tileset instanceof ol.TileSet).toBe(true);
        });
    });
});
