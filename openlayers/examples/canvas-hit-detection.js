
// create some sample features
var Feature = OpenLayers.Feature.Vector;
var Geometry = OpenLayers.Geometry;
var features = [
    new Feature(new Geometry.Point(-90, 45)),
    new Feature(
        new Geometry.Point(0, 45),
        {cls: "one"}
    ),
    new Feature(
        new Geometry.Point(90, 45),
        {cls: "two"}
    ),
    new Feature(
        Geometry.fromWKT("LINESTRING(-110 -60, -80 -40, -50 -60, -20 -40)")
    ),
    new Feature(
        Geometry.fromWKT("POLYGON((20 -20, 110 -20, 110 -80, 20 -80, 20 -20), (40 -40, 90 -40, 90 -60, 40 -60, 40 -40))")
    )    
];

// create rule based styles
var Rule = OpenLayers.Rule;
var Filter = OpenLayers.Filter;
var style = new OpenLayers.Style({
    pointRadius: 10,
    strokeWidth: 3,
    strokeOpacity: 0.7,
    strokeColor: "navy",
    fillColor: "#ffcc66",
    fillOpacity: 1
}, {
    rules: [
        new Rule({
            filter: new Filter.Comparison({
                type: "==",
                property: "cls",
                value: "one"
            }),
            symbolizer: {
                externalGraphic: "../img/marker-blue.png"
            }
        }),
        new Rule({
            filter: new Filter.Comparison({
                type: "==",
                property: "cls",
                value: "two"
            }),
            symbolizer: {
                externalGraphic: "../img/marker-green.png"
            }
        }),
        new Rule({
            elseFilter: true,
            symbolizer: {
                graphicName: "circle"
            }
        })
    ]
});

var layer = new OpenLayers.Layer.Vector(null, {
    styleMap: new OpenLayers.StyleMap({
        "default": style,
        select: {
            fillColor: "red",
            pointRadius: 13,
            strokeColor: "yellow",
            strokeWidth: 3
        }
    }),
    isBaseLayer: true,
    renderers: ["Canvas"]
});
layer.addFeatures(features);

var map = new OpenLayers.Map({
    div: "map",
    layers: [layer],
    center: new OpenLayers.LonLat(0, 0),
    zoom: 0
});

var select = new OpenLayers.Control.SelectFeature(layer);
map.addControl(select);
select.activate();
