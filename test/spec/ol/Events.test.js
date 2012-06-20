describe("ol.Events", function() {
    
    var count = 0, log = [],
        countFn = function() {count++;},
        logFn = function(e) {log.push({scope: this, evt: e});};

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
    
    it("relays browser events and knows about pointer position", function() {
        var element = document.createElement("div"),
            events = new ol.event.Events("foo", element);
        
        //TODO Figure out a good way to deal with fixtures
        element.style.position = "absolute";
        element.style.left = "5px";
        element.style.top = "10px";
        document.body.appendChild(element);
        // mock dom element so we can trigger events on it
        goog.object.extend(element, new goog.events.EventTarget());
        
        log = [];
        events.register("click", logFn);
        element.dispatchEvent("click");
        expect(log.length).toBe(1);
        
        // detach from the element
        events.setElement();
        element.dispatchEvent("click");
        expect(log.length).toBe(1);
        
        // attach to the element again
        events.setElement(element);
        events.setIncludeXY(true);
        element.dispatchEvent({
            type: "click",
            touches: [{clientX: 9, clientY: 22}, {clientX: 11, clientY: 18}]
        });
        expect(log.length).toBe(2);
        expect(log[1].evt.xy.x).toBe(5);
        expect(log[1].evt.xy.y).toBe(10);
        expect(log[1].evt.clientX).toBe(10);
        expect(log[1].evt.clientY).toBe(20);
        
        events.destroy();
        document.body.removeChild(element);
    });
    
    it("calls listeners with a scope and an event object", function() {
        var scope = {}, evt = {}, events = new ol.event.Events("foo");
        
        log = [];
        events.register("bar", logFn, scope);
        events.triggerEvent("bar", evt);
        expect(log[0].scope).toBe(scope);
        expect(log[0].evt).toBe(evt);
    });
    
    it("respects event priority", function() {
        var log = [], events = new ol.event.Events("foo");
        
        // register a normal listener
        events.register("bar", function() {log.push("normal");});
        // register a priority listener
        events.register(
            "bar", function() {log.push("priority");}, undefined, true);        
        events.triggerEvent("bar");        
        expect(log[0]).toBe("priority");
        expect(log[1]).toBe("normal");
        
        events.destroy();
    });
    
    it("allows to abort the event chain", function() {
        var events = new ol.event.Events("foo");
        
        count = 0;
        // register a listener that aborts the event chain
        events.register("bar", function() {count++; return false;});        
        // register a listener that just does something
        events.register("bar", countFn);        
        events.triggerEvent("bar");
        expect(count).toBe(1);
        
        count = 0;
        // register a priority listener that just does something
        events.register("bar", countFn, undefined, true);
        events.triggerEvent("bar");
        expect(count).toBe(2);
        
        events.destroy();
    });
    
    it("allows to unregister events", function() {
        var events = new ol.event.Events("foo");
        
        count = 0;
        events.register("bar", countFn);
        events.triggerEvent("bar");
        expect(count).toBe(1);
        
        events.unregister("bar", countFn);
        events.triggerEvent("bar");
        expect(count).toBe(1);
        
        events.destroy();
    });
    
    it("has working on() and un() convenience methods", function() {
        var scope = {}, events = new ol.event.Events("foo");
        
        count = 0;
        log = [];
        events.on({
            "bar": countFn,
            "baz": logFn,
            scope: scope
        });
        events.triggerEvent("bar");
        expect(count).toBe(1);
        events.triggerEvent("baz");
        expect(log[0].scope).toBe(scope);
        
        events.un({
            "bar": countFn,
            "baz": logFn,
            scope: scope
        });
        events.triggerEvent("bar");
        events.triggerEvent("baz");
        expect(count).toBe(1);
        expect(log.length).toBe(1);
        
        events.destroy();
    });
    
});
