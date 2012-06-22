describe('ol.layer.WMS', function() {

    describe('create a wms layer', function() {

        it('returns an ol.layer.WMS instance', function() {
            var layer = new ol.layer.WMS();
            expect(layer instanceof ol.layer.WMS).toBe(true);
        });

    });

    describe('get tile url', function() {
        var layer;
        beforeEach(function() {
            layer = new ol.layer.WMS('/wms', ['layer1', 'layer2']);
            layer.setResolutions([1, 0.5, 0.25]);
            layer.setTileOrigin(-128, 128);
            layer.setExtent(new ol.Bounds(-128, -128, 128, 128));
            layer.setProjection(new ol.Projection('EPSG:900913'));
        });
        it('returns a WMS GetMap URL', function() {
            var url = layer.getTileUrl(1, 2, 2);
            expect(url).toEqual('/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&STYLES&FORMAT=image%2Fpng&WIDTH=256&HEIGHT=256&BBOX=-64%2C-64%2C0%2C0&LAYERS=layer1%2Clayer2&SRS=EPSG%3A900913');
        });
    });

});
