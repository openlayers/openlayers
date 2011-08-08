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

// handle clicks on method links
$("insertXY").onclick = function() {
    var values = parseInput(
        window.prompt(
            "Enter map coordinates for new point (e.g. '-111, 46')", "x, y"
        )
    );
    if (values != null) {
        draw.insertXY(values[0], values[1]);
    }
}
$("insertDeltaXY").onclick = function() {
    var values = parseInput(
        window.prompt(
            "Enter offset values for new point (e.g. '15, -10')", "dx, dy"
        )
    );
    if (values != null) {
        draw.insertDeltaXY(values[0], values[1]);
    }
}
$("insertDirectionLength").onclick = function() {
    var values = parseInput(
        window.prompt(
            "Enter direction and length offset values for new point (e.g. '-45, 10')", "direction, length"
        )
    );
    if (values != null) {
        draw.insertDirectionLength(values[0], values[1]);
    }
}
$("insertDeflectionLength").onclick = function() {
    var values = parseInput(
        window.prompt(
            "Enter deflection and length offset values for new point (e.g. '15, 20')", "deflection, length"
        )
    );
    if (values != null) {
        draw.insertDeflectionLength(values[0], values[1]);
    }
}
$("cancel").onclick = function() {
    draw.cancel();
}
$("finishSketch").onclick = function() {
    draw.finishSketch();
}

function parseInput(text) {
    var values = text.split(",");
    if (values.length !== 2) {
        values = null;
    } else {
        values[0] = parseFloat(values[0]);
        values[1] = parseFloat(values[1]);
        if (isNaN(values[0]) || isNaN(values[1])) {
            window.alert("The two values must be numeric.");
            values = null;
        }
    }
    return values;
}