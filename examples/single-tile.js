var map = new OpenLayers.Map({
    div: "mapDiv",
    layers: [
        new OpenLayers.Layer.WMS(
            "Single Tile", 
            "http://vmap0.tiles.osgeo.org/wms/vmap0",
            {layers: "basic"}, 
            {singleTile: true, ratio: 1}
        ), 
        new OpenLayers.Layer.WMS(
            "Multiple Tiles", 
            "http://vmap0.tiles.osgeo.org/wms/vmap0",
            {layers: "basic"}
        )
    ],
    center: new OpenLayers.LonLat(6.5, 40.5),
    zoom: 4
});

map.addControl(new OpenLayers.Control.LayerSwitcher());
