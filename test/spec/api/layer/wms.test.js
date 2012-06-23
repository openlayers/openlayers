describe('ol.layer.wms', function() {
    
    describe('create a wms layer', function() {

        it('creates an ol.layer.WMS instance', function() {
            var wms = ol.layer.wms({
                url: 'http://wms',
                layers: ['layer1', 'layer2'],
                format: 'image/png'
            });
            expect(wms).toBeA(ol.layer.WMS);
        });
    });
});
