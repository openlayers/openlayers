describe("ol.Bounds", function() {
    
    it("allows flexible construction", function() {
        var bounds, proj;
        
        // array with min/max
        bounds = ol.bounds([1, 2, 3, 4]);
        
        expect(bounds.minX()).toBe(1);
        expect(bounds.minY()).toBe(2);
        expect(bounds.maxX()).toBe(3);
        expect(bounds.maxY()).toBe(4);
        
        // object config
        bounds = ol.bounds({
            minX: 9, maxX: 10, minY: 11, maxY: 12,
            projection: ol.projection("bar")
        });

        expect(bounds.minX()).toBe(9);
        expect(bounds.maxX()).toBe(10);
        expect(bounds.minY()).toBe(11);
        expect(bounds.maxY()).toBe(12);
        proj = bounds.projection();
        expect(proj instanceof ol.Projection).toBe(true);
        expect(proj.code()).toBe("bar");

    });

}); 
       
