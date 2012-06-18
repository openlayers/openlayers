describe("ol.Projection", function() {

    it("constructs instances", function() {
        var p;
        
        p = ol.projection("foo");
        expect(p.code()).toBe("foo");
        
        p = ol.projection({code: "bar"});
        expect(p.code()).toBe("bar");
        
    });
    
    it("allows units to be set", function() {
        var p;
        
        p = ol.projection("foo");
        expect(p.units()).toBeUndefined();
        
        p = ol.projection({code: "foo", units: "m"});
        expect(p.units()).toBe("m");
        
    });
    
    it("handles transforms", function() {
        
        var orig = {x: 10, y: 20, z: 30};
        
        var point = ol.Projection.transform(orig, "EPSG:4326", "EPSG:900913");
        
        expect(point.x.toFixed(3)).toBe("1113194.908");
        expect(point.y.toFixed(3)).toBe("2273030.927");
        expect(point.z).toBe(30);
        
        // original remains unchanged
        expect(orig.x).toBe(10);
        expect(orig.y).toBe(20);
        expect(orig.z).toBe(30);
        
    });
    
});
