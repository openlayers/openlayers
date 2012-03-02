var map = new OpenLayers.Map({
    div: "map",
    layers: [new OpenLayers.Layer.OSM()],
    controls: [
        new OpenLayers.Control.Navigation({
            dragPanOptions: {
                enableKinetic: true
            }
        }),
        new OpenLayers.Control.Zoom()
    ],
    center: [0, 0],
    zoom: 1
});
