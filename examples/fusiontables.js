var map = new OpenLayers.Map({
    div: "map",
    layers: [
        new OpenLayers.Layer.OSM(),
        new OpenLayers.Layer.Vector("Vectors", {
            projection: new OpenLayers.Projection("EPSG:4326"),
            strategies: [new OpenLayers.Strategy.Fixed()],
            protocol: new OpenLayers.Protocol.Script({
                url: "https://www.google.com/fusiontables/api/query",
                params: {sql: "select * from 1g5DrXcdotCiO_yffkdW0zhuJk0a1i80SPvERHI8"},
                format: new OpenLayers.Format.GeoJSON({
                    ignoreExtraDims: true,
                    read: function(json) {
                        var row, feature, atts = {}, features = [];
                        var cols = json.table.cols; // column names
                        for (var i = 0; i < json.table.rows.length; i++) {
                            row = json.table.rows[i];
                            feature = new OpenLayers.Feature.Vector();
                            atts = {};
                            for (var j = 0; j < row.length; j++) {
                                // 'location's are json objects, other types are strings
                                if (typeof row[j] === "object") {
                                    feature.geometry = this.parseGeometry(row[j]);
                                } else {
                                    atts[cols[j]] = row[j];
                                }
                            }
                            feature.attributes = atts;
                            // if no geometry, not much point in continuing with this row
                            if (feature.geometry) {
                                features.push(feature);
                            }
                        }
                        return features;
                    }
                }),
                callbackKey: "jsonCallback"
            }),
            eventListeners: {
                "featuresadded": function () {
                    this.map.zoomToExtent(this.getDataExtent());
                }
            }
        })
    ]
});
