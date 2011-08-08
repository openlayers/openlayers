var map = new OpenLayers.Map({
    div: "map",
    layers: [
        new OpenLayers.Layer.WMS(
            "Global Imagery",
            "http://maps.opengeo.org/geowebcache/service/wms",
            {layers: "bluemarble"},
            {tileOrigin: new OpenLayers.LonLat(-180, -90)}
        ),
        new OpenLayers.Layer.Vector()
    ],
    center: new OpenLayers.LonLat(0, 0),
    zoom: 1
});

var draw = new OpenLayers.Control.DrawFeature(
    map.layers[1], OpenLayers.Handler.Path
);
map.addControl(draw);
draw.activate();

OpenLayers.Event.observe(document, "keydown", function(evt) {
    var handled = false;
    switch (evt.keyCode) {
        case 90: // z
            if (evt.metaKey || evt.ctrlKey) {
                draw.undo();
                handled = true;
            }
            break;
        case 89: // y
            if (evt.metaKey || evt.ctrlKey) {
                draw.redo();
                handled = true;
            }
            break;
        case 27: // esc
            draw.cancel();
            handled = true;
            break;
    }
    if (handled) {
        OpenLayers.Event.stop(evt);
    }
});