describe("ol.feature", function() {
    
    it("should be easy to make a feature", function() {
        var feat = ol.feature();
        
        expect(feat).toBeA(ol.Feature);
    });

    it("should be easy to set feature attribute", function() {

        var feat = ol.feature();
        feat.set('foo', 'bar');
        
        expect(feat).toBeA(ol.Feature);
        expect(feat.get('foo')).toBe('bar');
    });

    it("calling set with one argument", function() {

        var feat = ol.feature();
        feat.set('foo');
        
        expect(feat.get('foo')).toBe(undefined);
    });

    it("should be easy to set feature geometry", function() {

        var feat = ol.feature();
        var point = ol.geom.point([21, 4]);
        feat.geometry(point);
        
        var geom = feat.geometry();
        expect(feat).toBeA(ol.Feature);
        expect(geom.getX()).toBe(21);
        expect(geom.getY()).toBe(4);
    });

    it("should be easy to create a feature from object literals", function() {

        var feat = ol.feature({
            properties: {
                foo: 'bar',
                two: 'deux',
                size: 3,
                flag: true
            },
            geometry: ol.geom.point([56, 22])
        });
        
        var geom = feat.geometry();
        expect(feat).toBeA(ol.Feature);
        expect(geom.getX()).toBe(56);
        expect(geom.getY()).toBe(22);
        expect(feat.get('foo')).toBe('bar');
        expect(feat.get('two')).toBe('deux');
        expect(feat.get('size')).toBe(3);
        expect(feat.get('flag')).toBe(true);
    });

    /*
    it("should be easy to create a feature from GeoJSON", function() {

        var geoJson = {
            type: "Feature",
            geometry: {type: "Point", coordinates: [102.0, 0.5]},
            properties: {prop0: "value0"}
        };
        var feat = ol.feature(geoJson);
        
        var geom = feat.geometry();
        expect(feat).toBeA(ol.Feature);
        expect(geom.getX()).toBe(102.0);
        expect(geom.getY()).toBe(0.5);
        expect(feat.get('prop0')).toBe('value0');
    });
    */

});

