var streets = new OpenLayers.Layer.XYZ(
    "MapBox Streets",
    [
        "http://a.tiles.mapbox.com/v3/mapbox.mapbox-streets/${z}/${x}/${y}.png",
        "http://b.tiles.mapbox.com/v3/mapbox.mapbox-streets/${z}/${x}/${y}.png",
        "http://c.tiles.mapbox.com/v3/mapbox.mapbox-streets/${z}/${x}/${y}.png",
        "http://d.tiles.mapbox.com/v3/mapbox.mapbox-streets/${z}/${x}/${y}.png"
    ], {
        attribution: "<a href='http://mapbox.com'>MapBox</a> | <a href='http://mapbox.com/tos/'>Terms of Service</a>",
        sphericalMercator: true,
        transitionEffect: "resize",
        numZoomLevels: 16
    }
);

var map = new OpenLayers.Map({
    div: "map",
    projeciton: "EPSG:900913",
    layers: [streets],
    controls: [
        new OpenLayers.Control.Attribution(),
        new OpenLayers.Control.TouchNavigation({
            dragPanOptions: {
                enableKinetic: true
            }
        }),
        new OpenLayers.Control.ZoomPanel(),
        new OpenLayers.Control.Permalink({anchor: true})
    ]
});
map.setCenter([0, 0], 1);
