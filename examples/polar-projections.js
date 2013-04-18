var map, layer, overlay;

var projectionOptions = {
    'EPSG:3574': {
        projection: new OpenLayers.Projection('EPSG:3574'),
        units: 'm',
        maxExtent: new OpenLayers.Bounds(-5505054, -5505054, 5505054, 5505054),
        maxResolution: 5505054 / 128,
        numZoomLevels: 18
    },
    'EPSG:3576': {
        projection: new OpenLayers.Projection('EPSG:3576'),
        units: 'm',
        maxExtent: new OpenLayers.Bounds(-5505054, -5505054, 5505054, 5505054),
        maxResolution: 5505054 / 128,
        numZoomLevels: 18
    },
    'EPSG:3571': {
        projection: new OpenLayers.Projection('EPSG:3571'),
        units: 'm',
        maxExtent: new OpenLayers.Bounds(-5505054, -5505054, 5505054, 5505054),
        maxResolution: 5505054 / 128,
        numZoomLevels: 18
    },
    'EPSG:3573': {
        projection: new OpenLayers.Projection('EPSG:3573'),
        units: 'm',
        maxExtent: new OpenLayers.Bounds(-5505054, -5505054, 5505054, 5505054),
        maxResolution: 5505054 / 128,
        numZoomLevels: 18
    }
};

function setProjection() {
    projCode = this.innerHTML;
    var oldExtent = map.getExtent();
    var oldCenter = map.getCenter();
    var oldProjection = map.getProjectionObject();
    
    // map projection is controlled by the base layer
    map.baseLayer.addOptions(projectionOptions[projCode]);
    
    // with the base layer updated, the map has the new projection now
    var newProjection = map.getProjectionObject();
    
    // transform the center of the old projection, not the extent
    map.setCenter(
        oldCenter.transform(oldProjection, newProjection,
        map.getZoomForExtent(oldExtent.transform(oldProjection, newProjection))
    ));
    
    for (var i=map.layers.length-1; i>=0; --i) {
        // update grid settings
        map.layers[i].addOptions(projectionOptions[projCode]);
        // redraw layer - just in case center and zoom are the same in old and
        // new projection
        map.layers[i].redraw();
    }
}

function init() {
    map = new OpenLayers.Map('map');
    layer = new OpenLayers.Layer.WMS(
        'world',
        'http://v2.suite.opengeo.org/geoserver/wms',
        {layers: 'world', version: '1.1.1'},
        projectionOptions['EPSG:3574']
    );
    overlay = new OpenLayers.Layer.WMS(
        'world',
        'http://v2.suite.opengeo.org/geoserver/wms',
        {transparent: 'true', layers: 'world:borders', styles: 'line'},
        projectionOptions['EPSG:3574']
    );
    overlay.isBaseLayer = false;
    map.addLayers([layer, overlay]);
    map.zoomToMaxExtent();
    
    // add behaviour to dom elements
    document.getElementById('epsg3574').onclick = setProjection;
    document.getElementById('epsg3576').onclick = setProjection;
    document.getElementById('epsg3571').onclick = setProjection;
    document.getElementById('epsg3573').onclick = setProjection;
}
