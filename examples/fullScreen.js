var urls = [
    "http://a.tile.openstreetmap.org/${z}/${x}/${y}.png",
    "http://b.tile.openstreetmap.org/${z}/${x}/${y}.png",
    "http://c.tile.openstreetmap.org/${z}/${x}/${y}.png"
];

var map = new OpenLayers.Map({
    div: "map",
    layers: [
        new OpenLayers.Layer.XYZ("OSM (with buffer)", urls, {
            transitionEffect: "resize", buffer: 2, sphericalMercator: true
        }),
        new OpenLayers.Layer.XYZ("OSM (without buffer)", urls, {
            transitionEffect: "resize", buffer: 0, sphericalMercator: true
        })
    ],
    controls: [
        new OpenLayers.Control.Navigation({
            dragPanOptions: {
                enableKinetic: true
            }
        }),
        new OpenLayers.Control.PanZoom(),
        new OpenLayers.Control.Attribution()
    ],
    center: [0, 0],
    zoom: 3
});

map.addControl(new OpenLayers.Control.LayerSwitcher());
