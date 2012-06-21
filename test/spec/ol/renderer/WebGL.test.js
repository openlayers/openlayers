describe("ol.renderer.WebGL", function() {

    it("is supported in this environment", function() {
        // this will not always be true, but for now we expect it to be so
        expect(ol.renderer.WebGL.isSupported()).toBe(true);
    });
    
});

