describe("ol.Events", function() {

    it("constructs instances", function() {
        var events, element = document.createElement("div");
        events = new ol.event.Events("foo");
        expect(events.getObject()).toBe("foo");
        events.destroy();
        events = new ol.event.Events("foo", element, true);
        expect(events.element_).toBe(element);
        expect(events.includeXY_).toBe(true);
    });
    
});
