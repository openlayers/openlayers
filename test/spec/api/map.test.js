describe("ol.map", function() {
    
    it("should be easy to make a map", function() {

        var map = ol.map();
        
        expect(map).toBeA(ol.Map);
        
    });

    it("should be easy to set the map center", function() {
        var map, center;

        // with array
        map = ol.map();
        map.center([-110, 45]);

        center = map.center();
        expect(center.x().toFixed(3)).toBe("-110.000");
        expect(center.y().toFixed(3)).toBe("45.000");
        expect(center).toBeA(ol.Loc);
        
        // with object literal
        map.center({x: -111, y: 46});
        
        center = map.center();
        expect(center.x().toFixed(3)).toBe("-111.000");
        expect(center.y().toFixed(3)).toBe("46.000");
        expect(center).toBeA(ol.Loc);

        // more verbose
        map = ol.map({
            center: ol.loc({x: -112, y: 47})
        });
        
        center = map.center();
        expect(center.x().toFixed(3)).toBe("-112.000");
        expect(center.y().toFixed(3)).toBe("47.000");
        expect(center).toBeA(ol.Loc);
        
    });
    
    it("allows flexible setting of center and zoom", function() {
        var map, center, zoom;
        
        // chained
        map = ol.map().center([1, 2]).zoom(3);

        center = map.center();
        zoom = map.zoom();
        expect(center.x().toFixed(3)).toBe("1.000");
        expect(center.y().toFixed(3)).toBe("2.000");
        expect(zoom).toBe(3);
        
        // all at once
        map = ol.map({
            center: [4, 5],
            zoom: 6
        });

        center = map.center();
        zoom = map.zoom();
        expect(center.x().toFixed(3)).toBe("4.000");
        expect(center.y().toFixed(3)).toBe("5.000");
        expect(zoom).toBe(6);
        
    });
    
    it("has a default projection", function() {
        
        var map = ol.map();
        var proj = map.projection();
        
        expect(proj).toBeA(ol.Projection);
        expect(proj.code()).toBe("EPSG:3857");
        
    });

    it("allows projection to be set", function() {
        var proj;
        
        // at construction
        var map = ol.map({
            projection: ol.projection("EPSG:4326")
        });
        proj = map.projection();
        
        expect(proj).toBeA(ol.Projection);
        expect(proj.code()).toBe("EPSG:4326");
        
        // after construction
        map.projection("EPSG:3857");
        proj = map.projection();
        
        expect(proj).toBeA(ol.Projection);
        expect(proj.code()).toBe("EPSG:3857");
        
    });
    
    it("has a default user projection in 4326", function() {
        
        var map = ol.map();
        var userproj = map.userProjection();
        
        expect(userproj).toBeA(ol.Projection);
        expect(userproj.code()).toBe("EPSG:4326");
        
    });

    it("allows number of zoom levels to be set", function() {
        
        var map = ol.map();
        var nzoom = map.numZoomLevels();
        
        expect(nzoom).toBe(22);
        
        map.numZoomLevels(15);
        
        nzoom = map.numZoomLevels();
        expect(nzoom).toBe(15);        

    });

    it("allows a user projection to be set", function() {
        var proj;

        var map = ol.map();
        proj = map.userProjection();
        
        expect(proj).toBeA(ol.Projection);
        expect(proj.code()).toBe("EPSG:4326");
        
        map.center([10, 20]);
        
        map.userProjection("EPSG:3857");
        var center = map.center();
        expect(center.x().toFixed(3)).toBe("1113194.908");
        expect(center.y().toFixed(3)).toBe("2273030.927");
        
        //make sure the center doesn't change
        expect(center.x().toFixed(3)).toBe("1113194.908");
        expect(center.y().toFixed(3)).toBe("2273030.927");
        
    });
    
    it("provides feedback when you mess up", function() {
        var map;
        if (goog.DEBUG) {
            // misspelling
            expect(function() {
                map = ol.map({
                    centre: [1, 2]
                });
            }).toThrow(new Error("Unsupported config property: centre"));
        } else {
            expect(function() {
                map = ol.map({
                    centre: [1, 2]
                });
            }).not.toThrow();
        }
    });
    
    it("is destroyable", function() {
        
        var map = ol.map();
        map.center([1, 2]);
        
        map.destroy();

        expect(goog.isDef(map.getLayers())).toBe(false);
        
    });
    
    it("allows setting the resolutions array", function() {
        var map = ol.map();
        map.resolutions([1,2,3]);
            
        var resolutions = map.resolutions();
        expect(resolutions.length).toBe(3);
        expect(resolutions[0]).toBe(1);
        expect(resolutions[1]).toBe(2);
        expect(resolutions[2]).toBe(3);
    });
    
    it("resolutions array is mutable", function() {
        var map = ol.map();
        map.resolutions([1,2,3]);
        
        var resolutions = map.resolutions();
        expect(resolutions[0]).toBe(1);
            
        map.resolutions([10,9,8,7,6,5]);

        resolutions = map.resolutions();
        expect(resolutions.length).toBe(6);
        expect(resolutions[0]).toBe(10);
        expect(resolutions[2]).toBe(8);
        expect(resolutions[4]).toBe(6);
    });
    
    it("returns correct maxExtent for default map", function() {
        var map = ol.map();
        
        var extent = map.maxExtent();
        expect(extent).toBeA(ol.UnreferencedBounds);
        expect(extent.getMinX()).toBe(-20037508.34);
        expect(extent.getMaxX()).toBe(20037508.34);
        expect(extent.getMinY()).toBe(-20037508.34);
        expect(extent.getMaxY()).toBe(20037508.34);
        
    });
    
    it("returns correct maxExtent for custom map extent", function() {
        var map = ol.map();
        map.maxExtent([-5,-4,7,9]);
        
        var extent = map.maxExtent();
        expect(extent).toBeA(ol.UnreferencedBounds);
        expect(extent.getMinX()).toBe(-5);
        expect(extent.getMaxX()).toBe(7);
        expect(extent.getMinY()).toBe(-4);
        expect(extent.getMaxY()).toBe(9);
        
    });
    
    it("returns correct maxExtent for custom projection extent", function() {
        var map = ol.map();
        map.projection("CRS:84");
        
        var extent = map.maxExtent();
        expect(extent).toBeA(ol.UnreferencedBounds);
        expect(extent.getMinX()).toBe(-180);
        expect(extent.getMaxX()).toBe(180);
        expect(extent.getMinY()).toBe(-90);
        expect(extent.getMaxY()).toBe(90);
        
    });
    
    it("throws an error whith no maxExtent available", function() {
        expect(function(){
            map({projection: ol.projection("bar")});
            extent = map.maxExtent();                
        }).toThrow();
    });
    
    it("getMaxRes returns correct defaults", function() {
        var map = ol.map();
        
        var res = map.maxRes();
        expect(res.toFixed(5)).toBe("156543.03391");
        
    });
    
    it("allows setting of maxRes", function() {
        var map = ol.map({
            maxRes: 67
        });
        
        var res = map.maxRes();
        expect(res).toBe(67);
        
    });
    
    it("getMaxRes returns correct for custom maxExtent", function() {
        var map = ol.map({
            projection: ol.projection({
                code: 'foo',
                maxExtent: [0,0,90,90]
            })
        });
        
        var res = map.maxRes();
        expect(res.toFixed(7)).toBe("0.3515625");
        
    });
    
    it("returns correct getResForZoom for default map", function() {
        var map = ol.map();
        
        var res = map.getResForZoom(0);
        expect(res.toFixed(5)).toBe("156543.03391");
        res = map.getResForZoom(5);
        expect(res.toFixed(5)).toBe("4891.96981");
        
    });
    
    it("returns correct getResForZoom when resolution array is set",function() {
        var map = ol.map({
            resolutions: [1,4,7,9,12]
        });
        
        var res = map.getResForZoom(0);
        expect(res).toBe(1);
        res = map.getResForZoom(3);
        expect(res).toBe(9);
        
    });
    
    it("has no layers by default", function() {
        var map = ol.map();
            
        var layers = map.layers();
        expect(layers).toBe(null);
    });
    
    
});
