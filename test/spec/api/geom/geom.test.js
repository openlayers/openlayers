describe("ol.geom.geometry", function() { 
    var g;
    
    beforeEach(function() {
        g = ol.geom.geometry();
    });
    
    afterEach(function() {
        g = null;
    });
    
    
    it("constructs instances", function() {
        expect(g).toEqual(jasmine.any(ol.geom.Geometry));
    });
    
    it("can set bounds", function() {
        var oldBounds = g.bounds();
        
        expect(oldBounds).toBeUndefined();
        
        var b = ol.bounds([0,1,2,3]);
        g.bounds(b);
        var gotBounds =  g.bounds();
        
        expect(gotBounds).not.toBeUndefined();
    });
    
    it("can get bounds", function() {
        var b = ol.bounds([0,1,2,3]);
        g.bounds(b);
        var gotBounds =  g.bounds();
        
        expect(gotBounds).toEqual(jasmine.any(ol.Bounds));
       
    });
    
    it("sets and gets the correct bounds", function() {
        var b = ol.bounds([0,1,2,3]);
        g.bounds(b);
        var gotBounds =  g.bounds();
        
        expect(gotBounds.getMinX()).toEqual(0);
        expect(gotBounds.getMinY()).toEqual(1);
        expect(gotBounds.getMaxX()).toEqual(2);
        expect(gotBounds.getMaxY()).toEqual(3);
    });
//    
});
