describe("ol.Bounds", function() {

    describe("creating a bounds", function() {
        it("creates a bounds instance", function() {
            var bounds = new ol.Bounds(1, 2, 3, 4);
            expect(bounds).toBeA(ol.Bounds);
        });
    });

    describe("getting properties", function() {
        var bounds = new ol.Bounds(10, 20, 30, 50);

        it("allows getting width", function() {
            expect(bounds.getWidth()).toBe(20);
        });

        it("allows getting height", function() {
            expect(bounds.getHeight()).toBe(30);
        });
        
        it("allows getting null projection", function() {
            expect(bounds.getProjection()).toBeNull();
        });
        
        it("allws getting a projection", function() {
            var proj = new ol.Projection("EPSG:4326");
            var bounds = new ol.Bounds(-180, -90, 180, 90, proj);
            expect(bounds.getProjection()).toBe(proj);
        });
        
    });
    
    describe("transforming bounds", function() {
        
        var gg = new ol.Projection("EPSG:4326");
        var sm = new ol.Projection("EPSG:900913");

        var bounds = new ol.Bounds(10, -10, 20, 10, gg);
        
        // approximate bbox array
        function bbox(bounds) {
            var mult = Math.pow(10, 6); // six figs
            return [
                Math.round(bounds.getMinX() * mult) / mult,
                Math.round(bounds.getMinY() * mult) / mult,
                Math.round(bounds.getMaxX() * mult) / mult,
                Math.round(bounds.getMaxY() * mult) / mult
            ];
        }
        
        it("doesn't mind a null transform", function() {
            var trans = bounds.transform(new ol.Projection("foo")); 
            expect(bbox(bounds)).toEqual([10, -10, 20, 10]);
        });
        
        it("transforms from geographic to spherical mercator", function() {
            var trans = bounds.transform(sm);
            expect(bbox(trans)).toEqual([1113194.907778, -1118889.974702, 2226389.815556, 1118889.974702]);
        });

        it("transforms from spherical mercator to geographic", function() {
            var trans = bounds.transform(sm);
            var back = trans.transform(gg);
            expect(bbox(back)).toEqual([10, -10, 20, 10]);
        });
        
    });

});
