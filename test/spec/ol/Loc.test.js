describe('ol.Loc', function() {
    
    it("should be easy to get a new location with deltas added to coordinates", function() {
        var loc, newLoc;
        
        loc = new ol.Loc(1, 2, 3);
        newLoc = loc.add(1, 2, 3);
        expect(newLoc.getX()).toBe(2);
        expect(newLoc.getY()).toBe(4);
        expect(newLoc.getZ()).toBe(6);
        
        loc = new ol.Loc(1, 2);
        newLoc =loc.add(1, 2);
        expect(newLoc.getX()).toBe(2);
        expect(newLoc.getY()).toBe(4);
        expect(newLoc.getZ()).toBeUndefined();
        
        newLoc = loc.add(0, 0, 1);
        expect(newLoc.getZ()).toBeUndefined();
    });
    
    it("should be immutable", function() {
        var loc = new ol.Loc(1, 2, 3);
        loc.add(1, 2, 3);
        expect(loc.getX()).toBe(1);
        expect(loc.getY()).toBe(2);
        expect(loc.getZ()).toBe(3);
    });
    
});