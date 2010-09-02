var map;

function init() {
    map = new OpenLayers.Map("map");

    var wms = new OpenLayers.Layer.WMS(
        "OpenLayers WMS",
        "http://vmap0.tiles.osgeo.org/wms/vmap0",
        {layers: "basic"}
    );
    
    /**
     * Create 50 vector features.  Your features would typically be fetched
     * from the server.  These are created here to demonstrate a rule based
     * style.  The features are given an attribute named "foo".  The value
     * of this attribute is an integer that ranges from 0 to 100.
     */   
    var features = new Array(25);
    for (var i=0; i<features.length; i++) {
        features[i] = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.Point(
                (340 * Math.random()) - 170,
                (160 * Math.random()) - 80
            ), {
                foo: 100 * Math.random() | 0
            }
        );
    }
    
    /**
     * Here we create a new style object with rules that determine
     * which symbolizer will be used to render each feature.
     */
    var style = new OpenLayers.Style(
        // the first argument is a base symbolizer
        // all other symbolizers in rules will extend this one
        {
            graphicWidth: 21,
            graphicHeight: 25,
            graphicYOffset: -28, // shift graphic up 28 pixels
            label: "${foo}" // label will be foo attribute value
        },
        // the second argument will include all rules
        {
            rules: [
                new OpenLayers.Rule({
                    // a rule contains an optional filter
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.LESS_THAN,
                        property: "foo", // the "foo" feature attribute
                        value: 25
                    }),
                    // if a feature matches the above filter, use this symbolizer
                    symbolizer: {
                        externalGraphic: "../img/marker-blue.png"
                    }
                }),
                new OpenLayers.Rule({
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.BETWEEN,
                        property: "foo",
                        lowerBoundary: 25,
                        upperBoundary: 50
                    }),
                    symbolizer: {
                        externalGraphic: "../img/marker-green.png"
                    }
                }),
                new OpenLayers.Rule({
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.BETWEEN,
                        property: "foo",
                        lowerBoundary: 50,
                        upperBoundary: 75
                    }),
                    symbolizer: {
                        externalGraphic: "../img/marker-gold.png"
                    }
                }),
                new OpenLayers.Rule({
                    // apply this rule if no others apply
                    elseFilter: true,
                    symbolizer: {
                        externalGraphic: "../img/marker.png"
                    }
                })
            ]
        }
    );
    
    // create the layer styleMap that uses the above style for all render intents
    var vector = new OpenLayers.Layer.Vector("Points", {
        styleMap: new OpenLayers.StyleMap(style)
    });
    vector.addFeatures(features);

    map.addLayers([wms, vector]);
    map.setCenter(new OpenLayers.LonLat(0, 0), 1);
}
