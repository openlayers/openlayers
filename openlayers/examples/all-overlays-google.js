var map;

function init() {

    map = new OpenLayers.Map({
        div: "map",
        allOverlays: true
    });

    var osm = new OpenLayers.Layer.OSM();
    var gmap = new OpenLayers.Layer.Google("Google Streets", {visibility: false});

    // note that first layer must be visible
    map.addLayers([osm, gmap]);

    map.addControl(new OpenLayers.Control.LayerSwitcher());
    map.zoomToMaxExtent();

}
