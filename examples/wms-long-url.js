// a long text that we set as dummy param (makeTheUrlLong) to make the url long
var longText = new Array(205).join("1234567890");

var map = new OpenLayers.Map( 'map' );
var base = new OpenLayers.Layer.WMS( "OpenLayers WMS",
    "http://vmap0.tiles.osgeo.org/wms/vmap0",
    {layers: 'basic', makeTheUrlLong: longText},
    {tileOptions: {maxGetUrlLength: 2048}, transitionEffect: 'resize'}
);
var overlay = new OpenLayers.Layer.WMS("Overlay",
    "http://suite.opengeo.org/geoserver/wms",
    {layers: "usa:states", transparent: true, makeTheUrlLong: longText},
    {ratio: 1, singleTile: true, tileOptions: {maxGetUrlLength: 2048}, transitionEffect: 'resize'}
);
map.addLayers([base, overlay]);
map.zoomToMaxExtent();

// add behavior to dom elements
document.getElementById("longurl").onclick = function() {
    base.mergeNewParams({makeTheUrlLong: longText});
    overlay.mergeNewParams({makeTheUrlLong: longText});
};
document.getElementById("shorturl").onclick = function() {
    base.mergeNewParams({makeTheUrlLong: null});
    overlay.mergeNewParams({makeTheUrlLong: null});
};
