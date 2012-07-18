describe('ol.Map', function() {
    
    describe('Calculating zoom and resolution', function() {
        
        it('converts zoom to resolution and resolution to zoom', function() {
            var map = new ol.Map();
            var res = map.getResolutionForZoom(1);
            expect(map.getZoomForResolution(res)).toBe(1);
            expect(map.getZoomForResolution(res / 2)).toBe(2);
        });
        
    });
    
});