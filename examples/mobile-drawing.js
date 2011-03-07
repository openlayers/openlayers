
function init() {

    var vector = new OpenLayers.Layer.Vector();
    var toolbar = new OpenLayers.Control.EditingToolbar(vector);

    map = new OpenLayers.Map({
        div: 'map',
        projection: 'EPSG:900913',
        units: 'm',
        numZoomLevels: 18,
        maxResolution: 156543.0339,
        maxExtent: new OpenLayers.Bounds(
            -20037508.34, -20037508.34, 20037508.34, 20037508.34
        ),
        controls: [
            new OpenLayers.Control.TouchNavigation({
                dragPanOptions: {
                    interval: 100
                }
            }),
            new OpenLayers.Control.ZoomPanel(),
            toolbar
        ],
        layers: [new OpenLayers.Layer.OSM(), vector],
        center: new OpenLayers.LonLat(0, 0),
        zoom: 1,
        theme: null
    });

    toolbar.controls[0].activate();

};
