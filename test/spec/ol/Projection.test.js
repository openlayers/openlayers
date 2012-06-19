describe("ol.Projection", function() {

    it("constructs instances", function() {
        var p;
        
        p = ol.projection("foo");
        expect(p.code()).toBe("foo");
        
        p = ol.projection({
            code: "bar",
            units: "m"
        });
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
        
        var point = {x: 10, y: 20, z: 30};
        
        var to = new ol.Projection("EPSG:4326");
        var from = new ol.Projection("EPSG:900913");
        var ret = ol.Projection.transform(point, to, from);
        
        expect(ret).toBeUndefined();
        
        // original is modified
        expect(point.x.toFixed(3)).toBe("1113194.908");
        expect(point.y.toFixed(3)).toBe("2273030.927");
        expect(point.z).toBe(30);
        
    });
    
});
