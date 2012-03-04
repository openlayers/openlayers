var map = new OpenLayers.Map({
    div: "map",
    layers: [
        new OpenLayers.Layer.OSM(),
        new OpenLayers.Layer.Vector("Vectors", {
            projection: new OpenLayers.Projection("EPSG:4326"),
            strategies: [new OpenLayers.Strategy.Fixed()],
            protocol: new OpenLayers.Protocol.Script({
                url: "http://query.yahooapis.com/v1/public/yql",
                params: {
                    q: "select * from xml where url='http://www.topografix.com/fells_loop.gpx'"
                },
                format: new OpenLayers.Format.GPX(),
                parseFeatures: function(data) {
                    return this.format.read(data.results[0]);
                }
            }),
            eventListeners: {
                "featuresadded": function () {
                    this.map.zoomToExtent(this.getDataExtent());
                }
            }
        })
    ]
});
