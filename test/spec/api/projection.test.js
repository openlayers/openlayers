describe("ol.projection", function() {

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
    
});
