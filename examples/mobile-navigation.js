var map, layer;
function init() {
    map = new OpenLayers.Map('map', { controls: [
        new OpenLayers.Control.TouchNavigation({
            dragPanOptions: {
                interval: 0, // non-zero kills performance on some mobile phones
                enableKinetic: true
            }
        }),
        new OpenLayers.Control.ZoomPanel()
    ] });
    layer = new OpenLayers.Layer.WMS( "OpenLayers WMS",
            "http://vmap0.tiles.osgeo.org/wms/vmap0",
            {layers: 'basic'} );
    map.addLayer(layer);
    map.setCenter(new OpenLayers.LonLat(5, 40), 2);
}
