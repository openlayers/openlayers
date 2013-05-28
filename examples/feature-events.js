var layerListeners = {
    featureclick: function(e) {
        log(e.object.name + " says: " + e.feature.id + " clicked.");
        return false;
    },
    nofeatureclick: function(e) {
        log(e.object.name + " says: No feature clicked.");
    }
};

var style = new OpenLayers.StyleMap({
    'default': OpenLayers.Util.applyDefaults(
        {label: "${l}", pointRadius: 10},
        OpenLayers.Feature.Vector.style["default"]
    ),
    'select': OpenLayers.Util.applyDefaults(
        {pointRadius: 10},
        OpenLayers.Feature.Vector.style.select
    )
});
var layer1 = new OpenLayers.Layer.Vector("Layer 1", {
    styleMap: style,
    eventListeners: layerListeners
});
layer1.addFeatures([
    new OpenLayers.Feature.Vector(OpenLayers.Geometry.fromWKT("POINT(-1 -1)"), {l:1}),
    new OpenLayers.Feature.Vector(OpenLayers.Geometry.fromWKT("POINT(1 1)"), {l:1})
]);
var layer2 = new OpenLayers.Layer.Vector("Layer 2", {
    styleMap: style,
    eventListeners: layerListeners
});
layer2.addFeatures([
    new OpenLayers.Feature.Vector(OpenLayers.Geometry.fromWKT("POINT(-1 1)"), {l:2}),
    new OpenLayers.Feature.Vector(OpenLayers.Geometry.fromWKT("POINT(1 -1)"), {l:2})
]);

var map = new OpenLayers.Map({
    div: "map",
    allOverlays: true,
    layers: [layer1, layer2],
    zoom: 6,
    center: [0, 0],
    eventListeners: {
        featureover: function(e) {
            e.feature.renderIntent = "select";
            e.feature.layer.drawFeature(e.feature);
            log("Map says: Pointer entered " + e.feature.id + " on " + e.feature.layer.name);
        },
        featureout: function(e) {
            e.feature.renderIntent = "default";
            e.feature.layer.drawFeature(e.feature);
            log("Map says: Pointer left " + e.feature.id + " on " + e.feature.layer.name);
        },
        featureclick: function(e) {
            log("Map says: " + e.feature.id + " clicked on " + e.feature.layer.name);
        }
    }
});

function log(msg) {
    if (!log.timer) {
        result.innerHTML = "";
        log.timer = window.setTimeout(function() {delete log.timer;}, 100);
    }
    result.innerHTML += msg + "<br>";
}
