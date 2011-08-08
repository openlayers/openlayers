var map;

function init() {
    map = new OpenLayers.Map({
        div: "map",
        projection: new OpenLayers.Projection("EPSG:900913"),
        units: "m",
        maxResolution: 156543.0339,
        maxExtent: new OpenLayers.Bounds(
            -20037508, -20037508, 20037508, 20037508.34
        )
    });
    
    var osm = new OpenLayers.Layer.OSM();            
    var gmap = new OpenLayers.Layer.Google("Google Streets");
    
    map.addLayers([osm, gmap]);

    map.addControl(new OpenLayers.Control.LayerSwitcher());

    map.setCenter(
        new OpenLayers.LonLat(10.2, 48.9).transform(
            new OpenLayers.Projection("EPSG:4326"),
            map.getProjectionObject()
        ), 
        5
    );
}
