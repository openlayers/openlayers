function init() {
    var map = new OpenLayers.Map({
        div: "map",
        projection: new OpenLayers.Projection("EPSG:900913"),
        displayProjection: new OpenLayers.Projection("EPSG:4326"),
        layers: [
            new OpenLayers.Layer.OSM()
        ]
    });
    if (!map.getCenter()) map.zoomToMaxExtent();

    map.addControl(new OpenLayers.Control.Permalink({anchor: true}));
}
