// allow testing of specific renderers via "?renderer=Canvas", etc
var renderer = OpenLayers.Util.getParameters(window.location.href).renderer;
renderer = (renderer) ? [renderer] : OpenLayers.Layer.Vector.prototype.renderers;

var map = new OpenLayers.Map({
    div: "map",
    layers: [
        new OpenLayers.Layer.OSM(),
        new OpenLayers.Layer.Vector("Vector Layer", {
            renderers: renderer
        })
    ],
    center: new OpenLayers.LonLat(0, 0),
    zoom: 1
});

var draw = new OpenLayers.Control.DrawFeature(
    map.layers[1],
    OpenLayers.Handler.Polygon,
    {handlerOptions: {holeModifier: "altKey"}}
);
map.addControl(draw);

// optionally listen for sketch events on the layer
var output = document.getElementById("output");
function updateOutput(event) {
    window.setTimeout(function() {
        output.innerHTML = event.type + " " + event.feature.id;
    }, 100);
}
map.layers[1].events.on({
    sketchmodified: updateOutput,
    sketchcomplete: updateOutput
})

// add behavior to UI elements
function toggleControl(element) {
    if (element.value === "polygon" && element.checked) {
        draw.activate();
    } else {
        draw.deactivate();
    }
}
document.getElementById("noneToggle").checked = true;
