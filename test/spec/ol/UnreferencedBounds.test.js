describe("ol.UnreferencedBounds", function() {

    describe("creating a bounds", function() {
        it("creates a bounds instance", function() {
            var bounds = new ol.UnreferencedBounds(1, 2, 3, 4);
            expect(bounds).toBeA(ol.UnreferencedBounds);
        });
    });
    describe("getting properties", function() {
        var bounds = new ol.UnreferencedBounds(10, 20, 30, 50);

        it("allows getting width", function() {
            expect(bounds.getWidth()).toBe(20);
        });

        it("allows getting height", function() {
            expect(bounds.getHeight()).toBe(30);
        });
    });

    describe("intersection", function() {

        var aBounds = new ol.UnreferencedBounds(-180, -90, 180, 90);

        it("works when within", function() {
            var bBounds = new ol.UnreferencedBounds(-20, -10, 20, 10);
            expect(aBounds.intersects(bBounds)).toBe(true);
            expect(bBounds.intersects(aBounds)).toBe(true);
        });

        it("works when contains", function() {
            var bBounds = new ol.UnreferencedBounds(-181, -91, 181, 91);
            expect(aBounds.intersects(bBounds)).toBe(true);
            expect(bBounds.intersects(aBounds)).toBe(true);
        });

        it("works when total intersect", function() {
            var bBounds = new ol.UnreferencedBounds(-185, -100, 20, 50);
            expect(aBounds.intersects(bBounds)).toBe(true);
            expect(bBounds.intersects(aBounds)).toBe(true);
        });

        it("works when borders intersect", function() {
            var bBounds = new ol.UnreferencedBounds(-360, -180, -180, -90);
            expect(aBounds.intersects(bBounds)).toBe(true);
            expect(bBounds.intersects(aBounds)).toBe(true);
        });

        it("works when no intersect", function() {
            var bBounds = new ol.UnreferencedBounds(-360, -180, -185, -95);
            expect(aBounds.intersects(bBounds)).toBe(false);
            expect(bBounds.intersects(aBounds)).toBe(false);
        });

    });

});
