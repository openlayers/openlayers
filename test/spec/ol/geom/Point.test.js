describe("ol.geom.Point", function() {  
    var pNoArgs,
        pNoZ,
        p;
        
    var instances = {
        "no arguments passed": ol.geom.point(),
        "only two arguments [x,y] passed": ol.geom.point([21, 4]),
        "all arguments passed": ol.geom.point([21, 4, 8])
    };
    
    beforeEach(function() {
        instances = {
            "no arguments passed": ol.geom.point(),
            "only two arguments [x,y] passed": ol.geom.point([21, 4]),
            "all arguments passed": ol.geom.point([21, 4, 8])
        };
        pNoArgs = instances['no arguments passed'];
        pNoZ = instances['only two arguments [x,y] passed'];
        p = instances['all arguments passed'];
    });
    
    afterEach(function() {
        pNoArgs = pNoZ = p = null;
        instances = {
            "no arguments passed": pNoArgs,
            "only two arguments [x,y] passed": pNoZ,
            "all arguments passed": p
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
            
            it("has the coordinate mixin methods (" + instancesDesc + ")", function() {
                expect(instance.getX).not.toBeUndefined();
                expect(instance.getY).not.toBeUndefined();
                expect(instance.getZ).not.toBeUndefined();
                expect(instance.setX).not.toBeUndefined();
                expect(instance.setY).not.toBeUndefined();
                expect(instance.setZ).not.toBeUndefined();
            });
        }
    }
    
    it("has functional getters (no arguments passed)", function(){
        expect(pNoArgs.getX()).toBe(0);
        expect(pNoArgs.getY()).toBe(0);
        expect(pNoArgs.getZ()).toBeUndefined();
    });
    
    it("has functional getters (only two arguments [x,y] passed)", function(){
        expect(pNoZ.getX()).toBe(21);
        expect(pNoZ.getY()).toBe(4);
        expect(pNoZ.getZ()).toBeUndefined();
    });
    
    it("has functional getters (all arguments passed)", function(){
        expect(p.getX()).toBe(21);
        expect(p.getY()).toBe(4);
        expect(p.getZ()).toBe(8);
    });
});
