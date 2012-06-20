describe("ol.renderer.TileLayerRenderer", function() {

    it("is supported in this environment", function() {
        // this will not always be true, but for now we expect it to be so
        expect(ol.renderer.TileLayerRenderer.isSupported()).toBe(true);
    });
    
    it("handles tile layers", function() {
        var xyz = new ol.layer.XYZ();
        expect(ol.renderer.TileLayerRenderer.canRender(xyz)).toBe(true);
    });

    it("doesn't handle arbitrary layers", function() {
        var layer = new ol.layer.Layer();
        expect(ol.renderer.TileLayerRenderer.canRender(layer)).toBe(false);
    });
    
});

