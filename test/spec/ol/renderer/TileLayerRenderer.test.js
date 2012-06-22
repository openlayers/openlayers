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

    it("returns a string type", function() {
        expect(ol.renderer.TileLayerRenderer.getType()).toBe("tile");
    });
    
    describe("getPreferredResAndZ_", function() {
        var layer = new ol.layer.XYZ();
        var resolutions = [100, 80, 50, 10, 1, 0.1];
        layer.setResolutions(resolutions);
        
        var container = document.createElement("div");
        var renderer = new ol.renderer.TileLayerRenderer(container, layer);

        it("gets the max resolution", function() {
            var pair = renderer.getPreferredResAndZ_(100);
            expect(pair[0]).toBe(100);
            expect(pair[1]).toBe(0);
        });

        it("gets the min resolution", function() {
            var pair = renderer.getPreferredResAndZ_(0.1);
            expect(pair[0]).toBe(0.1);
            expect(pair[1]).toBe(5);
        });

        it("gets the max when bigger", function() {
            var pair = renderer.getPreferredResAndZ_(200);
            expect(pair[0]).toBe(100);
            expect(pair[1]).toBe(0);
        });

        it("gets the min when smaller", function() {
            var pair = renderer.getPreferredResAndZ_(0.01);
            expect(pair[0]).toBe(0.1);
            expect(pair[1]).toBe(5);
        });

        it("gets the first when in the middle", function() {
            var pair = renderer.getPreferredResAndZ_(90);
            expect(pair[0]).toBe(100);
            expect(pair[1]).toBe(0);
        });

        it("gets the closer when elsewhere", function() {
            var pair = renderer.getPreferredResAndZ_(89);
            expect(pair[0]).toBe(80);
            expect(pair[1]).toBe(1);
            
            pair = renderer.getPreferredResAndZ_(49);
            expect(pair[0]).toBe(50);
            expect(pair[1]).toBe(2);

            pair = renderer.getPreferredResAndZ_(0.5);
            expect(pair[0]).toBe(0.1);
            expect(pair[1]).toBe(5);
        });
        
    });
    
    
    
});

