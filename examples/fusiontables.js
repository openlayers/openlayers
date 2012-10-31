// change this to your api key
var apikey = "AIzaSyD_1zzMAoZjuP-m4LyhieuYmqiVJTEajyI";

var map = new OpenLayers.Map({
    div: "map",
    layers: [
        new OpenLayers.Layer.OSM(),
        new OpenLayers.Layer.Vector("Vectors", {
            projection: new OpenLayers.Projection("EPSG:4326"),
            strategies: [new OpenLayers.Strategy.Fixed()],
            protocol: new OpenLayers.Protocol.Script({
                url: "https://www.googleapis.com/fusiontables/v1/query",
                params: {
                    sql: "select * from 1g5DrXcdotCiO_yffkdW0zhuJk0a1i80SPvERHI8",
                    key: apikey
                },
                format: new OpenLayers.Format.GeoJSON({
                    ignoreExtraDims: true,
                    read: function(json) {
                        var row, feature, atts = {}, features = [];
                        var cols = json.columns; // column names
                        for (var i = 0; i < json.rows.length; i++) {
                            row = json.rows[i];
                            feature = new OpenLayers.Feature.Vector();
                            atts = {};
                            for (var j = 0; j < row.length; j++) {
                                // 'location's are json objects, other types are strings
                                if (typeof row[j] === "object") {
                                    feature.geometry = this.parseGeometry(row[j].geometry);
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
                })
            }),
            eventListeners: {
                "featuresadded": function () {
                    this.map.zoomToExtent(this.getDataExtent());
                }
            }
        })
    ]
});
