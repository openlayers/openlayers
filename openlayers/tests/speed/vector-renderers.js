var map, vectorLayer, drawFeature, features

map = new OpenLayers.Map('map', {
    eventListeners: {
        movestart: function() {
            console.time("move");
        },
        moveend: function() {
            console.timeEnd("move");
        }
    }
});

// allow testing of specific renderers via "?renderer=Canvas", etc
var renderer = OpenLayers.Util.getParameters(window.location.href).renderer;
renderer = (renderer) ? [renderer] : OpenLayers.Layer.Vector.prototype.renderers;

vectorLayer = new OpenLayers.Layer.Vector("Vector Layer", {
    isBaseLayer: true,
    renderers: renderer,
    eventListeners: {
        beforefeaturesadded: function() {
            console.time("addFeatures");
        },
        featuresadded: function() {
            console.timeEnd("addFeatures");
        }
    }
});

map.addLayers([vectorLayer]);
map.addControl(new OpenLayers.Control.MousePosition());
map.setCenter(new OpenLayers.LonLat(0, 0), 2);

features = new Array(500);
var x, y, points
for (var i = 0; i < 500; i++) {
    x = 90-Math.random()*180;
    y = 45-Math.random()*90;
    var pointList = [];
    for(var p=0; p<19; ++p) {
        var a = p * (2 * Math.PI) / 20;
        var r = Math.random() * 3 + 1;
        var newPoint = new OpenLayers.Geometry.Point(x + (r * Math.cos(a)),
                                                     y + (r * Math.sin(a)));
        pointList.push(newPoint);
    }
    pointList.push(pointList[0]);
    features[i] = new OpenLayers.Feature.Vector(
        new OpenLayers.Geometry.LinearRing(pointList));
        
}
vectorLayer.addFeatures(features);

var select = document.getElementById("renderers");
var renderers = OpenLayers.Layer.Vector.prototype.renderers;
var option;
for (var i=0, len=renderers.length; i<len; i++) {
    if (OpenLayers.Renderer[renderers[i]].prototype.supported()) {
        option = document.createElement("option");
        option.textContent = renderers[i];
        option.value = renderers[i];
        option.selected = renderers[i] == vectorLayer.renderer.CLASS_NAME.split(".").pop();
        select.appendChild(option);
    }
}
select.onchange = function() {
    window.location.href = window.location.href.split("?")[0] +
        "?renderer=" + select.options[select.selectedIndex].value;
}
