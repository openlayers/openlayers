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

            describe("instantiate with " + instancesDesc, function() {

                it("constructs instances", function() {
                    expect(instance).toEqual(jasmine.any(ol.geom.Point));
                });

                it("constructs instances of ol.geom.Geometry", function() {
                    expect(instance).toEqual(jasmine.any(ol.geom.Geometry));
                });

                it("has coordinate getter/setter methods", function() {
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

                it("has projection getter/setter methods", function() {
                    expect(instance.projection).not.toBeUndefined();

                    var getRes = instance.projection();
                    expect(getRes === null || getRes instanceof ol.Projection).toBe(true);

                    var setRes = instance.projection("EPSG:12345");
                    expect(setRes instanceof ol.geom.Point).toBe(true);

                    getRes = instance.projection();
                    expect(getRes).toBeA(ol.Projection);
                    expect(getRes.code()).toEqual("EPSG:12345");
                });
            });


        }
    }

    describe('the getters are functional', function(){
        it("works when no arguments passed", function(){
            expect(pNoArgs.x()).toBe(0);
            expect(pNoArgs.y()).toBe(0);
            expect(pNoArgs.z()).toBeUndefined();
            expect(pNoArgs.projection()).toBeNull();
        });

        it("works when one argument <Array[x,y]> passed", function(){
            expect(pNoZ_arr.x()).toBe(21);
            expect(pNoZ_arr.y()).toBe(4);
            expect(pNoZ_arr.z()).toBeUndefined();
            expect(pNoZ_arr.projection()).toBeNull();
        });

        it("works when one argument <Array[x,y,z]> passed", function(){
            expect(pWithZ_arr.x()).toBe(21);
            expect(pWithZ_arr.y()).toBe(4);
            expect(pWithZ_arr.z()).toBe(8);
            expect(pWithZ_arr.projection()).toBeNull();
        });

        it("works when one argument <Array[x,y,z,projection]> passed", function(){
            expect(p_arr.x()).toBe(21);
            expect(p_arr.y()).toBe(4);
            expect(p_arr.z()).toBe(8);
            expect(p_arr.projection()).not.toBeNull();
            expect(p_arr.projection()).toBeA(ol.Projection);
        });

        it("works when one argument <Object{x,y}> passed", function(){
            expect(pNoZ_obj.x()).toBe(21);
            expect(pNoZ_obj.y()).toBe(4);
            expect(pNoZ_obj.z()).toBeUndefined();
            expect(pNoZ_obj.projection()).toBeNull();
        });

        it("works when one argument <Object{x,y,z}> passed", function(){
            expect(pWithZ_obj.x()).toBe(21);
            expect(pWithZ_obj.y()).toBe(4);
            expect(pWithZ_obj.z()).toBe(8);
            expect(pWithZ_obj.projection()).toBeNull();
        });

        it("works when one argument <Object{x,y,z,projection}> passed", function(){
            expect(p_obj.x()).toBe(21);
            expect(p_obj.y()).toBe(4);
            expect(p_obj.z()).toBe(8);
            expect(p_obj.projection()).not.toBeNull();
            expect(p_obj.projection()).toEqual(jasmine.any(ol.Projection));
        });
    });

    describe("the centroid method is functional", function(){
        it("returns an instance of ol.geom.Point", function(){
            expect(pNoZ_arr.centroid()).toBeA(ol.geom.Point);
            expect(pWithZ_arr.centroid()).toBeA(ol.geom.Point);
            expect(p_arr.centroid()).toBeA(ol.geom.Point);

            expect(pNoZ_obj.centroid()).toBeA(ol.geom.Point);
            expect(pWithZ_obj.centroid()).toBeA(ol.geom.Point);
            expect(p_obj.centroid()).toBeA(ol.geom.Point);
        });

        it("does return a clone and not the point itself", function(){
            expect(pNoZ_arr.centroid()).not.toBe(pNoZ_arr);
            expect(pWithZ_arr.centroid()).not.toBe(pWithZ_arr);
            expect(p_arr.centroid()).not.toBe(p_arr);

            expect(pNoZ_obj.centroid()).not.toBe(pNoZ_obj);
            expect(pWithZ_obj.centroid()).not.toBe(pWithZ_obj);
            expect(p_obj.centroid()).not.toBe(p_obj);
        });

        it("has the expected coordinates", function(){
            var c1 = pNoZ_arr.centroid(),
                c2 = pWithZ_arr.centroid(),
                c3 = p_arr.centroid(),
                c4 = pNoZ_obj.centroid(),
                c5 = pWithZ_obj.centroid(),
                c6 = p_obj.centroid();

            expect(c1.x() + ',' + c1.y()).toBe('21,4');
            expect(c2.x() + ',' + c2.y()).toBe('21,4');
            expect(c3.x() + ',' + c3.y()).toBe('21,4');
            expect(c4.x() + ',' + c4.y()).toBe('21,4');
            expect(c5.x() + ',' + c5.y()).toBe('21,4');
            expect(c6.x() + ',' + c6.y()).toBe('21,4');
        });

        it("returns point(0,0) when the point was constructed without args", function(){
            var c = pNoArgs.centroid();
            expect(c.x() + ',' + c.y()).toBe('0,0');
        });
    });
});
