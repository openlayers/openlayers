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

});
