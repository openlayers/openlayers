describe("ol.Events", function() {

    it("constructs instances", function() {
        var events, element = document.createElement("div");
        events = new ol.event.Events("foo");
        expect(events.getObject()).toBe("foo");
        expect(events.getElement()).toBe(null);
        events.destroy();
        events = new ol.event.Events("foo", element, true);
        expect(events.getElement()).toBe(element);
        expect(events.includeXY_).toBe(true);
        events.destroy();
    });
    
    it("destroys properly", function() {
        var events = new ol.event.Events("foo");
        events.destroy();
        expect(events.getObject()).toBe(undefined);
    });
    
    it("respects event priority", function() {
        var log = [], events = new ol.event.Events("foo");
        events.register("bar", function() {log.push("normal");});
        events.register(
            "bar", function() {log.push("priority");}, undefined, true);
        events.triggerEvent("bar");
        expect(log[0]).toBe("priority");
        expect(log[1]).toBe("normal");
    });
    
});
