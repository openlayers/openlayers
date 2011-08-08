// Create 50 random features, and give them a "type" attribute that
// will be used for the label text.
var features = new Array(50);
for (var i=0; i<features.length; i++) {
    features[i] = new OpenLayers.Feature.Vector(
        new OpenLayers.Geometry.Point(
            (360 * Math.random()) - 180, (180 * Math.random()) - 90
        ), {
            type: 5 + parseInt(5 * Math.random())
        }
    );
}

/**
 * Create a style instance that is a collection of rules with symbolizers.
 * Use a default symbolizer to extend symoblizers for all rules.
 */
var style = new OpenLayers.Style({
    fillColor: "#ffcc66",
    strokeColor: "#ff9933",
    strokeWidth: 2,
    label: "${type}",
    fontColor: "#333333",
    fontFamily: "sans-serif",
    fontWeight: "bold"
}, {
    rules: [
        new OpenLayers.Rule({
            minScaleDenominator: 200000000,
            symbolizer: {
                pointRadius: 7,
                fontSize: "9px"
            }
        }),
        new OpenLayers.Rule({
            maxScaleDenominator: 200000000,
            minScaleDenominator: 100000000,
            symbolizer: {
                pointRadius: 10,
                fontSize: "12px"
            }
        }),
        new OpenLayers.Rule({
            maxScaleDenominator: 100000000,
            symbolizer: {
                pointRadius: 13,
                fontSize: "15px"
            }
        })
    ]
});

// Create a vector layer and give it your style map.
var points = new OpenLayers.Layer.Vector("Points", {
    styleMap: new OpenLayers.StyleMap(style)
});
points.addFeatures(features);

var map = new OpenLayers.Map({
    div: "map",
    layers: [
        new OpenLayers.Layer.WMS(
            "OpenLayers WMS",
            "http://vmap0.tiles.osgeo.org/wms/vmap0",
            {layers: "basic"}
        ),
        points
    ],
    center: new OpenLayers.LonLat(0, 0),
    zoom: 1
});

