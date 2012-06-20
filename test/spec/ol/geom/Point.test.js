describe("ol.geom.Point", function() {  
    var pNoArgs,
        pNoZ,
        pWithZ,
        p,
        proj = "EPSG:4326";
        
    var instances = {
        "no arguments passed": ol.geom.point(),
        "one argument [x,y] passed": ol.geom.point([21, 4]),
        "one argument [x,y,z] passed": ol.geom.point([21, 4, 8]),
        "two arguments passed [x,y,z] & projection": ol.geom.point([21, 4, 8, proj])
    };
    
    beforeEach(function() {
        proj = ol.projection("EPSG:4326");
        instances = {
            "no arguments passed": ol.geom.point(),
            "one argument [x,y] passed": ol.geom.point([21, 4]),
            "one argument [x,y,z] passed": ol.geom.point([21, 4, 8]),
            "two arguments passed [x,y,z] & projection": ol.geom.point([21, 4, 8, proj])
        };
        pNoArgs = instances['no arguments passed'];
        pNoZ = instances['one argument [x,y] passed'];
        pWithZ = instances['one argument [x,y,z] passed'];
        p = instances['two arguments passed [x,y,z] & projection'];
    });
    
    afterEach(function() {
        pNoArgs = pNoZ = pWithZ = p = null;
        instances = {
            "no arguments passed": ol.geom.point(),
            "one argument [x,y] passed": ol.geom.point([21, 4]),
            "one argument [x,y,z] passed": ol.geom.point([21, 4, 8]),
            "two arguments passed [x,y,z] & projection": ol.geom.point([21, 4, 8, proj])
        };
    });
    
    for (instancesDesc in instances) {
        if (instances.hasOwnProperty(instancesDesc)) {
            var instance = instances[instancesDesc];
            
            it("constructs instances (" + instancesDesc + ")", function() {
                expect(instance).toEqual(jasmine.any(ol.geom.Point));
            });
            
            it("constructs instances of ol.geom.Geometry (" + instancesDesc + ")", function() {
                expect(instance).toEqual(jasmine.any(ol.geom.Geometry));
            });
            
            it("has the coordinate accessor methods (" + instancesDesc + ")", function() {
                expect(instance.getX).not.toBeUndefined();
                expect(instance.getY).not.toBeUndefined();
                expect(instance.getZ).not.toBeUndefined();
                expect(instance.setX).not.toBeUndefined();
                expect(instance.setY).not.toBeUndefined();
                expect(instance.setZ).not.toBeUndefined();
            });
            
            it("has the projection accessor methods (" + instancesDesc + ")", function() {
                expect(instance.getProjection).not.toBeUndefined();
                expect(instance.setProjection).not.toBeUndefined();
            });
        }
    }
    
    it("has functional getters (no arguments passed)", function(){
        expect(pNoArgs.getX()).toBe(0);
        expect(pNoArgs.getY()).toBe(0);
        expect(pNoArgs.getZ()).toBeUndefined();
        expect(pNoArgs.getProjection()).toBeNull();
    });
    
    it("has functional getters (one argument [x,y] passed)", function(){
        expect(pNoZ.getX()).toBe(21);
        expect(pNoZ.getY()).toBe(4);
        expect(pNoZ.getZ()).toBeUndefined();
        expect(pNoZ.getProjection()).toBeNull();
    });
    
    it("has functional getters (one argument [x,y,z] passed)", function(){
        expect(pWithZ.getX()).toBe(21);
        expect(pWithZ.getY()).toBe(4);
        expect(pWithZ.getZ()).toBe(8);
        expect(pWithZ.getProjection()).toBeNull();
    });
    
    it("has functional getters (two arguments passed [x,y,z] & projection)", function(){
        expect(p.getX()).toBe(21);
        expect(p.getY()).toBe(4);
        expect(p.getZ()).toBe(8);
        expect(p.getProjection()).not.toBeNull();
        expect(p.getProjection()).toEqual(jasmine.any(ol.Projection));
    });
});
