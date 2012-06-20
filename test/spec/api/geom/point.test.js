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
            
            it("has coordinate getter/setter methods (" + instancesDesc + ")", function() {
                expect(instance.x).not.toBeUndefined();
                expect(instance.y).not.toBeUndefined();
                expect(instance.z).not.toBeUndefined();
                
                // always a number
                expect( !isNaN( instance.x() ) ).toBe(true); 
                // setter returns self
                expect(instance.x(47)).toBeA(ol.geom.Point); 
                // getter returns correct number
                expect(instance.x()).toBe(47);
                
                // always a number
                expect( !isNaN( instance.y() ) ).toBe(true); 
                // setter returns self
                expect(instance.y(74)).toBeA(ol.geom.Point);
                // getter returns correct number
                expect(instance.y()).toBe(74);
                
                // always number or undefined
                expect(instance.z() === undefined || !isNaN(instance.z()) ).toBe(true); 
                // setter returns self
                expect(instance.z(0.074)).toBeA(ol.geom.Point);
                // getter returns correct number
                expect(instance.z()).toBe(0.074);
                
            });
            
            it("has projection getter/setter methods (" + instancesDesc + ")", function() {
                expect(instance.projection).not.toBeUndefined();
                
                var getRes = instance.projection();
                expect(getRes === null || getRes instanceof ol.Projection).toBe(true);
                
                var setRes = instance.projection("EPSG:12345");
                expect(setRes instanceof ol.geom.Point).toBe(true);
                
                getRes = instance.projection();
                expect(getRes).toBeA(ol.Projection);
                expect(getRes.code()).toEqual("EPSG:12345");
            });
        }
    }
    
    it("has functional getters (no arguments passed)", function(){
        expect(pNoArgs.x()).toBe(0);
        expect(pNoArgs.y()).toBe(0);
        expect(pNoArgs.z()).toBeUndefined();
        expect(pNoArgs.projection()).toBeNull();
    });
    
    it("has functional getters (one argument <Array[x,y]> passed)", function(){
        expect(pNoZ_arr.x()).toBe(21);
        expect(pNoZ_arr.y()).toBe(4);
        expect(pNoZ_arr.z()).toBeUndefined();
        expect(pNoZ_arr.projection()).toBeNull();
    });
    
    it("has functional getters (one argument <Array[x,y,z]> passed)", function(){
        expect(pWithZ_arr.x()).toBe(21);
        expect(pWithZ_arr.y()).toBe(4);
        expect(pWithZ_arr.z()).toBe(8);
        expect(pWithZ_arr.projection()).toBeNull();
    });
    
    it("has functional getters (one argument <Array[x,y,z,projection]> passed)", function(){
        expect(p_arr.x()).toBe(21);
        expect(p_arr.y()).toBe(4);
        expect(p_arr.z()).toBe(8);
        expect(p_arr.projection()).not.toBeNull();
        expect(p_arr.projection()).toBeA(ol.Projection);
    });
    
    it("has functional getters (one argument <Object{x,y}> passed)", function(){
        expect(pNoZ_obj.x()).toBe(21);
        expect(pNoZ_obj.y()).toBe(4);
        expect(pNoZ_obj.z()).toBeUndefined();
        expect(pNoZ_obj.projection()).toBeNull();
    });
    
    it("has functional getters (one argument <Object{x,y,z}> passed)", function(){
        expect(pWithZ_obj.x()).toBe(21);
        expect(pWithZ_obj.y()).toBe(4);
        expect(pWithZ_obj.z()).toBe(8);
        expect(pWithZ_obj.projection()).toBeNull();
    });
    
    it("has functional getters (one argument <Object{x,y,z,projection}> passed)", function(){
        expect(p_obj.x()).toBe(21);
        expect(p_obj.y()).toBe(4);
        expect(p_obj.z()).toBe(8);
        expect(p_obj.projection()).not.toBeNull();
        expect(p_obj.projection()).toEqual(jasmine.any(ol.Projection));
    });
});
