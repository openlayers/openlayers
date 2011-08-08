var points = new OpenLayers.Layer.PointGrid({
    name: "Snap Grid",
    dx: 600, dy: 600,
    styleMap: new OpenLayers.StyleMap({
        pointRadius: 1,
        strokeColor: "#3333ff",
        strokeWidth: 1,
        fillOpacity: 1,
        fillColor: "#ffffff",
        graphicName: "square"
    })
});

var lines = new OpenLayers.Layer.Vector("Lines", {
    styleMap: new OpenLayers.StyleMap({
        pointRadius: 3,
        strokeColor: "#ff3300",
        strokeWidth: 3,
        fillOpacity: 0
    })
});

var map = new OpenLayers.Map({
    div: "map",
    layers: [new OpenLayers.Layer.OSM(), points, lines],
    controls: [
        new OpenLayers.Control.Navigation(),
        new OpenLayers.Control.LayerSwitcher(),
        new OpenLayers.Control.Attribution()
    ],
    restrictedExtent: new OpenLayers.Bounds(
        1035374, 7448940, 1074510, 7468508
    ),
    center: new OpenLayers.LonLat(1054942, 7458724),
    zoom: 13
});

// configure the snapping agent
var snap = new OpenLayers.Control.Snapping({
    layer: lines,
    targets: [{
        layer: points,
        tolerance: 15
    }]
});
snap.activate();

// add some editing tools to a panel
var panel = new OpenLayers.Control.Panel({
    displayClass: "olControlEditingToolbar"
});
var draw = new OpenLayers.Control.DrawFeature(
    lines, OpenLayers.Handler.Path,
    {displayClass: "olControlDrawFeaturePath", title: "Draw Features"}
);
modify = new OpenLayers.Control.ModifyFeature(
    lines, {displayClass: "olControlModifyFeature", title: "Modify Features"}
);
panel.addControls([
    new OpenLayers.Control.Navigation({title: "Navigate"}),
    modify, draw
]);
map.addControl(panel);

var rotation = document.getElementById("rotation");
rotation.value = String(points.rotation);
rotation.onchange = function() {
    points.setRotation(Number(rotation.value));
}

var spacing = document.getElementById("spacing");
spacing.value = String(points.dx);
spacing.onchange = function() {
    points.setSpacing(Number(spacing.value));
}

var max = document.getElementById("max");
max.value = String(points.maxFeatures);
max.onchange = function() {
    points.setMaxFeatures(Number(max.value));
}
