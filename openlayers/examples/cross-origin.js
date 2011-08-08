var map = new OpenLayers.Map({
    div: "map",
    layers: [
        new OpenLayers.Layer.WMS(
            "World Map",
            "http://maps.opengeo.org/geowebcache/service/wms",
            {layers: "bluemarble"}
        ),
        new OpenLayers.Layer.Vector("States", {
            strategies: [new OpenLayers.Strategy.BBOX()],
            protocol: new OpenLayers.Protocol.Script({
                url: "http://suite.opengeo.org/geoserver/wfs",
                callbackKey: "format_options",
                callbackPrefix: "callback:",
                params: {
                    service: "WFS",
                    version: "1.1.0",
                    srsName: "EPSG:4326",
                    request: "GetFeature",
                    typeName: "world:cities",
                    outputFormat: "json"
                },
                filterToParams: function(filter, params) {
                    // example to demonstrate BBOX serialization
                    if (filter.type === OpenLayers.Filter.Spatial.BBOX) {
                        params.bbox = filter.value.toArray();
                        if (filter.projection) {
                            params.bbox.push(filter.projection.getCode());
                        }
                    }
                    return params;
                }
            })
        })
    ],
    center: new OpenLayers.LonLat(0, 0),
    zoom: 1
});

