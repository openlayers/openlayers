describe("ol.geom.point", function() {  
    var pNoArgs,
        pNoZ_arr,
        pWithZ_arr,
        p_arr,
        pNoZ_obj,
        pWithZ_obj,
        p_obj,
        proj = "EPSG:4326";
        
    var instances = {
        "no arguments passed": ol.geom.point(),
        "one argument <Array[x,y]> passed": ol.geom.point([21, 4]),
        "one argument <Array[x,y,z]> passed": ol.geom.point([21, 4, 8]),
        "one argument <Array[x,y,z,projection]> passed": ol.geom.point([21, 4, 8, proj]),
        "one argument <Object{x,y}> passed": ol.geom.point({x: 21, y: 4}),
        "one argument <Object{x,y,z}> passed": ol.geom.point({x: 21, y: 4, z: 8}),
        "one argument <Object{x,y,z,projection}> passed": ol.geom.point({x: 21, y: 4, z: 8, projection: proj})
    };
    
    beforeEach(function() {
        proj = ol.projection("EPSG:4326");
        instances = {
            "no arguments passed": ol.geom.point(),
            "one argument <Array[x,y]> passed": ol.geom.point([21, 4]),
            "one argument <Array[x,y,z]> passed": ol.geom.point([21, 4, 8]),
            "one argument <Array[x,y,z,projection]> passed": ol.geom.point([21, 4, 8, proj]),
            "one argument <Object{x,y}> passed": ol.geom.point({x: 21, y: 4}),
            "one argument <Object{x,y,z}> passed": ol.geom.point({x: 21, y: 4, z: 8}),
            "one argument <Object{x,y,z,projection}> passed": ol.geom.point({x: 21, y: 4, z: 8, projection: proj})
        };
        pNoArgs = instances["no arguments passed"];
        pNoZ_arr = instances["one argument <Array[x,y]> passed"];
        pWithZ_arr = instances["one argument <Array[x,y,z]> passed"];
        p_arr = instances["one argument <Array[x,y,z,projection]> passed"];
        pNoZ_obj = instances["one argument <Object{x,y}> passed"];
        pWithZ_obj = instances["one argument <Object{x,y,z}> passed"];
        p_obj = instances["one argument <Object{x,y,z,projection}> passed"];
    });
    
    afterEach(function() {
        pNoArgs = null;
        pNoZ_arr = pWithZ_arr = p_arr = null;
        PNoZ_obj = pWithZ_obj = p_obj = null;
        instances = {
            "no arguments passed": ol.geom.point(),
            "one argument <Array[x,y]> passed": ol.geom.point([21, 4]),
            "one argument <Array[x,y,z]> passed": ol.geom.point([21, 4, 8]),
            "one argument <Array[x,y,z,projection]> passed": ol.geom.point([21, 4, 8, proj]),
            "one argument <Object{x,y}> passed": ol.geom.point({x: 21, y: 4}),
            "one argument <Object{x,y,z}> passed": ol.geom.point({x: 21, y: 4, z: 8}),
            "one argument <Object{x,y,z,projection}> passed": ol.geom.point({x: 21, y: 4, z: 8, projection: proj})
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
    
    it("has functional getters (one argument <Array[x,y]> passed)", function(){
        expect(pNoZ_arr.getX()).toBe(21);
        expect(pNoZ_arr.getY()).toBe(4);
        expect(pNoZ_arr.getZ()).toBeUndefined();
        expect(pNoZ_arr.getProjection()).toBeNull();
    });
    
    it("has functional getters (one argument <Array[x,y,z]> passed)", function(){
        expect(pWithZ_arr.getX()).toBe(21);
        expect(pWithZ_arr.getY()).toBe(4);
        expect(pWithZ_arr.getZ()).toBe(8);
        expect(pWithZ_arr.getProjection()).toBeNull();
    });
    
    it("has functional getters (one argument <Array[x,y,z,projection]> passed)", function(){
        expect(p_arr.getX()).toBe(21);
        expect(p_arr.getY()).toBe(4);
        expect(p_arr.getZ()).toBe(8);
        expect(p_arr.getProjection()).not.toBeNull();
        expect(p_arr.getProjection()).toEqual(jasmine.any(ol.Projection));
    });
    
    it("has functional getters (one argument <Object{x,y}> passed)", function(){
        expect(pNoZ_obj.getX()).toBe(21);
        expect(pNoZ_obj.getY()).toBe(4);
        expect(pNoZ_obj.getZ()).toBeUndefined();
        expect(pNoZ_obj.getProjection()).toBeNull();
    });
    
    it("has functional getters (one argument <Object{x,y,z}> passed)", function(){
        expect(pWithZ_obj.getX()).toBe(21);
        expect(pWithZ_obj.getY()).toBe(4);
        expect(pWithZ_obj.getZ()).toBe(8);
        expect(pWithZ_obj.getProjection()).toBeNull();
    });
    
    it("has functional getters (one argument <Object{x,y,z,projection}> passed)", function(){
        expect(p_obj.getX()).toBe(21);
        expect(p_obj.getY()).toBe(4);
        expect(p_obj.getZ()).toBe(8);
        expect(p_obj.getProjection()).not.toBeNull();
        expect(p_obj.getProjection()).toEqual(jasmine.any(ol.Projection));
    });
});
