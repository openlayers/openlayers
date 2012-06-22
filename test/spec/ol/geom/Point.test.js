describe("ol.geom.Point", function() {
    var p2Args,
        p3Args,
        p4Args,
        proj = "EPSG:4326";

    var instances = {
        "two arguments <x>,<y> passed": new ol.geom.Point(21, 4),
        "three arguments <x>,<y>,<z> passed": new ol.geom.Point(21, 4, 8),
        "four arguments <x>,<y>,<z>,<projection> passed": new ol.geom.Point(21, 4, 8, proj)
    };

    beforeEach(function() {
        proj = ol.projection("EPSG:4326");
        instances = {
            "two arguments <x>,<y> passed": new ol.geom.Point(21, 4),
            "three arguments <x>,<y>,<z> passed": new ol.geom.Point(21, 4, 8),
            "four arguments <x>,<y>,<z>,<projection> passed": new ol.geom.Point(21, 4, 8, proj)
        };
        p2Args = instances['two arguments <x>,<y> passed'];
        p3Args = instances['three arguments <x>,<y>,<z> passed'];
        p4Args = instances['four arguments <x>,<y>,<z>,<projection> passed'];
    });

    afterEach(function() {
        p2Args = p3Args = p4Args = null;
        instances = {
            "two arguments <x>,<y> passed": new ol.geom.Point(21, 4),
            "three arguments <x>,<y>,<z> passed": new ol.geom.Point(21, 4, 8),
            "four arguments <x>,<y>,<z>,<projection> passed": new ol.geom.Point(21, 4, 8, proj)
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

                it("has the coordinate accessor methods", function() {
                    expect(instance.getX).not.toBeUndefined();
                    expect(instance.getY).not.toBeUndefined();
                    expect(instance.getZ).not.toBeUndefined();
                    expect(instance.setX).not.toBeUndefined();
                    expect(instance.setY).not.toBeUndefined();
                    expect(instance.setZ).not.toBeUndefined();
                });

                it("has the projection accessor methods", function() {
                    expect(instance.getProjection).not.toBeUndefined();
                    expect(instance.setProjection).not.toBeUndefined();
                });
            });
        }
    }
    describe('the getters are functional', function(){
        it("works when two arguments <x>,<y> passed", function(){

            expect(p2Args.getX()).toBe(21);
            expect(p2Args.getY()).toBe(4);
            expect(p2Args.getZ()).toBeUndefined();
            expect(p2Args.getProjection()).toBeNull();
        });

        it("works when three arguments <x>,<y>,<z> passed", function(){
            expect(p3Args.getX()).toBe(21);
            expect(p3Args.getY()).toBe(4);
            expect(p3Args.getZ()).not.toBeUndefined();
            expect(p3Args.getZ()).toBe(8);
            expect(p3Args.getProjection()).toBeNull();
        });

        it("works when four arguments <x>,<y>,<z>,<projection> passed", function(){
            expect(p4Args.getX()).toBe(21);
            expect(p4Args.getY()).toBe(4);
            expect(p4Args.getZ()).toBe(8);
            expect(p4Args.getProjection()).not.toBeNull();
            expect(p4Args.getProjection()).toBeA(ol.Projection);
        });
    });

    describe("transformation is functional", function(){
        it("can be transformed", function(){
            // save for later comparison
            var old = {
                x: p4Args.getX().toFixed(3),
                y: p4Args.getY().toFixed(3)
            };
            // with code only
            var transformedPoint = p4Args.transform("EPSG:3857");

            // is it still an instance of ol.geom.Point?
            expect(transformedPoint).toBeA(ol.geom.Point);
            // coordinates OK?
            expect(transformedPoint.getX().toFixed(3)).toBe("2337709.306");
            expect(transformedPoint.getY().toFixed(3)).toBe("445640.110");

            // with an ol.Projection
            var retransformedPoint = transformedPoint.transform(new ol.Projection("EPSG:4326"));
            expect(retransformedPoint).toBeA(ol.geom.Point);

            // coordinates shopulkd be the originally configured
            expect(retransformedPoint.getX().toFixed(3)).toBe(old.x);
            expect(retransformedPoint.getY().toFixed(3)).toBe(old.y);
        });

        it("throws an exception when you try to transform without a source projection", function(){
            expect(function() {
                p2Args.transform("EPSG:3857");
            }).toThrow();

            expect(function() {
                p3Args.transform("EPSG:3857");
            }).toThrow();
        });
    });

});
