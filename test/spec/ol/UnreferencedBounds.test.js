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

});
