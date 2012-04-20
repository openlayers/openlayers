var map;

function init() {
    map = new OpenLayers.Map({
        div: "map",
        theme: null,
        projection: new OpenLayers.Projection("EPSG:900913"),
        numZoomLevels: 18,
        controls: [
            new OpenLayers.Control.TouchNavigation({
                dragPanOptions: {
                    enableKinetic: true
                }
            }),
            new OpenLayers.Control.Zoom()
        ],
        layers: [
            new OpenLayers.Layer.OSM("OpenStreetMap", null, {
                transitionEffect: 'resize'
            })
        ]
    });
    map.setCenter(new OpenLayers.LonLat(0, 0), 3);
}
