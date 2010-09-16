// a long text that we set as dummy param (makeTheUrlLong) to make the url long
var longText = new Array(205).join("1234567890");

var map = new OpenLayers.Map( 'map' );
var layer = new OpenLayers.Layer.WMS( "OpenLayers WMS",
        "http://vmap0.tiles.osgeo.org/wms/vmap0",
        {layers: 'basic', makeTheUrlLong: longText},
        {tileOptions: {maxGetUrlLength: 2048}}
);
map.addLayer(layer);
map.zoomToMaxExtent();

// add behavior to dom elements
document.getElementById("longurl").onclick = function() {
    layer.mergeNewParams({makeTheUrlLong: longText})
}
document.getElementById("shorturl").onclick = function() {
    layer.mergeNewParams({makeTheUrlLong: null})
}
