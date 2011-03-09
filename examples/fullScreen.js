var map;
function init(){
    map = new OpenLayers.Map('map');

    var ol_wms = new OpenLayers.Layer.WMS( "OpenLayers WMS",
        "http://vmap0.tiles.osgeo.org/wms/vmap0",
        {layers: 'basic'} );
        var ol_wms_nobuffer = new OpenLayers.Layer.WMS( "OpenLayers WMS (no tile buffer)",
        "http://vmap0.tiles.osgeo.org/wms/vmap0",
        {layers: 'basic'}, {buffer: 0});

    map.addLayers([ol_wms, ol_wms_nobuffer]);
    map.addControl(new OpenLayers.Control.LayerSwitcher());
    map.setCenter(new OpenLayers.LonLat(0, 0), 6);
}
