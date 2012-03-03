var streets = new OpenLayers.Layer.XYZ(
    "MapBox Streets",
    [
        "http://a.tiles.mapbox.com/v3/mapbox.mapbox-streets/${z}/${x}/${y}.png",
        "http://b.tiles.mapbox.com/v3/mapbox.mapbox-streets/${z}/${x}/${y}.png",
        "http://c.tiles.mapbox.com/v3/mapbox.mapbox-streets/${z}/${x}/${y}.png",
        "http://d.tiles.mapbox.com/v3/mapbox.mapbox-streets/${z}/${x}/${y}.png"
    ], {
        attribution: "Tiles © <a href='http://mapbox.com/'>MapBox</a> | " + 
            "Data © <a href='http://www.openstreetmap.org/'>OpenStreetMap</a> " +
            "and contributors, CC-BY-SA",
        sphericalMercator: true,
        transitionEffect: "resize",
        buffer: 1,
        numZoomLevels: 16
    }
);

var map = new OpenLayers.Map({
    div: "map",
    layers: [streets],
    controls: [
        new OpenLayers.Control.Attribution(),
        new OpenLayers.Control.Navigation({
            dragPanOptions: {
                enableKinetic: true
            }
        }),
        new OpenLayers.Control.ZoomPanel(),
        new OpenLayers.Control.Permalink({anchor: true})
    ],
    center: [0, 0],
    zoom: 1
});
