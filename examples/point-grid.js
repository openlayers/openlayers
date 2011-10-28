var points = new OpenLayers.Layer.PointGrid({
    isBaseLayer: true, dx: 15, dy: 15
});

var map = new OpenLayers.Map({
    div: "map",
    layers: [points],
    center: new OpenLayers.LonLat(0, 0),
    zoom: 2
});

var rotation = document.getElementById("rotation");
rotation.value = String(points.rotation);
rotation.onchange = function() {
    points.setRotation(Number(rotation.value));
};

var dx = document.getElementById("dx");
var dy = document.getElementById("dy");
dx.value = String(points.dx);
dy.value = String(points.dy);
dx.onchange = function() {
    points.setSpacing(Number(dx.value), Number(dy.value));
};
dy.onchange = function() {
    points.setSpacing(Number(dx.value), Number(dy.value));
};

var max = document.getElementById("max");
max.value = String(points.maxFeatures);
max.onchange = function() {
    points.setMaxFeatures(Number(max.value));
};
