var map;

function init() {
    map = new OpenLayers.Map({
        div: "map",
        theme: null,
        projection: new OpenLayers.Projection("EPSG:900913"),
        units: "m",
        numZoomLevels: 18,
        maxResolution: 156543.0339,
        maxExtent: new OpenLayers.Bounds(
            -20037508.34, -20037508.34, 20037508.34, 20037508.34
        ),
        controls: [
            new OpenLayers.Control.TouchNavigation({
                dragPanOptions: {
                    enableKinetic: true
                }
            }),
            new OpenLayers.Control.ZoomPanel()
        ],
        layers: [
            new OpenLayers.Layer.OSM("OpenStreetMap", null, {
                transitionEffect: 'resize'
            })
        ]
    });
    map.setCenter(new OpenLayers.LonLat(0, 0), 3);
}
