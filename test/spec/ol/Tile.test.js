describe("ol.Tile", function() {

    describe("creating a tile", function() {
        it("creates a tile instance", function() {
            var tile = new ol.Tile();
            expect(tile).toBeA(ol.Tile);
        });
        it("sets an image node in the instance", function() {
            var tile = new ol.Tile();
            expect(tile.getImg()).toBeDefined();
        });
    });

});
