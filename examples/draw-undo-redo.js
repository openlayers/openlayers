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
    var code = evt.keyCode;
    var handled = false;
    if (code === 90) {
        // z
        if ("metaKey" in evt) {
            if (evt.metaKey) {
                draw.undo();
                handled = true;
            }
        } else if (evt.ctrlKey) {
            draw.undo();
            handled = true;
        }
    }
    if (code === 89) {
        // y
        if ("metaKey" in evt) {
            if (evt.metaKey) {
                draw.redo();
                handled = true;
            }
        } else if (evt.ctrlKey) {
            draw.redo();
            handled = true;
        }
    }
    if (handled) {
        OpenLayers.Event.stop(evt);
    }
    if (code === 27) {
        // esc
        draw.cancel();
    }
});