// user custom graphicname
OpenLayers.Renderer.symbol.lightning = [0, 0, 4, 2, 6, 0, 10, 5, 6, 3, 4, 5, 0, 0];
OpenLayers.Renderer.symbol.rectangle = [0, 0, 4, 0, 4, 10, 0, 10, 0, 0];
OpenLayers.Renderer.symbol.church = [4, 0, 6, 0, 6, 4, 10, 4, 10, 6, 6, 6, 6, 14, 4, 14, 4, 6, 0, 6, 0, 4, 4, 4, 4, 0];
var map;

function init(){
    // allow testing of specific renderers via "?renderer=Canvas", etc
    var renderer = OpenLayers.Util.getParameters(window.location.href).renderer;
    renderer = (renderer) ? [renderer] : OpenLayers.Layer.Vector.prototype.renderers;

    map = new OpenLayers.Map('map', {
        controls: []
    });
    
    // list of well-known graphic names
    var graphics = ["star", "cross", "x", "square", "triangle", "circle", "lightning", "rectangle", "church"];
    
    // Create one feature for each well known graphic.
    // Give features a type attribute with the graphic name.
    var num = graphics.length;
    var slot = map.maxExtent.getWidth() / num;
    var features = Array(num);
    for (var i = 0; i < graphics.length; ++i) {
        lon = map.maxExtent.left + (i * slot) + (slot / 2);
        features[i] = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(map.maxExtent.left + (i * slot) + (slot / 2), 0), {
            type: graphics[i]
        });
    }
    
    // Create a style map for painting the features.
    // The graphicName property of the symbolizer is evaluated using
    // the type attribute on each feature (set above).
    var styles = new OpenLayers.StyleMap({
        "default": {
            graphicName: "${type}",
            pointRadius: 10,
            strokeColor: "fuchsia",
            strokeWidth: 2,
            fillColor: "lime",
            fillOpacity: 0.6
        },
        "select": {
            pointRadius: 20,
            fillOpacity: 1,
            rotation: 45
        }
    });
    
    // Create a vector layer and give it your style map.
    var layer = new OpenLayers.Layer.Vector("Graphics", {
        styleMap: styles,
        isBaseLayer: true,
        renderers: renderer
    });
    layer.addFeatures(features);
    map.addLayer(layer);
    
    // Create a select feature control and add it to the map.
    var select = new OpenLayers.Control.SelectFeature(layer, {
        hover: true
    });
    map.addControl(select);
    select.activate();
    
    map.zoomToMaxExtent();
}
