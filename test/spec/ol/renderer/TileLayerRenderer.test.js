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
    
    describe("getNormalizedTileCoord_", function() {
        var container = document.createElement("div");
        function str(coord) {
            return coord.x + "," + coord.y;
        }
        
        describe("simple cases", function() {
            var layer = new ol.layer.TileLayer();
            layer.setResolutions([10]);
            layer.setTileOrigin(0, 0);
            var renderer = new ol.renderer.TileLayerRenderer(container, layer);

            var loc, coord;

            it("gets the first tile at the origin", function() {
                loc = new ol.Loc(0, 0);
                coord = renderer.getNormalizedTileCoord_(loc, 10);
                expect(str(coord)).toBe("0,0");
            });

            it("gets one tile northwest of the origin", function() {
                loc = new ol.Loc(-1280, 1280);
                coord = renderer.getNormalizedTileCoord_(loc, 10);
                expect(str(coord)).toBe("-1,-1");
            });

            it("gets one tile northeast of the origin", function() {
                loc = new ol.Loc(1280, 1280);
                coord = renderer.getNormalizedTileCoord_(loc, 10);
                expect(str(coord)).toBe("0,-1");
            });

            it("gets one tile southeast of the origin", function() {
                loc = new ol.Loc(1280, -1280);
                coord = renderer.getNormalizedTileCoord_(loc, 10);
                expect(str(coord)).toBe("0,0");
            });

            it("gets one tile southwest of the origin", function() {
                loc = new ol.Loc(-1280, -1280);
                coord = renderer.getNormalizedTileCoord_(loc, 10);
                expect(str(coord)).toBe("-1,0");
            });

            it("gets the tile to the east when on the edge", function() {
                loc = new ol.Loc(2560, -1280);
                coord = renderer.getNormalizedTileCoord_(loc, 10);
                expect(str(coord)).toBe("1,0");
            });

            it("gets the tile to the south when on the edge", function() {
                loc = new ol.Loc(1280, -2560);
                coord = renderer.getNormalizedTileCoord_(loc, 10);
                expect(str(coord)).toBe("0,1");
            });

            it("pixels are top aligned to the origin", function() {
                loc = new ol.Loc(1280, -2559.999);
                coord = renderer.getNormalizedTileCoord_(loc, 10);
                expect(str(coord)).toBe("0,0");
            });

            it("pixels are left aligned to the origin", function() {
                loc = new ol.Loc(2559.999, -1280);
                coord = renderer.getNormalizedTileCoord_(loc, 10);
                expect(str(coord)).toBe("0,0");
            });

        });
        
        describe("fractional zoom", function() {
            var layer = new ol.layer.TileLayer();
            layer.setResolutions([1/3]);
            layer.setTileOrigin(0, 0);
            var renderer = new ol.renderer.TileLayerRenderer(container, layer);

            var loc, coord;
            
            /**
                These tests render at a resolution of 1.  Because the layer's 
                closest resolution is 1/3, the images are scaled by 1/3.
                In this scenario, every third tile will be one pixel wider when
                rendered (0,0 is normal; 1,0 is wider; 0,1 is taller; etc.)
             */

            it("gets the first tile at the origin", function() {
                loc = new ol.Loc(0, 0);
                coord = renderer.getNormalizedTileCoord_(loc, 1);
                expect(str(coord)).toBe("0,0");
            });

            it("gets the 1,0 tile at 256/3,0", function() {
                loc = new ol.Loc(256/3, 0);
                coord = renderer.getNormalizedTileCoord_(loc, 1);
                expect(str(coord)).toBe("1,0");
            });

            it("still gets the 1,0 tile at 512/3,0 - wider tile", function() {
                loc = new ol.Loc(512/3, 0);
                coord = renderer.getNormalizedTileCoord_(loc, 1);
                expect(str(coord)).toBe("1,0");
            });
            
            it("gets the 2,0 tile at 513/3,0", function() {
                loc = new ol.Loc(513/3, 0);
                coord = renderer.getNormalizedTileCoord_(loc, 1);
                expect(str(coord)).toBe("2,0");
            });
            
            it("gets the 3,0 tile at 768/3,0", function() {
                loc = new ol.Loc(768/3, 0);
                coord = renderer.getNormalizedTileCoord_(loc, 1);
                expect(str(coord)).toBe("3,0");
            });
            
            it("gets the 4,0 tile at 1024/3,0", function() {
                loc = new ol.Loc(1024/3, 0);
                coord = renderer.getNormalizedTileCoord_(loc, 1);
                expect(str(coord)).toBe("4,0");
            });

            it("still gets the 4,0 tile at 1280/3,0 - wider tile", function() {
                loc = new ol.Loc(1280/3, 0);
                coord = renderer.getNormalizedTileCoord_(loc, 1);
                expect(str(coord)).toBe("4,0");
            });

            it("gets the 5,0 tile at 1281/3,0", function() {
                loc = new ol.Loc(1281/3, 0);
                coord = renderer.getNormalizedTileCoord_(loc, 1);
                expect(str(coord)).toBe("5,0");
            });

            it("gets the 0,1 tile at 0,-256/3", function() {
                loc = new ol.Loc(0,-256/3);
                coord = renderer.getNormalizedTileCoord_(loc, 1);
                expect(str(coord)).toBe("0,1");
            });

            it("still gets the 0,1 tile at 0,-512/3 - taller tile", function() {
                loc = new ol.Loc(0,-512/3);
                coord = renderer.getNormalizedTileCoord_(loc, 1);
                expect(str(coord)).toBe("0,1");
            });


        });
        
    });
    
    
    
});

