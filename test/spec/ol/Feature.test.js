describe("ol.Feature", function() {
    
    it("should be easy to make a feature", function() {
        var feat = new ol.Feature();
        
        expect(feat).toBeA(ol.Feature);
    });

    it("should be easy to set feature attribute", function() {

        var feat = new ol.Feature();
        feat.setAttribute('foo', 'bar');
        
        expect(feat).toBeA(ol.Feature);
        expect(feat.getAttribute('foo')).toBe('bar');
    });

    it("calling set with one argument", function() {

        var feat = new ol.Feature();
        feat.setAttribute('foo');
        
        expect(feat.getAttribute('foo')).toBe(undefined);
    });

    it("should be easy to set feature geometry", function() {

        var feat = new ol.Feature();
        var point = ol.geom.point([21, 4]);
        feat.setGeometry(point);
        
        var geom = feat.getGeometry();
        expect(feat).toBeA(ol.Feature);
        expect(geom).toBeA(ol.geom.Geometry);
        expect(geom.getX()).toBe(21);
        expect(geom.getY()).toBe(4);
    });

    it("should be able to set attributes from object literals", function() {

        var feat = new ol.Feature();
        feat.setAttributes({
                foo: 'bar',
                two: 'deux',
                size: 3,
                flag: true
        });
        
        expect(feat).toBeA(ol.Feature);
        expect(feat.getAttribute('foo')).toBe('bar');
        expect(feat.getAttribute('two')).toBe('deux');
        expect(feat.getAttribute('size')).toBe(3);
        expect(feat.getAttribute('flag')).toBe(true);
    });

    it("should be able to set attributes keeping existing ones", function() {

        var feat = new ol.Feature();
        feat.setAttributes({
                foo: 'bar',
                size: 3
        });
        
        expect(feat).toBeA(ol.Feature);
        expect(feat.getAttribute('size')).toBe(3);
        
        feat.setAttributes({
                two: 'deux',
                size: -99
        });
        
        expect(feat.getAttribute('two')).toBe('deux');
        expect(feat.getAttribute('foo')).toBe('bar');
        expect(feat.getAttribute('size')).toBe(-99);
        
    });

});

