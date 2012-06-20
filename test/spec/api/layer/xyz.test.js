describe('ol.layer.xyz', function() {

    it("doesn't allow empty construction", function() {

        expect(function() {
            // nowhere
            var layer = ol.layer.xyz();
        }).toThrow();

    });

    it("creates an ol.layer.XYZ instance", function() {
        var layer = ol.layer.xyz({url: 'http://foo/{x}/{y}/{z}'});
        expect(layer).toBeA(ol.layer.XYZ);
    });

});
